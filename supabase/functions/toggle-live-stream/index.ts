import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

((globalThis as any).Deno as any).serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);
    const supabase = adminClient;
    let isAdmin = false;
    let user: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser }, error: userError } = await userClient.auth.getUser();
      if (!userError && authUser) {
        user = authUser;
        const { data: hasAdminRole } = await adminClient.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        isAdmin = Boolean(hasAdminRole);
      }
    }

    if (authHeader?.startsWith("Bearer ") && !isAdmin) {
      console.error("Access denied: User is not admin", { userId: user?.id });
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isAdmin && user) {
      await supabase.from("audit_log").insert({
        action: "live_stream_toggled",
        module_name: "live_stream",
        user_id: user.id,
        details: {
          toggled_at: new Date().toISOString(),
          caller_email: user.email,
        },
      }).catch((err) => console.error("Audit log error:", err));
    }

    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    const dayOfWeek = ist.getUTCDay(); // 0=Sunday
    const hours = ist.getUTCHours().toString().padStart(2, "0");
    const minutes = ist.getUTCMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}:00`;

    // Check if any active schedule slot covers the current time
    const { data: slots, error: slotError } = await supabase
      .from("darshan_schedule")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (slotError) {
      throw slotError;
    }

    const shouldBeLive =
      slots && slots.length > 0 &&
      slots.some(
        (slot: any) => currentTime >= slot.start_time && currentTime < slot.end_time
      );

    // Get current live status and override settings
    const { data: settings, error: settingsError } = await supabase
      .from("live_stream_settings")
      .select("id, is_live, manual_override, manual_live")
      .limit(1)
      .single();

    if (settingsError) {
      throw settingsError;
    }

    const effectiveLiveState = settings?.manual_override
      ? Boolean(settings.manual_live)
      : shouldBeLive;

    // Only update if status needs to change and manual override is not blocking schedule updates
    if (settings && settings.is_live !== effectiveLiveState) {
      const { error: updateError } = await supabase
        .from("live_stream_settings")
        .update({
          is_live: effectiveLiveState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          toggled: true,
          is_live: effectiveLiveState,
          current_time_ist: currentTime,
          day_of_week: dayOfWeek,
          manual_override: settings.manual_override,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        toggled: false,
        is_live: settings?.is_live ?? effectiveLiveState,
        current_time_ist: currentTime,
        day_of_week: dayOfWeek,
        manual_override: settings?.manual_override ?? false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
