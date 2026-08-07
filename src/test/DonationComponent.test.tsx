import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Donation from "@/components/Donation";

const { mockInvoke, mockFetchDonationSettings } = vi.hoisted(() => {
  const mockInvoke = vi.fn(async (name: string) => {
    if (name === "create-donation-order") {
      return {
        data: {
          keyId: "rzp_test_key",
          amount: 10100,
          currency: "INR",
          orderId: "order_test",
          donationId: "donation_test",
        },
        error: null,
      };
    }

    if (name === "verify-donation-payment") {
      return { data: { success: true }, error: null };
    }

    return { data: null, error: null };
  });

  const mockFetchDonationSettings = vi.fn(async () => ({
    ...{
      default_amount: 101,
      minimum_amount: 1,
      maximum_amount: 500000,
      suggested_amounts: [11, 21, 51],
      enable_suggested_amounts: true,
      enable_custom_amount: true,
      enable_razorpay: true,
      enable_quick_upi: true,
      card_title: "Temple Donation",
      card_subtitle: "Support our daily rituals.",
      card_cta_text: "Give Now",
      hero_image_url: "https://example.com/temple.jpg",
      proof_video_url: "https://example.com/proof.mp4",
      payment_methods: ["UPI", "Card", "Bank Transfer"],
      show_qr_code: true,
      show_payment_methods: true,
    },
  }));

  return { mockInvoke, mockFetchDonationSettings };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user", email: "test@example.com" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/donationSettings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/donationSettings")>("@/lib/donationSettings");
  return {
    ...actual,
    fetchDonationSettings: mockFetchDonationSettings,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Donation component", () => {
  beforeEach(() => {
    mockFetchDonationSettings.mockClear();
    mockInvoke.mockClear();
    (window as any).Razorpay = vi.fn().mockImplementation((options: any) => ({
      open: vi.fn(() => {
        options.handler({
          razorpay_order_id: "order_test",
          razorpay_payment_id: "payment_test",
          razorpay_signature: "signature_test",
        });
      }),
    }));
  });

  it("renders the donation card with settings and quick amounts", async () => {
    render(
      <MemoryRouter>
        <Donation />
      </MemoryRouter>
    );

    expect(await screen.findByText("Temple Donation")).toBeInTheDocument();
    expect(screen.getByText("Support our daily rituals.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Give Now/i })).toBeInTheDocument();
    expect(screen.getByText("₹101")).toBeInTheDocument();
    expect(screen.getByText(/Scan & Donate via UPI/i)).toBeInTheDocument();
    expect(screen.getByText(/Proof Video/i)).toBeInTheDocument();
  });

  it("initiates donation flow when the donate button is clicked", async () => {
    render(
      <MemoryRouter>
        <Donation />
      </MemoryRouter>
    );

    expect(await screen.findByText("Temple Donation")).toBeInTheDocument();

    const donateButton = screen.getByRole("button", { name: /Give Now/i });
    fireEvent.click(donateButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("create-donation-order", {
        body: { amount: 101, tier: "custom" },
      });
    });
  });
});

/*
 * Earlier duplicate test block removed to prevent the parser from entering
 * an unterminated comment state.
 */

