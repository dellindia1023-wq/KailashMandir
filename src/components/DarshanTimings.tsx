import { Clock, Sun, Moon, Sunrise, Sunset, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAartiTimings, formatTime } from "@/hooks/useAartiTimings";

const DarshanTimings = () => {
  const { t } = useLanguage();
  const { data: aartiTimings, isLoading } = useAartiTimings(true); // activeOnly = true

  // Icon mapping for aartis
  const getIconForAarti = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("mangla") || nameLower.includes("shayan")) return Moon;
    if (nameLower.includes("shringar")) return Sunrise;
    if (nameLower.includes("evening")) return Sunset;
    return Sun;
  };

  const timings = (aartiTimings || []).map((aarti) => ({
    name: aarti.name,
    time: `${formatTime(aarti.start_time)} - ${formatTime(aarti.end_time)}`,
    icon: getIconForAarti(aarti.name),
    description: aarti.description,
    isSpecial: aarti.is_special,
  }));

  return (
    <section id="timings" className="py-10 md:py-24 bg-muted temple-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
            <Clock className="h-3 w-3 mr-1" />
            {t("darshan.badge")}
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            {t("darshan.title")} <span className="text-gradient-sacred">{t("darshan.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">{t("darshan.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {timings.map((timing, index) => (
              <Card
                key={timing.name}
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
                  timing.isSpecial ? "border-2 border-gold bg-gradient-to-br from-gold/10 to-saffron/5" : "border-border hover:border-primary/30"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {timing.isSpecial && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-gold text-accent-foreground text-[10px] md:text-xs">{t("common.special")}</Badge>
                  </div>
                )}
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`p-2.5 md:p-3 rounded-full ${timing.isSpecial ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"}`}>
                      <timing.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-sm md:text-lg text-foreground mb-0.5 md:mb-1">{timing.name}</h3>
                      <p className={`font-semibold text-xs md:text-sm mb-1 md:mb-2 ${timing.isSpecial ? "text-gold" : "text-primary"}`}>{timing.time}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{timing.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 md:mt-8 text-center">
          <p className="text-xs md:text-sm text-muted-foreground">{t("darshan.note")}</p>
        </div>
      </div>
    </section>
  );
};

export default DarshanTimings;
