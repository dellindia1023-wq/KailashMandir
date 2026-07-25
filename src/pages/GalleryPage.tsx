import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { Button } from "@/components/ui/button";
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
        <section className="pt-10 md:pt-14 pb-8 bg-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                फोटो दीर्घा
              </span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gold via-orange to-saffron bg-clip-text text-transparent mb-4">
              {t("gallery.pageTitle")}
            </h1>
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/80 dark:bg-slate-900/70 p-6 shadow-[0_24px_60px_rgba(114,46,33,0.14)]">
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                {t("gallery.pageSubtitle")}
              </p>
            </div>
            <span className="mt-6 block h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r from-gold to-orange"></span>
          </div>
        </section>

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
