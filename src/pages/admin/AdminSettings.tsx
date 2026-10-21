import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DarshanScheduleManager from "@/components/admin/DarshanScheduleManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Video, Wifi, WifiOff, Save, Loader2, Youtube, Upload, Radio, Camera, CalendarClock, Server, ShieldCheck, HardDriveUpload, AlertCircle, CheckCircle2, PlayCircle, StopCircle } from "lucide-react";
import DonationSettingsPanel from "@/components/admin/DonationSettingsPanel";
import { DarshanScheduleSlot, DarshanWindowStatus, formatScheduleTime, getDarshanWindowStatus } from "@/lib/liveDarshanSchedule";
import { buildLiveStreamEndpoints, fetchLiveStreamSettings, saveLiveStreamSettings, normalizeLiveStreamSettings, validateHlsStream } from "@/lib/liveStreamSettings";

type StreamType = "youtube" | "hls" | "rtsp" | "mobile";

type BackendStreamType = "hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc";

const STREAM_TYPE_LABELS: Record<StreamType, { label: string; icon: React.ReactNode; desc: string; placeholder: string }> = {
  youtube: {
    label: "YouTube Live / Video",
    icon: <Youtube className="h-4 w-4" />,
    desc: "Paste a YouTube Live stream or video URL (youtube.com/live/..., watch?v=..., or youtu.be/...). Plays smoothly across all browsers.",
    placeholder: "https://www.youtube.com/live/abcdefghijk",
  },
  hls: {
    label: "HLS Stream (.m3u8)",
    icon: <Radio className="h-4 w-4" />,
    desc: "Direct HTTP Live Streaming (.m3u8) feed from a media server or CDN. Plays natively in browser via HLS.js.",
    placeholder: "https://your-server.com/live/stream.m3u8",
  },
  rtsp: {
    label: "CCTV / RTSP Camera",
    icon: <Video className="h-4 w-4" />,
    desc: "Direct camera RTSP endpoint. Direct RTSP feeds require transcoding to HLS/WebRTC for web browsers.",
    placeholder: "rtsp://camera.local:8554/live",
  },
  mobile: {
    label: "Mobile Camera",
    icon: <Camera className="h-4 w-4" />,
    desc: "Grant camera permission on your phone to preview the live darshan feed locally.",
    placeholder: "Mobile camera stream preview",
  },
};

const normalizeAdminStreamType = (value?: string | null): StreamType => {
  const normalized = (value || "youtube").trim().toLowerCase();
  if (normalized === "youtube" || normalized === "hls" || normalized === "mobile" || normalized === "rtsp") {
    return normalized as StreamType;
  }

  return "youtube";
};

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamType, setStreamType] = useState<StreamType>("rtsp");
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState("Live Darshan");
  const [description, setDescription] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [sourceName, setSourceName] = useState("Primary Camera");
  const [backupStreamUrl, setBackupStreamUrl] = useState("");
  const [sourceNotes, setSourceNotes] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualLive, setManualLive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("prompt");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [mobilePublishStatus, setMobilePublishStatus] = useState<"idle" | "publishing" | "published" | "error">("idle");
  const [mobilePublishError, setMobilePublishError] = useState<string | null>(null);
  const [mediaServerUrl, setMediaServerUrl] = useState("");
  const [mediaServerPath, setMediaServerPath] = useState("live");
  const [rtmpUrl, setRtmpUrl] = useState("");
  const [rtmpStreamKey, setRtmpStreamKey] = useState("");
  const [cameraUsername, setCameraUsername] = useState("");
  const [cameraPassword, setCameraPassword] = useState("");
  const [autoFailover, setAutoFailover] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [isPrimary, setIsPrimary] = useState(true);
  const [priority, setPriority] = useState(1);
  const [streamStatus, setStreamStatus] = useState("offline");
  const [healthSummary, setHealthSummary] = useState("");
  const [scheduleSlots, setScheduleSlots] = useState<DarshanScheduleSlot[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<DarshanWindowStatus | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mobilePublishStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await fetchLiveStreamSettings();

      if (error) {
        toast.error("Failed to load live stream settings");
      }

      const settings = data ?? null;
      const normalizedSettings = normalizeLiveStreamSettings(settings as any);
      if (settings) {
        setSettingsId((settings as any).id || null);
        setStreamUrl(normalizedSettings.streamUrl);
        setStreamType(normalizeAdminStreamType(normalizedSettings.streamType));
        setIsLive(normalizedSettings.isLive);
        setTitle(normalizedSettings.title);
        setDescription(normalizedSettings.description);
        setViewerCount(normalizedSettings.viewerCount);
        setSourceName(normalizedSettings.sourceName);
        setBackupStreamUrl(normalizedSettings.backupStreamUrl);
        setSourceNotes(normalizedSettings.sourceNotes);
        setManualOverride(normalizedSettings.manualOverride);
        setManualLive(normalizedSettings.manualLive);
        setMediaServerUrl(normalizedSettings.mediaServerUrl);
        setMediaServerPath(normalizedSettings.mediaServerPath || "live");
        setRtmpUrl(normalizedSettings.rtmpUrl);
        setRtmpStreamKey(normalizedSettings.rtmpStreamKey);
        setCameraUsername(normalizedSettings.cameraUsername);
        setCameraPassword(normalizedSettings.cameraPassword);
        setAutoFailover(normalizedSettings.autoFailover);
        setRecordingEnabled(normalizedSettings.recordingEnabled);
        setIsPrimary(normalizedSettings.isPrimary);
        setPriority(normalizedSettings.priority || 1);
        setStreamStatus(normalizedSettings.streamStatus || "offline");
        setHealthSummary(normalizedSettings.healthSummary || "");
      } else {
        const { data: inserted, error: insertError } = await saveLiveStreamSettings({
          stream_url: "",
          stream_type: "rtsp",
          is_live: false,
          title: "Live Darshan",
          description: "",
          viewer_count: 0,
          source_name: "Primary Camera",
          backup_stream_url: "",
          source_notes: "",
          manual_override: false,
          manual_live: false,
        });

        if (insertError || !inserted) {
          toast.error("Unable to initialize live stream settings");
        } else {
          setSettingsId((inserted as any).id || null);
          setStreamUrl(inserted.stream_url || "");
          setStreamType(((inserted as any).stream_type as StreamType) || "rtsp");
          setIsLive(inserted.is_live || false);
          setTitle(inserted.title || "Live Darshan");
          setDescription(inserted.description || "");
          setViewerCount(inserted.viewer_count || 0);
          setSourceName((inserted as any).source_name || "Primary Camera");
          setBackupStreamUrl((inserted as any).backup_stream_url || "");
          setSourceNotes((inserted as any).source_notes || "");
          setManualOverride(Boolean((inserted as any).manual_override));
          setManualLive(Boolean((inserted as any).manual_live));
        }
      }

      setLoading(false);
    };

    const fetchScheduleState = async () => {
      const { data, error } = await supabase
        .from("darshan_schedule")
        .select("day_of_week, start_time, end_time, is_active, label")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (!error) {
        const slots = (data || []) as DarshanScheduleSlot[];
        setScheduleSlots(slots);
        setScheduleStatus(getDarshanWindowStatus(new Date(), slots));
      }
    };

    fetch();
    fetchScheduleState();
    const intervalId = window.setInterval(fetchScheduleState, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !cameraStream) return;
    videoRef.current.srcObject = cameraStream;
    videoRef.current.play().catch(() => {});
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [cameraStream]);

  const handleSave = async () => {
    setSaving(true);

    const nextStreamUrl = streamUrl.trim();
    const nextStreamStatus = isLive ? "ready" : "offline";
    const nextHealthSummary = isLive
      ? "The live darshan stream is active and configured for browser playback."
      : "Stream is currently offline.";

    const payload = {
      stream_url: nextStreamUrl,
      stream_type: streamType,
      is_live: isLive,
      title: title.trim() || "Live Darshan",
      description: description.trim(),
      viewer_count: viewerCount,
    };

    const { data: saved, error } = await saveLiveStreamSettings(payload, settingsId || undefined);

    if (error || !saved) {
      toast.error("Failed to save settings: " + (error?.message || "Unable to save settings"));
    } else {
      setSettingsId((saved as any).id || settingsId);
      setIsLive(saved.is_live ?? isLive);
      setStreamStatus(nextStreamStatus);
      setHealthSummary(nextHealthSummary);
      toast.success(settingsId ? "Live stream settings updated successfully!" : "Live stream settings created successfully!");
    }

    setSaving(false);
  };

  const handleToggleLive = async (checked: boolean) => {
    setIsLive(checked);

    const payload = {
      stream_url: streamUrl.trim(),
      stream_type: streamType,
      is_live: checked,
      title: title.trim() || "Live Darshan",
      description: description.trim(),
      viewer_count: viewerCount,
    };

    const { data: saved, error } = await saveLiveStreamSettings(payload, settingsId || undefined);

    if (error || !saved) {
      toast.error("Failed to toggle live status");
      setIsLive(!checked);
    } else {
      if ((saved as any).id) {
        setSettingsId((saved as any).id);
      }
      setStreamStatus(checked ? "ready" : "offline");
      toast.success(checked ? "Stream is now LIVE! 🔴" : "Stream set to offline");
    }
  };

  const requestCameraPermission = async () => {
    setCameraLoading(true);
    setMobilePublishError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera publishing.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setCameraStream(stream);
      setCameraPermission("granted");

      const endpoints = buildLiveStreamEndpoints({
        mediaServerUrl,
        mediaServerPath,
        rtmpUrl,
        rtmpStreamKey,
      });
      if (!endpoints.whipPublishUrl) {
        setMobilePublishStatus("idle");
        setMobilePublishError("Camera preview is active. Configure a MediaMTX server URL and path to publish publicly.");
        setHealthSummary("Camera preview ready; MediaMTX/WHIP configuration is required for public publishing.");
        return;
      }

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionRef.current = pc;
      mobilePublishStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(endpoints.whipPublishUrl, {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
      });

      if (!response.ok) {
        throw new Error(`WHIP publish failed with status ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setMobilePublishStatus("published");
      setStreamStatus("publishing");
      setHealthSummary(`Publishing to ${endpoints.whipPublishUrl}`);
      toast.success("Mobile camera is now publishing to your MediaMTX server.");
    } catch (error: any) {
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        setMobilePublishStatus("error");
        setMobilePublishError("Camera permission denied. Please allow access to use mobile camera.");
        toast.error("Camera permission denied. Please allow access to use mobile camera.");
      } else {
        setMobilePublishStatus("error");
        setMobilePublishError(error?.message || "Unable to publish the mobile camera stream.");
        toast.error(error?.message || "Unable to publish the mobile camera stream.");
      }
      setCameraStream(null);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCameraPreview = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (mobilePublishStreamRef.current) {
      mobilePublishStreamRef.current.getTracks().forEach((track) => track.stop());
      mobilePublishStreamRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setMobilePublishStatus("idle");
    setStreamStatus("offline");
    setHealthSummary("Mobile camera publish stopped.");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentTypeInfo = STREAM_TYPE_LABELS[streamType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Live Darshan Settings
              </CardTitle>
              <CardDescription>
                Configure the live darshan stream — choose your source type below
              </CardDescription>
            </div>
            <Badge
              variant={isLive ? "destructive" : "secondary"}
              className={isLive ? "animate-pulse" : ""}
            >
              {isLive ? (
                <><Wifi className="h-3 w-3 mr-1" /> LIVE</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <Label className="text-base font-semibold">Go Live</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Toggle to start/stop the live darshan stream for visitors
              </p>
            </div>
            <Switch checked={isLive} onCheckedChange={handleToggleLive} />
          </div>

          <Separator />

          {/* Stream Type Selector */}
          <div className="space-y-2">
            <Label>Stream Source Type</Label>
            <Select value={streamType} onValueChange={(v) => setStreamType(v as StreamType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STREAM_TYPE_LABELS) as StreamType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {STREAM_TYPE_LABELS[type].icon}
                      {STREAM_TYPE_LABELS[type].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {streamType !== "mobile" ? (
            <div className="space-y-2">
              <Label htmlFor="stream-url" className="flex items-center gap-2">
                {currentTypeInfo.icon}
                {currentTypeInfo.label} URL
              </Label>
              <Input
                id="stream-url"
                placeholder={currentTypeInfo.placeholder}
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{currentTypeInfo.desc}</p>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-gold/20 bg-gold/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Mobile camera preview
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Grant camera access on your phone to preview the live feed locally.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={cameraStream ? stopCameraPreview : requestCameraPermission}
                  disabled={cameraLoading}
                >
                  {cameraLoading ? "Please wait..." : cameraStream ? "Stop Preview" : "Allow Camera"}
                </Button>
              </div>
              {cameraPermission === "denied" && (
                <p className="text-xs text-destructive">Camera permission denied. Please allow access from your browser settings.</p>
              )}
              {mobilePublishError && (
                <p className="text-xs text-amber-700 dark:text-amber-300">{mobilePublishError}</p>
              )}
              {cameraStream && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <video ref={videoRef} className="w-full h-64 object-cover bg-black" muted playsInline />
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="stream-title">Stream Title</Label>
            <Input
              id="stream-title"
              placeholder="Live Darshan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="stream-desc">Description</Label>
            <Textarea
              id="stream-desc"
              placeholder="Describe the live darshan stream..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Viewer Count */}
          <div className="space-y-2">
            <Label htmlFor="viewer-count">Viewer Count (displayed)</Label>
            <Input
              id="viewer-count"
              type="number"
              min={0}
              value={viewerCount}
              onChange={(e) => setViewerCount(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Community counter shown on the live stream badge. Set to 0 to hide.</p>
          </div>

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Current Darshan Window
          </CardTitle>
          <CardDescription>
            A quick view of the active schedule so the live stream can be aligned with temple timings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold">{scheduleStatus?.isInSchedule ? "Live window is active" : "Live window is not active"}</p>
              <p className="text-sm text-muted-foreground">
                {scheduleStatus?.currentSlot
                  ? `${scheduleStatus.currentSlot.label || "Current slot"}: ${formatScheduleTime(scheduleStatus.currentSlot.start_time)}–${formatScheduleTime(scheduleStatus.currentSlot.end_time)}`
                  : scheduleStatus?.nextSlot
                    ? `Next slot: ${scheduleStatus.nextSlot.label || "Darshan"} at ${formatScheduleTime(scheduleStatus.nextSlot.start_time)}`
                    : "No active slots are currently configured."}
              </p>
            </div>
            <Badge variant={scheduleStatus?.isInSchedule ? "destructive" : "secondary"}>
              {scheduleStatus?.isInSchedule ? "Open now" : "Offline window"}
            </Badge>
          </div>
          {scheduleSlots.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Upcoming slots today</p>
              <ul className="mt-2 space-y-1">
                {scheduleSlots.slice(0, 3).map((slot, index) => (
                  <li key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}-${slot.label || "darshan"}-${index}`} className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2">
                    <span>{slot.label || "Darshan"}</span>
                    <span className="font-mono text-xs">{formatScheduleTime(slot.start_time)}–{formatScheduleTime(slot.end_time)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <DonationSettingsPanel />

      <DarshanScheduleManager />

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <div>
            <p className="font-semibold text-foreground mb-1 flex items-center gap-2"><Radio className="h-4 w-4" /> Option 1: CCTV / RTSP Camera</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Configure your CCTV camera or NVR to expose an RTSP endpoint.</li>
              <li>Point the MediaMTX server at that camera feed so it can publish HLS for the public player.</li>
              <li>Select "CCTV / RTSP Camera" and paste the RTSP URL, then toggle "Go Live".</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1 flex items-center gap-2"><Youtube className="h-4 w-4" /> Option 2: YouTube Live</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Start a YouTube Live stream from the temple's YouTube channel.</li>
              <li>Copy the live stream URL (e.g. youtube.com/live/...).</li>
              <li>Select "YouTube Live" as the source type and paste the URL.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1 flex items-center gap-2"><Camera className="h-4 w-4" /> Option 3: Mobile Camera</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Use the phone camera preview and publish flow from the admin panel.</li>
              <li>Ensure the MediaMTX server URL and path are configured.</li>
              <li>Select "Mobile Camera" and start the publish session for the temple feed.</li>
            </ol>
          </div>
          <p className="text-xs border-l-2 border-gold pl-3 mt-4">
            💡 These three modes are now the supported production paths: YouTube Live, Mobile Camera, and CCTV/RTSP through MediaMTX.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
