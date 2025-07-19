from flask import Flask, jsonify, send_from_directory, request
import requests
from google import genai
from google.genai import types

GEMINI_API_KEY="AIzaSyDHF546OTqCAr0zRvSha_HmOYUONMagoVE"
client = genai.Client(api_key=GEMINI_API_KEY)

PROMPT_TEMPLATE = """
You are helping a recruiter search for qualified candidates based on two types of input:

1. A natural language prompt. This may describe either:

A project the user is currently working on or the type of candidate or experience they are searching for

A checklist of selected tools, frameworks, skills, or domains

Your job is to extract relevant search keywords to match against a MongoDB collection of project documents with this structure:

{
"title": string,
"description": string,
"built_with": string,
}

Please return your output as a JSON object with four arrays:

{
"tools_frameworks": [...], ← used to match against built_with[]
"skills_capabilities": [...], ← used to match inside title/description
"domains": [...], ← used to match inside title/description

}

Rules:

Do not generate duplicates across lists

Only use the inputs that are present

Match terminology likely to appear in user-generated titles or descriptions

Do not include enhancements or unrelated synonyms

Examples:

Example 1:
Natural language prompt: "Find someone who built an AI chatbot for fintech"
Selected checkboxes: (none)

Expected output:
{
"tools_frameworks": ["Dialogflow", "LangChain", "OpenAI"],
"skills_capabilities": ["chatbot development", "natural language processing", "prompt engineering"],
"domains": ["fintech", "banking", "financial services"],
"related_terms": ["AI assistant", "virtual advisor"]
}

Example 2:
Natural language prompt: "Currently building a resume screener for HR powered by LLMs"
Selected checkboxes: ["Pinecone", "LangChain"]

Expected output:
{
"tools_frameworks": ["Pinecone", "LangChain"],
"skills_capabilities": ["semantic search", "LLM integration", "resume analysis"],
"domains": ["human resources", "recruitment tech"],
"related_terms": ["candidate screening", "job matching"]
}

User Input:
"""

def generate_keywords(refinedPrompt):
    
    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=f"{PROMPT_TEMPLATE} {refinedPrompt}",
    )
    return response.text
    


app=Flask(__name__)

@app.route("/")
def home():
    return send_from_directory('.', "search.html")

@app.route("/findHacker", methods=['POST'])
def price():
    data=request.get_json()
    userPrompt=data.get("prompt")
    selectedTools=data.get("tools")
    
    refinedPrompt=f"PROMPT_TEMPLATE\nNatural language prompt: {userPrompt}\nSelected checkboxes: {selectedTools}"
    keywords=generate_keywords(refinedPrompt)



    #call function to pass data to lewis code

    #prompt: "text"
    #tools: "tool list"
    

    

    
    return jsonify({
        
    })

if __name__ == "__main__":
    app.run(debug=True)