const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");

// Load .env variables
dotenv.config();

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// Define Project schema/model
const ProjectSchema = new mongoose.Schema({}, { strict: false });
const Project = mongoose.model("Project", ProjectSchema);

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

// Compatibility scoring
function calculateCompatibility(filters, project) {
  let score = 0;
  if (!filters || !project) return score;

  const title = (project.title || "").toLowerCase();
  const desc = (project.description || "").toLowerCase();
  const built = (project.built_with || []).map(s => s.toLowerCase());

  for (const skill of filters.tools || []) {
    const s = skill.toLowerCase();
    if (title.includes(s) || desc.includes(s) || built.includes(s)) score += 1;
  }

  return score;
}

app.post("/api/developers", async (req, res) => {
  try {
    const { prompt, tools } = req.body;

    // Step 1: Call Flask to extract filters
    console.log("→ Calling Flask /findhacker...");
    const { data: fbData } = await axios.post("http://127.0.0.1:5001/findhacker", { prompt, tools });
    const filters = Array.isArray(fbData) ? fbData[0] : fbData;
    console.log("✓ Filters received:", filters);

    // Step 2: Get and score projects
    const allProjects = await Project.find().lean();
    const scored = allProjects
      .map(p => ({ project: p, compatibility: calculateCompatibility(filters, p) }))
      .filter(x => x.compatibility > 0)
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10);

    // Step 3: Convert to developers
    const seen = new Set();
    const developers = scored.flatMap(({ project, compatibility }) => {
      const members = project.team_members || [];
      return members
        .filter(m => m.profile_url && !seen.has(m.profile_url))
        .map(m => {
          seen.add(m.profile_url);
          const username = m.profile_url.split("/").pop();
          return {
            id: username,
            name: m.name || username,
            location: null,
            profile: m.profile_url,
            matchScore: compatibility,
            projectDate: "Recent",
            projects: 1,
            rating: compatibility,
            skills: project.built_with || [],
            projectHighlights: [{
              title: project.title,
              description: project.description || "",
              technologies: project.built_with || []
            }],
            detailedSummary: "",
            githubUrl: "",
            linkedinUrl: ""
          };
        });
    });

    // Step 4: Summarize developers
    const summaryRows = developers.map(dev => [
      dev.name,
      ...dev.projectHighlights.map(h => h.title)
    ]);

    console.log("→ Calling Flask /summarizeCandidates...");
    const { data: summaries } = await axios.post("http://127.0.0.1:5001/summarizeCandidates", {
      data: summaryRows,
    });
    console.log("✓ Summaries received.");

    const summaryMap = new Map(summaries.map(s => [s.name, s.detailedSummary]));

    // Step 5: Scrape profiles
    await Promise.all(developers.map(async dev => {
      dev.detailedSummary = summaryMap.get(dev.name) || "";
      try {
        console.log(`→ Scraping profile for ${dev.name}`);
        const { data: profileInfo } = await axios.get(
          `http://127.0.0.1:5001/profile?url=${encodeURIComponent(dev.profile)}`
        );
        dev.githubUrl = profileInfo.github || "";
        dev.linkedinUrl = profileInfo.linkedin || "";
        dev.location = profileInfo.location || null;
      } catch (err) {
        console.warn("⚠️ Profile scrape failed for", dev.profile, err.message);
      }
    }));

    // Step 6: Respond
    res.json(developers);

  } catch (err) {
    console.error("❌ Error in /api/developers:", err.message);
    if (err.response) {
      console.error("↪ Status:", err.response.status);
      console.error("↪ Data:", err.response.data);
      return res.status(err.response.status).json({
        error: `Flask responded with ${err.response.status}`,
        details: err.response.data
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Start Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
