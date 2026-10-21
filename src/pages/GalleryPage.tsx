import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import shivlingGarland from "@/assets/gallery/shivling-garland.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Video } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const GalleryPage = () => {
  const { t } = useLanguage();
  const revealGallery = useScrollReveal();
  const revealCta = useScrollReveal();

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
          image={shivlingGarland}
          title="Sacred"
          highlight="Photo Gallery"
          subtitle={t("gallery.pageSubtitle")}
          mantra="दिव्य दर्शन दीर्घा"
          badge={
            <Badge className="bg-gold/20 text-gold-dark dark:text-gold-light border-gold/40 text-xs px-3 py-1 font-medium">
              फोटो दीर्घा · Divine Moments
            </Badge>
          }
        />

        {/* Main Gallery */}
        <section ref={revealGallery.ref} className={`py-10 md:py-16 ${revealGallery.className}`}>
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
