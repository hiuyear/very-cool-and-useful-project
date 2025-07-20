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

MAX_CANDIDATES = 10
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


Write a concise, two-to-three‑sentence summary of the candidate's expertise and background. Also, based on their skills and experience, give them a rating out of 10 
on whether they would do good on the employer's project / ideal candidate. Write a short summary of why or why not with specific references to their experience (or lack of). 

Format the output in the following format, so that it can be extracted at an frontend website for display.
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
    # Use a thread pool to parallelize API calls
    with ThreadPoolExecutor() as pool:
        futures = {}
        for name, projects in candidates:
            proj_tuple = tuple(projects)
            futures[ pool.submit(summarize_candidate_cached, proj_tuple) ] = name

        for fut in as_completed(futures):
            name = futures[fut]
            try:
                summary = fut.result()
            except Exception as e:
                logger.exception("Failed summarizing %s", name)
                summary = f"Error generating summary: {e}"
            results.append({"name": name, "summary": summary})

    logger.info("Generated %d summaries", len(results))
    return jsonify({"summaries": results})


if __name__ == "__main__":
    # In prod, run under Gunicorn/UWSGI behind nginx
    app.run(host="0.0.0.0", port=5000, debug=False)
