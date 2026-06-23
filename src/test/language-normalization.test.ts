import { describe, it, expect } from "vitest";
import { normalizeLanguage } from "../../supabase/functions/shared/language";

describe("normalizeLanguage", () => {
  it("returns hi for Hindi language codes", () => {
    expect(normalizeLanguage("hi")).toBe("hi");
    expect(normalizeLanguage("HI")).toBe("hi");
    expect(normalizeLanguage("hi_IN")).toBe("hi");
    expect(normalizeLanguage("hi-IN")).toBe("hi");
  });

  it("returns en for English and unknown codes", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("en_US")).toBe("en");
    expect(normalizeLanguage("fr_FR")).toBe("en");
    expect(normalizeLanguage("")).toBe("en");
  });

  it("falls back to locale when language is missing", () => {
    expect(normalizeLanguage(undefined, "hi_IN")).toBe("hi");
    expect(normalizeLanguage(undefined, "en_US")).toBe("en");
  });
});
