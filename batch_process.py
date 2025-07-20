import os
import time
import json
import re
import backoff               # pip install backoff
from dotenv import load_dotenv
from pymongo import MongoClient
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from google import genai
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─── CONFIG ───────────────────────────────────────────────────────────────────
load_dotenv()
MONGO_URI      = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Mongo
mongo = MongoClient(MONGO_URI)
db    = mongo.devpost
col   = db.projects

# Gemini client
gemini = genai.Client(api_key=GEMINI_API_KEY)

# Rate‑limit (free tier): 10 calls per minute → 6 s between calls
CALLS_PER_MINUTE = 10
MIN_INTERVAL     = 60.0 / CALLS_PER_MINUTE

# Batch size
BATCH_SIZE = 10

# Fixed category list
CATEGORIES = [
    "Health", "Finance", "Education", "Environment", "AI/ML",
    "Robotics", "Mobile", "Web", "IoT & Embedded", "E‑commerce",
    "Data Analytics", "Cybersecurity", "Gaming", "AR/VR",
    "Transportation", "Agriculture", "Manufacturing", "Retail",
    "Media & Entertainment", "Social Impact", "Other"
]

# ─── HELPERS ──────────────────────────────────────────────────────────────────



def throttle():
    """Ensure at least MIN_INTERVAL between Gemini calls."""
    now = time.time()
    last = getattr(throttle, "last", 0)
    elapsed = now - last
    if elapsed < MIN_INTERVAL:
        time.sleep(MIN_INTERVAL - elapsed)
    throttle.last = time.time()

@backoff.on_exception(
    backoff.expo,
    Exception,
    max_time=60,
    giveup=lambda e: not hasattr(e, "status_code") or e.status_code not in (429, 503)
)
def classify_batch(batch):
    """
    Send up to BATCH_SIZE descriptions in one Gemini call.
    Expects `batch` as list of dicts with keys "_id" and "description".
    Returns a list of {"id": int, "domains": [...]}.
    """
    # build prompt
    prompt = (
        "You are an AI assistant. Classify each project into these BASIC categories:\n"
        f"[{', '.join(CATEGORIES)}]\n\n"
        "Return JSON of the form:\n"
        "{\n"
        '  "results": [\n'
        '    {"id": 1, "domains": ["Health","AI/ML"]},\n'
        "    ...\n"
        "  ]\n"
        "}\n\n"
        "Descriptions:\n"
    )
    for idx, doc in enumerate(batch, 1):
        desc = doc["description"].replace('"""', '\\"""')
        prompt += f"{idx}) \"\"\"\n{desc}\n\"\"\"\n\n"

    throttle()
    resp = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    data = json.loads(resp.text)
    return data.get("results", [])

def chunks(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i : i + n]

def clean_from_inspiration(text: str) -> str:
    """Drop everything before the first 'Inspiration'."""
    m = re.search(r"inspiration", text, re.IGNORECASE)
    return text[m.start():].strip() if m else text

def get_project_links(query, max_pages=3):
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    driver = webdriver.Chrome(options=opts)

    links = []
    for pg in range(1, max_pages+1):
        url = f"https://devpost.com/software/search?query={query}&page={pg}"
        driver.get(url)
        time.sleep(2)
        cards = driver.find_elements(By.CSS_SELECTOR, "a.link-to-software")
        print(f"🔎 Page {pg}: found {len(cards)}")
        for c in cards:
            href = c.get_attribute("href")
            if href:
                links.append(href)
    driver.quit()
    return links
def parse_project_page(driver, url: str) -> dict:
    """Given a Selenium driver and a Devpost URL, scrape all fields and return the record."""
    driver.get(url)
    time.sleep(2)  # wait for JS

    soup = BeautifulSoup(driver.page_source, "html.parser")

    # Title
    h1 = soup.find("h1")
    title = h1.text.strip() if h1 else "Untitled"

    # Description
    cont = soup.select_one("div#app-details-left")
    parts, heading = [], None
    if cont:
        for el in cont.find_all(["h2","p"], recursive=True):
            if el.name == "h2":
                heading = el.get_text(strip=True)
            else:  # <p>
                txt = el.get_text(strip=True)
                parts.append(f"{heading}\n{txt}" if heading else txt)
    raw = "\n\n".join(parts) or "No description available."
    description = clean_from_inspiration(raw)

    # We’ll fill domains later
    domains = []
    team = []
    members = soup.select("li.software-team-member")
    # Team members
    for member in members:
        links = member.select("a.user-profile-link")
        for link in links:
            if link.text.strip():  # Ignore avatar links (no text)
                name = link.text.strip()
                profile_url = link["href"]
                if not profile_url.startswith("http"):
                    profile_url = "https://devpost.com" + profile_url
                team.append({"name": name, "profile_url": profile_url})
                break  # Only use the first valid name-link

    # Built‐with tags
    built = [el.text.strip() for el in driver.find_elements(
        By.CSS_SELECTOR, "ul.no-bullet.inline-list span.cp-tag"
    )]

    # Hackathon link
    hack_tag = soup.select_one("figure.challenge_avatar a")
    hack_url = hack_tag["href"] if hack_tag else None

    return {
        "title":        title,
        "url":          url,
        "description":  description,
        "domains":      domains,
        "team_members": team,
        "built_with":   built,
        "hackathon":    hack_url,
        "timestamp":    time.time()
    }
def scrape_worker(url: str) -> str:
    """
    Worker thread: spins up its own headless Chrome,
    scrapes the record via parse_project_page, and upserts it.
    Returns a status string for logging.
    """
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    driver = webdriver.Chrome(options=opts)
    try:
        rec = parse_project_page(driver, url)
        col.update_one({"url": url}, {"$set": rec}, upsert=True)
        return f"✅ {url}"
    except Exception as e:
        return f"❌ {url}: {e}"
    finally:
        driver.quit()

def classify_all():
    """
    Find all docs where domains == [], batch them,
    call Gemini, and write back results.
    """
    to_do = list(col.find({"domains": []}, {"_id":1, "description":1}))
    for batch in chunks(to_do, BATCH_SIZE):
        results = classify_batch(batch)
        for res in results:
            idx = res["id"] - 1
            doc = batch[idx]
            col.update_one(
                {"_id": doc["_id"]},
                {"$set": {"domains": res.get("domains", [])}}
            )
            print(f"[classify] {doc['_id']} → {res.get('domains',[])}")
        # no extra sleep here—throttle() inside classify_batch handles it

def main():
    # 1) gather URLs (unchanged)
    urls = get_project_links("is:winner", max_pages=100)
    print(f"🔍 Total URLs to scrape: {len(urls)}")

    # 2) scrape in parallel
    with ThreadPoolExecutor(max_workers=4) as exe:
        futures = [exe.submit(scrape_worker, u) for u in urls]
        for fut in as_completed(futures):
            print(fut.result())

    # 3) classify in batches (your existing function)
    classify_all()
def main():
    # 1) gather all URLs
    all_urls = get_project_links("is:winner", max_pages=100)
    print(f"🔍 Found {len(all_urls)} total URLs")

    # 2) filter out ones already in Mongo
    pending = []
    for url in all_urls:
        if not col.find_one({"url": url}):
            pending.append(url)
    print(f"⏩ Skipping {len(all_urls)-len(pending)} existing URLs, {len(pending)} to scrape")

    # 3) scrape pending URLs in parallel
    with ThreadPoolExecutor(max_workers=8) as exe:
        futures = [exe.submit(scrape_worker, u) for u in pending]
        for fut in as_completed(futures):
            print(fut.result())

    # 4) classification pass
    classify_all()
    
if __name__ == "__main__":
    main()