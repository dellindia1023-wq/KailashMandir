import { describe, expect, it } from "vitest";
import { normalizeRitualItems } from "../lib/aboutPageContent";

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
