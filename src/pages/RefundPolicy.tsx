import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const RefundPolicy = () => {
  const { t } = useLanguage();

  const sections = [
    {
      title: "1. Refund Eligibility",
      content: [
        "Refund requests for puja services and bookings must be submitted within 14 days of the booking date. The request must include a valid reason and booking reference number.",
        "Refunds are provided only if:",
        "- The requested puja could not be performed due to temple circumstances",
        "- A duplicate payment was made",
        "- The transaction was unauthorized or fraudulent",
        "- A technical error resulted in incorrect billing",
      ],
    },
    {
      title: "2. Non-Refundable Items",
      content: [
        "The following items are non-refundable:",
        "- Donations made voluntarily to the temple",
        "- Prasad delivery charges",
        "- Completed puja services unless cancelled by the temple",
        "- Cancelled pujas requested by the devotee less than 7 days before the scheduled date",
      ],
    },
    {
      title: "3. Refund Process",
      content: [
        "To request a refund, please email kailashmahadevagra@gmail.com with your booking details. Our team will review your request within 5-7 business days.",
        "Once approved, the refund will be processed back to the original payment method within 7-14 business days.",
        "Processing times may vary depending on your bank or payment provider.",
      ],
    },
    {
      title: "4. Partial Refunds",
      content: [
        "If a puja was partially performed due to unforeseen circumstances, a proportional refund will be issued. For example, if 50% of the puja was completed, 50% of the amount will be refunded.",
      ],
    },
    {
      title: "5. Cancellation Policy",
      content: [
        "Cancellations requested 7 or more days before the puja date: Full refund",
        "Cancellations requested 3-6 days before the puja date: 75% refund",
        "Cancellations requested less than 3 days before the puja date: No refund",
        "Emergency cancellations by the temple: Full refund or reschedule at no cost",
      ],
    },
    {
      title: "6. Special Occasions & Custom Pujas",
      content: [
        "Special pujas booked for specific dates (birthdays, anniversaries, etc.) follow the same cancellation policy. However, these may be rescheduled to another appropriate date instead of refunded.",
      ],
    },
    {
      title: "7. Donation Refunds",
      content: [
        "Donations are made in good faith and are strictly non-refundable. Donation receipts will be provided for tax purposes as applicable by Indian law.",
      ],
    },
    {
      title: "8. Refund Disputes",
      content: [
        "If you have any issues with a refund decision, please contact our support team within 30 days. We will review the dispute and respond within 7 business days.",
      ],
    },
    {
      title: "9. Payment Gateway Issues",
      content: [
        "If you encounter technical issues during payment or suspect a duplicate charge, please notify us immediately. We will investigate and process refunds accordingly.",
      ],
    },
    {
      title: "10. Changes to Refund Policy",
      content: [
        "Kailash Mahadev Temple reserves the right to modify this refund policy at any time. Changes will be effective immediately upon posting to this page.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Refund Policy - Kailash Mahadev Temple Agra"
        description="Review the refund and cancellation policy for pujas, donations, and bookings at Kailash Mahadev Temple Agra."
        canonical="/refund-policy"
        breadcrumbLabel="Refund Policy"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Refund Policy",
          url: "https://kailashmahadev.in/refund-policy",
          isPartOf: { "@id": "https://kailashmahadev.in#website" },
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title="Refund Policy"
          highlight="Payment & Cancellation"
          subtitle="Clear guidelines for refunds and cancellations"
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
                    <h3 className="font-heading font-semibold text-foreground mb-2">Support Contact</h3>
                    <p className="text-muted-foreground text-sm">
                      For refund requests and queries: <strong>kailashmahadevagra@gmail.com</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>If you have any questions about our Refund Policy, please <Link to="/contact" className="text-gold hover:underline">contact us</Link>.</p>
            </div>
          </div>
        </section>

        <TempleDivider />
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
