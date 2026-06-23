import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend((globalThis as any).Deno?.env?.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TYPES = ["confirmation", "reminder"];

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const generateConfirmationEmail = (booking: any, puja: any, profile: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #fef7ed;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🙏 Booking Confirmed</h1>
      <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 14px;">Shri Kailash Mahadev Temple</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Namaste <strong>${profile?.full_name || booking.devotee_name}</strong>,
      </p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Your puja booking has been confirmed. Here are your booking details:
      </p>
      <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #ea580c; margin: 0 0 16px 0; font-size: 20px;">${puja.name}</h2>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">📅 Date:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatDate(booking.booking_date)}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">⏰ Time:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatTime(booking.booking_time)}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">👤 Devotee:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${booking.devotee_name}</span>
        </div>
        ${booking.devotee_gotra ? `
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">🔱 Gotra:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${booking.devotee_gotra}</span>
        </div>
        ` : ""}
        <div style="border-top: 1px solid #fed7aa; margin-top: 16px; padding-top: 16px;">
          <span style="color: #6b7280; font-size: 14px;">💰 Amount Paid:</span>
          <span style="color: #16a34a; font-size: 18px; font-weight: 700; margin-left: 8px;">₹${booking.amount.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="color: #6b7280; font-size: 12px;">Booking Reference</span>
        <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 4px 0 0 0; font-family: monospace;">${booking.id.slice(0, 8).toUpperCase()}</p>
      </div>
      ${booking.special_instructions ? `
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <span style="color: #92400e; font-size: 14px; font-weight: 600;">📝 Special Instructions:</span>
        <p style="color: #78350f; font-size: 14px; margin: 8px 0 0 0;">${booking.special_instructions}</p>
      </div>
      ` : ""}
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        May Lord Mahadev bless you with peace and prosperity.
      </p>
    </div>
    <div style="background-color: #1f2937; padding: 24px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">Shri Kailash Mahadev Temple, Agra</p>
      <p style="color: #6b7280; font-size: 11px; margin: 0;">This is an automated confirmation email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

const generateReminderEmail = (booking: any, puja: any, profile: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puja Reminder</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #fef7ed;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔔 Puja Reminder</h1>
      <p style="color: #ddd6fe; margin: 8px 0 0 0; font-size: 14px;">Your puja is scheduled for tomorrow!</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        Namaste <strong>${profile?.full_name || booking.devotee_name}</strong>,
      </p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
        This is a gentle reminder that your puja is scheduled for <strong>tomorrow</strong>.
      </p>
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #7c3aed; margin: 0 0 16px 0; font-size: 20px;">${puja.name}</h2>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">📅 Date:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatDate(booking.booking_date)}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">⏰ Time:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${formatTime(booking.booking_time)}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 14px;">👤 Devotee:</span>
          <span style="color: #374151; font-size: 14px; font-weight: 600; margin-left: 8px;">${booking.devotee_name}</span>
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Please arrive 15 minutes before your scheduled time. May Lord Mahadev bless you.
      </p>
    </div>
    <div style="background-color: #1f2937; padding: 24px; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">Shri Kailash Mahadev Temple, Agra</p>
      <p style="color: #6b7280; font-size: 11px; margin: 0;">This is an automated reminder email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;

    // Authentication: require either user auth or service role key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;
    let callerUserId: string | null = null;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      callerUserId = user.id;
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { bookingId, type } = body as any;

    // Validate bookingId
    if (typeof bookingId !== "string" || !UUID_REGEX.test(bookingId)) {
      return new Response(JSON.stringify({ error: "Invalid booking ID" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate type
    if (typeof type !== "string" || !VALID_TYPES.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid email type" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
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
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Authorization: non-service-role callers must own the booking or be admin
    if (!isServiceRole && callerUserId) {
      if (booking.user_id !== callerUserId) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: callerUserId, _role: "admin" });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", booking.user_id)
      .single();

    // Check email notification preferences
    const prefColumn = type === "confirmation" ? "booking_enabled" : "reminder_enabled";
    const { data: emailPrefs } = await supabase
      .from("email_notification_prefs")
      .select(prefColumn)
      .eq("user_id", booking.user_id)
      .maybeSingle();

    // If prefs exist and the relevant type is disabled, skip sending
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
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const puja = booking.pujas;
    const subject = type === "confirmation"
      ? `🙏 Booking Confirmed: ${puja.name}`
      : `🔔 Reminder: ${puja.name} Tomorrow`;

    const html = type === "confirmation"
      ? generateConfirmationEmail(booking, puja, profile)
      : generateReminderEmail(booking, puja, profile);

    const emailResponse = await resend.emails.send({
      from: "Temple Bookings <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });

    // Check if email was sent successfully
    if (!emailResponse.data?.id) {
      console.error("Failed to send email. Resend response:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email", details: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-email:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
