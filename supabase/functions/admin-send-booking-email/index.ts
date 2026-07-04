import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail, BookingConfirmationEmail, BookingReminderEmail, type EmailSendResult } from "../shared/email/index.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.match(/^Bearer\s+(.+)$/i) ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // Verify caller is admin using anon client + caller token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader || "" } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // Check admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { bookingId, type } = body as { bookingId?: string; type?: string };

    if (typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
      return new Response(JSON.stringify({ error: "Invalid booking ID" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (type !== "confirmation" && type !== "reminder") {
      return new Response(JSON.stringify({ error: "Invalid email type" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Fetch booking and user data using service role
    const { data: booking, error: bookingError } = await serviceClient
      .from("puja_bookings")
      .select("*, pujas(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", booking.user_id)
      .single();

    const { data: userData } = await serviceClient.auth.admin.getUserById(booking.user_id);
    const userEmail = userData?.user?.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "User email not found" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const puja = booking.pujas;
    const subject = type === "confirmation" ? `🙏 Booking Confirmed: ${puja.name}` : `🔔 Reminder: ${puja.name} Tomorrow`;

    const reactEmail = type === "confirmation"
      ? BookingConfirmationEmail({ recipientName: profile?.full_name || booking.devotee_name, pujaName: puja.name, bookingDate: booking.booking_date, bookingTime: booking.booking_time, amount: Number(booking.amount || 0), referenceCode: booking.id?.slice(0, 8).toUpperCase() })
      : BookingReminderEmail({ recipientName: profile?.full_name || booking.devotee_name, pujaName: puja.name, bookingDate: booking.booking_date, bookingTime: booking.booking_time });

    const result: EmailSendResult = await sendEmail({ to: userEmail, subject, react: reactEmail, previewText: type === "confirmation" ? "Your puja booking is confirmed." : "A reminder for your upcoming temple service.", templateName: type === "confirmation" ? "booking_confirmation" : "booking_reminder", supabaseClient: serviceClient, maxRetries: 2 });

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Failed to send email", details: result.error }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, emailId: result.id }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error in admin-send-booking-email:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

serve(handler);
