import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import DarshanTimings from "@/components/DarshanTimings";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import aartiImg from "@/assets/gallery/shivling-shringar-1.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DarshanTimingsPage = () => {
  const revealContent = useScrollReveal();
  const revealCta = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Timings | Darshan & Aarti Schedule"
        description="Kailash mandir agra darshan timings and aarti schedule — Mangla Aarti, Sandhya Aarti, Shayan Aarti. Plan your visit to Kailash Mandir (Kailash Mahadev Temple) in Sikandra, Agra."
        canonical="/darshan-timings"
        breadcrumbLabel="Darshan Timings"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HinduTemple",
          "name": "Kailash Mahadev Temple – Darshan & Aarti Schedule",
          "description": "Daily darshan and aarti schedule at Kailash Mahadev Temple Agra including Mangla Aarti, Shringar, Bhog Aarti, and Sandhya Aarti timings.",
          "url": "https://kailashmahadev.in/darshan-timings",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Sikandra",
            "addressLocality": "Agra",
            "addressRegion": "Uttar Pradesh",
            "addressCountry": "IN"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
              "opens": "05:00",
              "closes": "12:00",
              "description": "Morning Darshan – Mangla Aarti to Bhog Aarti"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
              "opens": "16:00",
              "closes": "21:00",
              "description": "Evening Darshan – Sandhya Aarti to Shayan Aarti"
            }
          ],
          "isAccessibleForFree": true,
          "publicAccess": true
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title="Darshan"
          highlight="Timings"
          subtitle="Plan your visit with our daily darshan and aarti schedule."
          mantra="ॐ नमः शिवाय"
          badge={<Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">Daily Schedule</Badge>}
        />

        <TempleDivider />

        <section ref={revealContent.ref} className={revealContent.className}>
          <DarshanTimings />
        </section>

        <TempleDivider />

        {/* CTA */}
        <section ref={revealCta.ref} className={`relative py-14 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={aartiImg} alt="Temple Aarti" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              Can't Visit in <span className="text-gold-light">Person?</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">
              Watch the live darshan stream or book a puja online.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/live-darshan">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
                  Watch Live Darshan
                </Button>
              </Link>
              <Link to="/pujas">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  Book a Puja <ArrowRight className="ml-2 h-4 w-4" />
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

export default DarshanTimingsPage;
