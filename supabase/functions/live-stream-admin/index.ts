import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toJson = (body: unknown) => JSON.stringify(body);

const normalizeStreamType = (value?: string | null) => {
  const normalized = String(value || "hls").toLowerCase();
  return ["hls", "youtube", "upload", "mobile", "rtmp", "rtsp", "webrtc"].includes(normalized)
    ? normalized
    : "hls";
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

    const authHeader = req.headers.get("Authorization") || "";
    let isAdmin = false;

    if (authHeader.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user }, error } = await userClient.auth.getUser();
      if (!error && user) {
        const { data: hasAdminRole } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        isAdmin = Boolean(hasAdminRole);
      }
    }

    if (!isAdmin) {
      return new Response(toJson({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({}));
    const action = String(payload.action || "status").toLowerCase();

    const mediaServerUrl = String(payload.media_server_url || Deno.env.get("MEDIAMTX_URL") || "").trim();
    const mediaServerPath = String(payload.media_server_path || "live").trim();
    const rtmpUrl = String(payload.rtmp_url || "").trim();
    const rtmpStreamKey = String(payload.rtmp_stream_key || "live").trim();
    const rtspUrl = String(payload.rtsp_url || "").trim();
    const streamType = normalizeStreamType(payload.stream_type);

    const now = new Date().toISOString();

    if (action === "sync") {
      const { data: existingSettings } = await supabase.from("live_stream_settings").select("id").limit(1).maybeSingle();
      const resolvedRtmpUrl = rtmpUrl || `${mediaServerUrl ? mediaServerUrl.replace(/^https?:\/\//i, "rtmp://") : "rtmp://127.0.0.1:1935"}/live`;
      const resolvedRtspUrl = rtspUrl || `${mediaServerUrl ? mediaServerUrl.replace(/^https?:\/\//i, "rtsp://") : "rtsp://127.0.0.1:8554"}/live`;
      const updatePayload: Record<string, unknown> = {
        stream_url: payload.stream_url || resolvedRtspUrl,
        stream_type: streamType,
        media_server_url: mediaServerUrl,
        media_server_path: mediaServerPath,
        rtmp_url: resolvedRtmpUrl,
        rtmp_stream_key: rtmpStreamKey,
        camera_username: payload.camera_username || null,
        camera_password: payload.camera_password || null,
        auto_failover: Boolean(payload.auto_failover),
        recording_enabled: Boolean(payload.recording_enabled),
        is_primary: Boolean(payload.is_primary),
        priority: Number(payload.priority || 1),
        stream_status: payload.stream_status || "offline",
        health_summary: payload.health_summary || "MediaMTX sync pending",
        updated_at: now,
      };

      const { data, error } = existingSettings?.id
        ? await supabase.from("live_stream_settings").update(updatePayload).eq("id", existingSettings.id).select().maybeSingle()
        : await supabase.from("live_stream_settings").insert(updatePayload).select().maybeSingle();

      if (error) throw error;

      const sourcePayload = {
        name: payload.source_name || "Temple Primary Stream",
        source_key: `temple-${mediaServerPath || "live"}`,
        description: payload.description || `MediaMTX source for ${streamType}`,
        stream_url: payload.stream_url || resolvedRtspUrl,
        backup_stream_url: payload.backup_stream_url || "",
        source_type: streamType,
        current_status: payload.stream_status || "offline",
        priority: Number(payload.priority || 1),
        is_primary: Boolean(payload.is_primary),
        is_active: true,
        updated_at: now,
      };

      const { data: sourceData } = await supabase.from("live_stream_sources").select("id").eq("source_key", sourcePayload.source_key).maybeSingle();
      await supabase.from("live_stream_sources").upsert({
        id: sourceData?.id,
        ...sourcePayload,
      }, { onConflict: "source_key" });

      await supabase.from("live_stream_events").insert({
        source_id: sourceData?.id,
        event_type: "manual_override",
        event_description: "Admin synced MediaMTX source state",
        metadata: { action, streamType, mediaServerUrl, mediaServerPath },
        created_at: now,
      }).catch(() => undefined);

      return new Response(toJson({ ok: true, data, endpoints: { hls: `${mediaServerUrl}/${mediaServerPath}/index.m3u8`, rtmp: resolvedRtmpUrl, rtsp: resolvedRtspUrl } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start") {
      const { data, error } = await supabase.from("live_stream_settings").update({
        is_live: true,
        stream_status: "live",
        health_summary: "Stream started",
        updated_at: now,
      }).select().maybeSingle();
      if (error) throw error;
      return new Response(toJson({ ok: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stop") {
      const { data, error } = await supabase.from("live_stream_settings").update({
        is_live: false,
        stream_status: "offline",
        health_summary: "Stream stopped",
        updated_at: now,
      }).select().maybeSingle();
      if (error) throw error;
      return new Response(toJson({ ok: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "restart") {
      const { data, error } = await supabase.from("live_stream_settings").update({
        is_live: true,
        stream_status: "restarting",
        health_summary: "Restart requested",
        updated_at: now,
      }).select().maybeSingle();
      if (error) throw error;
      return new Response(toJson({ ok: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "health") {
      const health = {
        ok: true,
        media_server_url: mediaServerUrl,
        media_server_path: mediaServerPath,
        rtmp_url: rtmpUrl || `${mediaServerUrl ? mediaServerUrl.replace(/^https?:\/\//i, "rtmp://") : "rtmp://127.0.0.1:1935"}/live`,
        rtsp_url: rtspUrl || `${mediaServerUrl ? mediaServerUrl.replace(/^https?:\/\//i, "rtsp://") : "rtsp://127.0.0.1:8554"}/live`,
        stream_type: streamType,
        timestamp: now,
      };
      return new Response(toJson(health), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.from("live_stream_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;

    return new Response(toJson({ ok: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(toJson({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
