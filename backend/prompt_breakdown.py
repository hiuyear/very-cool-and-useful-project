from flask import Flask, jsonify, send_from_directory, request
from google import genai
import json
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env.local")

GEMINI_API_KEY = os.getenv("VITE_API_GEMINI_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

class hackerData(BaseModel):
    category: list[str]
    technical: list[str]   # fixed typo here
    location: str

PROMPT_TEMPLATE = """
You are an AI assistant helping a recruiter search for ideal candidates.

You are given a combination of:
- A natural language prompt describing a project or the type of candidate being searched for.
- A list of manually selected tools/frameworks (if any).

Your goal is to extract and format relevant search metadata as a Python dictionary with the following structure:

{
  "category": [up to 3 field/industry categories or domains relevant to the project, lowercase strings],
  "technical": [up to 50 total keywords including tools, frameworks, languages, and technical skills required — including manually selected tools],
  "location": [either a city/region/country string, or null if not mentioned or unknown]
}

Rules:
- Only include technical terms relevant to the project prompt and/or selected tools.
- Do not invent unrelated terms. Don't hallucinate categories or tools.
- Use lowercase for all strings. No duplicates.
- If no location is mentioned in the prompt, return: "location": null
- If the prompt is vague, try your best to infer categories/skills based on typical use cases.
- Match terminology to what a developer might include in a Devpost project: real frameworks, libraries, stacks, or skills (e.g. “react”, “python”, “llm fine-tuning”, not vague phrases like “communication”)

Return ONLY a valid Python dictionary (no extra commentary or explanation).

EXAMPLES:

Example 1:
Prompt: "We\’re looking for someone to help us build a climate dashboard using Next.js, Tailwind, and MongoDB. Based in Vancouver."

Selected tools: ["Next.js", "Tailwind"]

Expected Output:
{
  "category": ["climate tech", "data visualization"],
  "technical": ["next.js", "tailwind", "mongodb", "node.js", "react", "dashboard", "climate api", "chart.js", "d3.js"],
  "location": "vancouver"
}

Example 2:
Prompt: "We\’re prototyping an AI assistant to help HR teams with resume screening. The ideal candidate has experience with LangChain, OpenAI, and Pinecone."

Selected tools: ["LangChain", "OpenAI", "Pinecone"]

Expected Output:
{
  "category": ["human resources", "recruitment tech"],
  "technical": ["langchain", "openai", "pinecone", "llm integration", "semantic search", "resume parsing", "vector database", "api engineering"],
  "location": null
}

Now generate the structured dictionary for:
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

@app.route("/findhacker", methods=['POST'])
def findHacker():
    data = request.get_json()
    userPrompt = data.get("prompt", "")
    selectedTools = data.get("tools", [])

    print(userPrompt)

    # Build prompt correctly with PROMPT_TEMPLATE contents + user input
    refinedPrompt = f"{PROMPT_TEMPLATE}\nNatural language prompt: {userPrompt}\nSelected checkboxes: {selectedTools}"

    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=refinedPrompt,
    config={
        "response_mime_type": "application/json",
        "response_schema": hackerData}
    )
    raw_text = response.text
    print("Raw Gemini response:", repr(raw_text))

    info: list[hackerData] = response.parsed

    # Serialize parsed Pydantic models to list of dicts and return JSON response
    return jsonify(info.model_dump())
    

if __name__ == "__main__":
    app.run(debug=True)
