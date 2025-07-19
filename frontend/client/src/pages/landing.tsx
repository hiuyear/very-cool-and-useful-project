import { Rocket, Search, Brain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { DevHuntLogo } from "@/components/logo";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[hsl(195,100%,50%)]/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(158,64%,52%)]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect <br />
              <span className="gradient-text">Developer</span> Match
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered platform that connects you with skilled developers who have proven experience in your exact use case
            </p>
            <div className="bg-[hsl(217,33%,17%)]/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-lg text-gray-300">
                Find previously done hackathon projects and hire people who have expertise already
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] text-[hsl(222,84%,5%)] px-12 py-4 text-lg font-bold hover:scale-105 transition-transform animate-glow"
              onClick={() => navigate('/search')}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Start Your Search Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[hsl(217,33%,17%)]/50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            How DevHunt Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-holographic rounded-2xl p-8 text-center">
              <Search className="text-[hsl(195,100%,50%)] text-4xl mb-4 mx-auto h-16 w-16" />
              <h3 className="text-xl font-semibold mb-4">Describe Your Project</h3>
              <p className="text-gray-300">
                Tell us about your project or the skills you need. Our AI understands context.
              </p>
            </div>
            <div className="card-holographic rounded-2xl p-8 text-center">
              <Brain className="text-[hsl(158,64%,52%)] text-4xl mb-4 mx-auto h-16 w-16" />
              <h3 className="text-xl font-semibold mb-4">AI-Powered Matching</h3>
              <p className="text-gray-300">
                We analyze hackathon projects and provide a rating for developers with proven experience, based on potential and compatibility with your project.
              </p>
            </div>
            <div className="card-holographic rounded-2xl p-8 text-center">
              <Users className="text-[hsl(45,93%,47%)] text-4xl mb-4 mx-auto h-16 w-16" />
              <h3 className="text-xl font-semibold mb-4">Connect & Hire</h3>
              <p className="text-gray-300">
                Review detailed profiles and connect with your perfect developer match.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
