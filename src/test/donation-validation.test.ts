import { describe, it, expect } from "vitest";
import {
  DEFAULT_DONATION_AMOUNT,
  DONATION_MIN_AMOUNT,
  DONATION_MAX_AMOUNT,
  getDonationValidationError,
} from "@/lib/donationValidation";

describe("donation validation", () => {
  it("uses 251 as the default amount", () => {
    expect(DEFAULT_DONATION_AMOUNT).toBe(251);
  });

  it("accepts whole numbers within the allowed range", () => {
    expect(getDonationValidationError("1")).toBeNull();
    expect(getDonationValidationError("251")).toBeNull();
    expect(getDonationValidationError("500000")).toBeNull();
  });

  it("rejects values below the minimum and above the maximum", () => {
    expect(getDonationValidationError("0")).toBe("Minimum donation amount is ₹1.");
    expect(getDonationValidationError("500001")).toBe("Maximum donation amount is ₹5,00,000.");
  });

  it("rejects decimals and non-numeric input", () => {
    expect(getDonationValidationError("10.5")).toBe("Please enter a whole number amount in rupees.");
    expect(getDonationValidationError("abc")).toBe("Please enter a whole number amount in rupees.");
  });

  it("uses custom minimum and maximum values when provided", () => {
    expect(getDonationValidationError("5", { minAmount: 10 })).toBe("Minimum donation amount is ₹10.");
    expect(getDonationValidationError("1001", { maxAmount: 1000 })).toBe("Maximum donation amount is ₹1,000.");
    expect(getDonationValidationError("500", { minAmount: 100, maxAmount: 1000 })).toBeNull();
  });
});
