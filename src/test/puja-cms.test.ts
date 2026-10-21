import { describe, expect, it } from "vitest";
import { getPujaCategoryLabel, getPujaImage, isPujaVisible, normalizePujaRecord } from "@/lib/pujaCms";

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

  it("treats legacy active flags as visible for public puja listings", () => {
    expect(isPujaVisible({ is_active: null, active: true })).toBe(true);
    expect(isPujaVisible({ is_active: false, active: true })).toBe(true);
    expect(isPujaVisible({ is_active: false, active: false })).toBe(false);
  });

  it("parses and normalizes optional and included puja samagri", () => {
    const row = {
      id: "puja-3",
      name: "Maha Rudrabhishek",
      price: 2100,
      puja_booking_settings: {
        price: 2500,
        additional_charges: [
          { name: "Special Belpatra", price: 200, is_included: false, description: "108 fresh bilva leaves" },
          { name: "Gangajal & Panchamrit", price: 0, is_included: true, description: "Holy water and 5 sacred nectars" },
          { label: "Silver Bilva Patra", amount: 500 },
        ],
      },
    };

    const puja = normalizePujaRecord(row);

    expect(puja.price).toBe(2500);
    expect(puja.additionalCharges).toHaveLength(3);
    expect(puja.additionalCharges[0]).toMatchObject({
      id: "samagri-0",
      name: "Special Belpatra",
      label: "Special Belpatra",
      price: 200,
      amount: 200,
      isIncluded: false,
      included: false,
      description: "108 fresh bilva leaves",
    });
    expect(puja.additionalCharges[1]).toMatchObject({
      id: "samagri-1",
      name: "Gangajal & Panchamrit",
      price: 0,
      isIncluded: true,
      description: "Holy water and 5 sacred nectars",
    });
    expect(puja.additionalCharges[2]).toMatchObject({
      id: "samagri-2",
      name: "Silver Bilva Patra",
      price: 500,
      isIncluded: false,
    });
  });
});
