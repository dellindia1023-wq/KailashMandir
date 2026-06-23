import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const { t } = useLanguage();

  const sections = [
    {
      title: "1. Introduction",
      content: [
        "Kailash Mahadev Temple Agra ('we', 'our', or 'us') operates the www.kailashmahadev.in website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.",
      ],
    },
    {
      title: "2. Information Collection & Use",
      content: [
        "We collect several different types of information for various purposes to provide and improve our Service:",
        "• Personal Data: Name, email address, phone number, address, payment information",
        "• Usage Data: Browser type, IP address, pages visited, time spent on pages, referral source",
        "• Cookies: Small data files stored on your device for functionality and analytics",
      ],
    },
    {
      title: "3. Use of Data",
      content: [
        "Kailash Mahadev Temple Agra uses the collected data for various purposes:",
        "• To provide and maintain our Service",
        "• To notify you about changes to our Service",
        "• To allow you to participate in interactive features of our Service",
        "• To provide customer support",
        "• To gather analysis or valuable information so that we can improve our Service",
        "• To monitor the usage of our Service",
        "• To detect, prevent and address technical and security issues",
      ],
    },
    {
      title: "4. Security of Data",
      content: [
        "The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.",
      ],
    },
    {
      title: "5. Payment Information",
      content: [
        "When you make a payment through our website, your payment information is encrypted and transmitted securely to our payment gateway provider. We do not store your credit card or debit card information on our servers.",
        "All payment processing is handled by certified payment processors in compliance with PCI DSS standards.",
      ],
    },
    {
      title: "6. Service Providers",
      content: [
        "We may employ third-party companies and individuals to facilitate our Service. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.",
      ],
    },
    {
      title: "7. Links to Other Sites",
      content: [
        "Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.",
      ],
    },
    {
      title: "8. Children's Privacy",
      content: [
        "Our Service does not address anyone under the age of 18 ('Children'). We do not knowingly collect personally identifiable information from children under 18. If we become aware that a child under 18 has provided us with personal data, we immediately delete such information from our servers.",
      ],
    },
    {
      title: "9. Changes to This Privacy Policy",
      content: [
        "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date.",
      ],
    },
    {
      title: "10. Contact Us",
      content: [
        "If you have any questions about this Privacy Policy, please contact us at kailashmahadevagra@gmail.com or through our contact form.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy - Kailash Mahadev Temple Agra"
        description="Learn how Kailash Mahadev Temple Agra protects your personal information and privacy when using our website."
        canonical="/privacy-policy"
        breadcrumbLabel="Privacy Policy"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy Policy",
          url: "https://kailashmahadev.in/privacy-policy",
          isPartOf: { "@id": "https://kailashmahadev.in#website" },
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title="Privacy Policy"
          highlight="Your Privacy Matters"
          subtitle="We are committed to protecting your personal information"
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
              <p>If you have any privacy concerns, please <Link to="/contact" className="text-gold hover:underline">contact us</Link>.</p>
            </div>
          </div>
        </section>

        <TempleDivider />
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
