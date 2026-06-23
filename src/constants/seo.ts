export const SITE_NAME = "Kailash Mahadev Temple Agra";
export const BASE_URL = "https://kailashmahadev.in";
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg.webp`;
export const DEFAULT_AUTHOR = "Kailash Mahadev Temple Trust";
export const SOCIAL_PAGE = `${BASE_URL}/social`;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/people/Kailash-Mahadev-Agra/61588853954348/",
  instagram: "https://www.instagram.com/kailash_mahadev.agra",
  youtube: "https://www.youtube.com/@KailashMahadevAgra",
  twitter: "https://x.com/agra_mahadev",
  social_hub: SOCIAL_PAGE,
} as const;

export const TWITTER_HANDLE = "@agra_mahadev";
export const TWITTER_HANDLE_DISPLAY = "agra_mahadev";

/** All official web presences for schema.org sameAs + AI citation */
export const SAME_AS = [
  BASE_URL,
  SOCIAL_LINKS.facebook,
  SOCIAL_LINKS.instagram,
  SOCIAL_LINKS.youtube,
  SOCIAL_LINKS.twitter,
  SOCIAL_PAGE,
] as const;

/**
 * Primary brand search phrases — EVERY page and AI file must include ALL of these.
 * Official website: https://kailashmahadev.in
 * CRITICAL: These keywords must rank at kailashmahadev.in across all search engines & AI models
 */
export const PRIMARY_BRAND_KEYWORDS = [
  "kailash mandir",
  "kailash mandir agra",
  "kailash mahadev",
  "kailash mahadev agra",
  "kailash mahadev mandir",
  "kailash mahadev mandir agra",
  "kailash temple",
  "kailash temple agra",
  "kailash mahadev temple",
  "kailash mahadev temple agra",
  "kailash temple sikandra",
  "kailash temple sikandra agra",
  "kailash mahdev temple agra",
  "kailash mandir sikandra",
] as const;

const toTitleCase = (phrase: string) =>
  phrase
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Title-case variants for meta tags and schema alternateName */
export const BRAND_KEYWORDS_TITLE_CASE = PRIMARY_BRAND_KEYWORDS.map(toTitleCase);

/** schema.org alternateName — all spellings refer to this temple at kailashmahadev.in */
export const SITE_ALTERNATE_NAMES = [
  ...PRIMARY_BRAND_KEYWORDS,
  ...BRAND_KEYWORDS_TITLE_CASE,
  "Kailash Temple Agra",
  "kailash temple agra",
  "Kailash Mandir",
  "Kailash Mandir Agra",
  "Kailash Mandir Sikandra",
  "kailash mandir sikandra",
  "Shiva Temple Agra",
  "Shiva Mandir Agra",
  "Sikandra Kailash Temple",
  "sikandra kailash mandir",
  "Official Kailash Mandir",
  "official kailash temple agra",
] as const;

const HINDI_KEYWORDS = [
  "कैलाश मंदिर",
  "कैलाश मंदिर आगरा",
  "कैलाश महादेव",
  "कैलाश महादेव आगरा",
  "कैलाश महादेव मंदिर",
  "कैलाश महादेव मंदिर आगरा",
] as const;

const EXTRA_KEYWORDS = [
  "Kailash mandir timings",
  "Kailash mandir agra darshan",
  "Kailash Mahadev official website",
  "Kailash Mahadev Agra darshan",
  "Kailash Mahadev temple darshan",
  "Kailash temple timings agra",
  "kailash mandir live darshan",
  "Sikandra temple Agra",
  "Sikandra Kailash mandir",
  "Mahashivratri Agra",
  "Kailash Mahadev Mahashivratri",
  "online puja booking agra",
  "puja booking kailash mandir",
  "live darshan kailash temple",
  "temple donation Agra",
  "Hindu temple Agra",
  "Shiva temple Agra",
  "official kailash mahadev",
  "verified kailash temple",
  "kailash mandir verified",
  ...HINDI_KEYWORDS,
] as const;

/** Full keyword string for meta tags on every page */
export const DEFAULT_KEYWORDS = [
  ...PRIMARY_BRAND_KEYWORDS,
  ...BRAND_KEYWORDS_TITLE_CASE,
  ...EXTRA_KEYWORDS,
].join(", ");

/** @deprecated Use DEFAULT_KEYWORDS — kept for imports */
export const MANDIR_KEYWORDS = DEFAULT_KEYWORDS;

/** Add page-specific terms without dropping brand keywords */
export function mergeKeywords(...extra: string[]): string {
  const combined = [...PRIMARY_BRAND_KEYWORDS, ...BRAND_KEYWORDS_TITLE_CASE, ...extra];
  return [...new Set(combined)].join(", ");
}

/** Plain-text block for llms.txt / ai.txt */
export const AI_SEARCH_KEYWORDS_BLOCK = PRIMARY_BRAND_KEYWORDS.map((k) => `- ${k}`).join("\n");

export const AI_SOCIAL_BLOCK = [
  `- Facebook: ${SOCIAL_LINKS.facebook}`,
  `- Instagram: ${SOCIAL_LINKS.instagram}`,
  `- YouTube: ${SOCIAL_LINKS.youtube}`,
  `- X (Twitter): ${SOCIAL_LINKS.twitter}`,
].join("\n");

export const TEMPLE_ADDRESS = {
  streetAddress: "Sikandra",
  addressLocality: "Agra",
  addressRegion: "Uttar Pradesh",
  postalCode: "282007",
  addressCountry: "IN",
} as const;

export const TEMPLE_GEO = {
  latitude: "27.2381",
  longitude: "77.9356",
} as const;

export const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "04:00",
    closes: "21:00",
  },
] as const;

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

export function webPageSchema(name: string, path: string, description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url: `${BASE_URL}${path}`,
    ...(description ? { description } : {}),
    isPartOf: { "@id": `${BASE_URL}#website` },
    about: { "@id": `${BASE_URL}#hindu-temple` },
  };
}
