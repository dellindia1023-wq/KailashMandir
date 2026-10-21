import { ReactNode } from "react";

interface PageHeroBannerProps {
  image: string;
  title: string;
  highlight: string;
  subtitle?: string;
  badge?: ReactNode;
  mantra?: string;
  accentGradient?: string;
  children?: ReactNode;
}

const PageHeroBanner = ({ 
  image, 
  title, 
  highlight, 
  subtitle, 
  badge, 
  mantra,
  accentGradient,
  children 
}: PageHeroBannerProps) => (
  <section className="relative py-14 sm:py-18 md:py-24 flex items-center justify-center overflow-hidden border-b border-border/40">
    {/* Base subtle divine gradient */}
    <div className="absolute inset-0 bg-gradient-divine opacity-80" />
    
    {/* Background Image with balanced multi-tone overlay */}
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover object-center opacity-45 dark:opacity-35 transition-transform duration-1000 scale-105"
      />
      {/* Primary vertical dark gradient for text legibility and smooth page transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-background pointer-events-none" />
      {/* Radial vignette preserving image center while dark around text */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/80 pointer-events-none" />
      {/* Optional page-specific accent overlay */}
      {accentGradient && (
        <div className={`absolute inset-0 ${accentGradient} pointer-events-none`} />
      )}
    </div>

    {/* Content Container */}
    <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
      {mantra && (
        <p className="text-gold font-heading text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-2 drop-shadow flex items-center justify-center gap-2">
          <span className="h-px w-6 sm:w-10 bg-gold/40 inline-block" aria-hidden="true" />
          {mantra}
          <span className="h-px w-6 sm:w-10 bg-gold/40 inline-block" aria-hidden="true" />
        </p>
      )}

      {badge && <div className="mb-3 inline-block">{badge}</div>}

      <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
        {title} <span className="bg-gradient-to-r from-amber-300 via-gold to-orange-400 bg-clip-text text-transparent">{highlight}</span>
      </h1>

      {/* Devotional accent line */}
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4" aria-hidden="true">
        <span className="h-0.5 w-8 sm:w-12 rounded-full bg-gradient-to-r from-transparent via-gold to-gold" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-diya-glow" />
        <span className="h-0.5 w-8 sm:w-12 rounded-full bg-gradient-to-l from-transparent via-gold to-gold" />
      </div>

      {subtitle && (
        <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
          {subtitle}
        </p>
      )}

      {children && (
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  </section>
);

export default PageHeroBanner;
