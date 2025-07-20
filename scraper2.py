#!/usr/bin/env python3
"""
scraper_service.py

Flask service that scrapes Devpost profiles and returns structured JSON
with user metadata, project details, skills, and more.
"""

import os
import logging
import re
from typing import Optional, List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup
from flask import Flask, request, abort, jsonify

# ─────────────── CONFIG ───────────────
MAX_PROFILES = 10
USER_AGENT = "Mozilla/5.0 (compatible; ScraperService/1.1)"
TIMEOUT = 15
# ──────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─────────────── CORE SCRAPER ───────────────

def get_profile_info(devpost_url: str) -> Dict[str, Any]:
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = requests.get(devpost_url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        logger.error("Failed to fetch Devpost URL %s: %s", devpost_url, e)
        return {"id": devpost_url, "profile": devpost_url, "error": str(e)}

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract ID from URL
    devpost_id = devpost_url.rstrip("/").split("/")[-1]

    # Name
    name = None
    h1 = soup.find("h1")
    if h1:
        raw = h1.get_text(strip=True)
        m = re.match(r"(.+?)\s*\(", raw)
        name = m.group(1).strip() if m else raw

    # Socials
    github = linkedin = None
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if "github.com" in href and not github:
            github = href if href.startswith("http") else "https://" + href
        elif "linkedin.com" in href and not linkedin:
            linkedin = href if href.startswith("http") else "https://" + href

    # Location
    location = None
    if h1:
        ul = h1.find_next_sibling("ul")
        if ul:
            for li in ul.find_all("li"):
                icon = li.find("i", class_=lambda c: c and "map-marker" in c)
                if icon:
                    location = li.get_text(" ", strip=True)
                    break

    # Projects + Skills
    projects = soup.find_all("div", class_="link-to-software")
    project_highlights = []
    all_skills = set()
    for proj in projects[:3]:  # Limit to top 3 projects
        link_tag = proj.find("a")
        if not link_tag:
            continue
        proj_url = link_tag["href"]
        title = link_tag.get_text(strip=True)
        desc, techs = scrape_project(proj_url)
        project_highlights.append({
            "title": title,
            "description": desc,
            "technologies": techs
        })
        all_skills.update(techs)

    return {
        "id": devpost_id,
        "name": name or "—",
        "location": location,
        "profile": devpost_url,
        "matchScore": 80,  # placeholder
        "projectDate": "Recent",  # optional
        "projects": len(projects),
        "rating": len(all_skills),  # placeholder metric
        "skills": sorted(all_skills),
        "projectHighlights": project_highlights,
        "detailedSummary": None,  # to be filled by Gemini AI
        "githubUrl": github,
        "linkedinUrl": linkedin
    }

def scrape_project(proj_url: str) -> (str, List[str]):
    try:
        resp = requests.get(proj_url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        logger.warning("Error scraping project %s: %s", proj_url, e)
        return "", []

    soup = BeautifulSoup(resp.text, "html.parser")

    desc = soup.find("div", class_="large-12 columns").get_text(" ", strip=True) if soup else ""
    techs = []
    built_with = soup.find("span", string=re.compile("Built With", re.I))
    if built_with:
        parent = built_with.find_parent("li")
        if parent:
            techs = [t.strip() for t in parent.get_text(",").split(",") if t.strip()]

    return desc[:300], techs

# ─────────────── ROUTE ───────────────

@app.route("/scrapeProfiles", methods=["POST"])
def scrape_profiles():
    data = request.get_json(force=True, silent=True)
    if not data or "urls" not in data:
        abort(400, "Expected JSON body with 'urls' array.")
    urls = data["urls"]
    if not isinstance(urls, list) or not 1 <= len(urls) <= MAX_PROFILES:
        abort(400, f"'urls' must be a list of 1 to {MAX_PROFILES} Devpost URLs.")

    results: List[Dict[str, Any]] = []
    with ThreadPoolExecutor() as pool:
        futures = {pool.submit(get_profile_info, url): url for url in urls}
        for future in as_completed(futures):
            results.append(future.result())

    return jsonify(results), 200

# ─────────────── MAIN ───────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
