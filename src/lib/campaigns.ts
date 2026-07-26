import { useMemo } from "react";

export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "expired" | "archived";
export type CampaignCTAType = "link" | "phone" | "whatsapp" | "email" | "payment";

export interface CampaignCTA {
  id: string;
  label: string;
  url: string;
  type: CampaignCTAType;
  icon?: string;
  open_new_tab?: boolean;
  is_popup?: boolean;
}

export interface CampaignContent {
  headline?: string;
  message?: string;
  image_url?: string;
  mobile_image_url?: string;
  background_color?: string;
  badge?: string;
  countdown_target?: string;
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  donation_amount: number;
  booking_count: number;
}

export interface CampaignContext {
  path: string;
  pageType: string;
  location: string;
  isLoggedIn?: boolean;
  device?: "desktop" | "tablet" | "mobile";
  category?: string;
  tags?: string[];
  searchQuery?: string;
  customRoute?: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string | null;
  status: CampaignStatus;
  priority: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  locations: string[];
  targeting_rules: Record<string, any>;
  content: CampaignContent;
  ctas: CampaignCTA[];
  analytics: CampaignAnalytics;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const DEFAULT_CAMPAIGN_ANALYTICS: CampaignAnalytics = {
  impressions: 0,
  clicks: 0,
  conversions: 0,
  donation_amount: 0,
  booking_count: 0,
};

const LOCATION_ALIASES: Record<string, string> = {
  homepage_hero: "homepage.hero",
  homepage_top_banner: "homepage.top",
  homepage_cards: "homepage.cards",
  homepage_announcement_bar: "homepage.announcement",
  sticky_header: "sticky.header",
  sticky_footer: "sticky.footer",
  floating_widget: "floating.widget",
  sidebar: "sidebar",
  knowledge_hub: "knowledge.top",
  knowledge_article: "knowledge.article",
  blog_listing: "blog.top",
  blog_article: "blog.article",
  donation_page: "donate.top",
  booking_page: "pujas.hero",
  live_darshan: "live-darshan.after-player",
  events: "events.top",
  exit_intent_popup: "exit-intent.popup",
  welcome_popup: "welcome.popup",
  newsletter_popup: "newsletter.popup",
  mobile_bottom_sheet: "mobile-bottom-sheet",
  mobile_floating_button: "mobile-floating-button",
  desktop_hero_slider: "desktop.hero.slider",
  category_pages: "category.pages",
  tag_pages: "tag.pages",
  search_results: "search.results",
  "404_page": "404.page",
  custom_route: "custom_route",
};

const PAGE_TYPE_ALIASES: Record<string, string> = {
  home: "home",
  homepage: "home",
  knowledge: "knowledge",
  knowledge_hub: "knowledge",
  blog: "blog",
  blog_listing: "blog",
  donate: "donate",
  donation: "donate",
  pujas: "pujas",
  booking: "pujas",
  events: "events",
  "live-darshan": "live-darshan",
  live_darshan: "live-darshan",
  contact: "contact",
  about: "about",
  gallery: "gallery",
  "category.pages": "category.pages",
  category_pages: "category.pages",
  "tag.pages": "tag.pages",
  tag_pages: "tag.pages",
  "search.results": "search.results",
  search_results: "search.results",
  "404.page": "404.page",
  "404_page": "404.page",
};

export const normalizeCampaignLocation = (location: string): string => {
  const normalized = location.trim().toLowerCase();
  if (!normalized) return "";
  return LOCATION_ALIASES[normalized] ?? normalized;
};

export const normalizeCampaignPageType = (pageType: string): string => {
  const normalized = pageType.trim().toLowerCase();
  if (!normalized) return "";
  return PAGE_TYPE_ALIASES[normalized] ?? normalized;
};

export const getEffectiveCampaignStatus = (campaign: Campaign): CampaignStatus => {
  if (!campaign.is_active) return "archived";
  if (campaign.status === "archived") return "archived";
  if (campaign.status === "paused") return "paused";

  const now = new Date();
  const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;

  if (startDate && now < startDate) return "scheduled";
  if (endDate && now > endDate) return "expired";
  if (campaign.status === "draft") return "draft";
  return "running";
};

export const normalizeStringList = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => item.trim()).filter(Boolean);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const matchCampaignWithContext = (campaign: Campaign, context: CampaignContext): boolean => {
  const effectiveStatus = getEffectiveCampaignStatus(campaign);
  if (effectiveStatus !== "running") {
    return false;
  }

  if (!campaign.locations || campaign.locations.length === 0) {
    return false;
  }

  const rules = campaign.targeting_rules || {};

  const locationMatch = campaign.locations.some((location) => {
    const normalized = normalizeCampaignLocation(location);
    if (!normalized) return false;

    if (normalized === "custom_route") {
      const customRoute = typeof rules.custom_route === "string" ? rules.custom_route.trim() : "";
      return customRoute ? context.path === customRoute : false;
    }

    if (normalized.startsWith("custom:")) {
      const customRoute = normalized.replace(/^custom:/, "").trim();
      return customRoute ? context.path === customRoute : false;
    }

    return normalized === context.location.toLowerCase();
  });

  if (!locationMatch) {
    return false;
  }
  if (rules.page_types && Array.isArray(rules.page_types) && rules.page_types.length > 0) {
    const normalizedPageTypes = rules.page_types
      .filter(Boolean)
      .map((pageType) => normalizeCampaignPageType(String(pageType)));
    const currentPageType = normalizeCampaignPageType(context.pageType);
    if (!normalizedPageTypes.includes(currentPageType)) return false;
  }

  if (rules.url_contains && typeof rules.url_contains === "string") {
    if (!context.path.toLowerCase().includes(rules.url_contains.toLowerCase())) return false;
  }

  if (rules.logged_in === "logged_in" && !context.isLoggedIn) return false;
  if (rules.logged_in === "guest" && context.isLoggedIn) return false;

  if (rules.device && rules.device !== "any" && context.device && rules.device !== context.device) {
    return false;
  }

  if (rules.category && typeof rules.category === "string" && context.category) {
    if (rules.category.toLowerCase() !== context.category.toLowerCase()) return false;
  }

  if (rules.tags && Array.isArray(rules.tags) && rules.tags.length > 0 && Array.isArray(context.tags)) {
    const matchesTag = context.tags.some((tag) => rules.tags.includes(tag));
    if (!matchesTag) return false;
  }

  if (rules.search_keywords && typeof rules.search_keywords === "string" && context.searchQuery) {
    if (!context.searchQuery.toLowerCase().includes(rules.search_keywords.toLowerCase())) return false;
  }

  return true;
};

export const useCampaignPriority = (campaigns: Campaign[]) => {
  return useMemo(
    () => [...campaigns].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100)),
    [campaigns],
  );
};
