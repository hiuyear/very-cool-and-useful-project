export function DevHuntLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-2xl font-bold gradient-text">DEVHUNT</span>
    </div>
  );
}