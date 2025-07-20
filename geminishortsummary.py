from flask import Flask, jsonify, request
from google import genai
import os

# Load your API key from environment for safety
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Please set GEMINI_API_KEY in your environment")

client = genai.Client(api_key=GEMINI_API_KEY)

# Template for summarizing one candidate's projects
SUMMARY_PROMPT = """
You are an expert career summarizer. A candidate has worked on the following projects:
{projects}

Write a concise, two‑sentence summary of their expertise and background.
"""

def summarize_candidate(projects):
    """
    Given a list of project descriptions, call Gemini to get a two‑sentence summary.
    """
    content = SUMMARY_PROMPT.format(projects="\n".join(f"- {p}" for p in projects))
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=content
    )
    # Assume response.text is the generated summary
    return response.text.strip()

app = Flask(__name__)

@app.route("/summarizeCandidates", methods=["POST"])
def summarize_candidates():
    """
    Expects JSON of the form:
    {
      "candidates": [
        {
          "name": "Alice Smith",
          "projects": [
            "Built a real‑time chat moderation tool using TensorFlow and React",
            "Designed an e‑commerce recommendation engine in Python"
          ]
        },
        ...
      ]
    }
    Returns:
    {
      "summaries": [
        {
          "name": "Alice Smith",
          "summary": "Alice is a full‑stack engineer who built scalable chat‑moderation tools with TensorFlow and React. She also developed Python‑based recommendation engines for e‑commerce platforms."
        },
        ...
      ]
    }
    """
    data = request.get_json()
    candidates = data.get("candidates", [])
    if not isinstance(candidates, list) or len(candidates) > 10:
        return jsonify({"error": "Please provide up to 10 candidates, each with a name and project list."}), 400

    output = []
    for cand in candidates:
        name = cand.get("name", "Unknown")
        projects = cand.get("projects", [])
        if not projects or not isinstance(projects, list):
            summary = "No project data provided."
        else:
            try:
                summary = summarize_candidate(projects)
            except Exception as e:
                summary = f"Error generating summary: {e}"
        output.append({"name": name, "summary": summary})

    return jsonify({"summaries": output})

if __name__ == "__main__":
    # By default listens on http://127.0.0.1:5000
    app.run(debug=True)
