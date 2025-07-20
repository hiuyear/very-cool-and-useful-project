import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeveloperCard } from "@/components/developer-card";
import { DeveloperModal } from "@/components/developer-modal";
import type { Developer } from "@shared/schema";

export default function Results() {
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [searchQuery, setSearchQuery] = useState<any>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = localStorage.getItem('searchQuery');
    if (query) {
      setSearchQuery(JSON.parse(query));
    }
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchQuery || {}),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch developers');
      }

      const data = await response.json();
      setDevelopers(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching developers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(195,100%,50%)] mx-auto"></div>
          <p className="text-xl text-gray-300 mt-4">Searching for developers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error: {error}</p>
          <Button onClick={fetchDevelopers} className="bg-[hsl(195,100%,50%)] text-[hsl(222,84%,5%)]">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Search Results</h1>
          <p className="text-xl text-gray-300">
            Found <span className="text-[hsl(195,100%,50%)] font-semibold">{developers.length}</span> developers matching your criteria
          </p>
          {searchQuery?.prompt && (
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
              "{searchQuery.prompt}"
            </p>
          )}
        </div>

        {/* Results Grid */}
        {developers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {developers.map((developer, index) => (
              <div
                key={developer.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <DeveloperCard
                  developer={developer}
                  onClick={() => setSelectedDeveloper(developer)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No developers found matching your criteria.</p>
            <Button 
              onClick={() => window.location.href = '/search'} 
              className="mt-4 bg-[hsl(195,100%,50%)] text-[hsl(222,84%,5%)]"
            >
              Try New Search
            </Button>
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center">
          <Button
            variant="outline"
            className="border-[hsl(195,100%,50%)]/30 hover:bg-[hsl(195,100%,50%)]/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Load More Results
          </Button>
        </div>

        {/* Developer Modal */}
        <DeveloperModal
          developer={selectedDeveloper}
          open={!!selectedDeveloper}
          onClose={() => setSelectedDeveloper(null)}
        />
      </div>
    </div>
  );
}
