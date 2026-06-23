import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import Donation from "@/components/Donation";

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
    <main className="pt-20">
      <Donation />
    </main>
    <Footer />
  </div>
);

export default DonatePage;
