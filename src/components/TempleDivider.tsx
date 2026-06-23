const TempleDivider = () => (
  <div className="flex items-center justify-center py-6 md:py-10 overflow-hidden">
    <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent via-gold/30 to-gold/60 animate-pulse-border" />
    <div className="mx-3 flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rotate-45 bg-gold/40 animate-sparkle" style={{ animationDelay: "0s" }} />
      <div className="w-2 h-2 rotate-45 bg-gold/60 animate-sparkle" style={{ animationDelay: "0.3s" }} />
      <span className="text-gold font-heading text-lg md:text-xl animate-diya-glow mx-1">ॐ</span>
      <div className="w-2 h-2 rotate-45 bg-gold/60 animate-sparkle" style={{ animationDelay: "0.6s" }} />
      <div className="w-1.5 h-1.5 rotate-45 bg-gold/40 animate-sparkle" style={{ animationDelay: "0.9s" }} />
    </div>
    <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent via-gold/30 to-gold/60 animate-pulse-border" />
  </div>
);

export default TempleDivider;
