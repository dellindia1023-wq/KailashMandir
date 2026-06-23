import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import aartiCeremony from "@/assets/gallery/shivling-shringar-1.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Video, Upload, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const GalleryPage = () => {
  const { t } = useLanguage();
  const revealGallery = useScrollReveal();
  const revealHighlights = useScrollReveal();
  const revealCta = useScrollReveal();

  const highlights = [
    { icon: Camera, title: t("gallery.templeArchitecture"), count: t("gallery.templeArchitectureCount"), desc: t("gallery.templeArchitectureDesc") },
    { icon: Video, title: t("gallery.festivalMoments"), count: t("gallery.festivalMomentsCount"), desc: t("gallery.festivalMomentsDesc") },
    { icon: Upload, title: t("gallery.devoteeMemories"), count: t("gallery.devoteeMemoriesCount"), desc: t("gallery.devoteeMemoriesDesc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Photo Gallery | Temple Images"
        description="Photos of Kailash mandir agra (Kailash Mahadev Temple) — Shivling darshan, festivals, aarti, architecture and devotee moments in Sikandra, Agra."
        canonical="/gallery"
        breadcrumbLabel="Photo Gallery"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          "name": "Kailash Mahadev Temple Photo Gallery",
          "description": "Sacred moments captured at Kailash Mahadev Temple Agra — divine rituals, grand festivals, temple architecture, and devotee memories.",
          "url": "https://kailashmahadev.in/gallery",
          "about": {
            "@type": "HinduTemple",
            "name": "Kailash Mahadev Temple",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Agra",
              "addressRegion": "Uttar Pradesh",
              "addressCountry": "IN"
            }
          }
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={aartiCeremony}
          title={t("gallery.pageTitle")}
          highlight={t("gallery.pageTitleHighlight")}
          subtitle={t("gallery.pageSubtitle")}
          mantra="ॐ नमः शिवाय"
        />

        {/* Gallery Highlights Stats */}
        <section ref={revealHighlights.ref} className={`py-10 md:py-16 bg-muted temple-pattern ${revealHighlights.className}`}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
              {highlights.map((h) => (
                <Card key={h.title} className="text-center border-gold/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5 md:p-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center mx-auto mb-3">
                      <h.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-2xl md:text-3xl font-heading font-bold text-primary mb-1">{h.count}</p>
                    <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-0.5">{h.title}</h3>
                    <p className="text-xs text-muted-foreground">{h.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Main Gallery */}
        <section ref={revealGallery.ref} className={revealGallery.className}>
          <Gallery />
        </section>

        <TempleDivider />

        {/* CTA - Live Darshan */}
        <section ref={revealCta.ref} className={`relative py-16 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={shivaLingam} alt="Live Darshan" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              {t("gallery.cantVisit")} <span className="text-gold-light">{t("gallery.liveDarshan")}</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">{t("gallery.ctaSubtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/live-darshan">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
                  <Video className="h-4 w-4 mr-2" />
                  {t("gallery.watchLive")}
                </Button>
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

export default GalleryPage;
