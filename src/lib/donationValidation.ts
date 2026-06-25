export const DEFAULT_DONATION_AMOUNT = 251;
export const DONATION_MIN_AMOUNT = 1;
export const DONATION_MAX_AMOUNT = 500000;

export const QUICK_DONATION_AMOUNTS = [11, 21, 51, 101, 151, 251, 501, 1100, 2100, 5100];

export interface DonationValidationOptions {
  minAmount?: number;
  maxAmount?: number;
}

export function getDonationValidationError(value: string, options: DonationValidationOptions = {}): string | null {
  const trimmed = value.trim();
  const minAmount = options.minAmount ?? DONATION_MIN_AMOUNT;
  const maxAmount = options.maxAmount ?? DONATION_MAX_AMOUNT;

  if (trimmed.length === 0) {
    return "Please enter a donation amount.";
  }

  if (!/^\d+$/.test(trimmed)) {
    return "Please enter a whole number amount in rupees.";
  }

  const amount = Number(trimmed);

  if (!Number.isInteger(amount)) {
    return "Please enter a whole number amount in rupees.";
  }

  if (amount < minAmount) {
    return `Minimum donation amount is ₹${minAmount.toLocaleString("en-IN")}.`;
  }

  if (amount > maxAmount) {
    return `Maximum donation amount is ₹${maxAmount.toLocaleString("en-IN")}.`;
  }

  return null;
}
