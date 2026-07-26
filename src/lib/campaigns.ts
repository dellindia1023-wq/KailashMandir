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

  const locationMatch = campaign.locations.some((location) => {
    const normalized = location.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith("custom:")) {
      const customRoute = normalized.replace(/^custom:/, "").trim();
      return customRoute ? context.path === customRoute : false;
    }
    return normalized === context.location.toLowerCase();
  });

  if (!locationMatch) {
    return false;
  }

  const rules = campaign.targeting_rules || {};
  if (rules.page_types && Array.isArray(rules.page_types) && rules.page_types.length > 0) {
    if (!rules.page_types.includes(context.pageType)) return false;
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
