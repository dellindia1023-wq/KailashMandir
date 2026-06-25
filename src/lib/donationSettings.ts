import { supabase } from "@/integrations/supabase/client";

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
  };
}

export async function fetchDonationSettings(): Promise<DonationSettings> {
  const { data, error } = await supabase
    .from("donation_settings")
    .select("id, default_amount, minimum_amount, maximum_amount, suggested_amounts, enable_suggested_amounts, enable_custom_amount, enable_razorpay, enable_quick_upi")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load donation settings", error);
    return DEFAULT_DONATION_SETTINGS;
  }

  return normalizeDonationSettings(data as Partial<DonationSettings> | null);
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
  };

  const { data: existingRow, error: existingError } = await supabase
    .from("donation_settings")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let query = supabase.from("donation_settings");

  if (existingRow?.id) {
    query = query.update(payload).eq("id", existingRow.id);
  } else {
    query = query.insert(payload);
  }

  const { data, error } = await query
    .select("id, default_amount, minimum_amount, maximum_amount, suggested_amounts, enable_suggested_amounts, enable_custom_amount, enable_razorpay, enable_quick_upi")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeDonationSettings(data as Partial<DonationSettings> | null);
}
