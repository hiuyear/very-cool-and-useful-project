app.post("/api/developers", async (req, res) => {
  try {
    const { prompt, tools } = req.body;

    // 1) Get filters from your prompt-breakdown service
    const fb = await axios.post("http://localhost:5000/findhacker", { prompt, tools });
    const filters = Array.isArray(fb.data) ? fb.data[0] : fb.data;

    // 2) Score & pick top 10 projects
    const allProjects = await Project.find().lean();
    const scored = allProjects
      .map(p => ({
        project:       p,
        compatibility: calculateCompatibility(filters, p)
      }))
      .filter(x => x.compatibility > 0)
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10);

    // 3) Extract unique candidates and build the exact front‑end shape
    const seen = new Set();
    const developers = scored.flatMap(({ project, compatibility }) =>
      (project.team_members || [])
        .filter(m => m.profile_url && !seen.has(m.profile_url))
        .map(m => {
          seen.add(m.profile_url);
          const username = m.profile_url.split("/").pop();
          const id       = username;                // or use a UUID / Mongo _id
          const date     = project.timestamp 
                            ? new Date(project.timestamp * 1000).toISOString().slice(0,10)
                            : "Recent";

          return {
            id,                                    // unique identifier
            name:        m.name || username,      // full name or fallback
            location:    null,                    // populate later from profile
            profile:     m.profile_url,           // Devpost URL

            matchScore:  Math.round(compatibility), // number 0–100
            projectDate: date,                     // YYYY‑MM‑DD or "Recent"

            projects:    1,                        // for per‑project match; you can sum later
            rating:      compatibility,            // arbitrary metric

            skills:      project.built_with || [],

            projectHighlights: [                   // optional array
              {
                title:        project.title,
                description:  project.description || "",
                technologies: project.built_with || []
              }
            ]
          };
        })
    );

    // 4) Return the array
    res.json(developers);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});