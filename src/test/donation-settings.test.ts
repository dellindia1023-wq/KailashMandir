import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockMaybeSingle, mockSelect, mockOrder, mockLimit, mockEq, mockUpdate, mockInsert, mockFrom } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockLimit: vi.fn(),
  mockEq: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { DEFAULT_DONATION_SETTINGS, normalizeDonationSettings, saveDonationSettings } from "@/lib/donationSettings";

describe("donation settings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    const queryBuilder = {
      select: mockSelect.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      limit: mockLimit.mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      eq: mockEq.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
    };

    mockFrom.mockReturnValue(queryBuilder);
    mockSelect.mockReturnValue(queryBuilder);
    mockOrder.mockReturnValue(queryBuilder);
    mockLimit.mockReturnValue(queryBuilder);
    mockEq.mockReturnValue(queryBuilder);
    mockUpdate.mockReturnValue(queryBuilder);
    mockInsert.mockReturnValue(queryBuilder);
  });
  it("normalizes donation card copy and visibility defaults", () => {
    const settings = normalizeDonationSettings(null);

    expect(settings.card_title).toBe(DEFAULT_DONATION_SETTINGS.card_title);
    expect(settings.card_subtitle).toBe(DEFAULT_DONATION_SETTINGS.card_subtitle);
    expect(settings.card_cta_text).toBe(DEFAULT_DONATION_SETTINGS.card_cta_text);
    expect(settings.show_qr_code).toBe(true);
    expect(settings.show_payment_methods).toBe(true);
  });

  it("preserves custom card setup values", () => {
    const settings = normalizeDonationSettings({
      card_title: "Support the Temple",
      card_subtitle: "Every offering helps the daily rituals.",
      card_cta_text: "Offer Now",
      show_qr_code: false,
      show_payment_methods: false,
    });

    expect(settings.card_title).toBe("Support the Temple");
    expect(settings.card_subtitle).toBe("Every offering helps the daily rituals.");
    expect(settings.card_cta_text).toBe("Offer Now");
    expect(settings.show_qr_code).toBe(false);
    expect(settings.show_payment_methods).toBe(false);
  });

  it("persists donation settings locally when the remote table is unavailable", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST205", message: "Could not find the table" } });

    const saved = await saveDonationSettings({
      ...DEFAULT_DONATION_SETTINGS,
      card_title: "Temple Support",
    });

    expect(saved.card_title).toBe("Temple Support");
    expect(window.localStorage.getItem("kailash_donation_settings_source")).toBe("local");
  });
});
