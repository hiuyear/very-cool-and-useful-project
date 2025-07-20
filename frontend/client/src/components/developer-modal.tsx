import { X, Mail, Github, Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Developer } from "@shared/schema";

interface DeveloperModalProps {
  developer: Developer | null;
  open: boolean;
  onClose: () => void;
}

export function DeveloperModal({ developer, open, onClose }: DeveloperModalProps) {
  if (!developer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] flex items-center justify-center text-[hsl(222,84%,5%)] font-bold text-2xl">
              {developer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text">{developer.name}</h2>
              <p className="text-[hsl(195,100%,50%)] text-lg">{developer.location}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-[hsl(158,64%,52%)] font-semibold">
                  {developer.matchScore}% Match
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{developer.projectDate || "Recent"}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[hsl(222,84%,5%)] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[hsl(158,64%,52%)]">
                {developer.projects}
              </div>
              <div className="text-gray-400">Total Projects</div>
            </div>
            <div className="bg-[hsl(222,84%,5%)] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[hsl(195,100%,50%)]">
                {developer.rating}
              </div>
              <div className="text-gray-400">Rating</div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Technical Skills</h3>
            <div className="flex flex-wrap gap-3">
              {developer.skills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-[hsl(195,100%,50%)]/20 text-[hsl(195,100%,50%)] px-4 py-2 text-sm font-medium"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Project Highlights */}
          {developer.projectHighlights && developer.projectHighlights.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Recent Project Highlights</h3>
              <div className="space-y-4">
                {developer.projectHighlights.map((project, index) => (
                  <div key={index} className="bg-[hsl(222,84%,5%)] rounded-xl p-6">
                    <h4 className="font-semibold text-lg mb-2">{project.title}</h4>
                    <p className="text-gray-300 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge
                          key={tech}
                          variant="outline"
                          className="border-[hsl(195,100%,50%)]/30 text-[hsl(195,100%,50%)]"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {developer.detailedSummary && (
            <div>
              <h3 className="text-xl font-semibold mb-4">AI-Generated Summary</h3>
              <div className="bg-[hsl(222,84%,5%)] rounded-xl p-6">
                <p className="text-gray-300 leading-relaxed">
                  {developer.detailedSummary}
                </p>
              </div>
            </div>
          )}

          {/* Contact Actions */}
          <div className="flex space-x-4">
            <Button className="flex-1 bg-gradient-to-r from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] text-[hsl(222,84%,5%)] hover:scale-105 transition-transform">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            {developer.githubUrl && (
              <Button
                variant="outline"
                className="border-[hsl(195,100%,50%)]/30 hover:bg-[hsl(195,100%,50%)]/10"
                onClick={() => window.open(developer.githubUrl, '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                View GitHub
              </Button>
            )}
            {developer.linkedinUrl && (
              <Button
                variant="outline"
                className="border-[hsl(195,100%,50%)]/30 hover:bg-[hsl(195,100%,50%)]/10"
                onClick={() => window.open(developer.linkedinUrl, '_blank')}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
