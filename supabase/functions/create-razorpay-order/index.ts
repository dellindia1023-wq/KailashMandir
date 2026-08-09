import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "Authorization, apikey, X-Client-Info, Content-Type, x-supabase-auth, x-service-role-key, x-send-booking-email-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const MAX_AMOUNT = 10000000;

console.log("🚀 create-razorpay-order function starting...");

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const {
      bookingId,
      pujaId,
      amount,
      bookingDate,
      bookingTime,
      devoteeName,
      devoteeGotra,
      specialInstructions,
      additionalCharges,
      createPendingBooking,
      existingOrderId,
    } = body as any;

    let orderAmount = amount;
    const notes: Record<string, unknown> = {};
    let bookingRecordId: string | null = null;
    let createBookingPayload: Record<string, unknown> | null = null;

    const shouldCreatePendingBooking = createPendingBooking === true;
    const pendingOrderId = typeof existingOrderId === "string" ? existingOrderId : null;

    if (bookingId) {
      if (typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
        return new Response(JSON.stringify({ error: "Invalid booking ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: existingBooking, error: existingBookingError } = await supabase
        .from("puja_bookings")
        .select("id, user_id, amount, puja_id, payment_status")
        .eq("id", bookingId)
        .maybeSingle();

      if (existingBookingError || !existingBooking) {
        console.error("Booking fetch error:", existingBookingError);
        return new Response(JSON.stringify({ error: "Booking not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (existingBooking.user_id !== user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized to retry this booking" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!["pending", "failed"].includes(existingBooking.payment_status)) {
        return new Response(JSON.stringify({ error: "Only pending or failed bookings can be retried" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      orderAmount = Number(existingBooking.amount);
      bookingRecordId = existingBooking.id;
      notes.puja_id = existingBooking.puja_id;
      notes.user_id = existingBooking.user_id;
    } else {
      if (typeof pujaId !== "string" || !UUID_REGEX.test(pujaId)) {
        return new Response(JSON.stringify({ error: "Invalid puja ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (typeof bookingDate !== "string" || !DATE_REGEX.test(bookingDate)) {
        return new Response(JSON.stringify({ error: "Invalid booking date format (YYYY-MM-DD)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (typeof bookingTime !== "string" || !TIME_REGEX.test(bookingTime)) {
        return new Response(JSON.stringify({ error: "Invalid booking time format (HH:MM)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (typeof devoteeName !== "string" || devoteeName.trim().length < 2 || devoteeName.trim().length > 100) {
        return new Response(JSON.stringify({ error: "Devotee name must be 2-100 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const safeGotra = typeof devoteeGotra === "string" ? devoteeGotra.trim().slice(0, 50) || null : null;
      const safeInstructions = typeof specialInstructions === "string" ? specialInstructions.trim().slice(0, 500) || null : null;
      const safeName = devoteeName.trim().slice(0, 100);
      const safeCharges = Array.isArray(additionalCharges)
        ? additionalCharges.map((charge: any) => ({
            label: typeof charge.label === "string" ? charge.label.trim().slice(0, 100) : "",
            amount: typeof charge.amount === "number" && Number.isFinite(charge.amount) ? charge.amount : 0,
          }))
        : null;

      createBookingPayload = {
        user_id: user.id,
        puja_id: pujaId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        devotee_name: safeName,
        devotee_gotra: safeGotra,
        special_instructions: safeInstructions,
        amount: amount,
        payment_status: "pending",
        booking_status: "pending",
        additional_charges: safeCharges,
      };

      notes.puja_id = pujaId;
      notes.user_id = user.id;
      notes.devotee_name = safeName;
      if (safeGotra) notes.devotee_gotra = safeGotra;
      if (safeInstructions) notes.special_instructions = safeInstructions;
    }

    const razorpayKeyId = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Payment credentials not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (pendingOrderId) {
      if (bookingRecordId) {
        const { error: updateError } = await supabaseAdmin
          .from("puja_bookings")
          .update({
            razorpay_order_id: pendingOrderId,
            payment_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingRecordId)
          .in("payment_status", ["pending", "failed"]);

        if (updateError) {
          console.error("Pending booking update failed:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update pending booking" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } else if (shouldCreatePendingBooking) {
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from("puja_bookings")
          .insert({
            ...createBookingPayload,
            razorpay_order_id: pendingOrderId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (bookingError || !booking) {
          console.error("Pending booking creation error:", bookingError);
          return new Response(JSON.stringify({ error: "Failed to create pending booking" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        bookingRecordId = booking.id;
      }

      return new Response(
        JSON.stringify({
          orderId: pendingOrderId,
          bookingId: bookingRecordId,
          amount: Math.round(orderAmount * 100),
          currency: "INR",
          keyId: razorpayKeyId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encode(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(orderAmount * 100),
        currency: "INR",
        receipt: `puja_${Date.now()}`,
        notes,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const razorpayOrder = await razorpayResponse.json();

    if (bookingRecordId) {
      const updateQuery = supabaseAdmin
        .from("puja_bookings")
        .update({
          razorpay_order_id: razorpayOrder.id,
          payment_status: "pending",
          payment_id: null,
          razorpay_signature: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingRecordId)
        .in("payment_status", ["pending", "failed"]);

      if (!isAdmin) {
        updateQuery.eq("user_id", user.id);
      }

      const { error: updateError } = await updateQuery;
      if (updateError) {
        console.error("Booking update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update booking for retry" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (createBookingPayload && shouldCreatePendingBooking) {
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("puja_bookings")
        .insert({
          ...createBookingPayload,
          razorpay_order_id: razorpayOrder.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (bookingError || !booking) {
        console.error("Booking creation error:", bookingError);
        return new Response(JSON.stringify({ error: "Failed to create booking record" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      bookingRecordId = booking.id;
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        bookingId: bookingRecordId,
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
