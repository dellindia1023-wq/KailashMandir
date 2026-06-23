import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import LiveDarshan from "@/components/LiveDarshan";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LiveDarshanPage = () => {
  const revealContent = useScrollReveal();
  const revealCta = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Live Darshan | 24/7 Shiva Darshan"
        description="Watch live darshan from Kailash mandir agra (Kailash Mahadev Temple). 24/7 online Shiva darshan streaming from Sikandra, Agra."
        canonical="/live-darshan"
        breadcrumbLabel="Live Darshan"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BroadcastEvent",
          "name": "Live Darshan – Kailash Mahadev Temple",
          "description": "Watch live darshan of Lord Shiva at Kailash Mahadev Temple Agra. Experience the divine presence from anywhere via 24/7 live streaming.",
          "url": "https://kailashmahadev.in/live-darshan",
          "isLiveBroadcast": true,
          "videoFormat": "HD",
          "isAccessibleForFree": true,
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
          }
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title="Live"
          highlight="Darshan"
          subtitle="Experience the divine presence of Lord Shiva from wherever you are."
          mantra="ॐ नमः शिवाय"
          badge={<Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">🔴 Live Stream</Badge>}
        />

        <TempleDivider />

        <section ref={revealContent.ref} className={revealContent.className}>
          <LiveDarshan />
        </section>

        <TempleDivider />

        {/* CTA */}
        <section ref={revealCta.ref} className={`relative py-14 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={shivaLingam} alt="Shiva Lingam" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              Seek Divine <span className="text-gold-light">Blessings</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">
              Book a sacred puja or make a donation to the temple.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/pujas">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
                  Book a Puja
                </Button>
              </Link>
              <Link to="/donate">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  Donate Now <ArrowRight className="ml-2 h-4 w-4" />
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

export default LiveDarshanPage;
