import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactPage = () => {
  const { t } = useLanguage();
  const revealContact = useScrollReveal();
  const revealFaq = useScrollReveal();
  const revealCta = useScrollReveal();

  const faqs = [
    { q: t("contactPage.faq1q"), a: t("contactPage.faq1a") },
    { q: t("contactPage.faq2q"), a: t("contactPage.faq2a") },
    { q: t("contactPage.faq3q"), a: t("contactPage.faq3a") },
    { q: t("contactPage.faq4q"), a: t("contactPage.faq4a") },
    { q: t("contactPage.faq5q"), a: t("contactPage.faq5a") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Contact & Location | How to Reach"
        description="Contact Kailash mandir agra (Kailash Mahadev Temple) — address in Sikandra, directions, visiting hours, darshan, puja booking and donations."
        canonical="/contact"
        breadcrumbLabel="Contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <Header />
      <main>
        <PageHeroBanner
          image={templeHero}
          title={t("contactPage.pageTitle")}
          highlight={t("contactPage.pageTitleHighlight")}
          subtitle={t("contactPage.pageSubtitle")}
          mantra="ॐ नमः शिवाय"
        />

        {/* Contact Section */}
        <section ref={revealContact.ref} className={revealContact.className}>
          <Contact />
        </section>

        <TempleDivider />

        {/* FAQ Section */}
        <section ref={revealFaq.ref} className={`py-12 md:py-20 bg-background ${revealFaq.className}`}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-3 bg-gold/10 text-gold border-gold/20">
                <HelpCircle className="h-3 w-3 mr-1" />
                {t("contactPage.faqBadge")}
              </Badge>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                {t("contactPage.faqTitle")} <span className="text-gradient-sacred">{t("contactPage.faqTitleHighlight")}</span>
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all">
                  <AccordionTrigger className="font-heading text-sm md:text-base font-semibold text-foreground hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <TempleDivider />

        {/* CTA */}
        {/* ═══ Call to Action Section ═══ */}
        <section ref={revealCta.ref} className={`relative py-16 md:py-24 overflow-hidden ${revealCta.className}`}>
          <div className="absolute inset-0">
            <img src={shivaLingam} alt="Visit Us" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">ॐ नमः शिवाय</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              Plan Your Visit Today
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">Check our darshan timings, book a puja, or make a donation to support the temple.</p>
            <Link to="/darshan-timings">
              <Button size="lg" className="bg-saffron hover:bg-saffron-light text-accent-foreground font-semibold px-8 glow-saffron">
                {t("contactPage.viewDarshanTimings")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
