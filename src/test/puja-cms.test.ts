import { describe, expect, it } from "vitest";
import { getPujaCategoryLabel, getPujaImage, isPujaVisible, mergePujaCmsRelations, normalizePujaRecord } from "@/lib/pujaCms";

describe("puja CMS helpers", () => {
  it("normalizes database rows into a UI-friendly structure", () => {
    const row = {
      id: "puja-1",
      name: "Rudrabhishek",
      subtitle: "Sacred Shiva abhishekam",
      slug: "rudrabhishek",
      description: "A powerful Shiva ritual",
      long_description: "A complete ritual for prosperity and peace",
      category: "abhishekam",
      price: 5100,
      discount_price: 4500,
      duration_minutes: 90,
      estimated_completion: "2 hours",
      image_url: "https://cdn.example.com/banner.jpg",
      thumbnail_url: "https://cdn.example.com/thumb.jpg",
      banner_url: "https://cdn.example.com/banner-large.jpg",
      featured: true,
      popular: true,
      active: true,
      booking_enabled: true,
      donation_enabled: false,
      online_puja: true,
      offline_puja: true,
      home_puja: false,
      temple_puja: true,
      priority: 5,
      sort_order: 2,
      benefits: ["Peace", "Prosperity"],
    };

    const puja = normalizePujaRecord(row);

    expect(puja.name).toBe("Rudrabhishek");
    expect(puja.subtitle).toBe("Sacred Shiva abhishekam");
    expect(puja.slug).toBe("rudrabhishek");
    expect(puja.price).toBe(5100);
    expect(puja.discountPrice).toBe(4500);
    expect(puja.featured).toBe(true);
    expect(puja.bookingEnabled).toBe(true);
    expect(puja.sortOrder).toBe(2);
  });

  it("prefers media from the database before falling back to a local asset", () => {
    const puja = normalizePujaRecord({
      id: "puja-2",
      name: "Shiv Chalisa Path",
      image_url: "https://cdn.example.com/hero.jpg",
      thumbnail_url: "https://cdn.example.com/thumb.jpg",
      banner_url: "https://cdn.example.com/banner.jpg",
      category: "path",
    });

    expect(getPujaImage(puja, "https://fallback.example.com/fallback.jpg")).toBe("https://cdn.example.com/banner.jpg");
    expect(getPujaCategoryLabel("path")).toBe("Path");
  });

  it("loads the primary image from puja_media when available", () => {
    const puja = normalizePujaRecord({
      id: "puja-3",
      name: "Shiva Puja",
      puja_media: [
        {
          id: "media-1",
          url: "https://cdn.example.com/media-banner.jpg",
          role: "banner",
          media_type: "image",
          is_primary: true,
        },
      ],
    });

    expect(getPujaImage(puja, "https://fallback.example.com/fallback.jpg")).toBe("https://cdn.example.com/media-banner.jpg");
  });

  it("merges related CMS rows into the base puja record for public rendering", () => {
    const baseRow = { id: "puja-4", name: "Maha Mrityunjaya Jaap", category: "jaap" };
    const merged = mergePujaCmsRelations(baseRow, {
      puja_details: [{ subtitle: "Powerful healing mantra", slug: "maha-mrityunjaya-jaap", short_description: "A sacred jaap for protection and healing" }],
      puja_booking_settings: [{ price: 2500, duration_minutes: 45, booking_enabled: true }],
      puja_seo: [{ seo_title: "Maha Mrityunjaya Jaap", seo_keywords: "jaap, healing" }],
      puja_media: [{ role: "banner", url: "https://cdn.example.com/jaap-banner.jpg", is_primary: true }],
      puja_benefits: [{ benefit: "Healing" }, { benefit: "Protection" }],
    });

    const puja = normalizePujaRecord(merged as any);

    expect(puja.subtitle).toBe("Powerful healing mantra");
    expect(puja.price).toBe(2500);
    expect(puja.seoTitle).toBe("Maha Mrityunjaya Jaap");
    expect(puja.benefits).toEqual(["Healing", "Protection"]);
    expect(puja.imageUrl).toBe("https://cdn.example.com/jaap-banner.jpg");
  });

  it("loads optional additional charges from booking settings", () => {
    const puja = normalizePujaRecord({
      id: "puja-5",
      name: "Shiva Abhishek",
      puja_booking_settings: [{ price: 1500, additional_charges: [{ label: "Puja Samagri", amount: 500 }, { label: "Extra Aarti", amount: 300 }] }],
    } as any);

    expect(puja.additionalCharges).toEqual([
      { label: "Puja Samagri", amount: 500 },
      { label: "Extra Aarti", amount: 300 },
    ]);
  });

  it("treats legacy active flags as visible for public puja listings", () => {
    expect(isPujaVisible({ is_active: null, active: true })).toBe(true);
    expect(isPujaVisible({ is_active: false, active: true })).toBe(true);
    expect(isPujaVisible({ is_active: false, active: false })).toBe(false);
  });
});
