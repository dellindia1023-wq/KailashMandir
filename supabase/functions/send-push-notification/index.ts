import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map notification type to preference column
function getPrefColumn(type?: string): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    booking: "booking_enabled",
    payment: "payment_enabled",
    reminder: "reminder_enabled",
    system: "system_enabled",
    announcement: "system_enabled",
  };
  return map[type] || null;
}

((globalThis as any).Deno as any).serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_ids, title, body, data, type } = await req.json();

    if (!user_ids?.length || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing user_ids, title, or body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter user_ids by their push notification preferences
    let eligibleUserIds = [...user_ids];
    const prefColumn = getPrefColumn(type);

    // Log if unknown notification type is provided
    if (type && !prefColumn) {
      console.warn(`Unknown push notification type: "${type}". Sending to all users without filtering by preferences.`);
    }

    if (prefColumn) {
      const { data: prefs } = await supabase
        .from("push_notification_prefs")
        .select("user_id, " + prefColumn)
        .in("user_id", user_ids);

      if (prefs?.length) {
        // Users with a pref row where the column is false → exclude
        const disabledUsers = new Set(
          prefs.filter((p: any) => p[prefColumn] === false).map((p: any) => p.user_id)
        );
        eligibleUserIds = user_ids.filter((id: string) => !disabledUsers.has(id));
      }
      // Users without a pref row default to enabled (all true), so they stay in
    } else if (type) {
      // Unknown type but type was provided - log warning
      console.warn(`No preference column found for notification type: "${type}". Sending to all ${eligibleUserIds.length} users.`);
    }

    if (!eligibleUserIds.length) {
      return new Response(JSON.stringify({ sent: 0, filtered: user_ids.length, message: "All users have disabled this notification type" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get push subscriptions for eligible users
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", eligibleUserIds);

    if (subError) throw subError;
    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No push subscriptions found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const errors: string[] = [];
    const expiredSubscriptions: string[] = [];

    // ✅ ACTUALLY SEND PUSH NOTIFICATIONS
    for (const sub of subscriptions) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: "/icons/icon-512x512.png",
          badge: "/icons/icon-512x512.png",
          data: { ...data, type, url: "/" },
        });

        // ✅ SEND ACTUAL WEB PUSH NOTIFICATION
        const pushResponse = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "24h",
          },
          body: payload,
        });

        if (pushResponse.status === 410) {
          // Subscription expired
          console.log(`Subscription expired for ${sub.user_id}, deleting...`);
          expiredSubscriptions.push(sub.id);
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id)
            .catch((err) => console.error("Error deleting expired subscription:", err));
        } else if (pushResponse.status === 429) {
          // Rate limited, retry later
          errors.push(`Rate limited for ${sub.user_id}, retry later`);
          console.warn(`Rate limited sending to ${sub.user_id}`);
        } else if (pushResponse.ok) {
          sent++;
          console.log(`Push sent to ${sub.user_id}`);
        } else {
          const errText = await pushResponse.text();
          errors.push(`Failed for ${sub.user_id}: ${pushResponse.statusText}`);
          console.error(`Push failed for ${sub.user_id}:`, errText);
        }
      } catch (e) {
        errors.push(`Exception for ${sub.user_id}: ${e.message}`);
        console.error(`Exception sending push to ${sub.user_id}:`, e);
      }
    }

    return new Response(JSON.stringify({
      sent,
      total: subscriptions.length,
      filtered: user_ids.length - eligibleUserIds.length,
      expired: expiredSubscriptions.length,
      errors,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
