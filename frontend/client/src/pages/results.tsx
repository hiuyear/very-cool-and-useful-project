// frontend/src/pages/results.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DeveloperCard } from "@/components/developer-card";
import type { Developer } from "@shared/schema";

export default function ResultsPage() {
  const { state } = useLocation<{ results: Developer[] }>();
  const navigate = useNavigate();
  const results = state?.results ?? [];

  if (!state) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">No results to show. Please start a search first.</p>
        <Button onClick={() => navigate("/search")}>Go to Search</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button onClick={() => navigate(-1)} className="mb-4">
        ← Back
      </Button>
      <h2 className="text-2xl font-semibold mb-6">Search Results</h2>
      {results.length === 0 ? (
        <p>No candidates matched your criteria.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {results.map((dev, i) => (
            <DeveloperCard key={i} developer={dev} />
          ))}
        </div>
      )}
    </div>
  );
}
