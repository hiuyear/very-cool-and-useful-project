// frontend/src/pages/search.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [prompt, setPrompt] = useState("");
  const [tools, setTools]   = useState("");
  const navigate            = useNavigate();

  const handleSearch = async () => {
    // send to Flask at /findHacker (via Vite proxy or absolute URL)
    const res = await fetch("/findHacker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        // assume comma‑separated list in the input
        tools: tools.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) {
      console.error("Search failed", await res.text());
      return;
    }
    const data = await res.json();
    // pass results via location state
    navigate("/results", { state: { results: data } });
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Find Hackers</h1>
      <label className="block mb-2">
        Natural‑language prompt:
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
        />
      </label>
      <label className="block mb-4">
        Tools (comma‑separated):
        <input
          type="text"
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
        />
      </label>
      <Button onClick={handleSearch} className="w-full">
        Search
      </Button>
    </div>
  );
}
