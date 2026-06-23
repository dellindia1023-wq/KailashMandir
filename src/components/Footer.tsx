import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Facebook, Instagram, Youtube, Twitter, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SOCIAL_LINKS } from "@/constants/seo";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [email, setEmail] = useState("");
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Subscribed successfully! You'll receive temple updates. 🙏");
    setEmail("");
  };

  const quickLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.darshan"), href: "/darshan-timings" },
    { name: t("nav.events"), href: "/events" },
    { name: t("nav.gallery"), href: "/gallery" },
    { name: t("nav.donate"), href: "/donate" },
    { name: t("nav.contact"), href: "/contact" },
    { name: "Social Posts", href: "/social" },

  ];


  const services = [
    t("footer.services.pujaBooking"),
    t("footer.services.onlineDonation"),
    t("footer.services.liveDarshan"),
    t("footer.services.prasadDelivery"),
    t("footer.services.templeTours"),
    t("footer.services.volunteerRegistration"),
  ];

  const socialLinks = [
    { icon: Facebook, href: SOCIAL_LINKS.facebook, label: "Facebook" },
    { icon: Instagram, href: SOCIAL_LINKS.instagram, label: "Instagram" },
    { icon: Youtube, href: SOCIAL_LINKS.youtube, label: "YouTube" },
    { icon: Twitter, href: SOCIAL_LINKS.twitter, label: "X (Twitter)" },
  ];

  return (
    <footer ref={ref} className="bg-maroon-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-saffron flex items-center justify-center">
                <span className="text-primary-foreground font-heading text-xl">ॐ</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Kailash Mahadev</h3>
                <p className="text-sm text-primary-foreground/70">Temple Agra</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm mb-5">{t("footer.brandDesc")}</p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer noopener" aria-label={social.label} className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-gold flex items-center justify-center transition-colors">
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-3">{t("footer.quickLinks")}</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-gold transition-colors text-sm">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-3">{t("footer.ourServices")}</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {services.map((service) => (
                <li key={service}><span className="text-primary-foreground/70 text-sm">{service}</span></li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="font-heading font-semibold text-lg mb-3">{t("footer.templeUpdates")}</h4>
            <p className="text-primary-foreground/70 text-sm mb-3">{t("footer.subscribeDesc")}</p>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-gold text-primary-foreground w-full"
              />
              <Button className="w-full sm:w-auto bg-gold hover:bg-gold-light text-accent-foreground px-4" onClick={handleSubscribe}>
                {t("common.subscribe")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6 md:px-6">
          {/* Legal Links */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <Link to="/terms-and-conditions" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                Terms & Conditions
              </Link>
              <span className="hidden sm:inline text-primary-foreground/20">•</span>
              <Link to="/refund-policy" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                Refund Policy
              </Link>
              <span className="hidden sm:inline text-primary-foreground/20">•</span>
              <Link to="/privacy-policy" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 border-t border-primary-foreground/10 pt-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent mb-2"></div>
            <p className="text-sm font-medium text-primary-foreground/80 text-center max-w-2xl">
              {t("footer.copyright")}
            </p>
            <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-primary-foreground/70 hover:text-gold hover:bg-primary-foreground/10">
              <ArrowUp className="h-4 w-4 mr-2" />
              {t("common.backToTop")}
            </Button>
          </div>
        </div>
      </div>
      {/* Space for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
