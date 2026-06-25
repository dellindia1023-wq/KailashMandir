import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TIERS = ["seva", "bhakt", "premium", "divine", "custom"];
const MAX_AMOUNT = 500000;

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
    const supabaseKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
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

    const { amount, tier } = body as any;

    let parsedAmount: number | null = null;
    if (typeof amount === "number" && Number.isFinite(amount)) {
      parsedAmount = amount;
    } else if (typeof amount === "string" && /^\d+$/.test(amount.trim())) {
      parsedAmount = Number(amount);
    }

    if (parsedAmount === null || !Number.isInteger(parsedAmount) || parsedAmount < 1 || parsedAmount > MAX_AMOUNT) {
      return new Response(JSON.stringify({ error: `Invalid donation amount. Must be a whole number between 1 and ${MAX_AMOUNT.toLocaleString("en-IN")}` }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate tier
    const safeTier = typeof tier === "string" && VALID_TIERS.includes(tier.toLowerCase()) ? tier.toLowerCase() : "seva";

    const razorpayKeyId = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId) {
      return new Response(JSON.stringify({ error: "Missing environment variable: RAZORPAY_KEY_ID" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Missing environment variable: RAZORPAY_KEY_SECRET" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encode(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(parsedAmount * 100),
        currency: "INR",
        receipt: `donation_${Date.now()}`,
        notes: {
          user_id: user.id,
          tier: safeTier,
          type: "donation",
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const razorpayOrder = await razorpayResponse.json();

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        user_id: user.id,
        amount: parsedAmount,
        tier: safeTier,
        status: "pending",
        payment_method: "razorpay",
        transaction_id: razorpayOrder.id,
      })
      .select()
      .single();

    if (donationError) {
      console.error("Donation creation error:", donationError);
      return new Response(JSON.stringify({ error: "Failed to create donation record" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        donationId: donation.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error creating donation order:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
