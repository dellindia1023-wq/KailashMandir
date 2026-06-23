import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import festivalImg from "@/assets/gallery/shivling-flowers-3.jpg";

interface Event {
  id: string;
  event_name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
}

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id, event_name, start_date, end_date, image_url, location, description")
        .eq("is_active", true)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(3);
      setEvents((data as Event[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <section id="events" className="py-10 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-secondary/10 text-secondary border-secondary/20">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming Events
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            Sacred <span className="text-gradient-sacred">Celebrations</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Join us in celebrating divine festivals and special occasions.
            Experience the spiritual vibrance of our temple traditions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Featured Event */}
          <Card className="group overflow-hidden transition-all duration-500 hover:shadow-2xl active:scale-[0.99] lg:col-span-2 lg:row-span-2 border-2 border-gold">
            <div className="relative h-48 md:h-64 lg:h-80">
              <img
                src={featured.image_url || festivalImg}
                alt={featured.event_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <Badge className="absolute top-3 left-3 md:top-4 md:left-4 bg-gold text-accent-foreground text-xs">Featured Event</Badge>
            </div>
            <CardContent className="p-4 md:p-6">
              <h3 className="font-heading font-bold text-foreground mb-2 md:mb-3 text-lg md:text-2xl lg:text-3xl">{featured.event_name}</h3>
              {featured.description && (
                <p className="text-muted-foreground mb-4 text-base">{featured.description}</p>
              )}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {format(new Date(featured.start_date), "dd MMM yyyy")}
                    {featured.end_date && ` – ${format(new Date(featured.end_date), "dd MMM yyyy")}`}
                  </span>
                </div>
                {featured.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{featured.location}</span>
                  </div>
                )}
              </div>
              <a
                href={`https://wa.me/918859692841?text=${encodeURIComponent(`🙏 नमस्कार! I would like to enquire about "${featured.event_name}" at Kailash Mahadev Mandir, Agra.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                  Enquire Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Other Events */}
          {rest.map((event) => (
            <Card key={event.id} className="group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-primary/30">
              <div className="relative h-48">
                <img
                  src={event.image_url || festivalImg}
                  alt={event.event_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold text-foreground mb-3 text-xl">{event.event_name}</h3>
                {event.description && (
                  <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{event.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {format(new Date(event.start_date), "dd MMM yyyy")}
                      {event.end_date && ` – ${format(new Date(event.end_date), "dd MMM yyyy")}`}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://wa.me/918859692841?text=${encodeURIComponent(`🙏 नमस्कार! I would like to enquire about "${event.event_name}" at Kailash Mahadev Mandir, Agra.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Enquire Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link to="/events">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View All Events <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
