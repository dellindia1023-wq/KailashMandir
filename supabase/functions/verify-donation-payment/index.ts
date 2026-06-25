import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    }

    const razorpayKeyId = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Payment credentials not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const generatedSignature = hasSignature ? await createHmacSignature(
      razorpayKeySecret,
      `${razorpayOrderId}|${razorpayPaymentId}`
    ) : "";
    const razorpayPayment = await verifyPaymentWithRazorpay(razorpayKeyId, razorpayKeySecret, razorpayOrderId, razorpayPaymentId);
    const signatureMatches = hasSignature && generatedSignature === razorpaySignature;

    if (!signatureMatches && !razorpayPayment.verified) {
      console.error("[verify-donation-payment] Signature mismatch and Razorpay payment not captured", { donationId, userId: user.id });
      await supabase
        .from("donations")
        .update({ status: "failed" })
        .eq("id", donationId)
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ error: "Payment verification failed" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: donation, error: updateError } = await supabase
      .from("donations")
      .update({
        status: "completed",
        transaction_id: razorpayPaymentId,
      })
      .eq("id", donationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update donation" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        donationId: donation.id,
        message: "Donation verified successfully",
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
