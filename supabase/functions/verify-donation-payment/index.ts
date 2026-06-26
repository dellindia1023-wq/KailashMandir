import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { evaluateRazorpayVerification } from "../shared/razorpay-verification.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RAZORPAY_ID_REGEX = /^[a-zA-Z0-9_]{10,40}$/;
const SIGNATURE_REGEX = /^[a-f0-9]{64}$/;

async function createHmacSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPaymentWithRazorpay(
  keyId: string,
  keySecret: string,
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<{ verified: boolean; status?: string; orderId?: string; error?: string }> {
  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encode(`${keyId}:${keySecret}`)}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[verify-donation-payment] Razorpay payment lookup failed", {
        razorpayPaymentId,
        status: response.status,
        errorText,
      });
      return { verified: false, error: errorText };
    }

    const payment = await response.json();
    return {
      verified: payment?.status === "captured" && payment?.order_id === razorpayOrderId,
      status: payment?.status,
      orderId: payment?.order_id,
    };
  } catch (error: any) {
    console.error("[verify-donation-payment] Razorpay payment lookup threw", error);
    return { verified: false, error: String(error) };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseClient = createClient(supabaseUrl, (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { donationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body as any;

    console.log("[verify-donation-payment] request received", {
      donationId,
      razorpayOrderId,
      razorpayPaymentId,
      hasSignature: typeof razorpaySignature === "string" && razorpaySignature.trim().length > 0,
      userId: user.id,
    });

    // Validate donationId
    if (typeof donationId !== "string" || !UUID_REGEX.test(donationId)) {
      return new Response(JSON.stringify({ error: "Invalid donation ID" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate Razorpay IDs
    if (typeof razorpayOrderId !== "string" || !RAZORPAY_ID_REGEX.test(razorpayOrderId)) {
      return new Response(JSON.stringify({ error: "Invalid order ID" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (typeof razorpayPaymentId !== "string" || !RAZORPAY_ID_REGEX.test(razorpayPaymentId)) {
      return new Response(JSON.stringify({ error: "Invalid payment ID" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const hasSignature = typeof razorpaySignature === "string" && razorpaySignature.trim().length > 0;
    if (hasSignature && !SIGNATURE_REGEX.test(razorpaySignature)) {
      console.error("[verify-donation-payment] invalid razorpaySignature format", { razorpaySignatureLength: razorpaySignature.length });
      return new Response(JSON.stringify({ error: "Invalid razorpay signature" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const razorpayKeyId = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");
    console.log("[verify-donation-payment] Razorpay credentials status", {
      donationId,
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
    });

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Payment credentials not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const generatedSignature = hasSignature ? await createHmacSignature(
      razorpayKeySecret,
      `${razorpayOrderId}|${razorpayPaymentId}`
    ) : "";

    console.log("[verify-donation-payment] signature check", {
      donationId,
      signaturePresent: hasSignature,
      signatureFormatValid: hasSignature ? SIGNATURE_REGEX.test(razorpaySignature) : false,
      signatureLength: hasSignature ? razorpaySignature.length : 0,
    });

    const razorpayPayment = await verifyPaymentWithRazorpay(razorpayKeyId, razorpayKeySecret, razorpayOrderId, razorpayPaymentId);
    const verification = evaluateRazorpayVerification({
      hasSignature,
      razorpaySignature,
      generatedSignature,
      paymentStatus: razorpayPayment.status,
      paymentOrderId: razorpayPayment.orderId,
      expectedOrderId: razorpayOrderId,
    });

    console.log("[verify-donation-payment] payment lookup result", {
      donationId,
      userId: user.id,
      signaturePresent: hasSignature,
      signatureMatches: verification.signatureMatches,
      paymentVerified: verification.paymentVerified,
      verificationPassed: verification.verificationPassed,
      razorpayStatus: razorpayPayment.status,
      razorpayOrderId: razorpayPayment.orderId,
      razorpayError: razorpayPayment.error,
    });

    if (!verification.verificationPassed) {
      const failureReason = verification.failureReason ?? "payment not verified by Razorpay";

      console.error("[verify-donation-payment] verification failed", {
        donationId,
        userId: user.id,
        failureReason,
        razorpayStatus: razorpayPayment.status,
        razorpayOrderId: razorpayPayment.orderId,
        error: razorpayPayment.error,
      });
      const { data: failResult, error: failError } = await supabase.rpc("fail_donation_payment", {
        p_donation_id: donationId,
        p_user_id: user.id,
      });

      if (failError || failResult !== true) {
        console.error("[verify-donation-payment] RPC failure update error", { failError, failResult });
      }

      return new Response(JSON.stringify({ error: "Payment verification failed" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[verify-donation-payment] updating donation record", {
      donationId,
      userId: user.id,
      paymentId: razorpayPaymentId,
      status: "completed",
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc("complete_donation_payment", {
      p_donation_id: donationId,
      p_user_id: user.id,
      p_payment_id: razorpayPaymentId,
    });

    if (rpcError || rpcResult !== true) {
      console.error("[verify-donation-payment] RPC update error", { rpcError, rpcResult });
      return new Response(JSON.stringify({ error: "Failed to update donation" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[verify-donation-payment] database update complete", {
      donationId,
      userId: user.id,
      paymentId: razorpayPaymentId,
      status: "completed",
    });

    console.log("[verify-donation-payment] response sent", {
      donationId: donation.id,
      success: true,
      message: "Payment verified successfully",
    });

    return new Response(
      JSON.stringify({
        success: true,
        donationId: donation.id,
        message: "Payment verified successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error verifying donation:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
