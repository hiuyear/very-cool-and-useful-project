"""

from pymongo import MongoClient

def clean_description(text):
    lines = text.split('\n')
    meaningful_lines = [
        line.strip() for line in lines 
        if len(line.strip()) > 10 and not line.strip().lower().endswith("page")
    ]
    return "\n".join(meaningful_lines)

def count_keyword_matches(project, keywords):
    matches = 0

    title = project.get("title", "").lower()
    desc = project.get("description", "").lower()
    built = [bw.lower() for bw in project.get("built_with", [])]

    # Match tools_frameworks in built_with
    for tool in keywords["tools_frameworks"]:
        if tool.lower() in built:
            matches += 1

    # Match skills_capabilities and domains in title and description
    for term in keywords["skills_capabilities"] + keywords["domains"]:
        if term.lower() in title or term.lower() in desc:
            matches += 1

    return matches

# Replace this with your actual connection string
client = MongoClient("mongodb+srv://Joshuabehinayin:WAchzAWbMa0tLE1W@devpostdatabase.nlofybh.mongodb.net/?retryWrites=true&w=majority&appName=devpostDatabase")


# Connect to your database and collection
db = client["devpost"]
collection = db["projects"]

# Example: fetch all documents
all_projects = list(collection.find())

results = collection.find({}, {
    "_id": 0,
    "title": 1,
    "description": 1,
    "built_with": 1,
    "team_members": 1
})

clean_description(results);

keywords = {
    "tools_frameworks": ["android-studio", "supabase", "google-maps", "flask"],
    "skills_capabilities": ["real-time", "chat", "authentication", "push notifications"],
    "domains": ["social network", "mental health", "education", "productivity"]
}

ranked_projects = []
for project in all_projects:
    if not project.get("description"):
        continue

    score = count_keyword_matches(project, keywords)
    cleaned_desc = clean_description(project["description"])
    ranked_projects.append({
        "title": project.get("title", ""),
        "description": cleaned_desc,
        "built_with": project.get("built_with", []),
        "team_members": project.get("team_members", []),
        "match_score": score
    })

# Sort by score descending
ranked_projects.sort(key=lambda p: p["match_score"], reverse=True)

# Limit to top 5 projects
top_projects = ranked_projects[:5]

# Build prompt for Gemini
gemini_prompt = "Below are top-matching hackathon projects based on provided keywords. For each, summarize the project's purpose and list team members:\n\n"

for i, proj in enumerate(top_projects, 1):
    built = ", ".join(proj["built_with"])
    members = ", ".join([m["name"] for m in proj["team_members"]]) or "N/A"
    gemini_prompt += f"Project {i}:\nTitle: {proj['title']}\nBuilt With: {built}\nTeam: {members}\nDescription:\n{proj['description']}\n\n"

# Output the prompt or send to Gemini model
print(gemini_prompt)
"""

from pymongo import MongoClient
from typing import Dict, List, Optional
import logging
from backend.prompt_breakdown import sendData
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectSummarizer:
    def __init__(self, mongo_uri: str, db_name: str, collection_name: str):
        """Initialize MongoDB connection."""
        try:
            self.client = MongoClient(mongo_uri)
            self.db = self.client[db_name]
            self.collection = self.db[collection_name]
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    @staticmethod
    def clean_description(text: str) -> str:
        """Clean project description by removing irrelevant lines."""
        if not text:
            return ""
            
        lines = text.split('\n')
        meaningful_lines = [
            line.strip() for line in lines 
            if len(line.strip()) > 10 and not line.strip().lower().endswith("page")
        ]
        return " ".join(meaningful_lines)  # Join as single paragraph

    @staticmethod
    def count_keyword_matches(project: Dict, keywords: Dict) -> int:
        """Count how many keyword matches a project has."""
        matches = 0

        title = project.get("title", "").lower()
        desc = project.get("description", "").lower()
        built = [bw.lower() for bw in project.get("built_with", [])]

        # Match tools_frameworks in built_with
        for tool in keywords.get("tools_frameworks", []):
            if tool.lower() in built:
                matches += 1

        # Match skills_capabilities and domains in title and description
        for term in keywords.get("skills_capabilities", []) + keywords.get("domains", []):
            if term.lower() in title or term.lower() in desc:
                matches += 1

        return matches

    def get_projects(self) -> List[Dict]:
        """Fetch projects from MongoDB."""
        try:
            projection = {
                "_id": 0,
                "title": 1,
                "description": 1,
                "built_with": 1,
                "team_members": 1
            }
            return list(self.collection.find({}, projection))
        except Exception as e:
            logger.error(f"Failed to fetch projects: {e}")
            return []

    def rank_projects(self, projects: List[Dict], keywords: Dict) -> List[Dict]:
        """Rank projects based on keyword matches."""
        ranked = []
        
        for project in projects:
            if not project.get("description"):
                continue

            try:
                score = self.count_keyword_matches(project, keywords)
                cleaned_desc = self.clean_description(project["description"])
                ranked.append({
                    "title": project.get("title", ""),
                    "description": cleaned_desc,
                    "built_with": project.get("built_with", []),
                    "team_members": [m["name"] for m in project.get("team_members", [])],
                    "match_score": score
                })
            except Exception as e:
                logger.warning(f"Error processing project {project.get('title')}: {e}")
                continue

        # Sort by score descending
        ranked.sort(key=lambda p: p["match_score"], reverse=True)
        return ranked

    def generate_summaries(self, projects: List[Dict], keywords: Dict, top_n: int = 5) -> List[Dict]:
        """
        Generate ready-to-use summaries of top projects including:
        - Title
        - Concise summary description
        - Matching reasons
        - Team members
        """
        top_projects = projects[:top_n]
        summaries = []
        
        for project in top_projects:
            # Find which keywords matched
            matched_keywords = set()
            
            # Check tools/frameworks matches
            built_lower = [bw.lower() for bw in project["built_with"]]
            for tool in keywords.get("tools_frameworks", []):
                if tool.lower() in built_lower:
                    matched_keywords.add(tool)
            
            # Check skills/domains matches
            text_content = f"{project['title']} {project['description']}".lower()
            for term in keywords.get("skills_capabilities", []) + keywords.get("domains", []):
                if term.lower() in text_content:
                    matched_keywords.add(term)
            
            # Create the summary
            summary = {
                "title": project["title"],
                "summary": self._generate_concise_summary(project["description"]),
                "matched_keywords": sorted(list(matched_keywords)),
                "team_members": project["team_members"],
                "built_with": project["built_with"],
                "match_score": project["match_score"]
            }
            summaries.append(summary)
        
        return summaries

    @staticmethod
    def _generate_concise_summary(description: str, max_length: int = 200) -> str:
        """Generate a short summary from the description."""
        if not description:
            return "No description available"
        
        # Take first few sentences
        sentences = description.split('. ')
        summary = sentences[0]
        
        for sentence in sentences[1:]:
            if len(summary) + len(sentence) < max_length:
                summary += ". " + sentence
            else:
                break
                
        return summary.strip() + ("..." if len(description) > max_length else "")

    def process_user_query(self, keywords: Dict, top_n: int = 5) -> Dict:
        """Main method to process user query and return formatted summaries."""
        try:
            # Get and rank projects
            projects = self.get_projects()
            ranked_projects = self.rank_projects(projects, keywords)
            
            # Generate summaries
            summaries = self.generate_summaries(ranked_projects, keywords, top_n)
            
            return {
                "summaries": summaries,
                "total_projects_processed": len(ranked_projects),
                "top_n": top_n
            }
        except Exception as e:
            logger.error(f"Error processing user query: {e}")
            return {"error": str(e)}



    
# Example usage with formatted output
if __name__ == "__main__":
    # Configuration
    MONGO_URI = "mongodb+srv://Joshuabehinayin:WAchzAWbMa0tLE1W@devpostdatabase.nlofybh.mongodb.net/?retryWrites=true&w=majority&appName=devpostDatabase"
    DB_NAME = "devpost"
    COLLECTION_NAME = "projects"
    
    #gemini keywords
    KEYWORDS = sendData()

    # Initialize and run
    try:
        summarizer = ProjectSummarizer(MONGO_URI, DB_NAME, COLLECTION_NAME)
        results = summarizer.process_user_query(KEYWORDS)
        
        if "error" in results:
            print(f"Error: {results['error']}")
        else:
            print(f"Found {results['total_projects_processed']} projects. Top {results['top_n']} summaries:\n")
            print("="*50)
            
            for i, summary in enumerate(results["summaries"], 1):
                print(f"\nProject #{i}: {summary['title']}")
                print(f"Match Score: {summary['match_score']}")
                print("\nSummary:")
                print(summary["summary"])
                print("\nTechnologies Used:")
                print(", ".join(summary["built_with"]) if summary["built_with"] else "Not specified")
                print("\nMatching Keywords:")
                print(", ".join(summary["matched_keywords"]) if summary["matched_keywords"] else "None")
                print("\nTeam Members:")
                print(", ".join(summary["team_members"]) if summary["team_members"] else "Not available")
                print("\n" + "="*50)
                
    except Exception as e:
        print(f"Error: {e}")