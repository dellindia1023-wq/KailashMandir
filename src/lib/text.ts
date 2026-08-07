export const safeString = (value?: string | null): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const capitalize = (value?: string | null): string => {
  const text = safeString(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

export const toTitleCase = (phrase: string): string =>
  phrase
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
