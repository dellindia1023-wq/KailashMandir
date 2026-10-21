import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import CampaignCollection from "@/components/campaigns/CampaignCollection";
import Donation from "@/components/Donation";
import { Badge } from "@/components/ui/badge";
import shivlingShringar1 from "@/assets/gallery/shivling-shringar-1.jpg";

const DonatePage = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Donate to Kailash Mandir Agra | Online Temple Donation"
      description="Donate online to Kailash mandir agra (Kailash Mahadev Temple) — UPI, card or bank transfer for rituals, temple seva and puja services in Agra."
      canonical="/donate"
      breadcrumbLabel="Donate"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "DonateAction",
        "name": "Donate to Kailash Mahadev Temple",
        "description": "Support the maintenance, rituals, and community services of Kailash Mahadev Temple Agra through generous donations.",
        "url": "https://kailashmahadev.in/donate",
        "recipient": {
          "@type": "Organization",
          "name": "Kailash Mahadev Temple Trust",
          "url": "https://kailashmahadev.in",
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
        image={shivlingShringar1}
        title="Temple Seva &"
        highlight="Donation"
        subtitle="Support sacred daily rituals, aarti, prasad distribution, and temple heritage preservation."
        mantra="परोपकाराय पुण्याय"
        badge={
          <Badge className="bg-primary/20 text-gold-light border-gold/30 text-xs px-3 py-1 font-medium">
            पुण्य सेवा · Divine Contribution
          </Badge>
        }
      />
      <div className="space-y-10 py-6 md:py-10">
        <CampaignCollection locationKey="donate.top" pageType="donate" />
        <Donation />
      </div>
    </main>
    <Footer />
  </div>
);

export default DonatePage;
