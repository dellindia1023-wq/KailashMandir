import { useState, useEffect, useCallback } from "react";
import { ArrowDown, Calendar, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const INTERVAL = 5000;

const Hero = () => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Dynamic content from database
  const [settings, setSettings] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_button_text: "Book Puja",
    hero_button_link: "/pujas",
    years_of_heritage: 200,
    daily_devotees: 5000,
    days_open: 365,
  });
  const [slides, setSlides] = useState<Array<{ url: string; alt: string }>>([]);

  useEffect(() => {
    fetchHomepageSettings();
  }, []);

  const fetchHomepageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setSettings({
          hero_title: data.hero_title || "",
          hero_subtitle: data.hero_subtitle || "",
          hero_button_text: data.hero_button_text || "Book Puja",
          hero_button_link: data.hero_button_link || "/pujas",
          years_of_heritage: data.years_of_heritage || 200,
          daily_devotees: data.daily_devotees || 5000,
          days_open: data.days_open || 365,
        });
        if (data.hero_images && Array.isArray(data.hero_images) && data.hero_images.length > 0) {
          console.log("Hero images loaded:", data.hero_images);
          setSlides(data.hero_images);
          setCurrent(0);
        }
      }
    } catch (error) {
      console.error("Error loading homepage settings:", error);
    }
  };

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (slides.length || 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + (slides.length || 1)) % (slides.length || 1));
  }, [slides.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setTouchStart(null);
    setIsPaused(false);
  }, [touchStart, next, prev]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next, slides.length]);

  return (
    <section
      id="home"
      className="relative h-[calc(100vh-64px)] md:h-screen min-h-[640px] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hero carousel images */}
      {slides.length > 0 && slides.map((slide, i) => (
        <div
          key={`slide-${i}`}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ 
            opacity: i === current ? 1 : 0,
            pointerEvents: i === current ? 'auto' : 'none'
          }}
        >
          <img
            src={slide.url}
            alt={slide.alt || "Hero banner"}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            decoding="async"
            loading={i === 0 ? "eager" : "lazy"}
            onError={(e) => {
              console.error(`Failed to load image ${i}:`, slide.url);
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23333' width='1920' height='1080'/%3E%3C/svg%3E";
            }}
          />
        </div>
      ))}

      {/* Fallback gradient if no images */}
      {slides.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/40 via-orange/30 to-gold/20" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-divine z-[1]" />

      {/* Floating orbs */}
      <div className="hidden md:block absolute top-16 left-8 w-16 h-16 rounded-full bg-gold/20 blur-2xl animate-float z-[2]" />
      <div className="hidden md:block absolute top-32 right-16 w-24 h-24 rounded-full bg-saffron/15 blur-3xl animate-float z-[2]" style={{ animationDelay: "1.5s" }} />
      <div className="hidden md:block absolute bottom-40 right-20 w-32 h-32 rounded-full bg-saffron/20 blur-3xl animate-float z-[2]" style={{ animationDelay: "3s" }} />
      <div className="hidden md:block absolute bottom-28 left-16 w-20 h-20 rounded-full bg-gold/15 blur-2xl animate-float z-[2]" style={{ animationDelay: "4.5s" }} />

      {/* Floating diya flames */}
      <div className="hidden md:block absolute top-24 right-10 animate-float opacity-60 z-[2]" style={{ animationDelay: "1s" }}>
        <Flame className="h-5 w-5 text-gold animate-diya-glow" />
      </div>
      <div className="hidden md:block absolute bottom-36 left-12 animate-float opacity-50 z-[2]" style={{ animationDelay: "2.5s" }}>
        <Flame className="h-4 w-4 text-saffron animate-diya-glow" />
      </div>

      {/* Particle dots */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="hidden md:block absolute w-1 h-1 rounded-full bg-gold/40 animate-sparkle z-[2]"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 16}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Slide navigation arrows - only show if multiple images */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/80 hover:bg-background/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/20 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/80 hover:bg-background/30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dot indicators - only show if multiple images */}
      {slides.length > 1 && (
        <div className="absolute bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-8 bg-gold"
                  : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto">
          <p className="animate-text-shimmer font-heading text-base md:text-xl mb-3 md:mb-4 tracking-wider animate-fade-in">
            {t("hero.mantra")}
          </p>

          <h1
            className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4 md:mb-6 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {settings.hero_title || t("hero.templeName")}
            {settings.hero_subtitle ? (
              <span className="block animate-text-shimmer text-2xl md:text-4xl lg:text-5xl">{settings.hero_subtitle}</span>
            ) : t("hero.templeLocation") ? (
              <span className="block animate-text-shimmer">{t("hero.templeLocation")}</span>
            ) : null}
          </h1>

          <p
            className="text-sm md:text-lg lg:text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-6 md:mb-8 animate-fade-in px-2 leading-relaxed"
            style={{ animationDelay: "0.4s" }}
          >
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Link to="/darshan-timings" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-6 md:px-8 py-5 md:py-6 text-base md:text-lg glow-gold animate-diya-glow"
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t("hero.viewDarshanTimings")}
              </Button>
            </Link>
            <Link to={settings.hero_button_link} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg backdrop-blur-sm"
              >
                {settings.hero_button_text}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-8 mt-8 md:mt-16 animate-fade-in" style={{ animationDelay: "0.8s" }}>
            {[
              { value: `${settings.years_of_heritage}+`, label: t("hero.yearsHeritage") },
              { value: `${settings.daily_devotees / 1000}K+`, label: t("hero.dailyDevotees") },
              { value: settings.days_open.toString(), label: t("hero.daysOpen") },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center relative p-3 rounded-xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 animate-shimmer"
              >
                <p className="text-2xl md:text-4xl font-heading font-bold text-gold">{stat.value}</p>
                <p className="text-xs md:text-base text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link to="/darshan-timings" className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10" aria-label="Explore more">
        <ArrowDown className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground/70" />
      </Link>
    </section>
  );
};

export default Hero;

