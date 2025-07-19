
import { useEffect, useState } from "react";

export function AnimatedDinosaur() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative animate-walk">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="text-[hsl(195,100%,50%)]"
        fill="currentColor"
      >
        {/* Dinosaur body */}
        <ellipse cx="20" cy="28" rx="8" ry="6" />
        
        {/* Dinosaur head */}
        <ellipse cx="12" cy="20" rx="6" ry="5" />
        
        {/* Eye */}
        <circle cx="9" cy="18" r="1.5" fill="white" />
        <circle cx="8.5" cy="17.5" r="0.8" fill="black" />
        
        {/* Tail */}
        <ellipse cx="30" cy="26" rx="4" ry="2" />
        
        {/* Legs - animated walking */}
        <g>
          {frame % 2 === 0 ? (
            <>
              <ellipse cx="16" cy="34" rx="1.5" ry="3" />
              <ellipse cx="24" cy="35" rx="1.5" ry="2" />
            </>
          ) : (
            <>
              <ellipse cx="16" cy="35" rx="1.5" ry="2" />
              <ellipse cx="24" cy="34" rx="1.5" ry="3" />
            </>
          )}
        </g>
        
        {/* Back spikes */}
        <polygon points="14,15 16,12 18,15" />
        <polygon points="18,16 20,13 22,16" />
        <polygon points="22,18 24,15 26,18" />
      </svg>
    </div>
  );
}
