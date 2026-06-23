import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const MAX_AMOUNT = 10000000;

console.log("🚀 create-razorpay-order function starting...");

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

    const { pujaId, amount, bookingDate, bookingTime, devoteeName, devoteeGotra, specialInstructions } = body as any;

    // Validate pujaId
    if (typeof pujaId !== "string" || !UUID_REGEX.test(pujaId)) {
      return new Response(JSON.stringify({ error: "Invalid puja ID" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate amount
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate bookingDate
    if (typeof bookingDate !== "string" || !DATE_REGEX.test(bookingDate)) {
      return new Response(JSON.stringify({ error: "Invalid booking date format (YYYY-MM-DD)" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate bookingTime
    if (typeof bookingTime !== "string" || !TIME_REGEX.test(bookingTime)) {
      return new Response(JSON.stringify({ error: "Invalid booking time format (HH:MM)" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate devoteeName
    if (typeof devoteeName !== "string" || devoteeName.trim().length < 2 || devoteeName.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Devotee name must be 2-100 characters" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitize optional fields
    const safeGotra = typeof devoteeGotra === "string" ? devoteeGotra.trim().slice(0, 50) || null : null;
    const safeInstructions = typeof specialInstructions === "string" ? specialInstructions.trim().slice(0, 500) || null : null;
    const safeName = devoteeName.trim().slice(0, 100);

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
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `puja_${Date.now()}`,
        notes: {
          puja_id: pujaId,
          user_id: user.id,
          devotee_name: safeName,
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

    const { data: booking, error: bookingError } = await supabase
      .from("puja_bookings")
      .insert({
        user_id: user.id,
        puja_id: pujaId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        devotee_name: safeName,
        devotee_gotra: safeGotra,
        special_instructions: safeInstructions,
        amount: amount,
        razorpay_order_id: razorpayOrder.id,
        payment_status: "pending",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking creation error:", bookingError);
      return new Response(JSON.stringify({ error: "Failed to create booking record" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        bookingId: booking.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
