from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os
import json

# === Setup ===
app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://..."
client = MongoClient(MONGO_URI)
db = client.get_database("devpost")
projects_col = db.get_collection("projects")

seen_candidates = set()  # Store candidate profile URLs we've already processed

# === Compatibility Scoring ===
def calculate_compatibility(employer_dict, project_doc):
    tech_matches = set(map(str.lower, employer_dict.get("technical", []))) & set(map(str.lower, project_doc.get("built_with", [])))
    cat_matches = set(map(str.lower, employer_dict.get("category", []))) & set(map(str.lower, project_doc.get("domains", [])))
    total_possible = len(employer_dict.get("technical", [])) + len(employer_dict.get("category", []))
    total_matched = len(tech_matches) + len(cat_matches)
    return round((total_matched / total_possible) * 100, 2) if total_possible else 0.0

# === Flask Route ===
@app.route("/match", methods=['POST'])
def match_candidates():
    data = request.get_json()
    employer_dict = data.get("filters", {})

    if not employer_dict:
        return jsonify({"error": "Missing filters payload"}), 400

    # Step 1: Match employer needs to DB
    all_projects = list(projects_col.find())
    scored_projects = []
    for proj in all_projects:
        compatibility = calculate_compatibility(employer_dict, proj)
        if compatibility > 0:
            scored_projects.append({"project": proj, "compatibility": compatibility})

    top_projects = sorted(scored_projects, key=lambda x: x["compatibility"], reverse=True)[:10]

    # Step 2: Extract team members
    unique_candidates = []
    for item in top_projects:
        members = item["project"].get("team_members", [])
        for member in members:
            profile = member.get("profile_url")
            if profile and profile not in seen_candidates:
                seen_candidates.add(profile)
                unique_candidates.append({
                    "name": member.get("name"),
                    "profile": profile,
                    "skills": member.get("skills", []),
                    "project_history": [],  # to be filled
                    "github": None,
                    "linkedin": None,
                    "location": None
                })

    # Step 3: Cross-reference their project history
    for cand in unique_candidates:
        linked_projects = projects_col.find({"team_members.profile_url": cand["profile"]})
        for p in linked_projects:
            cand["project_history"].append({
                "title": p["title"],
                "description": p.get("description", "")
            })

    return jsonify({
        "employer_filters": employer_dict,
        "matched_projects": top_projects,
        "candidates": unique_candidates
    })

if __name__ == "__main__":
    app.run(debug=True)

