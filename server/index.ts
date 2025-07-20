import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/developers", async (req, res) => {
  const { prompt, tools } = req.body;
  // TODO: replace with your actual logic (DB, Flask, scraping, etc.)
  const developers = [
    {
      id: 1,
      name: "Alex Chen",
      username: "alexchen",
      location: "San Francisco, CA",
      skills: ["React", "Node.js", "Python"],
      experience: "3.5y",
      projects: 8,
      rating: "4.9",
      summary: "Built fintech apps with React & Python.",
      detailedSummary: "Alex is an exceptionally talented full-stack developer…"
    }
  ];
  res.json(developers);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Express server listening on http://localhost:${PORT}`);
});