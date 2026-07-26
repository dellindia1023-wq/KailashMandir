import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { matchCampaignWithContext, type Campaign, type CampaignContext, type CampaignCTA } from "@/lib/campaigns";

export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "expired" | "archived";

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  donation_amount: number;
  booking_count: number;
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

export interface CampaignRow {
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

export const fetchCampaigns = async (): Promise<CampaignRow[]> => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("priority", { ascending: true });

  if (error) throw error;
  return (data as CampaignRow[]) || [];
};

export const useCampaigns = (context: CampaignContext, enabled = true) => {
  const query = useQuery({
    queryKey: ["campaigns", context],
    queryFn: async () => {
      const campaigns = await fetchCampaigns();
      return campaigns.filter((campaign) => matchCampaignWithContext(campaign, context));
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return query;
};

export const incrementCampaignImpression = async (campaignId: string) => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("analytics")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) return;
  const analytics = (data as any)?.analytics || { impressions: 0, clicks: 0, conversions: 0, donation_amount: 0, booking_count: 0 };
  await supabase.from("campaigns").update({ analytics: { ...analytics, impressions: (analytics.impressions || 0) + 1 } }).eq("id", campaignId);
};

export const incrementCampaignClick = async (campaignId: string) => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("analytics")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) return;
  const analytics = (data as any)?.analytics || { impressions: 0, clicks: 0, conversions: 0, donation_amount: 0, booking_count: 0 };
  await supabase.from("campaigns").update({ analytics: { ...analytics, clicks: (analytics.clicks || 0) + 1 } }).eq("id", campaignId);
};

export const useCampaignContext = (override: Partial<CampaignContext> = {}): CampaignContext => {
  const { user } = useAuth();
  const url = typeof window !== "undefined" ? window.location.pathname : "/";
  const path = override.path ?? url;
  const device = override.device ?? (typeof navigator !== "undefined" ? (/Mobi|Android|Tablet/i.test(navigator.userAgent) ? "mobile" : "desktop") : "desktop");
  const isLoggedIn = override.isLoggedIn ?? Boolean(user);

  return {
    path,
    pageType: override.pageType ?? "public",
    location: override.location ?? "",
    isLoggedIn,
    device,
    category: override.category,
    tags: override.tags,
    searchQuery: override.searchQuery,
    customRoute: override.customRoute,
  };
};
