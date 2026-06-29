import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  BookingConfirmationEmail,
  BookingReminderEmail,
  sendEmail,
  type EmailSendResult,
} from "../shared/email/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-send-booking-email-key",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TYPES = ["confirmation", "reminder"];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const serviceRoleHeader =
      req.headers.get("x-supabase-service-role") || req.headers.get("x-service-role-key") || req.headers.get("x-send-booking-email-key");

    const token = authHeader?.match(/^Bearer\s+(.+)$/i)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : serviceRoleHeader?.trim();

    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isServiceRole = token === supabaseServiceKey?.trim();
    let callerUserId: string | null = null;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      callerUserId = user.id;
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

    const { bookingId, type, debug } = body as { bookingId?: string; type?: string; debug?: boolean };

    // Production: do not expose debug information about service-role secrets.

    if (typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
      return new Response(JSON.stringify({ error: "Invalid booking ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (typeof type !== "string" || !VALID_TYPES.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid email type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from("puja_bookings")
      .select("*, pujas(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isServiceRole && callerUserId) {
      if (booking.user_id !== callerUserId) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: callerUserId, _role: "admin" });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", booking.user_id)
      .single();

    const prefColumn = type === "confirmation" ? "booking_enabled" : "reminder_enabled";
    const { data: emailPrefs } = await supabase
      .from("email_notification_prefs")
      .select(prefColumn)
      .eq("user_id", booking.user_id)
      .maybeSingle();

    if (emailPrefs && emailPrefs[prefColumn] === false) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "User disabled this email type" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id);
    const userEmail = userData?.user?.email;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const puja = booking.pujas;
    const subject = type === "confirmation"
      ? `🙏 Booking Confirmed: ${puja.name}`
      : `🔔 Reminder: ${puja.name} Tomorrow`;

    const reactEmail = type === "confirmation"
      ? BookingConfirmationEmail({
          recipientName: profile?.full_name || booking.devotee_name,
          pujaName: puja.name,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          amount: Number(booking.amount || 0),
          referenceCode: booking.id?.slice(0, 8).toUpperCase(),
        })
      : BookingReminderEmail({
          recipientName: profile?.full_name || booking.devotee_name,
          pujaName: puja.name,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
        });

    const result: EmailSendResult = await sendEmail({
      to: userEmail,
      subject,
      react: reactEmail,
      previewText: type === "confirmation" ? "Your puja booking is confirmed." : "A reminder for your upcoming temple service.",
      templateName: type === "confirmation" ? "booking_confirmation" : "booking_reminder",
      supabaseClient: supabase,
      maxRetries: 2,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Failed to send confirmation email", details: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
