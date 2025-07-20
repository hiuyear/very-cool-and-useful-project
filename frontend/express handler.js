// server.js (excerpt inside your POST /api/developers handler)

const axios = require("axios");

app.post("/api/developers", async (req, res) => {
  try {
    const { prompt, tools } = req.body;

    // 1) Get filters
    const { data: fbData } = await axios.post("http://localhost:5000/findhacker", { prompt, tools });
    const filters = Array.isArray(fbData) ? fbData[0] : fbData;

    // 2) Score & pick top projects
    const allProjects = await Project.find().lean();
    const scored = allProjects
      .map(p => ({ project: p, compatibility: calculateCompatibility(filters, p) }))
      .filter(x => x.compatibility > 0)
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10);

    // 3) Build raw developers
    const seen = new Set();
    const developers = scored.flatMap(({ project, compatibility }) =>
      (project.team_members || [])
        .filter(m => m.profile_url && !seen.has(m.profile_url))
        .map(m => {
          seen.add(m.profile_url);
          const username = m.profile_url.split("/").pop();
          return {
            id:               username,
            name:             m.name || username,
            location:         null,            // fill below
            profile:          m.profile_url,

            matchScore:       compatibility,
            projectDate:      "Recent",

            projects:         projectHighlights.length,
            rating:           compatibility,

            skills:           project.built_with || [],

            projectHighlights: [{
              title:        project.title,
              description:  project.description || "",
              technologies: project.built_with || []
            }],

            // placeholders for enrichment:
            detailedSummary: "",
            githubUrl:       "",
            linkedinUrl:     ""
          };
        })
    );

    // 4) Enrich with summaries (batch call to your /summarizeCandidates service)
    //    prepare rows for summarization: [ [name, proj1, proj2, ...], ... ]
    const summaryRows = developers.map(dev => [
      dev.name,
      ...dev.projectHighlights.map(h => h.title)
    ]);
    const { data: summaries } = await axios.post(
      "http://localhost:5000/summarizeCandidates",
      { data: summaryRows }
    );
    // summaries is an array of { name, detailedSummary, githubUrl, linkedinUrl }
    const summaryMap = new Map(summaries.map(s => [s.name, s.detailedSummary]));

    // 5) Enrich with profile info (call your profile scraper for GitHub/LinkedIn)
    //    you could batch or call in parallel; here’s a simple parallel example:
    await Promise.all(developers.map(async dev => {
      // attach summary
      dev.detailedSummary = summaryMap.get(dev.name) || "";

      // fetch profile info
      try {
        const { data: profileInfo } = await axios.get(
          `http://localhost:5000/profile?url=${encodeURIComponent(dev.profile)}`
        );
        dev.githubUrl   = profileInfo.github   || "";
        dev.linkedinUrl = profileInfo.linkedin || "";
        dev.location    = profileInfo.location || null;
      } catch (err) {
        console.warn("Profile scrape failed for", dev.profile, err.message);
      }
    }));

    // 6) Return fully-enriched developers
    res.json(developers);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});