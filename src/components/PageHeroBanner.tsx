import { ReactNode } from "react";

interface PageHeroBannerProps {
  image: string;
  title: string;
  highlight: string;
  subtitle?: string;
  badge?: ReactNode;
  mantra?: string;
}

const PageHeroBanner = ({ image, title, highlight, subtitle, badge, mantra }: PageHeroBannerProps) => (
  <section className="relative min-h-[34vh] sm:min-h-[40vh] md:min-h-[48vh] lg:min-h-[55vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-divine" />
    <div className="absolute inset-0 hidden sm:block">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover object-center"
        style={{ transform: "scale(1.08)" }}
      />
      <div className="absolute inset-0 bg-gradient-divine/80" />
    </div>
    <div className="absolute top-[-20%] left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl opacity-90 sm:hidden" />
    <div className="absolute bottom-8 left-6 h-24 w-24 rounded-full bg-saffron/15 blur-3xl opacity-90 sm:hidden" />
    <div className="absolute top-6 right-6 h-20 w-20 rounded-full bg-primary/10 blur-3xl opacity-90 sm:hidden" />
    <div className="relative z-10 text-center px-4 py-12 sm:py-0 max-w-3xl mx-auto">
      {mantra && (
        <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider animate-fade-in">{mantra}</p>
      )}
      {badge && <div className="mb-3 animate-fade-in">{badge}</div>}
      <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-3 md:mb-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        {title} <span className="text-gold-light">{highlight}</span>
      </h1>
      {subtitle && (
        <p className="text-primary-foreground/85 text-sm md:text-lg max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {subtitle}
        </p>
      )}
    </div>
  </section>
);

export default PageHeroBanner;
