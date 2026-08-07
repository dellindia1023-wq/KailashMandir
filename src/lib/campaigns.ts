import { useMemo } from "react";
import type { Database, Json } from "@/integrations/supabase/types";

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
  // Donation-specific fields
  gallery?: string[]; // list of image URLs
  icon?: string; // small icon URL or name
  target_amount?: number; // fundraising target
  default_full_amount?: number; // default full donation amount
  min_custom_amount?: number;
  max_custom_amount?: number;
  button_color?: string;
  featured?: boolean;
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  donation_amount: number;
  booking_count: number;
  views?: number;
  ctr?: number;
  bookings?: number;
  donations?: number;
  revenue?: number;
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
  targeting_rules: Record<string, unknown>;
  content: CampaignContent;
  ctas: CampaignCTA[];
  analytics: CampaignAnalytics;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupabaseCampaignRow {
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
  locations: unknown;
  targeting_rules: unknown;
  content: unknown;
  ctas: unknown;
  analytics: unknown;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const normalizeRecord = <T>(value: T | undefined | null, fallback: T): T => {
  if (value === undefined || value === null) return fallback;
  return value;
};

const normalizeJsonArray = <T>(value: unknown, fallback: T[]): T[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => Boolean(item)) as T[];
  }
  return fallback;
};

const normalizeJsonRecord = (value: unknown, fallback: Record<string, unknown>): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return fallback;
};

const toJson = (value: unknown): Json => value as Json;

export const buildSupabaseCampaignInsertPayload = (
  campaign: Partial<Campaign>,
  overrides: Partial<Pick<Campaign, "created_by" | "updated_by" | "created_at" | "updated_at">> = {},
): Database["public"]["Tables"]["campaigns"]["Insert"] => ({
  id: campaign.id,
  name: campaign.name ?? "",
  slug: campaign.slug ?? "",
  description: campaign.description ?? null,
  type: campaign.type ?? null,
  status: campaign.status ?? "draft",
  priority: campaign.priority ?? 50,
  start_date: campaign.start_date ?? null,
  end_date: campaign.end_date ?? null,
  is_active: campaign.is_active ?? true,
  locations: toJson(normalizeJsonArray<string>(campaign.locations, [])),
  targeting_rules: toJson(normalizeJsonRecord(campaign.targeting_rules, {})),
  content: toJson(normalizeRecord(campaign.content, {} as CampaignContent)),
  ctas: toJson(normalizeJsonArray<CampaignCTA>(campaign.ctas, [])),
  analytics: toJson(normalizeRecord(campaign.analytics, DEFAULT_CAMPAIGN_ANALYTICS)),
  created_by: overrides.created_by ?? campaign.created_by ?? null,
  updated_by: overrides.updated_by ?? campaign.updated_by ?? null,
  created_at: overrides.created_at ?? campaign.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? campaign.updated_at ?? new Date().toISOString(),
}) as Database["public"]["Tables"]["campaigns"]["Insert"];

export const buildSupabaseCampaignUpdatePayload = (campaign: Partial<Campaign>): Database["public"]["Tables"]["campaigns"]["Update"] => ({
  name: campaign.name,
  slug: campaign.slug,
  description: campaign.description,
  type: campaign.type,
  status: campaign.status,
  priority: campaign.priority,
  start_date: campaign.start_date,
  end_date: campaign.end_date,
  is_active: campaign.is_active,
  locations: campaign.locations === undefined ? undefined : toJson(normalizeJsonArray<string>(campaign.locations, [])),
  targeting_rules: campaign.targeting_rules === undefined ? undefined : toJson(normalizeJsonRecord(campaign.targeting_rules, {})),
  content: campaign.content === undefined ? undefined : toJson(normalizeRecord(campaign.content, {} as CampaignContent)),
  ctas: campaign.ctas === undefined ? undefined : toJson(normalizeJsonArray<CampaignCTA>(campaign.ctas, [])),
  analytics: campaign.analytics === undefined ? undefined : toJson(normalizeRecord(campaign.analytics, DEFAULT_CAMPAIGN_ANALYTICS)),
  updated_by: campaign.updated_by ?? null,
  updated_at: new Date().toISOString(),
}) as Database["public"]["Tables"]["campaigns"]["Update"];

export const fromSupabaseCampaignRow = (row: SupabaseCampaignRow): Campaign => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  type: row.type,
  status: row.status,
  priority: row.priority,
  start_date: row.start_date,
  end_date: row.end_date,
  is_active: row.is_active,
  locations: normalizeJsonArray<string>(row.locations, []),
  targeting_rules: normalizeJsonRecord(row.targeting_rules, {}),
  content: normalizeRecord(row.content as CampaignContent | undefined, defaultContent),
  ctas: normalizeJsonArray<CampaignCTA>(row.ctas, []),
  analytics: normalizeRecord(row.analytics as CampaignAnalytics | undefined, DEFAULT_CAMPAIGN_ANALYTICS),
  created_by: row.created_by,
  updated_by: row.updated_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const defaultContent: CampaignContent = {
  headline: "",
  message: "",
  image_url: "",
  mobile_image_url: "",
  background_color: "",
  badge: "",
  gallery: [],
  icon: "",
  target_amount: undefined,
  default_full_amount: undefined,
  min_custom_amount: undefined,
  max_custom_amount: undefined,
  button_color: "",
  featured: false,
};

export const DEFAULT_CAMPAIGN_ANALYTICS: CampaignAnalytics = {
  impressions: 0,
  clicks: 0,
  conversions: 0,
  donation_amount: 0,
  booking_count: 0,
  views: 0,
  ctr: 0,
  bookings: 0,
  donations: 0,
  revenue: 0,
};

export const getCampaignAnalyticsSummary = (analytics: Partial<CampaignAnalytics> = {}) => ({
  views: analytics.views ?? 0,
  clicks: analytics.clicks ?? 0,
  ctr: analytics.ctr ?? 0,
  bookings: analytics.bookings ?? 0,
  donations: analytics.donations ?? 0,
  revenue: analytics.revenue ?? 0,
});

const LOCATION_ALIASES: Record<string, string> = {
  homepage_hero: "homepage.hero",
  homepage_top_banner: "homepage.hero",
  homepage_banner: "homepage.hero",
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

export const getCampaignGroupName = (campaign: Campaign): string => {
  const rules = (campaign.targeting_rules || {}) as Record<string, unknown>;
  return typeof rules.group_name === "string" ? rules.group_name : "";
};

export const getCampaignGroupRole = (campaign: Campaign): string => {
  const rules = (campaign.targeting_rules || {}) as Record<string, unknown>;
  return typeof rules.group_role === "string" ? rules.group_role : "standalone";
};

export const getCampaignParentGroupId = (campaign: Campaign): string => {
  const rules = (campaign.targeting_rules || {}) as Record<string, unknown>;
  return typeof rules.parent_group_id === "string" ? rules.parent_group_id : "";
};

export const getLocationLabel = (location: string): string => {
  const normalized = normalizeCampaignLocation(location);
  const labels: Record<string, string> = {
    "homepage.hero": "Homepage Hero",
    "homepage.top": "Homepage Top",
    "homepage.cards": "Homepage Cards",
    "homepage.announcement": "Homepage Announcement",
    "sticky.header": "Sticky Header",
    "sticky.footer": "Sticky Footer",
    "floating.widget": "Floating Widget",
    sidebar: "Sidebar",
    "knowledge.top": "Knowledge Hub",
    "knowledge.article": "Knowledge Article",
    "blog.top": "Blog Listing",
    "blog.article": "Blog Article",
    "donate.top": "Donation Banner",
    "pujas.hero": "Booking Banner",
    "events.top": "Events Banner",
    contact: "Contact CTA",
    about: "About CTA",
    footer: "Footer Banner",
    "exit-intent.popup": "Exit Intent Popup",
    "welcome.popup": "Welcome Popup",
    "newsletter.popup": "Newsletter Popup",
    "mobile-bottom-sheet": "Mobile Bottom Sheet",
    "mobile-floating-button": "Mobile Floating Button",
    "desktop.hero.slider": "Desktop Hero Slider",
    "category.pages": "Category Pages",
    "tag.pages": "Tag Pages",
    "search.results": "Search Results",
    "404.page": "404 Page",
    custom_route: "Custom Route",
  };

  return labels[normalized] || normalized.replace(/_/g, " ").replace(/\./g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
};

export const getCampaignTimelineState = (campaign: Campaign): "draft" | "running" | "ending-soon" | "expired" | "archive" => {
  const effectiveStatus = getEffectiveCampaignStatus(campaign);
  if (!campaign.is_active || effectiveStatus === "archived" || effectiveStatus === "paused") return "archive";
  if (effectiveStatus === "expired") return "expired";

  const now = new Date();
  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
  if (endDate && now.getTime() > endDate.getTime() - 1000 * 60 * 60 * 24 * 7) return "ending-soon";
  if (effectiveStatus === "scheduled") return "draft";
  return "running";
};

export const getCampaignHealthScore = (campaign: Campaign) => {
  const issues: string[] = [];
  let score = 100;

  if (!campaign.content?.image_url) {
    issues.push("Missing image");
    score -= 18;
  }
  if (!campaign.ctas?.some((cta) => cta.label && cta.url)) {
    issues.push("Missing CTA");
    score -= 18;
  }
  if (!campaign.start_date || !campaign.end_date) {
    issues.push("Missing schedule");
    score -= 14;
  }
  if (!campaign.locations?.length) {
    issues.push("Missing placement");
    score -= 12;
  }
  const targetingRules = campaign.targeting_rules as Record<string, unknown> | undefined;
  const pageTypes = Array.isArray(targetingRules?.page_types) ? targetingRules.page_types.filter((item): item is string => typeof item === "string") : [];
  if (!pageTypes.length && !targetingRules?.url_contains) {
    issues.push("Missing targeting");
    score -= 12;
  }
  if (campaign.ctas?.some((cta) => typeof cta.url === "string" && /^(http|https):\/\//i.test(cta.url) === false && !cta.url.startsWith("/"))) {
    issues.push("Broken CTA URL");
    score -= 12;
  }

  const healthScore = Math.max(0, Math.min(100, score));
  return {
    score: healthScore,
    issues,
    label: healthScore >= 85 ? "Healthy" : healthScore >= 65 ? "Needs attention" : "At risk",
  };
};

export const getCampaignValidationIssues = (campaign: Campaign, campaigns: Campaign[] = []) => {
  const issues: string[] = [];
  const normalizedSlug = campaign.slug?.trim().toLowerCase();

  if (!campaign.content?.image_url) issues.push("Image missing");
  if (!campaign.ctas?.some((cta) => cta.label && cta.url)) issues.push("CTA missing");
  if (!campaign.start_date || !campaign.end_date) issues.push("Dates invalid");
  if (campaign.start_date && campaign.end_date && new Date(campaign.end_date) < new Date(campaign.start_date)) issues.push("End date before start date");
  const pageTypes = Array.isArray((campaign.targeting_rules as Record<string, unknown>)?.page_types)
    ? ((campaign.targeting_rules as Record<string, unknown>).page_types as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  if (pageTypes.length === 0 && ((campaign.targeting_rules as Record<string, unknown>)?.url_contains as string | undefined) === undefined) issues.push("Invalid targeting");
  if (!campaign.locations?.length) issues.push("Missing placement");
  if (campaign.ctas?.some((cta) => Boolean(cta.url) && !/^https?:\/\//i.test(cta.url) && !cta.url.startsWith("/"))) issues.push("Broken URL");

  const duplicateSlug = campaigns.some((item) => item.id !== campaign.id && item.slug?.trim().toLowerCase() === normalizedSlug);
  if (duplicateSlug) issues.push("Duplicate slug");

  const samePlacement = campaigns.some((item) => item.id !== campaign.id && item.locations.some((location) => campaign.locations.includes(location)) && item.priority === campaign.priority);
  if (samePlacement) issues.push("Duplicate priority conflict");

  return issues;
};

export const getCampaignConflictIssues = (campaign: Campaign, campaigns: Campaign[] = []) => {
  const conflicts: string[] = [];
  const samePlacement = campaigns.filter((item) => item.id !== campaign.id && item.locations.some((location) => campaign.locations.includes(location)));
  if (samePlacement.length > 0) conflicts.push(`Same placement as ${samePlacement.map((item) => item.name).join(", ")}`);
  if (samePlacement.some((item) => item.priority === campaign.priority)) conflicts.push("Same priority on same placement");
  if (campaigns.some((item) => item.id !== campaign.id && item.slug?.trim().toLowerCase() === campaign.slug?.trim().toLowerCase())) conflicts.push("Duplicate slug");
  if (!campaign.content?.image_url) conflicts.push("Missing image");
  if (!campaign.ctas?.some((cta) => cta.label && cta.url)) conflicts.push("Broken CTA");
  return conflicts;
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

  const rules = (campaign.targeting_rules || {}) as Record<string, unknown>;

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
    const normalizedPageTypes = (rules.page_types as unknown[])
      .filter((item): item is string => typeof item === "string")
      .map((pageType) => normalizeCampaignPageType(pageType));
    const currentPageType = normalizeCampaignPageType(context.pageType);
    if (!normalizedPageTypes.includes(currentPageType)) return false;
  }

  if (rules.url_contains && typeof rules.url_contains === "string") {
    if (!context.path.toLowerCase().includes(rules.url_contains.toLowerCase())) return false;
  }

  if (rules.logged_in === "logged_in" && !context.isLoggedIn) return false;
  if (rules.logged_in === "guest" && context.isLoggedIn) return false;

  if (rules.device && typeof rules.device === "string" && rules.device !== "any" && context.device && rules.device !== context.device) {
    return false;
  }

  if (rules.category && typeof rules.category === "string" && context.category) {
    if (rules.category.toLowerCase() !== context.category.toLowerCase()) return false;
  }

  if (rules.tags && Array.isArray(rules.tags) && rules.tags.length > 0 && Array.isArray(context.tags)) {
    const matchesTag = context.tags.some((tag) => (rules.tags as string[]).includes(tag));
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
