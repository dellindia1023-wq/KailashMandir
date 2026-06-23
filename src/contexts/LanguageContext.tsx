import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { en } from "@/translations/en";
import { hi } from "@/translations/hi";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isHindi: boolean;
}

const translations: Record<Language, Record<string, any>> = { en, hi };

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
  isHindi: false,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("temple-lang");
    return (saved === "hi" ? "hi" : "en") as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("temple-lang", lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: any = translations[language];
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          // Fallback to English
          let fallback: any = translations.en;
          for (const fk of keys) fallback = fallback?.[fk];
          return typeof fallback === "string" ? fallback : key;
        }
      }
      return typeof value === "string" ? value : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHindi: language === "hi" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
