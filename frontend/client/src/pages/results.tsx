import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeveloperCard } from "@/components/developer-card";
import { DeveloperModal } from "@/components/developer-modal";
import type { Developer } from "@shared/schema";

// This would normally come from your API
const MOCK_DEVELOPERS: Developer[] = [
  {
    id: 1,
    name: "Alex Chen",
    username: "alexchen",
    location: "San Francisco, CA",
    skills: ["React", "Node.js", "Python", "Django", "PostgreSQL", "AWS"],
    experience: "3.5y",
    projects: 8,
    rating: "4.9",
    summary: "Built fintech apps with React & Python. Led team in blockchain hackathon, created trading dashboard.",
    detailedSummary: "Alex is an exceptionally talented full-stack developer with a proven track record in fintech applications. His experience building complex financial dashboards and real-time trading systems makes him an ideal candidate for projects requiring both technical excellence and domain expertise in finance.",
    githubUrl: "https://github.com/alexchen",
    linkedinUrl: "https://linkedin.com/in/alexchen",
    hourlyRate: "$85/hr",
    projectDate: "2024-01",
    matchScore: 95,
    projectHighlights: [
      {
        title: "FinanceTracker Pro",
        description: "Built a comprehensive personal finance management application with real-time bank integration and AI-powered spending insights.",
        technologies: ["React", "Python", "ML"]
      },
      {
        title: "Blockchain Trading Dashboard",
        description: "Led a team of 4 developers to create a real-time cryptocurrency trading dashboard with advanced charting and portfolio management.",
        technologies: ["Vue.js", "WebSocket", "Chart.js"]
      }
    ]
  },
  {
    id: 2,
    name: "Sarah Rodriguez",
    username: "sarahrod",
    location: "Austin, TX",
    skills: ["Vue.js", "Django", "PostgreSQL", "Docker", "Kubernetes"],
    experience: "5.2y",
    projects: 12,
    rating: "4.8",
    summary: "Full-stack developer specializing in e-commerce. Won health-tech hackathon with ML recommendation engine.",
    detailedSummary: "Sarah brings extensive experience in building scalable e-commerce platforms and has a strong background in machine learning applications for health technology.",
    githubUrl: "https://github.com/sarahrod",
    linkedinUrl: "https://linkedin.com/in/sarahrod",
    hourlyRate: "$95/hr",
    projectDate: "2023-12",
    matchScore: 92,
    projectHighlights: []
  },
  {
    id: 3,
    name: "Marcus Kim",
    username: "marcusk",
    location: "Seattle, WA",
    skills: ["Angular", "Java", "MongoDB", "Spring Boot", "Microservices", "AWS", "DevOps"],
    experience: "6.1y",
    projects: 15,
    rating: "4.7",
    summary: "Enterprise software architect. Created IoT monitoring system, won smart city hackathon with data visualization.",
    detailedSummary: "Marcus specializes in enterprise-grade software architecture with expertise in IoT systems and data visualization platforms for smart city applications.",
    githubUrl: "https://github.com/marcusk",
    linkedinUrl: "https://linkedin.com/in/marcusk",
    hourlyRate: "$120/hr",
    projectDate: "2023-11",
    matchScore: 88,
    projectHighlights: []
  }
];

export default function Results() {
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [searchQuery, setSearchQuery] = useState<any>(null);

  useEffect(() => {
    const query = localStorage.getItem('searchQuery');
    if (query) {
      setSearchQuery(JSON.parse(query));
    }
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Search Results</h1>
          <p className="text-xl text-gray-300">
            Found <span className="text-[hsl(195,100%,50%)] font-semibold">{MOCK_DEVELOPERS.length}</span> developers matching your criteria
          </p>
          {searchQuery?.prompt && (
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
              "{searchQuery.prompt}"
            </p>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {MOCK_DEVELOPERS.map((developer, index) => (
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
