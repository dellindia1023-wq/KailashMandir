import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const FloatingLanguageButton = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="fixed bottom-20 left-4 z-40 lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      title={language === "en" ? "हिंदी में देखें" : "View in English"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-bold">{language === "en" ? "हिं" : "EN"}</span>
    </button>
  );
};

export default FloatingLanguageButton;
