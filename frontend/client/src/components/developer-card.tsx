import { Github, Linkedin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Developer } from "@shared/schema";

interface DeveloperCardProps {
  developer: Developer;
  onClick: () => void;
}

export function DeveloperCard({ developer, onClick }: DeveloperCardProps) {
  const displaySkills = developer.skills.slice(0, 3);
  const remainingSkills = developer.skills.length - 3;

  return (
    <Card 
      className="pokemon-card rounded-2xl p-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] flex items-center justify-center text-[hsl(222,84%,5%)] font-bold text-lg">
            {developer.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-lg">{developer.name}</h3>
            <p className="text-[hsl(195,100%,50%)] text-sm">{developer.location}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[hsl(158,64%,52%)] font-bold text-lg">
            {developer.matchScore}%
          </div>
          <div className="text-xs text-gray-400">Match</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {displaySkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-[hsl(195,100%,50%)]/20 text-[hsl(195,100%,50%)] text-sm"
            >
              {skill}
            </Badge>
          ))}
          {remainingSkills > 0 && (
            <Badge
              variant="secondary"
              className="bg-[hsl(195,100%,50%)]/20 text-[hsl(195,100%,50%)] text-sm"
            >
              +{remainingSkills}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-[hsl(158,64%,52%)]">
            {developer.projects}
          </div>
          <div className="text-xs text-gray-400">Projects</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-[hsl(45,93%,47%)]">
            {developer.experience}
          </div>
          <div className="text-xs text-gray-400">Experience</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {developer.hourlyRate || "$85/hr"}
          </div>
          <div className="text-xs text-gray-400">Rate</div>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
        {developer.summary}
      </p>

      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 bg-[hsl(195,100%,50%)] text-[hsl(222,84%,5%)] hover:bg-[hsl(195,100%,50%)]/80"
          onClick={(e) => {
            e.stopPropagation();
            window.open(developer.githubUrl, '_blank');
          }}
        >
          <Github className="h-4 w-4 mr-1" />
          GitHub
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-[hsl(195,100%,50%)]/30 hover:bg-[hsl(195,100%,50%)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.stopPropagation();
            if (developer.linkedinUrl) {
              window.open(developer.linkedinUrl, '_blank');
            }
          }}
          disabled={!developer.linkedinUrl}
        >
          <Linkedin className="h-4 w-4 mr-1" />
          LinkedIn
        </Button>
      </div>
    </Card>
  );
}
