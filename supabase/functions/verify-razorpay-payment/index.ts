import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
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

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body as any;

    // Evidence logging (DO NOT log secrets)
    console.log("[verify-razorpay-payment] start", {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      hasRazorpaySignature: typeof razorpaySignature === "string",
      userId: user?.id,
    });

    // Validate bookingId
    if (typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
      console.error("[verify-razorpay-payment] invalid bookingId", { bookingId });
      return new Response(JSON.stringify({ error: "Invalid booking ID", bookingId }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate Razorpay IDs
    if (typeof razorpayOrderId !== "string" || !RAZORPAY_ID_REGEX.test(razorpayOrderId)) {
      console.error("[verify-razorpay-payment] invalid razorpayOrderId", { razorpayOrderId });
      return new Response(JSON.stringify({ error: "Invalid order ID", razorpayOrderId }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (typeof razorpayPaymentId !== "string" || !RAZORPAY_ID_REGEX.test(razorpayPaymentId)) {
      console.error("[verify-razorpay-payment] invalid razorpayPaymentId", { razorpayPaymentId });
      return new Response(JSON.stringify({ error: "Invalid payment ID", razorpayPaymentId }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (typeof razorpaySignature !== "string" || !SIGNATURE_REGEX.test(razorpaySignature)) {
      console.error("[verify-razorpay-payment] invalid razorpaySignature format", { razorpaySignatureLength: typeof razorpaySignature === "string" ? razorpaySignature.length : null });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      console.error("[verify-razorpay-payment] missing RAZORPAY_KEY_SECRET");
      return new Response(JSON.stringify({ error: "Payment credentials not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const generatedSignature = await createHmacSignature(razorpayKeySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
    console.log("[verify-razorpay-payment] signature validation", {
      bookingId,
      userId: user?.id,
      generatedSignatureMatches: generatedSignature === razorpaySignature,
    });

    if (generatedSignature !== razorpaySignature) {
      console.error("[verify-razorpay-payment] Signature mismatch", { bookingId, userId: user?.id });

      await supabase
        .from("puja_bookings")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ error: "Payment signature mismatch" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Optional: check booking row exists for requested filters
    try {
      const { data: bookingProbe, error: bookingProbeError } = await supabase
        .from("puja_bookings")
        .select("id, user_id, payment_status")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[verify-razorpay-payment] booking probe", {
        bookingId,
        userId: user?.id,
        found: !!bookingProbe,
        probeError: bookingProbeError,
        payment_status: (bookingProbe as any)?.payment_status,
      });
    } catch (probeErr) {
      console.error("[verify-razorpay-payment] booking probe threw", probeErr);
    }

    const { data: booking, error: updateError } = await supabase
      .from("puja_bookings")
      .update({
        payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("[verify-razorpay-payment] Update error", {
        bookingId,
        userId: user?.id,
        updateError,
      });

      return new Response(JSON.stringify({
        error: "Failed to update booking",
        details: updateError,
        bookingId,
        userId: user?.id,
      }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[verify-razorpay-payment] booking marked paid", {
      bookingId,
      userId: user?.id,
      updatedPaymentStatus: "paid",
    });

    // Send confirmation email
    let emailStatus: { ok: boolean; status?: number; errorText?: string } | null = null;
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          bookingId: bookingId,
          type: "confirmation",
        }),
      });

      if (emailResponse.ok) {
        emailStatus = { ok: true, status: emailResponse.status };
        console.log("[verify-razorpay-payment] Confirmation email sent");
      } else {
        const errText = await emailResponse.text();
        emailStatus = { ok: false, status: emailResponse.status, errorText: errText };
        console.error("[verify-razorpay-payment] Failed to send confirmation email:", errText);
      }
    } catch (emailError) {
      console.error("[verify-razorpay-payment] Email error:", emailError);
      emailStatus = { ok: false, errorText: String(emailError) };
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        message: "Payment verified successfully",
        email: emailStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
