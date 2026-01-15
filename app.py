from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os
import json

# === Setup ===
app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://..."
client = MongoClient("mongodb+srv://Joshuabehinayin:WAchzAWbMa0tLE1W@devpostdatabase.nlofybh.mongodb.net/?retryWrites=true&w=majority&appName=devpostDatabase")
db = client.get_database("devpost")
projects_col = db.get_collection("projects")

seen_candidates = set()  # Store candidate profile URLs we've already processed

# === Compatibility Scoring ===
def calculate_compatibility(employer_filters, project_doc):
    # Handle case where employer_filters might be a list or dict
    if isinstance(employer_filters, list):
        # If it's a list, convert to a more usable format
        # You'll need to adjust this based on your actual data structure
        print(f"Warning: employer_filters is a list: {employer_filters}")
        return 0.0
    
    # Ensure we're working with a dictionary
    if not isinstance(employer_filters, dict):
        print(f"Warning: employer_filters is neither list nor dict: {type(employer_filters)}")
        return 0.0
    
    # Get technical and category requirements, defaulting to empty lists
    employer_tech = employer_filters.get("technical", [])
    employer_categories = employer_filters.get("category", [])
    
    # Get project technologies and domains, defaulting to empty lists
    project_tech = project_doc.get("built_with", [])
    project_domains = project_doc.get("domains", [])
    
    # Calculate matches
    tech_matches = set(map(str.lower, employer_tech)) & set(map(str.lower, project_tech))
    cat_matches = set(map(str.lower, employer_categories)) & set(map(str.lower, project_domains))
    
    # Calculate total possible and matched
    total_possible = len(employer_tech) + len(employer_categories)
    total_matched = len(tech_matches) + len(cat_matches)
    
    # Return compatibility score
    return round((total_matched / total_possible) * 100, 2) if total_possible > 0 else 0.0

# === Flask Route ===
@app.route("/match", methods=['POST'])
def match_candidates():
    try:
        data = request.get_json()
        
        # Debug: Print the incoming data
        print(f"Received data: {data}")
        
        employer_filters = data.get("filters", {})
        
        # Debug: Print the filters
        print(f"Employer filters: {employer_filters}")
        print(f"Employer filters type: {type(employer_filters)}")

        if not employer_filters:
            return jsonify({"error": "Missing filters payload"}), 400

        # Step 1: Match employer needs to DB
        all_projects = list(projects_col.find())
        scored_projects = []
        
        for proj in all_projects:
            compatibility = calculate_compatibility(employer_filters, proj)
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
            "employer_filters": employer_filters,
            "matched_projects": top_projects,
            "candidates": unique_candidates
        })
    
    except Exception as e:
        print(f"Error in match_candidates: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)