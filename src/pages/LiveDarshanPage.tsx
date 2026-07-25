import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import LiveDarshan from "@/components/LiveDarshan";
import useScrollReveal from "@/hooks/useScrollReveal";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
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
        {/* Header Section */}
        <section className="py-12 md:py-20 bg-muted temple-pattern overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-3 tracking-wider uppercase">हर हर महादेव</p>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              <span className="text-gradient-sacred">Live Darshan</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-3">
              24/7 Divine Stream from Kailash Mahadev Temple
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              Join thousands of devotees worldwide as they experience the sacred rituals and divine presence of Lord Shiva in real-time. Our live darshan brings the temple sanctum directly to your home.
            </p>
          </div>
        </section>

        {/* Live Player Section */}
        <section ref={revealContent.ref} className={`py-10 md:py-16 bg-background ${revealContent.className}`}>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gold/10 hover:shadow-3xl transition-shadow duration-500">
                <LiveDarshan />
              </div>
            </div>
          </div>
        </section>

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
