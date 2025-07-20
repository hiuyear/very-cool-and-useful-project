import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DevHuntLogo } from "./logo";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-[hsl(195,100%,50%)]/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
          <DevHuntLogo />
        </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-[hsl(195,100%,50%)] transition-colors">
              How it Works
            </a>
            <a href="#" className="text-gray-300 hover:text-[hsl(195,100%,50%)] transition-colors">
              About
            </a>
            <Button className="bg-[hsl(195,100%,50%)] text-[hsl(222,84%,5%)] hover:bg-[hsl(195,100%,50%)]/80">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}