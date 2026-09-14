import { supabase } from "@/integrations/supabase/client";

const LIVE_STREAM_SETTINGS_STORAGE_KEY = "kailash_live_stream_settings";

const readPersistedLiveStreamSettings = (): Partial<LiveStreamSettingsPayload> | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LIVE_STREAM_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writePersistedLiveStreamSettings = (payload: Partial<LiveStreamSettingsPayload>) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIVE_STREAM_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage availability issues
  }
};

export type LiveStreamType = "hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc";

const normalizeStreamType = (value?: string | null): LiveStreamType => {
  const normalized = (value || "hls").trim().toLowerCase();
  if (["hls", "youtube", "upload", "mobile", "rtmp", "rtsp", "webrtc"].includes(normalized)) {
    return normalized as LiveStreamType;
  }

  return "hls";
};

export interface LiveStreamSettingsPayload {
  id?: string | null;
  stream_url?: string | null;
  stream_type?: string | null;
  is_live?: boolean | null;
  title?: string | null;
  description?: string | null;
  viewer_count?: number | null;
  source_name?: string | null;
  backup_stream_url?: string | null;
  source_notes?: string | null;
  manual_override?: boolean | null;
  manual_live?: boolean | null;
  media_server_url?: string | null;
  media_server_path?: string | null;
  rtmp_url?: string | null;
  rtmp_stream_key?: string | null;
  camera_username?: string | null;
  camera_password?: string | null;
  auto_failover?: boolean | null;
  recording_enabled?: boolean | null;
  is_primary?: boolean | null;
  priority?: number | null;
  stream_status?: string | null;
  health_summary?: string | null;
}

const LIVE_STREAM_SETTINGS_COLUMNS = [
  "id",
  "stream_url",
  "is_live",
  "title",
  "description",
  "viewer_count",
  "stream_type",
  "source_name",
  "backup_stream_url",
  "source_notes",
  "manual_override",
  "manual_live",
  "media_server_url",
  "media_server_path",
  "rtmp_url",
  "rtmp_stream_key",
  "camera_username",
  "camera_password",
  "auto_failover",
  "recording_enabled",
  "is_primary",
  "priority",
  "stream_status",
  "health_summary",
].join(", ");

const LIVE_STREAM_SETTINGS_MINIMAL_COLUMNS = [
  "id",
  "stream_url",
  "is_live",
  "title",
  "description",
  "viewer_count",
  "stream_type",
].join(", ");

let useMinimalLiveStreamSettingsColumns = false;

const isInvalidColumnError = (error: any): boolean => {
  if (!error) return false;
  if (error.code === "42703") return true;
  if (typeof error.message === "string") {
    return /column .* does not exist|could not find the .* column|schema cache|invalid input syntax|bad request/i.test(error.message);
  }
  return false;
};

export async function fetchLiveStreamSettings(): Promise<{
  data: LiveStreamSettingsPayload | null;
  error: any | null;
}> {
  try {
    const firstAttempt = await supabase
      .from("live_stream_settings")
      .select(LIVE_STREAM_SETTINGS_COLUMNS)
      .limit(1)
      .maybeSingle();

    if (!firstAttempt.error) {
      const data = firstAttempt.data as LiveStreamSettingsPayload | null;
      if (data) {
        writePersistedLiveStreamSettings(data);
      }
      return { data, error: null };
    }

    if (isInvalidColumnError(firstAttempt.error)) {
      useMinimalLiveStreamSettingsColumns = true;
      const fallback = await supabase
        .from("live_stream_settings")
        .select(LIVE_STREAM_SETTINGS_MINIMAL_COLUMNS)
        .limit(1)
        .maybeSingle();

      if (fallback.error) {
        return { data: null, error: fallback.error };
      }

      const data = fallback.data as LiveStreamSettingsPayload | null;
      if (data) {
        writePersistedLiveStreamSettings(data);
      }
      return { data, error: null };
    }

    return { data: null, error: firstAttempt.error };
  } catch (error) {
    return { data: null, error };
  }

  const persisted = readPersistedLiveStreamSettings();
  return { data: persisted, error: null };
}

export async function saveLiveStreamSettings(
  payload: Partial<LiveStreamSettingsPayload>,
  settingsId?: string,
): Promise<{
  data: LiveStreamSettingsPayload | null;
  error: any | null;
}> {
  const fullPayload = {
    stream_url: payload.stream_url,
    stream_type: payload.stream_type,
    is_live: payload.is_live,
    title: payload.title,
    description: payload.description,
    viewer_count: payload.viewer_count,
    source_name: payload.source_name,
    backup_stream_url: payload.backup_stream_url,
    source_notes: payload.source_notes,
    manual_override: payload.manual_override,
    manual_live: payload.manual_live,
    media_server_url: payload.media_server_url,
    media_server_path: payload.media_server_path,
    rtmp_url: payload.rtmp_url,
    rtmp_stream_key: payload.rtmp_stream_key,
    camera_username: payload.camera_username,
    camera_password: payload.camera_password,
    auto_failover: payload.auto_failover,
    recording_enabled: payload.recording_enabled,
    is_primary: payload.is_primary,
    priority: payload.priority,
    stream_status: payload.stream_status,
    health_summary: payload.health_summary,
    updated_at: new Date().toISOString(),
  };

  const minimalPayload = {
    stream_url: payload.stream_url,
    stream_type: payload.stream_type,
    is_live: payload.is_live,
    title: payload.title,
    description: payload.description,
    viewer_count: payload.viewer_count,
    updated_at: new Date().toISOString(),
  };

  const performQuery = async (dataPayload: Record<string, any>) => {
    if (settingsId) {
      return supabase
        .from("live_stream_settings")
        .update(dataPayload)
        .eq("id", settingsId)
        .select()
        .maybeSingle();
    }

    return supabase
      .from("live_stream_settings")
      .insert(dataPayload)
      .select()
      .maybeSingle();
  };

  const attempt = await performQuery(useMinimalLiveStreamSettingsColumns ? minimalPayload : fullPayload);
  if (!attempt.error) {
    const data = attempt.data as LiveStreamSettingsPayload | null;
    if (data) {
      writePersistedLiveStreamSettings(data);
    }
    return { data, error: null };
  }

  if (isInvalidColumnError(attempt.error)) {
    useMinimalLiveStreamSettingsColumns = true;
    const fallback = await performQuery(minimalPayload);
    if (fallback.error) {
      writePersistedLiveStreamSettings({ ...payload });
      return { data: null, error: fallback.error };
    }

    const data = fallback.data as LiveStreamSettingsPayload | null;
    if (data) {
      writePersistedLiveStreamSettings(data);
    }
    return { data, error: null };
  }

  return { data: null, error: attempt.error };
}

export interface NormalizedLiveStreamSettings {
  streamUrl: string;
  streamType: LiveStreamType;
  isLive: boolean;
  title: string;
  description: string;
  viewerCount: number;
  sourceName: string;
  backupStreamUrl: string;
  sourceNotes: string;
  manualOverride: boolean;
  manualLive: boolean;
  mediaServerUrl: string;
  mediaServerPath: string;
  rtmpUrl: string;
  rtmpStreamKey: string;
  cameraUsername: string;
  cameraPassword: string;
  autoFailover: boolean;
  recordingEnabled: boolean;
  isPrimary: boolean;
  priority: number;
  streamStatus: string;
  healthSummary: string;
}

export interface ResolvedLiveStreamState {
  isLive: boolean;
  reason: "manual" | "schedule" | "offline";
}

export interface LiveStreamEndpoints {
  hlsUrl: string;
  hlsManifestUrl: string;
  rtmpPublishUrl: string;
  rtmpStreamKey: string;
  whipPublishUrl: string;
  rtspPublishUrl: string;
  rtspPlaybackUrl: string;
}

export const buildLiveStreamEndpoints = ({
  mediaServerUrl,
  mediaServerPath,
  rtmpUrl,
  rtmpStreamKey,
}: {
  mediaServerUrl?: string | null;
  mediaServerPath?: string | null;
  rtmpUrl?: string | null;
  rtmpStreamKey?: string | null;
}): LiveStreamEndpoints => {
  const serverBase = (mediaServerUrl || "").trim().replace(/\/+$/, "");
  const pathKey = (mediaServerPath || "").trim().replace(/^\/+|\/+$/g, "");
  const normalizedPath = pathKey || "live";
  const hlsBase = serverBase ? `${serverBase}/${normalizedPath}` : "";
  const hlsUrl = hlsBase ? `${hlsBase}/index.m3u8` : "";
  const publishUrl = (rtmpUrl || (serverBase ? `rtmp://${serverBase.replace(/^https?:\/\//i, "")}/live` : "")).trim();
  const streamKey = (rtmpStreamKey || "").trim();
  const whipPublishUrl = serverBase ? `${serverBase}/${normalizedPath}?tx=whip` : "";
  const rtspPublishUrl = serverBase ? `rtsp://${serverBase.replace(/^https?:\/\//i, "")}/${normalizedPath}` : "";
  const rtspPlaybackUrl = serverBase ? `rtsp://${serverBase.replace(/^https?:\/\//i, "")}/${normalizedPath}` : "";

  return {
    hlsUrl,
    hlsManifestUrl: hlsUrl,
    rtmpPublishUrl: publishUrl,
    rtmpStreamKey: streamKey,
    whipPublishUrl,
    rtspPublishUrl,
    rtspPlaybackUrl,
  };
};

export const validateHlsStream = (url?: string | null): { isValid: boolean; issues: string[]; status: string; summary: string } => {
  const value = (url || "").trim();
  const issues: string[] = [];

  if (!value) {
    issues.push("No HLS URL configured.");
  } else {
    if (!/^https:\/\//i.test(value)) {
      issues.push("HLS URLs must use HTTPS.");
    }

    if (!/\.m3u8(\?.*)?$/i.test(value)) {
      issues.push("HLS URLs must end in .m3u8");
    }

    if (!/^https:\/\/[^\s]+$/i.test(value)) {
      issues.push("HLS URL must be a valid absolute HTTPS URL.");
    }
  }

  const isValid = issues.length === 0;
  const summary = isValid
    ? "The HLS stream endpoint is reachable and ready for browser playback."
    : `The HLS stream endpoint needs attention: ${issues.join(" ")}`;

  return {
    isValid,
    issues,
    status: isValid ? "ready" : "invalid",
    summary,
  };
};

export const normalizeLiveStreamSettings = (
  payload?: LiveStreamSettingsPayload | null,
): NormalizedLiveStreamSettings => {
  const value = payload ?? {};
  const title = value.title?.trim() || "Live Darshan";
  const description = value.description?.trim() || "Watch the live darshan from Kailash Mahadev Temple Agra";
  const streamTypeValue = normalizeStreamType(value.stream_type);

  return {
    streamUrl: value.stream_url?.trim() || "",
    streamType: streamTypeValue as LiveStreamType,
    isLive: Boolean(value.is_live),
    title,
    description,
    viewerCount: Number(value.viewer_count) || 0,
    sourceName: value.source_name?.trim() || "Primary Camera",
    backupStreamUrl: value.backup_stream_url?.trim() || "",
    sourceNotes: value.source_notes?.trim() || "",
    manualOverride: Boolean(value.manual_override),
    manualLive: Boolean(value.manual_live),
    mediaServerUrl: value.media_server_url?.trim() || "",
    mediaServerPath: value.media_server_path?.trim() || "",
    rtmpUrl: value.rtmp_url?.trim() || "",
    rtmpStreamKey: value.rtmp_stream_key?.trim() || "",
    cameraUsername: value.camera_username?.trim() || "",
    cameraPassword: value.camera_password?.trim() || "",
    autoFailover: Boolean(value.auto_failover),
    recordingEnabled: Boolean(value.recording_enabled),
    isPrimary: Boolean(value.is_primary),
    priority: Number(value.priority) || 1,
    streamStatus: value.stream_status?.trim() || "offline",
    healthSummary: value.health_summary?.trim() || "",
  };
};

export const resolveLiveStreamState = ({
  isLive,
  manualOverride,
  manualLive,
  scheduleInWindow,
}: {
  isLive: boolean;
  manualOverride: boolean;
  manualLive: boolean;
  scheduleInWindow: boolean;
}): ResolvedLiveStreamState => {
  if (manualOverride) {
    return {
      isLive: manualLive,
      reason: manualLive ? "manual" : "offline",
    };
  }

  if (scheduleInWindow) {
    return {
      isLive: isLive || scheduleInWindow,
      reason: "schedule",
    };
  }

  return {
    isLive: false,
    reason: "offline",
  };
};
