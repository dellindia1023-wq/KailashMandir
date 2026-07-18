import { Instagram, MessageCircle, Phone } from "lucide-react";
import { SOCIAL_LINKS } from "@/constants/seo";

const phoneNumber = "+918859692841";
const phoneDisplay = "88596-92841";
const whatsappLink = `https://wa.me/918859692841?text=${encodeURIComponent("🙏 नमस्कार! मैं Kailash Mahadev Temple Agra से संपर्क करना चाहता हूँ।")}`;

const FloatingContactButtons = () => {
  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2 sm:bottom-6">
      <a
        href={`tel:${phoneNumber}`}
        aria-label={`Call temple helpline ${phoneDisplay}`}
        title={`Call ${phoneDisplay}`}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
      >
        <Phone className="h-5 w-5" />
      </a>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Contact on WhatsApp"
        title="Contact on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-600 text-white shadow-lg transition-transform duration-200 hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </a>

      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Open Instagram"
        title="Open Instagram"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-500/20 bg-gradient-to-br from-pink-600 via-purple-600 to-orange-500 text-white shadow-lg transition-transform duration-200 hover:scale-105"
      >
        <Instagram className="h-5 w-5" />
      </a>
    </div>
  );
};

export default FloatingContactButtons;
