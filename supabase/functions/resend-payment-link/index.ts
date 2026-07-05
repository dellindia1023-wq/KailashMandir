import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, PaymentLinkEmail } from "../shared/email/index.ts";
import { getFrontendUrl } from "../shared/email/utils.ts";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "Authorization, apikey, X-Client-Info, Content-Type, x-supabase-auth, x-service-role-key, x-send-booking-email-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const bookingId = (body as any)?.bookingId;
    if (!bookingId || typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
      return new Response(JSON.stringify({ error: "Invalid bookingId" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch booking with service role (simple fields first)
    const { data: booking, error: bookingErr } = await adminClient
      .from("puja_bookings")
      .select("id, user_id, amount, payment_status, puja_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      console.error("[resend-payment-link] booking fetch failed", bookingErr);
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Check permissions: owner or admin
    const { data: isAdminRaw, error: roleErr } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const isAdmin = !!(isAdminRaw === true || (Array.isArray(isAdminRaw) && isAdminRaw[0]) || isAdminRaw === "t");
    if (booking.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (booking.payment_status === "paid" || booking.payment_status === "completed") {
      return new Response(JSON.stringify({ error: "Booking already paid" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const razorpayKeyId = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = (globalThis as any).Deno?.env?.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) return new Response(JSON.stringify({ error: "Razorpay not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Create Razorpay order
    const amount = Math.round(Number(booking.amount) * 100);
    const razorResp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${encode(`${razorpayKeyId}:${razorpayKeySecret}`)}` },
      body: JSON.stringify({ amount, currency: "INR", receipt: `puja_${Date.now()}`, notes: { booking_id: booking.id } }),
    });

    if (!razorResp.ok) {
      const errText = await razorResp.text();
      console.error("[resend-payment-link] razorpay order failed", errText);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const razor = await razorResp.json();

    // Update booking with razorpay_order_id
    const { error: updErr } = await adminClient.from("puja_bookings").update({ razorpay_order_id: razor.id, payment_status: "pending", updated_at: new Date().toISOString() }).eq("id", booking.id);
    if (updErr) console.error("[resend-payment-link] update error", updErr);

    // Fetch user email
    const { data: userRecord, error: userRecordErr } = await adminClient.auth.admin.getUserById(booking.user_id);
    const userEmail = userRecord?.user?.email;
    if (userRecordErr || !userEmail) {
      console.error("[resend-payment-link] user lookup failed", userRecordErr);
      return new Response(JSON.stringify({ error: "User email not found" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Resolve puja name safely (separate lookup) to avoid relationship selection issues
    let pujaName = null;
    try {
      if (booking.puja_id) {
        const { data: pujaRow } = await adminClient.from("pujas").select("name").eq("id", booking.puja_id).maybeSingle();
        pujaName = pujaRow?.name || null;
      }
    } catch (e) {
      console.error("[resend-payment-link] puja lookup failed", e);
    }

    // Build frontend pay URL (point to booking page with orderId and bookingId)
    const payUrl = `${getFrontendUrl()}/pay?bookingId=${booking.id}&orderId=${razor.id}`;

    // Send email using shared sendEmail helper
    try {
      const subject = `Complete payment for ${pujaName || "your booking"}`;
      const react = PaymentLinkEmail({ recipientName: "Devotee", pujaName: pujaName || "Puja", amount: Number(booking.amount || 0), payUrl });

      const result = await sendEmail({ to: userEmail, subject, react, previewText: "Complete payment to confirm your booking.", templateName: "payment_link", supabaseClient: adminClient });
      if (!result.success) {
        console.error("[resend-payment-link] email send failed", result.error);
        return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    } catch (e) {
      console.error("[resend-payment-link] email error", e);
    }

    return new Response(JSON.stringify({ success: true, orderId: razor.id, payUrl }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("[resend-payment-link] error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
