import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-reminders function invoked");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Verify admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate tomorrow's date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date(istNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Looking for bookings on: ${tomorrowStr}`);

    // Fetch all confirmed bookings for tomorrow with priest info
    const { data: bookings, error: bookingsError } = await supabase
      .from("puja_bookings")
      .select("id, devotee_name, booking_date, booking_time, user_id, assigned_priest_id, puja_id")
      .eq("booking_date", tomorrowStr)
      .eq("payment_status", "paid");

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw new Error("Failed to fetch bookings");
    }

    console.log(`Found ${bookings?.length || 0} bookings for tomorrow`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No bookings for tomorrow", sent: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create in-app reminder notifications for users and priests
    for (const booking of bookings) {
      // Get puja name
      const { data: puja } = await supabase.from("pujas").select("name").eq("id", booking.puja_id).single();
      const pujaName = puja?.name || "Puja";

      // Notify user
      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        role: "user",
        title: "Booking Reminder",
        message: `Reminder: Your ${pujaName} is scheduled for tomorrow at ${booking.booking_time}.`,
        type: "reminder",
        metadata: { booking_id: booking.id, event: "booking.reminder" },
      });

      // Notify assigned priest
      if (booking.assigned_priest_id) {
        await supabase.from("notifications").insert({
          user_id: booking.assigned_priest_id,
          role: "priest",
          title: "Puja Reminder",
          message: `Reminder: ${pujaName} for ${booking.devotee_name} is scheduled for tomorrow at ${booking.booking_time}.`,
          type: "reminder",
          metadata: { booking_id: booking.id, event: "booking.reminder" },
        });
      }
    }

    // Send reminder emails for each booking
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        console.log(`Sending reminder for booking ${booking.id} - ${booking.devotee_name}`);
        
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-booking-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              bookingId: booking.id,
              type: "reminder",
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send email for ${booking.id}: ${errorText}`);
        }

        return { bookingId: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Reminder emails sent: ${successful} successful, ${failed} failed`);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed for booking ${bookings[index].id}:`, result.reason);
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successful} reminder emails`,
        sent: successful,
        failed: failed,
        date: tomorrowStr,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
