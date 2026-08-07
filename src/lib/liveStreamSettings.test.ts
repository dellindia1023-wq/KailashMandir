import { describe, expect, it } from "vitest";
import { normalizeLiveStreamSettings, buildLiveStreamEndpoints, validateHlsStream } from "./liveStreamSettings";

describe("normalizeLiveStreamSettings", () => {
  it("keeps RTSP stream type intact for direct camera feeds", () => {
    const normalized = normalizeLiveStreamSettings({
      stream_type: "rtsp",
      stream_url: "rtsp://camera.local:8554/live",
      title: "Temple RTSP Feed",
    });

    expect(normalized.streamType).toBe("rtsp");
    expect(normalized.streamUrl).toBe("rtsp://camera.local:8554/live");
    expect(normalized.title).toBe("Temple RTSP Feed");
  });

  it("preserves backend stream types internally while the admin UI only exposes three options", () => {
    const normalized = normalizeLiveStreamSettings({
      stream_type: "hls",
      stream_url: "https://example.com/live/temple/index.m3u8",
      title: "CCTV Stream",
    });

    expect(normalized.streamType).toBe("hls");
    expect(normalized.streamUrl).toBe("https://example.com/live/temple/index.m3u8");
  });

  it("preserves production streaming metadata for MediaMTX integrations", () => {
    const normalized = normalizeLiveStreamSettings({
      stream_type: "rtmp",
      stream_url: "https://example.com/live/temple/index.m3u8",
      media_server_url: "https://media.example.com",
      media_server_path: "temple",
      rtmp_url: "rtmp://media.example.com/live",
      rtmp_stream_key: "temple-key",
      auto_failover: true,
      recording_enabled: true,
      is_primary: true,
      priority: 1,
    });

    expect(normalized.streamType).toBe("rtmp");
    expect(normalized.mediaServerUrl).toBe("https://media.example.com");
    expect(normalized.autoFailover).toBe(true);
    expect(normalized.recordingEnabled).toBe(true);
    expect(normalized.isPrimary).toBe(true);
    expect(normalized.priority).toBe(1);
  });
});

describe("buildLiveStreamEndpoints", () => {
  it("builds MediaMTX playback and publish URLs from the configured server base URL", () => {
    const endpoints = buildLiveStreamEndpoints({
      mediaServerUrl: "https://media.example.com",
      mediaServerPath: "temple",
      rtmpUrl: "rtmp://media.example.com/live",
      rtmpStreamKey: "temple-key",
    });

    expect(endpoints.hlsUrl).toBe("https://media.example.com/temple/index.m3u8");
    expect(endpoints.rtmpPublishUrl).toBe("rtmp://media.example.com/live");
    expect(endpoints.rtmpStreamKey).toBe("temple-key");
    expect(endpoints.whipPublishUrl).toBe("https://media.example.com/temple?tx=whip");
  });
});

describe("validateHlsStream", () => {
  it("flags insecure and malformed HLS URLs", () => {
    const diagnostics = validateHlsStream("http://example.com/stream");

    expect(diagnostics.isValid).toBe(false);
    expect(diagnostics.issues).toContain("HLS URLs must use HTTPS.");
    expect(diagnostics.issues).toContain("HLS URLs must end in .m3u8");
  });
});
