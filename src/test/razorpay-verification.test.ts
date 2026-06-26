import { describe, expect, it } from "vitest";
import { evaluateRazorpayVerification } from "../../supabase/functions/shared/razorpay-verification";

describe("evaluateRazorpayVerification", () => {
  it("passes only when signature, status, and order ID all match", () => {
    const result = evaluateRazorpayVerification({
      hasSignature: true,
      razorpaySignature: "a".repeat(64),
      generatedSignature: "a".repeat(64),
      paymentStatus: "captured",
      paymentOrderId: "order_123",
      expectedOrderId: "order_123",
    });

    expect(result.verificationPassed).toBe(true);
    expect(result.signatureMatches).toBe(true);
    expect(result.paymentVerified).toBe(true);
  });

  it("rejects missing signatures", () => {
    const result = evaluateRazorpayVerification({
      hasSignature: false,
      paymentStatus: "captured",
      paymentOrderId: "order_123",
      expectedOrderId: "order_123",
    });

    expect(result.verificationPassed).toBe(false);
    expect(result.failureReason).toBe("missing signature");
  });

  it("rejects mismatched signatures or non-captured payments", () => {
    const signatureMismatch = evaluateRazorpayVerification({
      hasSignature: true,
      razorpaySignature: "b".repeat(64),
      generatedSignature: "a".repeat(64),
      paymentStatus: "captured",
      paymentOrderId: "order_123",
      expectedOrderId: "order_123",
    });

    const pendingPayment = evaluateRazorpayVerification({
      hasSignature: true,
      razorpaySignature: "a".repeat(64),
      generatedSignature: "a".repeat(64),
      paymentStatus: "pending",
      paymentOrderId: "order_123",
      expectedOrderId: "order_123",
    });

    expect(signatureMismatch.verificationPassed).toBe(false);
    expect(signatureMismatch.failureReason).toBe("signature mismatch");
    expect(pendingPayment.verificationPassed).toBe(false);
    expect(pendingPayment.failureReason).toBe("payment not verified by Razorpay");
  });
});
