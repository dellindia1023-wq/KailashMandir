import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const mediaServerUrl = String(Deno.env.get("MEDIAMTX_URL") || "http://127.0.0.1:8888").trim();
    const mediaServerPath = String(Deno.env.get("MEDIAMTX_PATH") || "live").trim();

    const healthChecks = [] as Array<{ name: string; ok: boolean; detail: string }>;
    let overallOk = true;

    try {
      const response = await fetch(`${mediaServerUrl}/${mediaServerPath}/index.m3u8`, { method: "GET" });
      const ok = response.ok;
      overallOk = overallOk && ok;
      healthChecks.push({ name: "hls", ok, detail: `HTTP ${response.status}` });
    } catch (error) {
      overallOk = false;
      healthChecks.push({ name: "hls", ok: false, detail: error instanceof Error ? error.message : String(error) });
    }

    try {
      const response = await fetch(`${mediaServerUrl.replace(/^https?:\/\//i, "http://")}/metrics`, { method: "GET" });
      const ok = response.ok;
      overallOk = overallOk && ok;
      healthChecks.push({ name: "metrics", ok, detail: `HTTP ${response.status}` });
    } catch (error) {
      overallOk = false;
      healthChecks.push({ name: "metrics", ok: false, detail: error instanceof Error ? error.message : String(error) });
    }

    const { data, error } = await supabase.from("live_stream_settings").select("id, stream_status, is_live, health_summary").limit(1).maybeSingle();
    if (error) throw error;

    await supabase.from("live_stream_settings").update({
      stream_status: overallOk ? "live" : "offline",
      health_summary: overallOk ? "MediaMTX is healthy" : healthChecks.map((check) => `${check.name}:${check.ok ? "ok" : "error"}`).join(", "),
      updated_at: new Date().toISOString(),
    }).eq("id", data?.id).catch(() => undefined);

    const payload = {
      ok: overallOk,
      health_checks: healthChecks,
      settings: data,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
