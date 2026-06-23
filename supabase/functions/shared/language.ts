export const normalizeLanguage = (language?: string, locale?: string) => {
  const value = (language || locale || "").toLowerCase();
  if (value === "hi" || value === "hi_in" || value.startsWith("hi")) {
    return "hi";
  }
  return "en";
};
