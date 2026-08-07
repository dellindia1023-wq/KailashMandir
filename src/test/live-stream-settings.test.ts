import { describe, expect, it } from "vitest";
import { normalizeLiveStreamSettings, resolveLiveStreamState } from "@/lib/liveStreamSettings";

describe("live stream settings", () => {
  it("normalizes saved settings and preserves manual override values", () => {
    const settings = normalizeLiveStreamSettings({
      stream_url: "",
      stream_type: "mobile",
      is_live: false,
      title: "",
      description: null,
      viewer_count: 0,
      source_name: "North Camera",
      backup_stream_url: "https://example.com/backup.m3u8",
      source_notes: "Use this during the morning darshan.",
      manual_override: true,
      manual_live: true,
    });

    expect(settings.streamUrl).toBe("");
    expect(settings.streamType).toBe("mobile");
    expect(settings.title).toBe("Live Darshan");
    expect(settings.sourceName).toBe("North Camera");
    expect(settings.backupStreamUrl).toBe("https://example.com/backup.m3u8");
    expect(settings.manualOverride).toBe(true);
    expect(settings.manualLive).toBe(true);
  });

  it("uses the manual state when overrides are enabled", () => {
    const state = resolveLiveStreamState({
      isLive: false,
      manualOverride: true,
      manualLive: true,
      scheduleInWindow: false,
    });

    expect(state.isLive).toBe(true);
    expect(state.reason).toBe("manual");
  });

  it("falls back to the schedule window when no manual override is active", () => {
    const state = resolveLiveStreamState({
      isLive: false,
      manualOverride: false,
      manualLive: false,
      scheduleInWindow: true,
    });

    expect(state.isLive).toBe(true);
    expect(state.reason).toBe("schedule");
  });
});
