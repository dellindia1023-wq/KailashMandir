export interface RazorpayVerificationEvaluation {
  signatureMatches: boolean;
  paymentVerified: boolean;
  verificationPassed: boolean;
  failureReason?: "missing signature" | "signature mismatch" | "payment not verified by Razorpay";
}

export function evaluateRazorpayVerification({
  hasSignature,
  razorpaySignature,
  generatedSignature,
  paymentStatus,
  paymentOrderId,
  expectedOrderId,
}: {
  hasSignature: boolean;
  razorpaySignature?: unknown;
  generatedSignature?: string;
  paymentStatus?: string;
  paymentOrderId?: string;
  expectedOrderId?: string;
}): RazorpayVerificationEvaluation {
  const signatureMatches =
    hasSignature &&
    typeof generatedSignature === "string" &&
    generatedSignature.length > 0 &&
    typeof razorpaySignature === "string" &&
    generatedSignature === razorpaySignature;

  const orderMatches =
    typeof paymentOrderId === "string" &&
    typeof expectedOrderId === "string" &&
    paymentOrderId === expectedOrderId;

  const paymentVerified = paymentStatus === "captured" && orderMatches;
  const verificationPassed = hasSignature && signatureMatches && paymentVerified;

  let failureReason: RazorpayVerificationEvaluation["failureReason"];
  if (!hasSignature) {
    failureReason = "missing signature";
  } else if (!signatureMatches) {
    failureReason = "signature mismatch";
  } else if (!paymentVerified) {
    failureReason = "payment not verified by Razorpay";
  }

  return {
    signatureMatches,
    paymentVerified,
    verificationPassed,
    failureReason,
  };
}
