import { describe, expect, it } from "vitest";
import { getVisibleAboutEntries, normalizeRitualItems } from "../lib/aboutPageContent";

describe("normalizeRitualItems", () => {
  it("keeps the data shape safe for render even when the Supabase payload uses title/description fields", () => {
    const items = normalizeRitualItems([
      { title: "Daily Aarti", description: "Morning and evening aarti timings." },
    ]);

    expect(items[0]).toMatchObject({
      name: "Daily Aarti",
      desc: "Morning and evening aarti timings.",
      special: false,
    });
  });
});

describe("getVisibleAboutEntries", () => {
  it("returns an empty list when no entries have been saved yet", () => {
    expect(getVisibleAboutEntries(undefined)).toEqual([]);
    expect(getVisibleAboutEntries([])).toEqual([]);
  });

  it("returns saved entries as-is when present", () => {
    const items = [{ name: "Shri Giri Ji", role: "Chairman" }];
    expect(getVisibleAboutEntries(items)).toEqual(items);
  });
});
