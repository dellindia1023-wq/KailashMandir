import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight, Loader2, Bell, BookOpen } from "lucide-react";
import { format, isPast } from "date-fns";
import festivalImg from "@/assets/gallery/shivling-flowers-3.jpg";
import { Link } from "react-router-dom";
import CampaignSlot from "@/components/campaigns/CampaignSlot";
import { useLanguage } from "@/contexts/LanguageContext";

interface Event {
  id: string; event_name: string; description: string | null; start_date: string; end_date: string | null; location: string | null; image_url: string | null;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const revealCta = useScrollReveal();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("events").select("*").eq("is_active", true).order("start_date", { ascending: true });
      setEvents((data as Event[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const upcoming = events.filter((e) => !isPast(new Date(e.end_date || e.start_date)));
  const past = events.filter((e) => isPast(new Date(e.end_date || e.start_date)));

  const EventCard = ({ event, isPastEvent = false }: { event: Event; isPastEvent?: boolean }) => (
    <Card className={`group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-2 border-gold/20 dark:border-gold/40 backdrop-blur-sm ${isPastEvent ? "opacity-70" : ""}`}>
      <div className="relative h-40 md:h-48 overflow-hidden bg-gray-900/20">
        <img src={event.image_url || festivalImg} alt={event.event_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {isPastEvent && <Badge className="absolute top-3 left-3 bg-gray-500/80 text-white text-xs backdrop-blur-sm">{t("common.pastEvent")}</Badge>}
        {!isPastEvent && <Badge className="absolute top-3 right-3 bg-red-500/80 text-white text-xs backdrop-blur-sm animate-pulse">Live</Badge>}
      </div>
      <CardContent className="p-5 md:p-6">
        <h3 className="font-heading text-base md:text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-gold transition-colors">{event.event_name}</h3>
        {event.description && <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>}
        <div className="space-y-2 mb-4 pb-4 border-b border-gold/10 dark:border-gold/20">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-gold" />
            <span className="font-medium">{format(new Date(event.start_date), "dd MMM yyyy")}{event.end_date && ` – ${format(new Date(event.end_date), "dd MMM yyyy")}`}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <MapPin className="h-4 w-4 text-saffron" /><span className="font-medium">{event.location}</span>
            </div>
          )}
        </div>
        {!isPastEvent && (
          <a href={`https://wa.me/918859692841?text=${encodeURIComponent(`🙏 नमस्कार! I would like to enquire about "${event.event_name}" (${format(new Date(event.start_date), "dd MMM yyyy")}) at Kailash Mahadev Mandir, Agra. Please share more details.`)}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full bg-gradient-to-r from-gold to-orange hover:shadow-lg hover:shadow-gold/40 text-white font-bold transition-all text-xs md:text-sm group/btn">
              {t("common.enquireOnWhatsApp")} <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Events & Festivals"
        description="Festivals and celebrations at Kailash mandir agra (Kailash Mahadev Temple) — Mahashivratri, Shravan Somvar, special darshan days and temple events in Agra."
        canonical="/events"
        breadcrumbLabel="Events & Festivals"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Events & Celebrations at Kailash Mahadev Temple",
          "description": "Upcoming and past religious festivals, pujas, and sacred celebrations at Kailash Mahadev Temple Agra.",
          "url": "https://kailashmahadev.in/events",
          "numberOfItems": upcoming.length,
          "itemListElement": upcoming.slice(0, 10).map((event, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Event",
              "name": event.event_name,
              "description": event.description || `${event.event_name} at Kailash Mahadev Temple Agra`,
              "startDate": event.start_date,
              ...(event.end_date ? { "endDate": event.end_date } : {}),
              "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
              "eventStatus": "https://schema.org/EventScheduled",
              "location": {
                "@type": "Place",
                "name": "Kailash Mahadev Temple",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Sikandra",
                  "addressLocality": "Agra",
                  "addressRegion": "Uttar Pradesh",
                  "addressCountry": "IN"
                }
              },
              "organizer": {
                "@type": "Organization",
                "name": "Kailash Mahadev Temple Trust"
              },
              ...(event.image_url ? { "image": event.image_url } : {})
            }
          }))
        }}
      />
      <Header />
      <main>
        <section className="pt-8 md:pt-10 pb-6 bg-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                शिव उत्सव
              </span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gold via-orange to-saffron bg-clip-text text-transparent mb-4">
              {t("events.title")}
            </h1>
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/80 dark:bg-slate-900/70 p-6 shadow-[0_24px_60px_rgba(114,46,33,0.14)]">
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                {t("events.subtitle")}
              </p>
            </div>
            <span className="mt-6 block h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r from-gold to-orange"></span>
          </div>
        </section>

        <section className="py-10 md:py-12 bg-background">
          <div className="container mx-auto px-4">
            <CampaignSlot locationKey="events.top" pageType="events" />
          </div>
        </section>

        <TempleDivider />

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">{t("events.noEvents")}</p>
            <p className="text-muted-foreground/60 text-sm">{t("events.checkBack")}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="py-10 md:py-16 bg-gradient-to-b from-background via-background to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4">
                  <div className="mb-8 md:mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="h-12 w-1 bg-gradient-to-b from-gold to-orange rounded-full"></div>
                      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 px-4 py-2 font-bold">
                        <Calendar className="h-4 w-4 mr-2 animate-pulse" />{t("common.upcoming")}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
                      {t("events.upcomingEvents")}
                      <span className="block text-gold/70 dark:text-gold text-lg md:text-xl mt-2">आने वाले विशेष समय की प्रतीक्षा करें</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </div>
              </section>
            )}
            {upcoming.length > 0 && past.length > 0 && <TempleDivider />}
            {past.length > 0 && (
              <section className="py-10 md:py-16 bg-gradient-to-b from-gray-50 dark:from-slate-900/50 via-gray-50 dark:via-slate-900/50 to-background dark:to-slate-950">
                <div className="container mx-auto px-4">
                  <div className="mb-8 md:mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="h-12 w-1 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                      <Badge className="bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 px-4 py-2 font-bold">
                        📸 {t("common.past")}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
                      {t("events.pastEvents")}
                      <span className="block text-gray-600 dark:text-gray-400 text-lg md:text-xl mt-2">हमारी विरासत के शानदार पल</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {past.map((e) => <EventCard key={e.id} event={e} isPastEvent />)}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <TempleDivider />

        <section ref={revealCta.ref} className={`relative py-14 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={festivalImg} alt="Celebrations" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              {t("events.dontMiss")} <span className="text-gold-light">{t("events.celebration")}</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">{t("events.stayUpdatedCta")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/notice-board">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">{t("events.viewNoticeBoard")}</Button>
              </Link>
              <Link to="/pujas">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  {t("common.bookAPuja")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
