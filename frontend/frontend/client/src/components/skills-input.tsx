import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SKILLS } from "@/lib/constants";

interface SkillsInputProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export function SkillsInput({ selectedSkills, onSkillsChange }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered = SKILLS.filter(
      skill =>
        skill.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedSkills.includes(skill)
    ).slice(0, 8);
    setFilteredSkills(filtered);
  }, [inputValue, selectedSkills]);

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill]);
    }
    setInputValue("");
    setShowDropdown(false);
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue.trim());
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type skills (Python, React, etc.)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={handleKeyDown}
          className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30 text-white placeholder-gray-400 focus:border-[hsl(195,100%,50%)]"
        />
        
        {showDropdown && filteredSkills.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[hsl(217,33%,17%)] border border-[hsl(195,100%,50%)]/30 rounded-lg mt-1 z-10">
            <div className="p-2">
              {filteredSkills.map((skill) => (
                <div
                  key={skill}
                  className="px-3 py-2 hover:bg-[hsl(195,100%,50%)]/20 cursor-pointer rounded"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSkill(skill)}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-[hsl(195,100%,50%)] text-[hsl(222,84%,5%)] hover:bg-[hsl(195,100%,50%)]/80"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 hover:bg-[hsl(195,100%,50%)]/80 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
