import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, PriestAssignedEmail } from "../shared/email/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body = await req.json().catch(() => null);
    const bookingId = body?.bookingId;
    const priestUserId = body?.priestUserId || null;

    if (!bookingId || typeof bookingId !== "string") {
      return new Response(JSON.stringify({ error: "Missing bookingId" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin using their auth token
    const callerClient = createClient(supabaseUrl, (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Check admin role via RPC
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Perform update using service role
    const { error: updateError } = await supabaseAdmin
      .from("puja_bookings")
      .update({ assigned_priest_id: priestUserId || null, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[assign-priest] update error", updateError);
      return new Response(JSON.stringify({ error: "Failed to update booking" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // If assigned, send email to priest
    if (priestUserId) {
      try {
        const { data: priestProfile } = await supabaseAdmin.from("profiles").select("full_name, email").eq("user_id", priestUserId).maybeSingle();
        if (priestProfile?.email) {
          // fetch booking info for puja name and devotee
          const { data: booking } = await supabaseAdmin.from("puja_bookings").select("devotee_name, pujas(name)").eq("id", bookingId).maybeSingle();

          const subject = `New Puja Assignment — ${bookingId.slice(0, 8).toUpperCase()}`;
          const react = PriestAssignedEmail({ recipientName: priestProfile.full_name || "Priest", priestName: priestProfile.full_name || "Priest", pujaName: booking?.pujas?.name || "Puja" });

          const result = await sendEmail({
            to: priestProfile.email,
            subject,
            react,
            previewText: "You have been assigned a new puja.",
            templateName: "priest_assigned",
            supabaseClient: supabaseAdmin,
          });

          console.log("[assign-priest] email result", { bookingId, priestUserId, result });
        }
      } catch (emailErr) {
        console.error("[assign-priest] failed to send email", emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("[assign-priest] error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
