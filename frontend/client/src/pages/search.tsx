// frontend/src/pages/search.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [prompt, setPrompt] = useState("");
  const [tools, setTools] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    const toolsArray = tools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/developers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, tools: toolsArray }),
    });

<<<<<<< HEAD
    setIsLoading(true);

    try {
      // Step 1: Call Gemini Flask backend to get extracted filters
      const response1 = await fetch("http://localhost:5000/findHacker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: searchData.prompt,
          tools: searchData.skills,
        }),
      });

      const aiFilters = await response1.json();
      console.log("Gemini filters:", aiFilters);

      // Step 2: Save everything to localStorage
      localStorage.setItem(
        "searchQuery",
        JSON.stringify({
          ...searchData,
          filters: aiFilters,
        })
      );
    
      
      try {
      // Step 3: Pass filters python app.py
      const response2 = await fetch("http://localhost:5001/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: aiFilters,
        }),
      });

    
    const matchResults = await response2.json();
    console.log("Match results:", matchResults);
}   catch (err) {
    console.error("Error during fetch sequence:", err);
}
      

      // Step 2: Save everything to localStorage
      localStorage.setItem(
        "searchQuery",
        JSON.stringify({
          ...searchData,
          filters: aiFilters,
        })
      );

      // Step 3: Navigate to results page
      navigate("/results");
    } catch (error) {
      console.error("Error calling backend:", error);
      alert("Something went wrong while analyzing your search.");
    } finally {
      setIsLoading(false);
=======
    if (!res.ok) {
      console.error("Search failed:", await res.text());
      return;
>>>>>>> 0b25400e6c3e5ad7710a59c28054bd9998e97c40
    }

    const data = await res.json();
    console.log("Fetched developers:", data);
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
