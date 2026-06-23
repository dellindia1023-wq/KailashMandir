import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Camera, Video, Heart, BookOpen, Megaphone,
  CalendarDays, MessageCircle, Phone, History, Flame,
  ArrowRight, MapPin, Sparkles, ImageIcon, Star, BookMarked,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

import rudrabhishek from "@/assets/pujas/rudrabhishek.jpg";
import mahaShivaratri from "@/assets/pujas/maha-shivaratri.jpg";
import mrityunjayaJaap from "@/assets/pujas/mrityunjaya-jaap.jpg";
import shivChalisa from "@/assets/pujas/shiv-chalisa.jpg";
import festival from "@/assets/gallery/shivling-flowers-3.jpg";
import aartiCeremony from "@/assets/gallery/shivling-shringar-1.jpg";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";

const quickActions = [
  { title: "Darshan Timings", icon: Clock, href: "/darshan-timings", color: "text-primary", bg: "bg-primary/10" },
  { title: "Book Puja", icon: BookOpen, href: "/pujas", color: "text-saffron", bg: "bg-saffron/10" },
  { title: "Live Darshan", icon: Video, href: "/live-darshan", color: "text-maroon", bg: "bg-maroon/10" },
  { title: "Donate", icon: Heart, href: "/donate", color: "text-destructive", bg: "bg-destructive/10" },
];

const moreCards = [
  { title: "Blogs", icon: BookMarked, href: "/blogs", color: "text-primary", bg: "bg-primary/10" },
  { title: "Knowledge Hub", icon: BookOpen, href: "/knowledge-hub", color: "text-gold", bg: "bg-gold/10" },
  { title: "Events", icon: CalendarDays, href: "/events", color: "text-maroon", bg: "bg-maroon/10" },
  { title: "Gallery", icon: Camera, href: "/gallery", color: "text-gold", bg: "bg-gold/10" },
  { title: "About Temple", icon: History, href: "/about", color: "text-saffron", bg: "bg-saffron/10" },
  { title: "Notices", icon: Megaphone, href: "/notice-board", color: "text-primary", bg: "bg-primary/10" },
  { title: "Contact", icon: Phone, href: "/contact", color: "text-maroon", bg: "bg-maroon/10" },
];

const featuredPujas = [
  { name: "Rudrabhishek", price: "₹2,100", image: rudrabhishek, desc: "Sacred abhishekam with milk, honey & holy water" },
  { name: "Maha Shivaratri Special", price: "₹5,100", image: mahaShivaratri, desc: "Grand puja on the holiest night of Shiva" },
  { name: "Mrityunjaya Jaap", price: "₹3,100", image: mrityunjayaJaap, desc: "Powerful mantra jaap for health & protection" },
  { name: "Shiv Chalisa Path", price: "₹1,100", image: shivChalisa, desc: "Recitation of 40 verses praising Lord Shiva" },
];

const fallbackEvents = [
  { id: "1", event_name: "Maha Shivaratri", start_date: "2026-02-26", image_url: null, location: "Temple Premises", fallbackImg: festival },
  { id: "2", event_name: "Shravan Somvar", start_date: "2026-07-15", image_url: null, location: "Temple Premises", fallbackImg: aartiCeremony },
  { id: "3", event_name: "Navratri", start_date: "2026-10-01", image_url: null, location: "Temple Premises", fallbackImg: festival },
];

const fallbackGallery = [
  { id: "1", title: "Sacred Shivling", image: shivaLingam, category: "Temple" },
  { id: "2", title: "Devotees in Prayer", image: templeHero, category: "Devotees" },
  { id: "3", title: "Shringar Ceremony", image: aartiCeremony, category: "Rituals" },
  { id: "4", title: "Floral Offerings", image: festival, category: "Festivals" },
];

/* ─── Dot Indicators ─── */
const CarouselDots = ({ count, selected }: { count: number; selected: number }) => (
  <div className="flex justify-center gap-1.5 mt-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === selected ? "bg-primary w-5" : "bg-muted-foreground/25 w-1.5"
        }`}
      />
    ))}
  </div>
);

/* ─── Auto-play hook ─── */
const useAutoplay = (api: any, delay = 4000) => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!api) return;
    const play = () => {
      intervalRef.current = setInterval(() => {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0);
        }
      }, delay);
    };
    play();
    api.on("pointerDown", () => clearInterval(intervalRef.current));
    api.on("pointerUp", () => play());
    return () => clearInterval(intervalRef.current);
  }, [api, delay]);
};

const MobileHomeCards = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [pujaIndex, setPujaIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [pujaRef, pujaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [eventRef, eventApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [galleryRef, galleryApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
    loop: true,
  });

  // Auto-play all carousels
  useAutoplay(pujaApi, 4000);
  useAutoplay(eventApi, 5000);
  useAutoplay(galleryApi, 3500);

  const onPujaSelect = useCallback(() => {
    if (!pujaApi) return;
    setPujaIndex(pujaApi.selectedScrollSnap());
  }, [pujaApi]);

  const onEventSelect = useCallback(() => {
    if (!eventApi) return;
    setEventIndex(eventApi.selectedScrollSnap());
  }, [eventApi]);

  const onGallerySelect = useCallback(() => {
    if (!galleryApi) return;
    setGalleryIndex(galleryApi.selectedScrollSnap());
  }, [galleryApi]);

  useEffect(() => {
    if (!pujaApi) return;
    pujaApi.on("select", onPujaSelect);
    onPujaSelect();
    return () => { pujaApi.off("select", onPujaSelect); };
  }, [pujaApi, onPujaSelect]);

  useEffect(() => {
    if (!eventApi) return;
    eventApi.on("select", onEventSelect);
    onEventSelect();
    return () => { eventApi.off("select", onEventSelect); };
  }, [eventApi, onEventSelect]);

  useEffect(() => {
    if (!galleryApi) return;
    galleryApi.on("select", onGallerySelect);
    onGallerySelect();
    return () => { galleryApi.off("select", onGallerySelect); };
  }, [galleryApi, onGallerySelect]);

  useEffect(() => {
    const fetchData = async () => {
      const [eventsRes, galleryRes] = await Promise.all([
        supabase
          .from("events")
          .select("id, event_name, start_date, image_url, location")
          .eq("is_active", true)
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(5),
        supabase
          .from("gallery_photos")
          .select("id, title, image_url, category")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(8),
      ]);
      if (eventsRes.data && eventsRes.data.length > 0) setEvents(eventsRes.data);
      if (galleryRes.data && galleryRes.data.length > 0) {
        setGalleryPhotos(galleryRes.data);
      }
    };
    fetchData();
  }, []);

  const displayEvents = events.length > 0 ? events : fallbackEvents;
  const displayGallery = galleryPhotos.length > 0
    ? galleryPhotos.map((p) => ({ id: p.id, title: p.title, image: p.image_url, category: p.category }))
    : fallbackGallery;

  return (
    <section className="py-6 px-4 md:hidden space-y-6">
      {/* Quick Actions - Large Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card className="active:scale-95 transition-transform border-border/50 h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[100px]">
                  <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <span className="font-heading font-semibold text-sm text-foreground leading-tight">
                    {action.title}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ Featured Pujas Carousel ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-saffron" />
            <h2 className="font-heading text-base font-semibold text-foreground">Featured Pujas</h2>
          </div>
          <Link to="/pujas" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-hidden" ref={pujaRef}>
          <div className="flex gap-3">
            {featuredPujas.map((puja) => (
              <div key={puja.name} className="flex-[0_0_75%] min-w-0">
                <Link to="/pujas">
                  <Card className="overflow-hidden border-saffron/15 active:scale-[0.98] transition-transform h-full">
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={puja.image}
                        alt={puja.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <Badge className="absolute top-2 right-2 bg-gold text-accent-foreground text-xs font-semibold">
                        {puja.price}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-heading font-semibold text-sm text-foreground mb-0.5">{puja.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{puja.desc}</p>
                      <Button size="sm" className="w-full mt-2 bg-gradient-saffron text-primary-foreground text-xs h-8">
                        {t("common.bookNow")} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <CarouselDots count={featuredPujas.length} selected={pujaIndex} />
      </div>

      {/* ═══ Temple Gallery Carousel ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gold" />
            <h2 className="font-heading text-base font-semibold text-foreground">Temple Gallery</h2>
          </div>
          <Link to="/gallery" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-hidden" ref={galleryRef}>
          <div className="flex gap-3">
            {displayGallery.map((photo) => (
              <div key={photo.id} className="flex-[0_0_85%] min-w-0">
                <Link to="/gallery">
                  <Card className="overflow-hidden border-gold/15 active:scale-[0.98] transition-transform">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      <Badge className="absolute top-2 left-2 bg-gold/90 text-accent-foreground text-[10px]">
                        {photo.category}
                      </Badge>
                      <h3 className="absolute bottom-2 left-3 font-heading font-semibold text-sm text-white drop-shadow-lg">
                        {photo.title}
                      </h3>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <CarouselDots count={displayGallery.length} selected={galleryIndex} />
      </div>

      {/* ═══ Upcoming Events Carousel ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-maroon" />
            <h2 className="font-heading text-base font-semibold text-foreground">Upcoming Events</h2>
          </div>
          <Link to="/events" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-hidden" ref={eventRef}>
          <div className="flex gap-3">
            {displayEvents.map((event: any) => (
              <div key={event.id} className="flex-[0_0_80%] min-w-0">
                <Link to="/events">
                  <Card className="overflow-hidden border-maroon/15 active:scale-[0.98] transition-transform h-full">
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={event.image_url || event.fallbackImg || festival}
                        alt={event.event_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <Badge className="absolute top-2 left-2 bg-maroon text-primary-foreground text-[10px]">
                        {t("common.upcoming")}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{event.event_name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3 text-primary" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <CarouselDots count={displayEvents.length} selected={eventIndex} />
      </div>

      {/* More Services - Compact Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h2 className="font-heading text-base font-semibold text-foreground">Explore</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {moreCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="active:scale-95 transition-transform border-border/50">
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight">
                    {card.title}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileHomeCards;
