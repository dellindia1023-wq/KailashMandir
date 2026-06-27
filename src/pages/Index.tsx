import { useEffect, useRef, useState, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import { Star as StarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NoticeMarquee from "@/components/NoticeMarquee";
import NextAartiCountdown from "@/components/NextAartiCountdown";
import MobileHomeCards from "@/components/MobileHomeCards";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Clock, History, Camera, Video, Heart, Phone,
  CalendarDays, Megaphone, BookOpen, MessageCircle, Sun, Moon,
  Sunrise, Sunset, MapPin, Users, Star, Quote, ChevronLeft, ChevronRight,
  Flame, Sparkles, Eye, BookMarked,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAartiTimings, formatTime, timeToMinutes } from "@/hooks/useAartiTimings";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import aartiCeremony from "@/assets/gallery/shivling-shringar-1.jpg";
import festival from "@/assets/gallery/shivling-flowers-3.jpg";
import shivlingGarland from "@/assets/gallery/shivling-garland.jpg";
import shivlingMala from "@/assets/gallery/shivling-mala.jpg";
import sanctumOverview from "@/assets/gallery/sanctum-overview.jpg";
import shivlingShringar2 from "@/assets/gallery/shivling-shringar-2.jpg";
import rudrabhishek from "@/assets/pujas/rudrabhishek.jpg";
import mahaShivaratri from "@/assets/pujas/maha-shivaratri.jpg";
import mrityunjayaJaap from "@/assets/pujas/mrityunjaya-jaap.jpg";
import shivChalisa from "@/assets/pujas/shiv-chalisa.jpg";

import TempleDivider from "@/components/TempleDivider";
import { useLanguage } from "@/contexts/LanguageContext";
import { mergeKeywords, SAME_AS, SITE_ALTERNATE_NAMES } from "@/constants/seo";
import { useBlogs } from "@/hooks/useBlog";

/* ─── Animated Counter Hook ─── */
const useCountUp = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
};

import useScrollReveal from "@/hooks/useScrollReveal";

/* ─── Parallax Hook ─── */
const useParallax = (speed = 0.3) => {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    if (rect.bottom < 0 || rect.top > windowH) return;
    const center = rect.top + rect.height / 2 - windowH / 2;
    setOffset(center * speed);
  }, [speed]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { ref, offset };
};

/* ─── Staggered Reveal Hook ─── */
const useStaggerReveal = (itemCount: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 100);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [itemCount]);

  return { ref, visibleItems };
};

/* ─── Quick Nav Sections ─── */
const sections = [
  { title: "Darshan Timings", description: "Daily aarti & darshan schedule", icon: Clock, href: "/darshan-timings", color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/20" },
  { title: "About Temple", description: "500+ years of heritage", icon: History, href: "/about", color: "text-saffron", bg: "bg-saffron/10", borderColor: "border-saffron/20" },
  { title: "Upcoming Events", description: "Festivals & celebrations", icon: CalendarDays, href: "/events", color: "text-maroon", bg: "bg-maroon/10", borderColor: "border-maroon/20" },
  { title: "Photo Gallery", description: "Divine moments captured", icon: Camera, href: "/gallery", color: "text-gold", bg: "bg-gold/10", borderColor: "border-gold/20" },
  { title: "Live Darshan", description: "Watch live 24/7", icon: Video, href: "/live-darshan", color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/20" },
  { title: "Blogs", description: "Insights & temple articles", icon: BookMarked, href: "/blogs", color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/20" },
  { title: "Knowledge Hub", description: "FAQ & common questions", icon: BookOpen, href: "/knowledge-hub", color: "text-gold", bg: "bg-gold/10", borderColor: "border-gold/20" },
  { title: "Donate", description: "Support the temple", icon: Heart, href: "/donate", color: "text-destructive", bg: "bg-destructive/10", borderColor: "border-destructive/20" },
  { title: "Book a Puja", description: "Sacred rituals & ceremonies", icon: BookOpen, href: "/pujas", color: "text-saffron", bg: "bg-saffron/10", borderColor: "border-saffron/20" },
  { title: "Notice Board", description: "Latest announcements", icon: Megaphone, href: "/notice-board", color: "text-maroon", bg: "bg-maroon/10", borderColor: "border-maroon/20" },
  { title: "Contact Us", description: "Get in touch & directions", icon: Phone, href: "/contact", color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/20" },
];

const getIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
};

const getAartiStatus = (startTime: string, endTime: string) => {
  const now = getIST();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (currentMinutes >= start && currentMinutes < end) return "Live";
  if (currentMinutes < start) return "Upcoming";
  return "Closed";
};

const getIconForAarti = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("mangla") || nameLower.includes("shayan")) return Moon;
  if (nameLower.includes("shringar")) return Sunrise;
  if (nameLower.includes("evening") || nameLower.includes("sandhya")) return Sunset;
  return Sun;
};

/* ─── Featured Pujas ─── */
const featuredPujas = [
  { name: "Rudrabhishek", price: "₹2,100", image: rudrabhishek, desc: "Sacred abhishekam with milk, honey & holy water" },
  { name: "Maha Shivaratri Special", price: "₹5,100", image: mahaShivaratri, desc: "Grand puja on the holiest night of Shiva" },
  { name: "Mrityunjaya Jaap", price: "₹3,100", image: mrityunjayaJaap, desc: "Powerful mantra jaap for health & protection" },
  { name: "Shiv Chalisa Path", price: "₹1,100", image: shivChalisa, desc: "Recitation of 40 verses praising Lord Shiva" },
];

/* ─── Testimonials ─── */
const testimonials = [
  { name: "Priya Sharma", location: "Delhi", text: "The divine energy of Kailash Mahadev Temple is unparalleled. Every visit fills my soul with peace and devotion. The priests are very knowledgeable and helpful.", rating: 5 },
  { name: "Rajesh Gupta", location: "Mumbai", text: "I booked a Rudrabhishek puja online and the experience was seamless. The temple management is excellent and the atmosphere is truly spiritual.", rating: 5 },
  { name: "Anita Verma", location: "Agra", text: "Being a local, I visit every Monday. The Shravan Somvar celebrations here are the best in the city. A must-visit for all Shiva devotees.", rating: 5 },
  { name: "Vikram Singh", location: "Jaipur", text: "The temple's online darshan and puja booking services are truly innovative. Received prasad at home after the puja. Wonderful experience!", rating: 4 },
];

/* ─── Gallery Images ─── */
const galleryImages = [
  { src: shivlingGarland, title: "Marigold Garland Offering" },
  { src: shivaLingam, title: "Chandan Shringar" },
  { src: shivlingShringar2, title: "Pushp Mala Decoration" },
  { src: sanctumOverview, title: "Sacred Sanctum" },
  { src: shivlingMala, title: "Rose Shringar" },
  { src: aartiCeremony, title: "Festival Shringar" },
];

/* ─── Sacred Mantras ─── */
const sacredMantras = [
  "ॐ नमः शिवाय",
  "हर हर महादेव",
  "ॐ त्र्यम्बकं यजामहे",
  "महामृत्युंजय मंत्र",
  "ॐ नमः शिवाय",
  "शिवोहम् शिवोहम्",
  "बम बम भोले",
  "जय शिव शंकर",
];

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [testimonialDirection, setTestimonialDirection] = useState<"left" | "right">("right");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [events, setEvents] = useState<{ id: string; event_name: string; start_date: string; end_date: string; image_url: string | null; location: string | null }[]>([]);
  const { t } = useLanguage();
  const { data: blogs = [] } = useBlogs("published");
  const { data: aartiSchedule = [], isLoading: isAartiLoading } = useAartiTimings(true);

  const counter1 = useCountUp(500);
  const counter2 = useCountUp(10000);
  const counter3 = useCountUp(365);
  const counter4 = useCountUp(50);

  // Scroll reveal refs for each section
  const revealStats = useScrollReveal();
  const revealExplore = useScrollReveal();
  const revealAarti = useScrollReveal();
  const revealPujas = useScrollReveal();
  const revealEvents = useScrollReveal();
  const revealGallery = useScrollReveal();
  const revealTestimonials = useScrollReveal();
  const revealCta = useScrollReveal();
  const revealEngage = useScrollReveal();
  const parallax = useParallax(0.35);

  // Staggered reveals
  const navStagger = useStaggerReveal(sections.length);
  const aartiStagger = useStaggerReveal(Math.max(aartiSchedule.length, 4));
  const pujaStagger = useStaggerReveal(featuredPujas.length);
  const galleryStagger = useStaggerReveal(galleryImages.length);
  const blogStagger = useStaggerReveal(Math.min(blogs.length, 3));

  // Fetch upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, event_name, start_date, end_date, image_url, location")
        .eq("is_active", true)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(3);
      if (data) setEvents(data);
    };
    fetchEvents();
  }, []);

  // Auto-rotate testimonials with smooth transition
  const changeTestimonial = useCallback((direction: "left" | "right") => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTestimonialDirection(direction);
    setTimeout(() => {
      setCurrentTestimonial((prev) =>
        direction === "right"
          ? (prev + 1) % testimonials.length
          : (prev - 1 + testimonials.length) % testimonials.length
      );
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  useEffect(() => {
    const timer = setInterval(() => {
      changeTestimonial("right");
    }, 5000);
    return () => clearInterval(timer);
  }, [changeTestimonial]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra | Kailash Mahadev Temple Agra — Official Website"
        description="Official site for kailash mandir, kailash mandir agra, kailash mahadev, kailash mahadev agra, kailash mahadev mandir agra, kailash mahadev temple agra. Timings, darshan, puja, live stream. Follow on Facebook, Instagram, YouTube & X."
        canonical="/"
        keywords={mergeKeywords("Kailash mandir timings", "live darshan", "puja booking Agra", "Mahashivratri")}

        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ReligiousOrganization",
            name: "Kailash Mahadev Temple Agra",
            alternateName: [...SITE_ALTERNATE_NAMES],
            url: "https://kailashmahadev.in",
            description:
              "Kailash mandir agra (Kailash Mahadev Temple) is a sacred Shiva temple in Sikandra, Agra, Uttar Pradesh, India — darshan timings, puja booking, and visitor guide.",
            sameAs: [...SAME_AS],
            address: {
              "@type": "PostalAddress",
              addressLocality: "Agra",
              addressRegion: "Uttar Pradesh",
              addressCountry: "IN",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Place",
            name: "Kailash Mahadev Temple Agra",
            url: "https://kailashmahadev.in",
            description:
              "A famous Shiva temple near Sikandra in Agra that welcomes pilgrims and visitors seeking darshan, puja, and local travel guidance.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Agra",
              addressRegion: "Uttar Pradesh",
              addressCountry: "IN",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: "Kailash Mahadev Temple Agra",
            url: "https://kailashmahadev.in",
            description:
              "A well-known Shiva temple in Agra favored by devotees for darshan, puja, and Mahashivratri celebrations.",
            sameAs: [...SAME_AS],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://kailashmahadev.in",
              },
            ],
          },
        ]}
      />
      <Header />
      <main>
        <Hero />
        <NoticeMarquee />
        <NextAartiCountdown />
        {/* ═══ Sacred Mantra Ticker ═══ */}
        <div className="bg-maroon/90 py-2 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221.5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
          <div className="flex animate-marquee whitespace-nowrap relative z-10">
            {[...sacredMantras, ...sacredMantras].map((mantra, i) => (
              <span key={i} className="mx-6 md:mx-10 text-gold font-heading text-sm md:text-base tracking-widest flex items-center gap-2">
                <Flame className="h-3 w-3 text-saffron-light animate-diya-glow" />
                {mantra}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ Animated Stats Bar ═══ */}
        <section ref={revealStats.ref} className={`relative py-8 md:py-12 bg-gradient-saffron overflow-hidden ${revealStats.className}`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.08%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { ref: counter1.ref, count: `${counter1.count}+`, label: t("index.stats.yearsHeritage") },
                { ref: counter2.ref, count: `${counter2.count.toLocaleString()}+`, label: t("index.stats.dailyDevotees") },
                { ref: counter3.ref, count: `${counter3.count}`, label: t("index.stats.daysOpen") },
                { ref: counter4.ref, count: `${counter4.count}+`, label: t("index.stats.sacredPujas") },
              ].map((stat, i) => (
                <div
                  key={i}
                  ref={stat.ref}
                  className="text-center p-4 rounded-xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 animate-shimmer transition-transform duration-300 hover:scale-105"
                >
                  <p className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground">{stat.count}</p>
                  <p className="text-xs md:text-sm text-primary-foreground/80 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Mobile: Card-based Dashboard ═══ */}
        <MobileHomeCards />

        {/* ═══ Quick Navigation Cards — Desktop Only ═══ */}
        <section ref={revealExplore.ref} className={`hidden md:block py-10 md:py-20 bg-muted temple-pattern ${revealExplore.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 md:mb-4">
                {t("index.exploreTitle")} <span className="text-gradient-sacred">{t("index.exploreHighlight")}</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                {t("index.exploreSubtitle")}
              </p>
            </div>
            <div ref={navStagger.ref} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
              {sections.map((section, i) => (
                <Link key={section.title} to={section.href}>
                  <Card
                    className={`group h-full overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${section.borderColor} cursor-pointer active:scale-95 animate-tilt-3d ${
                      navStagger.visibleItems[i]
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${section.bg} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <section.icon className={`h-6 w-6 md:h-7 md:w-7 ${section.color}`} />
                      </div>
                      <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5 md:mb-1 leading-tight">{section.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{section.description}</p>
                      <ArrowRight className={`h-4 w-4 ${section.color} mt-2 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-1 transition-all duration-300`} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* ═══ Blog & Insights — Featured Posts ═══ */}
        {blogs.length > 0 && (
          <>
            <section ref={revealTestimonials.ref} className={`py-10 md:py-20 bg-background ${revealTestimonials.className}`}>
              <div className="container mx-auto px-4">
                <div className="text-center mb-8 md:mb-12">
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Blog & Insights
                  </Badge>
                  <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                    Explore Spiritual <span className="text-gradient-sacred">Wisdom</span>
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                    Discover articles about temple rituals, spiritual teachings, and temple updates
                  </p>
                </div>

                {/* Desktop: 3 Column Grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-6">
                  {blogs.slice(0, 3).map((blog, i) => (
                    <Link key={blog.id} to={`/blog/${blog.slug}`}>
                      <Card
                        className={`group h-full overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer ${
                          blogStagger.visibleItems[i]
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                        }`}
                        style={{ transitionDelay: `${i * 100}ms` }}
                      >
                        {blog.featured_image_url && (
                          <div className="h-40 overflow-hidden">
                            <img
                              src={blog.featured_image_url}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardContent className="p-4 md:p-5 flex flex-col h-full">
                          <div className="mb-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              {blog.category_id || "Insights"}
                            </Badge>
                          </div>
                          <h3 className="font-heading font-semibold text-foreground text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
                            {blog.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(blog.created_at).toLocaleDateString("en-IN")}</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{blog.view_count || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Mobile: Vertical Stack */}
                <div className="md:hidden space-y-3 mb-6">
                  {blogs.slice(0, 2).map((blog) => (
                    <Link key={blog.id} to={`/blog/${blog.slug}`}>
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <div className="flex gap-3">
                          {blog.featured_image_url && (
                            <div className="w-20 h-20 shrink-0 overflow-hidden rounded-l-lg">
                              <img
                                src={blog.featured_image_url}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <CardContent className="p-3 flex flex-col justify-between flex-grow">
                            <div>
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1">
                                {blog.category_id || "Insights"}
                              </Badge>
                              <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {blog.title}
                              </h3>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{new Date(blog.created_at).toLocaleDateString("en-IN")}</span>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{blog.view_count || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                <div className="text-center">
                  <Link to="/blogs">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground group">
                      Read All Articles <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

            <TempleDivider />
          </>
        )}

        {/* ═══ Today's Aarti Schedule — Staggered ═══ */}
        <section ref={revealAarti.ref} className={`py-10 md:py-20 bg-background ${revealAarti.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Clock className="h-3 w-3 mr-1" />
                {t("index.todaysSchedule")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                {t("darshan.title")} <span className="text-gradient-sacred">{t("darshan.titleHighlight")}</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                {t("darshan.subtitle")}
              </p>
            </div>
            <div ref={aartiStagger.ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-5xl mx-auto">
              {isAartiLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Card
                      key={`skeleton-${i}`}
                      className={`animate-pulse border-border bg-muted/60 ${
                        aartiStagger.visibleItems[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                      }`}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      <CardContent className="p-4 md:p-5 h-28" />
                    </Card>
                  ))
                : aartiSchedule.length > 0
                ? aartiSchedule.map((aarti, i) => {
                    const status = getAartiStatus(aarti.start_time, aarti.end_time);
                    const Icon = getIconForAarti(aarti.name);
                    return (
                      <Card
                        key={aarti.id}
                        className={`text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-lg ${
                          status === "Live"
                            ? "border-destructive bg-destructive/10"
                            : aarti.is_special
                            ? "border-gold bg-gold/5 animate-pulse-border"
                            : "border-border bg-card"
                        } ${
                          aartiStagger.visibleItems[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                        }`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <CardContent className="p-4 md:p-5">
                          <div className={`w-11 h-11 rounded-full mx-auto mb-3 flex items-center justify-center transition-all duration-300 ${
                            aarti.is_special ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Badge className={`text-[10px] px-2 py-1 ${
                                status === "Live"
                                  ? "bg-destructive text-destructive-foreground"
                                  : status === "Upcoming"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {status}
                              </Badge>
                              {aarti.is_special && (
                                <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-2 py-1">
                                  <Sparkles className="h-3 w-3 mr-1 inline" />
                                  Special
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-heading text-xs md:text-sm font-semibold text-foreground leading-tight">{aarti.name}</h4>
                            <p className="text-xs md:text-sm font-semibold mt-0.5 text-primary">
                              {formatTime(aarti.start_time)} - {formatTime(aarti.end_time)}
                            </p>
                            {aarti.description && (
                              <p className="text-[11px] text-muted-foreground leading-snug max-w-[10rem] mx-auto">
                                {aarti.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                : (
                  <div className="col-span-full rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No active aarti timings are available right now. Please check the full schedule page for the latest timing updates.
                  </div>
                )}
            </div>
            <div className="text-center mt-6">
              <Link to="/darshan-timings">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground group">
                  {t("common.viewFullSchedule")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* ═══ Featured Pujas — Staggered with 3D hover ═══ */}
        <section ref={revealPujas.ref} className={`py-10 md:py-20 bg-muted temple-pattern ${revealPujas.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-saffron/10 text-saffron border-saffron/20">
                <BookOpen className="h-3 w-3 mr-1" />
                {t("index.sacredServices")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                {t("index.featuredPujas")} <span className="text-gradient-sacred">{t("index.featuredPujasHighlight")}</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                {t("index.featuredPujasSubtitle")}
              </p>
            </div>
            <div ref={pujaStagger.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredPujas.map((puja, i) => (
                <Link key={puja.name} to="/pujas">
                  <Card
                    className={`group overflow-hidden h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-saffron/10 animate-tilt-3d ${
                      pujaStagger.visibleItems[i]
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                    style={{ transitionDelay: `${i * 120}ms` }}
                  >
                    <div className="relative h-44 md:h-52 overflow-hidden">
                      <img src={puja.image} alt={puja.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-gold text-accent-foreground font-semibold animate-shimmer">{puja.price}</Badge>
                    </div>
                    <CardContent className="p-4 md:p-5">
                      <h3 className="font-heading font-semibold text-foreground text-base md:text-lg mb-1">{puja.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{puja.desc}</p>
                      <Button size="sm" className="w-full mt-3 bg-gradient-saffron hover:opacity-90 text-primary-foreground group-hover:glow-saffron transition-shadow">
                        {t("common.bookNow")} <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* ═══ Upcoming Events Preview ═══ */}
        <section ref={revealEvents.ref} className={`py-10 md:py-20 bg-background ${revealEvents.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-maroon/10 text-maroon border-maroon/20">
                <CalendarDays className="h-3 w-3 mr-1" />
                Upcoming Events
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                {t("index.sacredCelebrations")} <span className="text-gradient-sacred">{t("index.sacredCelebrationsHighlight")}</span>
              </h2>
            </div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
                {events.map((event, i) => (
                  <Card key={event.id} className="group overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-tilt-3d" style={{ animationDelay: `${i * 150}ms` }}>
                    {event.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={event.image_url} alt={event.event_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-4 md:p-5">
                      <h3 className="font-heading font-semibold text-foreground text-lg mb-2">{event.event_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>{new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
                {[
                  { title: "Maha Shivaratri", date: "February 26, 2026", img: festival },
                  { title: "Shravan Somvar", date: "July-August 2026", img: aartiCeremony },
                  { title: "Navratri", date: "October 2026", img: festival },
                ].map((ev, i) => (
                  <Card key={ev.title} className="group overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-tilt-3d">
                    <div className="h-40 overflow-hidden">
                      <img src={ev.img} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    </div>
                    <CardContent className="p-4 md:p-5">
                      <h3 className="font-heading font-semibold text-foreground text-lg mb-1">{ev.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span>{ev.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="text-center mt-6">
              <Link to="/events">
                <Button variant="outline" className="border-maroon text-maroon hover:bg-maroon hover:text-secondary-foreground group">
                  {t("common.viewAllEvents")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* ═══ Photo Gallery — 3D Tilt + Staggered ═══ */}
        <section ref={revealGallery.ref} className={`py-10 md:py-20 bg-muted temple-pattern overflow-hidden ${revealGallery.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <Camera className="h-3 w-3 mr-1" />
                Photo Gallery
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                {t("gallery.title")} <span className="text-gradient-sacred">{t("index.divineHighlight")}</span>
              </h2>
            </div>
            <div ref={galleryStagger.ref} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer animate-tilt-3d ${
                    galleryStagger.visibleItems[i]
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-90"
                  }`}
                  style={{
                    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-maroon/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                    <p className="text-primary-foreground font-heading font-semibold text-sm">{img.title}</p>
                  </div>
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/gallery">
                <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-accent-foreground group">
                  {t("common.viewFullGallery")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* ═══ Testimonials — Smooth Slide Transitions ═══ */}
        <section ref={revealTestimonials.ref} className={`py-10 md:py-20 bg-background ${revealTestimonials.className}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <Quote className="h-3 w-3 mr-1" />
                Devotee Stories
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
                {t("index.voicesOf")} <span className="text-gradient-sacred">{t("index.devotion")}</span>
              </h2>
            </div>
            <div className="max-w-3xl mx-auto relative">
              <Card className="border-gold/20 bg-card overflow-hidden">
                <CardContent className="p-6 md:p-10 text-center">
                  <Quote className="h-8 w-8 text-gold/40 mx-auto mb-4" />
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isTransitioning
                        ? testimonialDirection === "right"
                          ? "opacity-0 -translate-x-4"
                          : "opacity-0 translate-x-4"
                        : "opacity-100 translate-x-0"
                    }`}
                  >
                    <p className="text-foreground text-base md:text-lg leading-relaxed mb-6 italic">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                    <div className="flex justify-center gap-1 mb-4">
                      {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="font-heading font-semibold text-foreground">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" /> {testimonials[currentTestimonial].location}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Navigation */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-gold/10 hover:border-gold transition-colors"
                  onClick={() => changeTestimonial("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (i === currentTestimonial) return;
                      setTestimonialDirection(i > currentTestimonial ? "right" : "left");
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentTestimonial(i);
                        setIsTransitioning(false);
                      }, 300);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentTestimonial ? "bg-gold w-6" : "bg-muted-foreground/30 w-2 hover:bg-gold/50"
                    }`}
                  />
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-gold/10 hover:border-gold transition-colors"
                  onClick={() => changeTestimonial("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <TempleDivider />

        <section className="container mx-auto px-4 py-8 md:py-12 bg-gradient-to-br from-maroon/10 via-gold/5 to-maroon/10 rounded-2xl border border-gold/20 shadow-lg overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-gold/80 mb-2">Visitor Information</p>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Kailash Mahadev Temple Agra
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">Temple Timings</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Kailash Mahadev Temple Agra offers daily darshan in the morning and evening. <Link to="/darshan-timings" className="text-gold underline hover:text-gold-light">View Timings</Link>
                </p>
              </article>

              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">How to Reach</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Located near Sikandra in Agra. Reach by taxi, auto or local transport. <Link to="/contact" className="text-gold underline hover:text-gold-light">Route Guide</Link>
                </p>
              </article>

              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">Temple History</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Ancient Shiva heritage with unique twin Shivlings. <Link to="/about" className="text-gold underline hover:text-gold-light">Learn More</Link>
                </p>
              </article>

              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">Festivals</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Major destination during Mahashivratri and Shravan month. <Link to="/events" className="text-gold underline hover:text-gold-light">View Events</Link>
                </p>
              </article>

              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">Visitor Info</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Updated April 18, 2026. Arrive early, follow temple etiquette, respect worship areas.
                </p>
              </article>

              <article className="rounded-2xl border border-gold/30 bg-background/70 p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-2">Nearby Places</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Explore Agra landmarks around Sikandra. <Link to="/gallery" className="text-gold underline hover:text-gold-light">View Gallery</Link>
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ═══ Engage With Us ═══ */}
        <section ref={revealEngage.ref} className={`py-10 md:py-16 bg-muted ${revealEngage.className}`}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {[
                { to: "/live-darshan", icon: Video, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", title: t("index.liveDarshan"), desc: t("index.liveDarshanDesc") },
                { to: "/contact", icon: Phone, color: "text-maroon", bg: "bg-maroon/10", border: "border-maroon/20", title: t("index.contactTemple"), desc: t("index.contactDesc") },
              ].map((item, i) => (
                <Link key={i} to={item.to} className="group">
                  <Card className={`h-full ${item.border} transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-tilt-3d`}>
                    <CardContent className="p-5 md:p-6 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
