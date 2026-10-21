import { useState, useEffect, useCallback } from "react";
import { ArrowDown, Calendar, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { buildHeroSlides, type HeroMediaItem } from "@/lib/homeHeroMedia";

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
  const [slides, setSlides] = useState<HeroMediaItem[]>(() => buildHeroSlides(null, templeHero));
  const [hasLoadedRemoteSettings, setHasLoadedRemoteSettings] = useState(false);

  const currentSlide = slides[current];
  const heroTitle = currentSlide?.title || settings.hero_title || t("hero.templeName");
  const heroSubtitle = currentSlide?.subtitle || settings.hero_subtitle || t("hero.templeLocation");
  const heroButtonText = currentSlide?.button_text || settings.hero_button_text;
  const heroButtonLink = currentSlide?.button_link || settings.hero_button_link;

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

        const slidesFromDb = buildHeroSlides(data, templeHero);
        setSlides(slidesFromDb);
        setCurrent(0);
      } else {
        setSlides(buildHeroSlides(null, templeHero));
      }

      setHasLoadedRemoteSettings(true);
    } catch (error) {
      console.error("Error loading homepage settings:", error);
      setSlides(buildHeroSlides(null, templeHero));
      setHasLoadedRemoteSettings(true);
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
      if (diff > 0) {
        next();
      } else {
        prev();
      }
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
      className="relative min-h-[560px] sm:min-h-[600px] md:h-[84vh] md:min-h-[640px] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hero carousel media */}
      {slides.length > 0 && slides.map((slide, i) => (
        <div
          key={`slide-${i}`}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: i === current ? 1 : 0,
            pointerEvents: i === current ? "auto" : "none",
          }}
        >
          {slide.media_type === "video" ? (
            <video
              src={slide.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload={i === 0 ? "auto" : "metadata"}
            />
          ) : (
            <img
              src={slide.url}
              alt={slide.alt || "Hero banner"}
              className="w-full h-full object-cover object-center"
              width={1920}
              height={1080}
              decoding="async"
              loading={i === 0 ? "eager" : "lazy"}
              onError={(e) => {
                console.error(`Failed to load image ${i}:`, slide.url);
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23333' width='1920' height='1080'/%3E%3C/svg%3E";
              }}
            />
          )}
        </div>
      ))}

      {/* Fallback gradient if no images */}
      {slides.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/40 via-orange/30 to-gold/20" />
      )}

      {/* Carefully balanced gradient overlay — preserves vibrant temple view while securing text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/65 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 opacity-70 z-[1]" />

      {/* Subtle floating glow orbs */}
      <div className="hidden md:block absolute top-16 left-8 w-16 h-16 rounded-full bg-gold/15 blur-2xl animate-float z-[2]" />
      <div className="hidden md:block absolute top-32 right-16 w-24 h-24 rounded-full bg-saffron/10 blur-3xl animate-float z-[2]" style={{ animationDelay: "1.5s" }} />
      <div className="hidden md:block absolute bottom-40 right-20 w-32 h-32 rounded-full bg-saffron/15 blur-3xl animate-float z-[2]" style={{ animationDelay: "3s" }} />
      <div className="hidden md:block absolute bottom-28 left-16 w-20 h-20 rounded-full bg-gold/10 blur-2xl animate-float z-[2]" style={{ animationDelay: "4.5s" }} />

      {/* Floating diya flames */}
      <div className="hidden md:block absolute top-24 right-10 animate-float opacity-60 z-[2]" style={{ animationDelay: "1s" }}>
        <Flame className="h-5 w-5 text-gold animate-diya-glow" />
      </div>
      <div className="hidden md:block absolute bottom-36 left-12 animate-float opacity-50 z-[2]" style={{ animationDelay: "2.5s" }}>
        <Flame className="h-4 w-4 text-saffron animate-diya-glow" />
      </div>

      {/* Slide navigation arrows - only show if multiple images */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dot indicators - only show if multiple images */}
      {slides.length > 1 && (
        <div className="absolute bottom-14 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-8 bg-gold shadow-md"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 text-center pt-16 sm:pt-20 pb-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="inline-block text-gold-light font-heading text-sm sm:text-base md:text-lg mb-2 sm:mb-3 tracking-widest uppercase font-semibold drop-shadow-md">
            {t("hero.mantra")}
          </p>

          <h1
            className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
            style={{ animationDelay: "0.2s" }}
          >
            {heroTitle}
            {heroSubtitle ? (
              <span className="block mt-1 sm:mt-2 text-gold-light font-medium text-xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {heroSubtitle}
              </span>
            ) : null}
          </h1>

          <p
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 max-w-2xl sm:max-w-3xl mx-auto mb-6 sm:mb-8 px-2 leading-relaxed font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
            style={{ animationDelay: "0.4s" }}
          >
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4" style={{ animationDelay: "0.6s" }}>
            <Link to="/darshan-timings" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-gold via-amber-500 to-gold hover:from-gold-light hover:to-amber-400 text-slate-950 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base md:text-lg shadow-xl shadow-gold/20 hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl"
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t("hero.viewDarshanTimings")}
              </Button>
            </Link>
            <Link to={heroButtonLink} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/60 bg-black/25 text-white hover:bg-white/20 hover:text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base md:text-lg backdrop-blur-md transition-all rounded-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {heroButtonText}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mt-8 sm:mt-12 md:mt-14 max-w-2xl mx-auto" style={{ animationDelay: "0.8s" }}>
            {[
              { value: `${settings.years_of_heritage}+`, label: t("hero.yearsHeritage") },
              { value: `${settings.daily_devotees / 1000}K+`, label: t("hero.dailyDevotees") },
              { value: settings.days_open.toString(), label: t("hero.daysOpen") },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center p-2.5 sm:p-4 rounded-xl bg-black/30 backdrop-blur-md border border-white/15 shadow-lg"
              >
                <p className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-gold drop-shadow">{stat.value}</p>
                <p className="text-[11px] sm:text-xs md:text-sm text-white/85 font-medium mt-0.5">{stat.label}</p>
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

