from flask import Flask, jsonify, send_from_directory, request
from google import genai
import json
from pydantic import BaseModel


GEMINI_API_KEY = "AIzaSyDHF546OTqCAr0zRvSha_HmOYUONMagoVE"
client = genai.Client(api_key=GEMINI_API_KEY)

class hackerData(BaseModel):
    category: list[str]
    technical: list[str]   # fixed typo here
    location: str

PROMPT_TEMPLATE = """

You are an AI assistant helping a recruiter search for ideal candidates.

You are given a combination of:
A natural language prompt describing a project or the type of candidate being searched for.
A list of manually selected tools/frameworks (if any).

Your goal is to extract and format relevant search metadata as a Python dictionary with the following structure:

{
  "category": [up to 3 field/industry categories or domains relevant to the project, lowercase strings],
  "technical": [up to 50 total keywords including tools, frameworks, languages, and technical skills required — including manually selected tools],
  "location": [either a city/region/country string, or null if not mentioned or unknown]
}

**Return ONLY the JSON object. DO NOT include markdown code blocks, text explanations, or formatting like ```json.**

EXAMPLES:

Example 1:
Prompt: "We’re looking for someone to help us build a climate dashboard using Next.js, Tailwind, and MongoDB. Based in Vancouver."

Selected tools: ["Next.js", "Tailwind"]

Expected Output:
{
  "category": ["climate tech", "data visualization"],
  "technical": ["next.js", "tailwind", "mongodb", "node.js", "react", "dashboard", "climate api", "chart.js", "d3.js"],
  "location": "vancouver"
}
User Input:
"""

def generate_keywords(refinedPrompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=refinedPrompt,
    )
    return response.text
def parse_markdown_json(text):
    # Strip markdown-style code block
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    # Now safely parse JSON
    return json.loads(text)

app = Flask(__name__)

@app.route("/")
def home():
    return send_from_directory('.', "home.html")

@app.route("/findHacker", methods=['POST'])
def findHacker():
    data = request.get_json()
    userPrompt = data.get("prompt", "")
    selectedTools = data.get("tools", [])

    # Build prompt correctly with PROMPT_TEMPLATE contents + user input
    refinedPrompt = f"{PROMPT_TEMPLATE}\nNatural language prompt: {userPrompt}\nSelected checkboxes: {selectedTools}"

    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=refinedPrompt,
    config={
        "response_mime_type": "application/json",
        "response_schema": list[hackerData],}
    )
    raw_text = response.text
    print("Raw Gemini response:", repr(raw_text))

    info: list[hackerData] = response.parsed

    # Serialize parsed Pydantic models to list of dicts and return JSON response
    return jsonify([r.model_dump() for r in info])
    

if __name__ == "__main__":
    app.run(debug=True)
