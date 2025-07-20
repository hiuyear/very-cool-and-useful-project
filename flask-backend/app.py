from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # ✅ allow all origins by default

@app.route("/findhacker", methods=["POST"])
def find_hacker():
    data = request.get_json()
    return jsonify({
        "tools": data.get("tools", []),
        "domains": ["AI", "Web"],
        "skills": ["React", "Node.js"],
    })

@app.route("/summarizeCandidates", methods=["POST"])
def summarize():
    rows = request.get_json().get("data", [])
    results = []
    for row in rows:
        name = row[0]
        projects = row[1:]
        results.append({
            "name": name,
            "detailedSummary": f"{name} has worked on: {', '.join(projects)}"
        })
    return jsonify(results)

@app.route("/profile")
def profile():
    url = request.args.get("url")
    return jsonify({
        "github": f"https://github.com/{url.split('/')[-1]}",
        "linkedin": f"https://linkedin.com/in/{url.split('/')[-1]}",
        "location": "Toronto, Canada"
    })

if __name__ == "__main__":
    app.run(port=5001)
