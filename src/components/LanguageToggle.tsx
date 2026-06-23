import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      className="gap-1.5 text-foreground/80 hover:text-primary px-2"
      title={language === "en" ? "हिंदी में देखें" : "View in English"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-semibold">{language === "en" ? "हिं" : "EN"}</span>
    </Button>
  );
};

export default LanguageToggle;
