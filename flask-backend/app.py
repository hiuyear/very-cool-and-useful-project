# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow your React app (via Vite proxy) to talk to Flask

@app.route("/findHacker", methods=["POST"])
def find_hacker():
    # 1. Grab the JSON payload from the frontend
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    tools  = data.get("tools", [])

    # 2. YOUR LOGIC HERE: call Gemini, query DB, scrape Devpost, etc.
    #    and build two lists: `domains` and `skills`
    #
    #    For example purposes, let’s just echo back:
    response = {
        "domains": ["exampleDomain1", "exampleDomain2"],
        "skills":  ["exampleSkillA", "exampleSkillB"],
        # you can also include any other fields your DeveloperCard needs
    }

    # 3. Return it as JSON
    return jsonify(response)


if __name__ == "__main__":
    # this lets you run `python app.py` directly
    app.run(host="0.0.0.0", port=5000, debug=True)
