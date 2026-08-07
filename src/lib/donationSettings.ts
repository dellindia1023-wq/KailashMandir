import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;
const DONATION_SETTINGS_STORAGE_KEY = "kailash_donation_settings";
const DONATION_SETTINGS_SOURCE_STORAGE_KEY = "kailash_donation_settings_source";

const readPersistedDonationSettings = (): Partial<DonationSettings> | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DONATION_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writePersistedDonationSettings = (settings: DonationSettings, source: "remote" | "local" = "local") => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DONATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(DONATION_SETTINGS_SOURCE_STORAGE_KEY, source);
  } catch {
    // ignore storage availability issues
  }
};

export interface DonationSettings {
  id?: string;
  default_amount: number;
  minimum_amount: number;
  maximum_amount: number;
  suggested_amounts: number[];
  enable_suggested_amounts: boolean;
  enable_custom_amount: boolean;
  enable_razorpay: boolean;
  enable_quick_upi: boolean;
  card_title: string;
  card_subtitle: string;
  card_cta_text: string;
  hero_image_url: string;
  proof_video_url: string;
  payment_methods: string[];
  show_qr_code: boolean;
  show_payment_methods: boolean;
}

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  default_amount: 251,
  minimum_amount: 1,
  maximum_amount: 500000,
  suggested_amounts: [11, 21, 51, 101, 151, 251, 501, 1100, 2100, 5100],
  enable_suggested_amounts: true,
  enable_custom_amount: true,
  enable_razorpay: true,
  enable_quick_upi: true,
  card_title: "Make a Sacred Donation",
  card_subtitle: "Your offering helps sustain the temple, seva, and daily rituals.",
  card_cta_text: "Donate Now",
  hero_image_url: "",
  proof_video_url: "",
  payment_methods: ["UPI", "Card", "Wallet"],
  show_qr_code: true,
  show_payment_methods: true,
};

export function normalizeDonationSettings(input: Partial<DonationSettings> | null | undefined): DonationSettings {
  const values = input ?? {};
  const suggested = Array.isArray(values.suggested_amounts)
    ? values.suggested_amounts.filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    : DEFAULT_DONATION_SETTINGS.suggested_amounts;

  const defaultAmount = typeof values.default_amount === "number" && Number.isFinite(values.default_amount) && values.default_amount > 0
    ? values.default_amount
    : DEFAULT_DONATION_SETTINGS.default_amount;

  const minimumAmount = typeof values.minimum_amount === "number" && Number.isFinite(values.minimum_amount) && values.minimum_amount > 0
    ? values.minimum_amount
    : DEFAULT_DONATION_SETTINGS.minimum_amount;

  const maximumAmount = typeof values.maximum_amount === "number" && Number.isFinite(values.maximum_amount) && values.maximum_amount > 0
    ? values.maximum_amount
    : DEFAULT_DONATION_SETTINGS.maximum_amount;

  const proofVideoUrl = typeof values.proof_video_url === "string" && values.proof_video_url.trim()
    ? values.proof_video_url.trim()
    : DEFAULT_DONATION_SETTINGS.proof_video_url;

  const paymentMethods = Array.isArray(values.payment_methods)
    ? values.payment_methods.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim())
    : DEFAULT_DONATION_SETTINGS.payment_methods;

  return {
    id: values.id,
    default_amount: defaultAmount,
    minimum_amount: minimumAmount,
    maximum_amount: maximumAmount,
    suggested_amounts: suggested,
    enable_suggested_amounts: typeof values.enable_suggested_amounts === "boolean" ? values.enable_suggested_amounts : DEFAULT_DONATION_SETTINGS.enable_suggested_amounts,
    enable_custom_amount: typeof values.enable_custom_amount === "boolean" ? values.enable_custom_amount : DEFAULT_DONATION_SETTINGS.enable_custom_amount,
    enable_razorpay: typeof values.enable_razorpay === "boolean" ? values.enable_razorpay : DEFAULT_DONATION_SETTINGS.enable_razorpay,
    enable_quick_upi: typeof values.enable_quick_upi === "boolean" ? values.enable_quick_upi : DEFAULT_DONATION_SETTINGS.enable_quick_upi,
    card_title: typeof values.card_title === "string" && values.card_title.trim() ? values.card_title.trim() : DEFAULT_DONATION_SETTINGS.card_title,
    card_subtitle: typeof values.card_subtitle === "string" && values.card_subtitle.trim() ? values.card_subtitle.trim() : DEFAULT_DONATION_SETTINGS.card_subtitle,
    card_cta_text: typeof values.card_cta_text === "string" && values.card_cta_text.trim() ? values.card_cta_text.trim() : DEFAULT_DONATION_SETTINGS.card_cta_text,
    hero_image_url: typeof values.hero_image_url === "string" && values.hero_image_url.trim() ? values.hero_image_url.trim() : DEFAULT_DONATION_SETTINGS.hero_image_url,
    proof_video_url: proofVideoUrl,
    payment_methods: paymentMethods,
    show_qr_code: typeof values.show_qr_code === "boolean" ? values.show_qr_code : DEFAULT_DONATION_SETTINGS.show_qr_code,
    show_payment_methods: typeof values.show_payment_methods === "boolean" ? values.show_payment_methods : DEFAULT_DONATION_SETTINGS.show_payment_methods,
  };
}

const DONATION_SETTINGS_SELECT_COLUMNS = [
  "id",
  "default_amount",
  "minimum_amount",
  "maximum_amount",
  "suggested_amounts",
  "enable_suggested_amounts",
  "enable_custom_amount",
  "enable_razorpay",
  "enable_quick_upi",
  "card_title",
  "card_subtitle",
  "card_cta_text",
  "hero_image_url",
  "proof_video_url",
  "payment_methods",
  "show_qr_code",
  "show_payment_methods",
].join(", ");

const DONATION_SETTINGS_MINIMAL_COLUMNS = [
  "id",
  "default_amount",
  "minimum_amount",
  "maximum_amount",
  "suggested_amounts",
  "enable_suggested_amounts",
  "enable_custom_amount",
  "enable_razorpay",
  "enable_quick_upi",
  "card_title",
  "card_subtitle",
  "card_cta_text",
  "show_qr_code",
  "show_payment_methods",
  "proof_video_url",
].join(", ");

export async function fetchDonationSettings(): Promise<DonationSettings> {
  try {
    const firstAttempt = await supabaseAny
      .from("donation_settings")
      .select(DONATION_SETTINGS_SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: Partial<DonationSettings> | null; error: any };

    if (!firstAttempt.error) {
      const normalized = normalizeDonationSettings(firstAttempt.data as Partial<DonationSettings> | null);
      if (normalized) {
        writePersistedDonationSettings(normalized, "remote");
      }
      return normalized;
    }

    const missingTable = firstAttempt.error?.code === "42703" || firstAttempt.error?.status === 404 || String(firstAttempt.error?.message).toLowerCase().includes("not found");
    if (missingTable) {
      return DEFAULT_DONATION_SETTINGS;
    }

    const fallback = await supabaseAny
      .from("donation_settings")
      .select(DONATION_SETTINGS_MINIMAL_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: Partial<DonationSettings> | null; error: any };

    if (!fallback.error) {
      const normalized = normalizeDonationSettings(fallback.data as Partial<DonationSettings> | null);
      if (normalized) {
        writePersistedDonationSettings(normalized, "remote");
      }
      return normalized;
    }

    if (fallback.error?.code === "42703" || fallback.error?.status === 404 || String(fallback.error?.message).toLowerCase().includes("not found")) {
      return DEFAULT_DONATION_SETTINGS;
    }
  } catch (error) {
    // ignore missing table or runtime fetch issues and fall back to defaults
  }

  const persisted = readPersistedDonationSettings();
  if (persisted) {
    return normalizeDonationSettings(persisted);
  }

  return DEFAULT_DONATION_SETTINGS;
}

export async function saveDonationSettings(settings: DonationSettings): Promise<DonationSettings> {
  const normalized = normalizeDonationSettings(settings);
  const payload = {
    default_amount: normalized.default_amount,
    minimum_amount: normalized.minimum_amount,
    maximum_amount: normalized.maximum_amount,
    suggested_amounts: normalized.suggested_amounts,
    enable_suggested_amounts: normalized.enable_suggested_amounts,
    enable_custom_amount: normalized.enable_custom_amount,
    enable_razorpay: normalized.enable_razorpay,
    enable_quick_upi: normalized.enable_quick_upi,
    card_title: normalized.card_title,
    card_subtitle: normalized.card_subtitle,
    card_cta_text: normalized.card_cta_text,
    hero_image_url: normalized.hero_image_url,
    proof_video_url: normalized.proof_video_url,
    payment_methods: normalized.payment_methods,
    show_qr_code: normalized.show_qr_code,
    show_payment_methods: normalized.show_payment_methods,
  };

  const minimalPayload = {
    default_amount: normalized.default_amount,
    minimum_amount: normalized.minimum_amount,
    maximum_amount: normalized.maximum_amount,
    suggested_amounts: normalized.suggested_amounts,
    enable_suggested_amounts: normalized.enable_suggested_amounts,
    enable_custom_amount: normalized.enable_custom_amount,
    enable_razorpay: normalized.enable_razorpay,
    enable_quick_upi: normalized.enable_quick_upi,
    card_title: normalized.card_title,
    card_subtitle: normalized.card_subtitle,
    card_cta_text: normalized.card_cta_text,
    show_qr_code: normalized.show_qr_code,
    show_payment_methods: normalized.show_payment_methods,
    proof_video_url: normalized.proof_video_url,
  };

  try {
    const { data: existingRow, error: existingError } = await supabaseAny
      .from("donation_settings")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { id: string } | null; error: any };

    if (existingError) {
      throw existingError;
    }

    const performQuery = async (dataPayload: Record<string, any>) => {
      let query = supabaseAny.from("donation_settings");

      if (existingRow?.id) {
        query = query.update(dataPayload).eq("id", existingRow.id);
      } else {
        query = query.insert(dataPayload);
      }

      return query
        .select(DONATION_SETTINGS_SELECT_COLUMNS)
        .maybeSingle();
    };

    let response = await performQuery(payload) as { data: Partial<DonationSettings> | null; error: any };
    if (response.error?.code === "42703") {
      response = await performQuery(minimalPayload);
    }

    if (response.error) {
      throw response.error;
    }

    const saved = normalizeDonationSettings(response.data as Partial<DonationSettings> | null);
    writePersistedDonationSettings(saved, "remote");
    return saved;
  } catch (error) {
    writePersistedDonationSettings(normalized, "local");
    return normalized;
  }
}
