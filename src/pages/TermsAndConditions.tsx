import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsAndConditions = () => {
  const { t } = useLanguage();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using the Kailash Mahadev Temple Agra website (www.kailashmahadev.in), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
      ],
    },
    {
      title: "2. Use License",
      content: [
        "Permission is granted to temporarily download one copy of the materials (information or software) on Kailash Mahadev Temple Agra's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
        "- Modify or copy the materials",
        "- Use the materials for any commercial purpose or for any public display",
        "- Attempt to decompile or reverse engineer any software contained on the website",
        "- Remove any copyright or other proprietary notations from the materials",
        "- Transfer the materials to another person or 'mirror' the materials on any other server",
      ],
    },
    {
      title: "3. Disclaimer",
      content: [
        "The materials on Kailash Mahadev Temple Agra's website are provided on an 'as is' basis. Kailash Mahadev Temple makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
      ],
    },
    {
      title: "4. Limitations",
      content: [
        "In no event shall Kailash Mahadev Temple Agra or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Kailash Mahadev Temple Agra website, even if Kailash Mahadev Temple or an authorized representative has been notified orally or in writing of the possibility of such damage.",
      ],
    },
    {
      title: "5. Accuracy of Materials",
      content: [
        "The materials appearing on Kailash Mahadev Temple Agra's website could include technical, typographical, or photographic errors. Kailash Mahadev Temple does not warrant that any of the materials on its website are accurate, complete, or current. Kailash Mahadev Temple may make changes to the materials contained on its website at any time without notice.",
      ],
    },
    {
      title: "6. Links",
      content: [
        "Kailash Mahadev Temple has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Kailash Mahadev Temple of the site. Use of any such linked website is at the user's own risk.",
      ],
    },
    {
      title: "7. Modifications",
      content: [
        "Kailash Mahadev Temple may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.",
      ],
    },
    {
      title: "8. Governing Law",
      content: [
        "These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in Agra, Uttar Pradesh.",
      ],
    },
    {
      title: "9. Puja Booking Terms",
      content: [
        "All puja bookings are subject to availability and confirmation by the temple. Once a booking is confirmed, it is non-refundable unless otherwise specified. Cancellation requests must be made at least 7 days in advance. The temple reserves the right to reschedule pujas due to unforeseen circumstances.",
      ],
    },
    {
      title: "10. Donations",
      content: [
        "All donations made through this website are voluntary and are used for the maintenance and development of the temple. Donations are non-refundable and are accepted in good faith for temple purposes.",
      ],
    },
    {
      title: "11. User Responsibilities",
      content: [
        "You are responsible for maintaining the confidentiality of any account information and password, and are responsible for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security.",
      ],
    },
    {
      title: "12. Payment Terms",
      content: [
        "Payment for pujas and donations must be made through the secure payment gateway provided on our website. All payment information is encrypted and processed securely. The temple does not store credit card information on its servers.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms & Conditions - Kailash Mahadev Temple Agra"
        description="Read the terms and conditions for using Kailash Mahadev Temple Agra's official website, including puja booking, donations, and payment terms."
        canonical="/terms-and-conditions"
        breadcrumbLabel="Terms & Conditions"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms & Conditions",
          url: "https://kailashmahadev.in/terms-and-conditions",
          isPartOf: { "@id": "https://kailashmahadev.in#website" },
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title="Terms & Conditions"
          highlight="Legal Agreement"
          subtitle="Please read these terms carefully before using our website"
          mantra="ॐ नमः शिवाय"
        />

        <section className="py-10 md:py-20 bg-muted">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-10">
                <div className="space-y-8">
                  {sections.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="font-heading text-xl font-bold text-foreground mb-3">{section.title}</h3>
                      <div className="space-y-2">
                        {section.content.map((line, cidx) => (
                          <p key={cidx} className="text-muted-foreground leading-relaxed text-sm md:text-base">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="font-heading font-semibold text-foreground mb-2">Last Updated</h3>
                    <p className="text-muted-foreground text-sm">April 19, 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>If you have any questions about these Terms & Conditions, please <Link to="/contact" className="text-gold hover:underline">contact us</Link>.</p>
            </div>
          </div>
        </section>

        <TempleDivider />
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
