import { describe, expect, it } from "vitest";
import {
  buildSupabaseCampaignInsertPayload,
  buildSupabaseCampaignUpdatePayload,
  fromSupabaseCampaignRow,
  matchCampaignWithContext,
  normalizeCampaignLocation,
  type Campaign,
} from "@/lib/campaigns";

describe("campaign adapters", () => {
  it("serializes UI campaign data into database-safe payloads", () => {
    const campaign: Campaign = {
      id: "campaign-1",
      name: "Spring Fest",
      slug: "spring-fest",
      description: "A seasonal launch",
      type: "festival",
      status: "running",
      priority: 20,
      start_date: "2026-07-01",
      end_date: "2026-07-31",
      is_active: true,
      locations: ["homepage.top"],
      targeting_rules: { page_types: ["home"], logged_in: "any" },
      content: { headline: "Celebrate now", message: "Book your visit" },
      ctas: [{ id: "cta-1", label: "Book", url: "/book", type: "link" }],
      analytics: { impressions: 5, clicks: 2, conversions: 1, donation_amount: 0, booking_count: 1 },
      created_by: null,
      updated_by: null,
      created_at: null,
      updated_at: null,
    };

    const payload = buildSupabaseCampaignInsertPayload(campaign, { created_by: "user-1" });

    expect(payload.name).toBe("Spring Fest");
    expect(payload.locations).toEqual(["homepage.top"]);
    expect(payload.targeting_rules).toEqual({ page_types: ["home"], logged_in: "any" });
    expect(payload.content).toEqual({ headline: "Celebrate now", message: "Book your visit" });
    expect(payload.ctas).toEqual(campaign.ctas);
    expect(payload.created_by).toBe("user-1");
  });

  it("hydrates Supabase rows back into app campaign objects", () => {
    const row = {
      id: "campaign-2",
      name: "Monsoon Offer",
      slug: "monsoon-offer",
      description: "Limited offer",
      type: "offer",
      status: "draft",
      priority: 15,
      start_date: "2026-08-01",
      end_date: "2026-08-15",
      is_active: true,
      locations: ["homepage.hero"],
      targeting_rules: { page_types: ["home"] },
      content: { headline: "Fresh arrivals", message: "Offer ends soon" },
      ctas: [{ id: "cta-2", label: "Explore", url: "/offers", type: "link" }],
      analytics: { impressions: 10, clicks: 3, conversions: 0, donation_amount: 0, booking_count: 0 },
      created_by: "user-2",
      updated_by: "user-2",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };

    const campaign = fromSupabaseCampaignRow(row);

    expect(campaign.locations).toEqual(["homepage.hero"]);
    expect(campaign.content.headline).toBe("Fresh arrivals");
    expect(campaign.ctas[0].label).toBe("Explore");
    expect(campaign.analytics.clicks).toBe(3);
    expect(campaign.created_by).toBe("user-2");
  });

  it("matches legacy homepage banner placements to the homepage hero slot", () => {
    const campaign = fromSupabaseCampaignRow({
      id: "campaign-3",
      name: "Legacy Homepage Banner",
      slug: "legacy-homepage-banner",
      description: null,
      type: "promo",
      status: "running",
      priority: 10,
      start_date: null,
      end_date: null,
      is_active: true,
      locations: ["homepage_top_banner"],
      targeting_rules: { page_types: ["home"] },
      content: { headline: "Now live", message: "This should appear on the homepage hero" },
      ctas: [{ id: "cta-3", label: "Explore", url: "/", type: "link" }],
      analytics: { impressions: 0, clicks: 0, conversions: 0, donation_amount: 0, booking_count: 0 },
      created_by: null,
      updated_by: null,
      created_at: null,
      updated_at: null,
    });

    expect(normalizeCampaignLocation("homepage_top_banner")).toBe("homepage.hero");
    expect(matchCampaignWithContext(campaign, {
      path: "/",
      pageType: "home",
      location: "homepage.hero",
      isLoggedIn: false,
      device: "desktop",
    })).toBe(true);
  });

  it("normalizes missing JSON fields into safe defaults", () => {
    const campaign = fromSupabaseCampaignRow({
      id: "campaign-4",
      name: "Fallback",
      slug: "fallback",
      description: null,
      type: null,
      status: "draft",
      priority: 10,
      start_date: null,
      end_date: null,
      is_active: true,
      locations: undefined as unknown as string[],
      targeting_rules: undefined as unknown as Record<string, unknown>,
      content: undefined as unknown as Record<string, unknown>,
      ctas: undefined as unknown as Array<{ id: string; label: string; url: string; type: string }>,
      analytics: undefined as unknown as Record<string, unknown>,
      created_by: null,
      updated_by: null,
      created_at: null,
      updated_at: null,
    });

    expect(campaign.locations).toEqual([]);
    expect(campaign.content.headline).toBe("");
    expect(campaign.ctas).toEqual([]);
    expect(campaign.analytics.impressions).toBe(0);
  });
});
