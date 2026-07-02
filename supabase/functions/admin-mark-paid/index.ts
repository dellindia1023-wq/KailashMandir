import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("🚀 admin-mark-paid function starting...");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const body = await req.json().catch(() => null);
    const bookingId = body?.bookingId;
    const paymentId = body?.paymentId || null;
    const orderId = body?.orderId || null;
    const signature = body?.signature || null;

    if (!bookingId || typeof bookingId !== "string") {
      return new Response(JSON.stringify({ error: "Missing bookingId" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Update booking as paid using service role
    const updates: Record<string, unknown> = {
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    };
    if (paymentId) updates.payment_id = paymentId;
    if (orderId) updates.razorpay_order_id = orderId;
    if (signature) updates.razorpay_signature = signature;

    const { error: updateError } = await adminClient.from("puja_bookings").update(updates).eq("id", bookingId);
    if (updateError) {
      console.error("[admin-mark-paid] update error", updateError);
      return new Response(JSON.stringify({ error: "Failed to mark booking paid" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Send confirmation email via internal function
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ bookingId, type: "confirmation" }),
      });
      if (!resp.ok) console.error("[admin-mark-paid] send email failed", await resp.text());
    } catch (e) {
      console.error("[admin-mark-paid] email error", e);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("[admin-mark-paid] error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
