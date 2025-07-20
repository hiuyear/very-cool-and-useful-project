import os
import logging
import time
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, jsonify, request
from google import genai
from google.genai import types

# —— Configuration ——
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Please set the GEMINI_API_KEY environment variable")

MAX_CANDIDATES = https://chatgpt.com/gpts
MAX_RETRIES = 2
RETRY_BACKOFF_BASE = 0.5  # seconds

# —— Logging setup ——
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# —— Gemini client ——
client = genai.Client(api_key=GEMINI_API_KEY)

SUMMARY_PROMPT = """
You are an expert career summarizer. You are going to recieve a list of information on a candidate with information such as their projects and names of them.
You will also receive a short prompt from an employer about what candidate they are looking for / what projects they need help with.


Write a concise, two-to-three‑sentence summary of their expertise and background.
"""

def call_gemini(projects_text: str) -> str:
    """Single Gemini API call wrapped for retries."""
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=SUMMARY_PROMPT.format(projects=projects_text)
            )
            text = resp.text.strip()
            logger.debug("Gemini response: %s", text)
            return text
        except Exception as e:
            logger.warning("Gemini call failed (attempt %d): %s", attempt, e)
            if attempt <= MAX_RETRIES:
                backoff = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
                time.sleep(backoff)
            else:
                raise

@lru_cache(maxsize=128)
def summarize_candidate_cached(projects_tuple: tuple) -> str:
    """Cache summaries by tuple of project descriptions."""
    projects_text = "\n".join(f"- {p}" for p in projects_tuple)
    return call_gemini(projects_text)

def parse_and_validate(data):
    """
    Expect JSON body like:
      { "data": [
          ["Alice Smith", "Proj A", "Proj B", ...],
          ["Bob Jones",   "Proj X", ...],
          ...
        ]
      }
    """
    arr = data.get("data")
    if not isinstance(arr, list):
        return None, "Payload must have a top‑level 'data' array."
    if len(arr) == 0 or len(arr) > MAX_CANDIDATES:
        return None, f"'data' must have between 1 and {MAX_CANDIDATES} entries."
    candidates = []
    for idx, row in enumerate(arr, start=1):
        if (not isinstance(row, list)) or len(row) < 2:
            return None, f"Row {idx} must be a list with at least a name and one project."
        name = row[0]
        projects = row[1:]
        if not isinstance(name, str) or not name.strip():
            return None, f"Row {idx}: name must be a nonempty string."
        if any((not isinstance(p, str) or not p.strip()) for p in projects):
            return None, f"Row {idx}: each project must be a nonempty string."
        candidates.append((name.strip(), [p.strip() for p in projects]))
    return candidates, None

# —— Flask app ——
app = Flask(__name__)

@app.route("/summarizeCandidates", methods=["POST"])
def summarize_candidates():
    data = request.get_json(force=True)
    candidates, err = parse_and_validate(data)
    if err:
        logger.error("Validation error: %s", err)
        return jsonify({"error": err}), 400

    results = []
    with ThreadPoolExecutor() as pool:
        futures = {
            pool.submit(summarize_candidate_cached, tuple(projects)): name
            for name, projects in candidates
        }

        for fut in as_completed(futures):
            name = futures[fut]
            try:
                summary = fut.result()
            except Exception as e:
                logger.exception("Failed summarizing %s", name)
                summary = f"Error generating summary: {e}"

            # <-- build the exact output object here -->
            results.append({
                "name":            name,
                "detailedSummary": summary,
                "githubUrl":       None,
                "linkedinUrl":     None
            })

    logger.info("Generated %d summaries", len(results))
    # <-- return the bare list, not wrapped in {"summaries": ...} -->
    return jsonify(results), 200