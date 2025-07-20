
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from google import genai
import os
import json

# === Flask App Setup ===
app = Flask(__name__)
CORS(app)

# === Configure Gemini ===
GEMINI_API_KEY="AIzaSyDHF546OTqCAr0zRvSha_HmOYUONMagoVE"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# === Gemini Prompt Template ===
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

# === Gemini Execution Function ===
def generate_keywords(prompt: str, tools: list):
    full_prompt = (
        f"{PROMPT_TEMPLATE}\n"
        f"Prompt: {prompt}\n"
        f"Selected tools: {tools}"
    )

    try:
        response = model.generate_content(full_prompt)
        print("Gemini raw response:", response.text)
        return eval(response.text)
    except Exception as e:
        print("Gemini parsing error:", e)
        return {"error": "Failed to parse Gemini output", "raw": response.text}

# === Flask Routes ===
@app.route("/")
def home():
    return send_from_directory('.', "search.html")

@app.route("/findHacker", methods=['POST'])
def find_hacker():
    data = request.get_json()
    user_prompt = data.get("prompt", "")
    selected_tools = data.get("tools", [])

    result = generate_keywords(user_prompt, selected_tools)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
