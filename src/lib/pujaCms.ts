export interface PujaCategoryRecord {
  id: string;
  name: string;
  slug: string;
}

export interface PujaDetailsRecord {
  subtitle?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  long_description?: string | null;
  icon_url?: string | null;
}

export interface PujaBookingSettingsRecord {
  price?: number | null;
  discount_price?: number | null;
  duration_minutes?: number | null;
  estimated_completion?: string | null;
  booking_enabled?: boolean | null;
  donation_enabled?: boolean | null;
  online_puja?: boolean | null;
  offline_puja?: boolean | null;
  home_puja?: boolean | null;
  temple_puja?: boolean | null;
  featured?: boolean | null;
  popular?: boolean | null;
  trending?: boolean | null;
  recommended?: boolean | null;
  priority?: number | null;
  sort_order?: number | null;
  additional_charges?: Array<{ label?: string | null; amount?: number | null }> | null;
}

export interface PujaSeoRecord {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface PujaMediaRecord {
  media_type?: string | null;
  role?: string | null;
  url?: string | null;
  alt_text?: string | null;
  is_primary?: boolean | null;
}

export interface PujaBenefitRecord {
  benefit?: string | null;
}

export interface PujaCmsRecord {
  id: string;
  name: string;
  subtitle?: string | null;
  slug?: string | null;
  description?: string | null;
  long_description?: string | null;
  category?: string | null;
  category_id?: string | null;
  short_description?: string | null;
  price?: number | null;
  discount_price?: number | null;
  duration_minutes?: number | null;
  estimated_completion?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  mobile_banner_url?: string | null;
  desktop_banner_url?: string | null;
  icon_url?: string | null;
  featured?: boolean | null;
  popular?: boolean | null;
  trending?: boolean | null;
  recommended?: boolean | null;
  is_active?: boolean | null;
  active?: boolean | null;
  booking_enabled?: boolean | null;
  donation_enabled?: boolean | null;
  online_puja?: boolean | null;
  offline_puja?: boolean | null;
  home_puja?: boolean | null;
  temple_puja?: boolean | null;
  priority?: number | null;
  sort_order?: number | null;
  benefits?: string[] | null;
  puja_categories?: PujaCategoryRecord | null;
  puja_details?: PujaDetailsRecord | PujaDetailsRecord[] | null;
  puja_booking_settings?: PujaBookingSettingsRecord | PujaBookingSettingsRecord[] | null;
  puja_seo?: PujaSeoRecord | PujaSeoRecord[] | null;
  puja_media?: PujaMediaRecord[] | null;
  puja_benefits?: PujaBenefitRecord[] | null;
  [key: string]: unknown;
}

export interface NormalizedPuja {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  categoryId: string | null;
  shortDescription: string;
  price: number;
  discountPrice: number;
  durationMinutes: number;
  estimatedCompletion: string;
  imageUrl: string;
  thumbnailUrl: string;
  bannerUrl: string;
  iconUrl: string;
  mobileBannerUrl: string;
  desktopBannerUrl: string;
  featured: boolean;
  popular: boolean;
  trending: boolean;
  recommended: boolean;
  active: boolean;
  bookingEnabled: boolean;
  donationEnabled: boolean;
  onlinePuja: boolean;
  offlinePuja: boolean;
  homePuja: boolean;
  templePuja: boolean;
  priority: number;
  sortOrder: number;
  benefits: string[];
  additionalCharges: Array<{ label: string; amount: number }>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getDetailObject = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const getAnyMediaUrl = (row: PujaCmsRecord, fallback = "") => {
  const media = Array.isArray(row.puja_media) ? row.puja_media : [];
  const primary = media.find((item) => item?.is_primary && item?.url);
  if (primary?.url) return primary.url;
  const first = media.find((item) => item?.url);
  return first?.url || fallback;
};

const getMediaUrl = (row: PujaCmsRecord, roles: string[], fallback = "") => {
  const media = Array.isArray(row.puja_media) ? row.puja_media : [];
  for (const role of roles) {
    const entry = media.find((item) => item.role === role && item.url);
    if (entry?.url) return entry.url;
  }
  return getAnyMediaUrl(row, fallback);
};

const getMediaUrlByRole = (row: PujaCmsRecord, role: string) => {
  const media = Array.isArray(row.puja_media) ? row.puja_media : [];
  return media.find((item) => item.role === role && item.url)?.url || getAnyMediaUrl(row, "");
};

export const mergePujaCmsRelations = (
  row: PujaCmsRecord,
  relations: Partial<Pick<PujaCmsRecord, "puja_details" | "puja_booking_settings" | "puja_seo" | "puja_media" | "puja_benefits">> = {}
): PujaCmsRecord => {
  const merged = { ...row } as PujaCmsRecord;

  if (!merged.puja_details && relations.puja_details) {
    merged.puja_details = relations.puja_details;
  }
  if (!merged.puja_booking_settings && relations.puja_booking_settings) {
    merged.puja_booking_settings = relations.puja_booking_settings;
  }
  if (!merged.puja_seo && relations.puja_seo) {
    merged.puja_seo = relations.puja_seo;
  }
  if (!merged.puja_media && relations.puja_media) {
    merged.puja_media = relations.puja_media;
  }
  if (!merged.puja_benefits && relations.puja_benefits) {
    merged.puja_benefits = relations.puja_benefits;
  }

  return merged;
};

export const isPujaVisible = (row: Pick<PujaCmsRecord, "is_active" | "active">) => {
  const explicitActive = row.is_active;
  const legacyActive = row.active;

  if (typeof explicitActive === "boolean" && typeof legacyActive === "boolean") {
    return explicitActive || legacyActive;
  }

  if (typeof explicitActive === "boolean") {
    return explicitActive || legacyActive !== false;
  }

  if (typeof legacyActive === "boolean") {
    return legacyActive || explicitActive !== false;
  }

  return true;
};

export const normalizePujaRecord = (row: PujaCmsRecord): NormalizedPuja => {
  const details = getDetailObject(row.puja_details);
  const settings = getDetailObject(row.puja_booking_settings);
  const seo = getDetailObject(row.puja_seo);

  const name = row.name || "Untitled Puja";
  const slug = details?.slug || row.slug || normalizeSlug(name);
  const categoryLabel = row.puja_categories?.name || row.category || "general";

  const imageUrl =
    getMediaUrl(row, ["banner", "image", "thumbnail"]) || row.image_url || row.banner_url || row.thumbnail_url || "";
  const thumbnailUrl =
    getMediaUrlByRole(row, "thumbnail") || row.thumbnail_url || row.image_url || "";
  const bannerUrl =
    getMediaUrlByRole(row, "banner") || row.banner_url || row.image_url || row.thumbnail_url || "";

  return {
    id: row.id,
    name,
    subtitle: details?.subtitle || row.subtitle || "",
    slug,
    description: details?.description || row.description || row.short_description || "",
    longDescription: details?.long_description || row.long_description || row.description || "",
    category: categoryLabel,
    categoryId: row.category_id || null,
    shortDescription: details?.short_description || row.short_description || row.description || "",
    price: Number(settings?.price ?? row.price ?? 0),
    discountPrice: Number(settings?.discount_price ?? row.discount_price ?? row.price ?? 0),
    durationMinutes: Number(settings?.duration_minutes ?? row.duration_minutes ?? 60),
    estimatedCompletion:
      settings?.estimated_completion || row.estimated_completion || `${Number(settings?.duration_minutes ?? row.duration_minutes ?? 60)} mins`,
    imageUrl,
    thumbnailUrl,
    bannerUrl,
    iconUrl: details?.icon_url || row.icon_url || "",
    mobileBannerUrl: getMediaUrlByRole(row, "mobile_banner") || row.mobile_banner_url || "",
    desktopBannerUrl: getMediaUrlByRole(row, "desktop_banner") || row.desktop_banner_url || "",
    featured: Boolean(settings?.featured ?? row.featured),
    popular: Boolean(settings?.popular ?? row.popular),
    trending: Boolean(settings?.trending ?? row.trending),
    recommended: Boolean(settings?.recommended ?? row.recommended),
    active: isPujaVisible(row),
    bookingEnabled: settings?.booking_enabled ?? row.booking_enabled ?? true,
    donationEnabled: settings?.donation_enabled ?? row.donation_enabled ?? true,
    onlinePuja: settings?.online_puja ?? row.online_puja ?? true,
    offlinePuja: settings?.offline_puja ?? row.offline_puja ?? true,
    homePuja: settings?.home_puja ?? row.home_puja ?? false,
    templePuja: settings?.temple_puja ?? row.temple_puja ?? true,
    priority: Number(settings?.priority ?? row.priority ?? 0),
    sortOrder: Number(settings?.sort_order ?? row.sort_order ?? 0),
    benefits: Array.isArray(row.puja_benefits)
      ? row.puja_benefits.map((item) => item?.benefit).filter(Boolean) as string[]
      : Array.isArray(row.benefits)
      ? row.benefits.filter(Boolean)
      : [],
    additionalCharges: Array.isArray(settings?.additional_charges)
      ? (settings!.additional_charges as Array<{ label?: string | null; amount?: number | null }>).map((item) => ({
          label: item?.label || "Additional charge",
          amount: Number(item?.amount ?? 0),
        }))
      : Array.isArray(row.additional_charges)
      ? (row.additional_charges as Array<{ label?: string | null; amount?: number | null }>).map((item) => ({
          label: item?.label || "Additional charge",
          amount: Number(item?.amount ?? 0),
        }))
      : [],
    seoTitle: seo?.seo_title || "",
    seoDescription: seo?.seo_description || "",
    seoKeywords: seo?.seo_keywords || "",
  };
};

export const getPujaCategoryLabel = (category: string | null | undefined) => {
  const map: Record<string, string> = {
    abhishekam: "Abhishekam",
    jaap: "Jaap",
    path: "Path",
    puja: "Puja",
    special: "Special",
    sponsorship: "Sponsorship",
  };

  return map[category?.toLowerCase() || ""] || category || "General";
};

export const getPujaImage = (puja: Partial<NormalizedPuja>, fallback = "") => {
  return puja.bannerUrl || puja.imageUrl || puja.thumbnailUrl || fallback;
};
