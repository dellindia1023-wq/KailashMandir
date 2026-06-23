import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight, Loader2, Bell, BookOpen } from "lucide-react";
import { format, isPast } from "date-fns";
import festivalImg from "@/assets/gallery/shivling-flowers-3.jpg";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface Event {
  id: string; event_name: string; description: string | null; start_date: string; end_date: string | null; location: string | null; image_url: string | null;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const revealCta = useScrollReveal();
  const revealInfo = useScrollReveal();

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
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPastEvent ? "opacity-70" : "border-primary/10"}`}>
      <div className="relative h-40 md:h-48 overflow-hidden">
        <img src={event.image_url || festivalImg} alt={event.event_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        {isPastEvent && <Badge className="absolute top-3 left-3 bg-muted text-muted-foreground text-xs">{t("common.pastEvent")}</Badge>}
      </div>
      <CardContent className="p-4 md:p-6">
        <h3 className="font-heading text-base md:text-xl font-bold text-foreground mb-2">{event.event_name}</h3>
        {event.description && <p className="text-muted-foreground text-xs md:text-sm mb-3 line-clamp-2">{event.description}</p>}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{format(new Date(event.start_date), "dd MMM yyyy")}{event.end_date && ` – ${format(new Date(event.end_date), "dd MMM yyyy")}`}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /><span>{event.location}</span>
            </div>
          )}
        </div>
        {!isPastEvent && (
          <a href={`https://wa.me/918859692841?text=${encodeURIComponent(`🙏 नमस्कार! I would like to enquire about "${event.event_name}" (${format(new Date(event.start_date), "dd MMM yyyy")}) at Kailash Mahadev Mandir, Agra. Please share more details.`)}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm">
              {t("common.enquireOnWhatsApp")} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
        <PageHeroBanner image={templeHero} title={t("events.title")} highlight={t("events.titleHighlight")} subtitle={t("events.subtitle")} mantra="ॐ नमः शिवाय" />

        <section ref={revealInfo.ref} className={`py-10 md:py-16 bg-muted temple-pattern ${revealInfo.className}`}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
              <Card className="text-center border-primary/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-3"><Calendar className="h-6 w-6 text-primary-foreground" /></div>
                  <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5">{t("events.yearRound")}</h3>
                  <p className="text-xs text-muted-foreground">{t("events.yearRoundDesc")}</p>
                </CardContent>
              </Card>
              <Card className="text-center border-gold/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3"><Bell className="h-6 w-6 text-gold" /></div>
                  <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5">{t("events.stayUpdated")}</h3>
                  <p className="text-xs text-muted-foreground">{t("events.stayUpdatedDesc")}</p>
                </CardContent>
              </Card>
              <Card className="text-center border-maroon/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center mx-auto mb-3"><BookOpen className="h-6 w-6 text-maroon" /></div>
                  <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5">{t("events.specialPujas")}</h3>
                  <p className="text-xs text-muted-foreground">{t("events.specialPujasDesc")}</p>
                </CardContent>
              </Card>
            </div>
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
              <section className="py-10 md:py-20 bg-background">
                <div className="container mx-auto px-4">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Badge className="bg-primary/10 text-primary border-primary/20"><Calendar className="h-3 w-3 mr-1" />{t("common.upcoming")}</Badge>
                    <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground">{t("events.upcomingEvents")}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </div>
              </section>
            )}
            {upcoming.length > 0 && past.length > 0 && <TempleDivider />}
            {past.length > 0 && (
              <section className="py-10 md:py-20 bg-muted temple-pattern">
                <div className="container mx-auto px-4">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Badge className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">{t("common.past")}</Badge>
                    <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground">{t("events.pastEvents")}</h2>
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
