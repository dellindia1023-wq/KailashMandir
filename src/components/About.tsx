import { History, Landmark, Award, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  const features = [
    { icon: History, title: t("about.feature1Title"), description: t("about.feature1Desc") },
    { icon: Landmark, title: t("about.feature2Title"), description: t("about.feature2Desc") },
    { icon: Award, title: t("about.feature3Title"), description: t("about.feature3Desc") },
    { icon: BookOpen, title: t("about.feature4Title"), description: t("about.feature4Desc") },
  ];

  return (
    <section className="py-10 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative pb-8 md:pb-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img src={shivaLingam} alt="Sacred Shiva Lingam at Kailash Mahadev Temple" className="w-full h-64 sm:h-80 md:h-[500px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon/60 to-transparent" />
            </div>
            <Card className="absolute -bottom-4 right-2 md:bottom-8 md:-right-12 bg-background border-2 border-gold shadow-xl max-w-[200px] md:max-w-xs">
              <CardContent className="p-3 md:p-6">
                <p className="text-gold font-heading text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{t("about.established")}</p>
                <p className="text-muted-foreground text-xs md:text-sm">{t("about.historicalMonument")}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
              <History className="h-3 w-3 mr-1" />
              {t("about.badge")}
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              {t("about.title")} <span className="text-gradient-sacred">{t("about.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-4 md:mb-6 leading-relaxed">{t("about.description1")}</p>
            <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8 leading-relaxed">{t("about.description2")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-[0.98]">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-saffron flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5 md:mb-1">{feature.title}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
