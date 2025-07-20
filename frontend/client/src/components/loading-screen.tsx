
import { useState, useEffect } from "react";
import { AnimatedDinosaur } from "./animated-dinosaur";

interface LoadingScreenProps {
  isVisible: boolean;
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h2 className="text-3xl font-bold gradient-text">Finding Your Perfect Developers</h2>
        <div className="relative w-96 h-8">
          {/* Progress bar */}
          <div className="w-full h-8 bg-[hsl(217,33%,17%)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Animated dinosaur walking on top */}
          <div 
            className="absolute -top-6 transition-all duration-300 ease-out"
            style={{ 
              left: `${Math.max(0, Math.min(progress - 2, 92))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <AnimatedDinosaur />
          </div>
        </div>
        <p className="text-xl text-gray-300">{Math.round(progress)}% Complete</p>
        <div className="space-y-2 text-gray-400">
          <p>Analyzing hackathon projects...</p>
          <p>Matching skills and experience...</p>
          <p>Ranking compatibility scores...</p>
        </div>
      </div>
    </div>
  );
}
