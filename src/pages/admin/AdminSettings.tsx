import { useState, useEffect } from "react";
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
import { Video, Wifi, WifiOff, Save, Loader2, Youtube, Upload, Radio } from "lucide-react";
import DonationSettingsPanel from "@/components/admin/DonationSettingsPanel";

type StreamType = "hls" | "youtube" | "upload";

const STREAM_TYPE_LABELS: Record<StreamType, { label: string; icon: React.ReactNode; desc: string; placeholder: string }> = {
  hls: {
    label: "HLS / CCTV Stream",
    icon: <Radio className="h-4 w-4" />,
    desc: "Enter the HLS (.m3u8) URL from your CCTV/NVR/media server.",
    placeholder: "https://your-server.com/live/temple.m3u8",
  },
  youtube: {
    label: "YouTube Live",
    icon: <Youtube className="h-4 w-4" />,
    desc: "Paste a YouTube Live or regular video URL. Supports youtube.com/live/..., youtube.com/watch?v=..., and youtu.be/... formats.",
    placeholder: "https://www.youtube.com/live/abcdefghijk",
  },
  upload: {
    label: "Uploaded Video URL",
    icon: <Upload className="h-4 w-4" />,
    desc: "Paste a direct video file URL (.mp4, .webm). Useful for pre-recorded darshan playback when stream is unavailable.",
    placeholder: "https://storage.example.com/darshan-replay.mp4",
  },
};

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamType, setStreamType] = useState<StreamType>("hls");
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState("Live Darshan");
  const [description, setDescription] = useState("");
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("live_stream_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load live stream settings");
      }

      const settings = data ?? null;
      if (settings) {
        setSettingsId(settings.id);
        setStreamUrl(settings.stream_url);
        setStreamType(((settings as any).stream_type as StreamType) || "hls");
        setIsLive(settings.is_live);
        setTitle(settings.title);
        setDescription(settings.description || "");
        setViewerCount(settings.viewer_count);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("live_stream_settings")
          .insert({
            stream_url: "",
            stream_type: "hls",
            is_live: false,
            title: "Live Darshan",
            description: "",
            viewer_count: 0,
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (insertError || !inserted) {
          toast.error("Unable to initialize live stream settings");
        } else {
          setSettingsId(inserted.id);
          setStreamUrl(inserted.stream_url);
          setStreamType(((inserted as any).stream_type as StreamType) || "hls");
          setIsLive(inserted.is_live);
          setTitle(inserted.title);
          setDescription(inserted.description || "");
          setViewerCount(inserted.viewer_count);
        }
      }

      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    if (!settingsId) {
      const { data: inserted, error } = await supabase
        .from("live_stream_settings")
        .insert({
          stream_url: streamUrl,
          stream_type: streamType,
          is_live: isLive,
          title,
          description,
          viewer_count: viewerCount,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error || !inserted) {
        toast.error("Failed to save settings: " + (error?.message || "Unable to insert settings"));
      } else {
        setSettingsId(inserted.id);
        toast.success("Live stream settings created!");
      }

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("live_stream_settings")
      .update({
        stream_url: streamUrl,
        stream_type: streamType,
        is_live: isLive,
        title,
        description,
        viewer_count: viewerCount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", settingsId);

    if (error) {
      toast.error("Failed to save settings: " + error.message);
    } else {
      toast.success("Live stream settings updated!");
    }
    setSaving(false);
  };

  const handleToggleLive = async (checked: boolean) => {
    setIsLive(checked);

    if (!settingsId) {
      const { data: inserted, error } = await supabase
        .from("live_stream_settings")
        .insert({
          stream_url: streamUrl,
          stream_type: streamType,
          is_live: checked,
          title,
          description,
          viewer_count: viewerCount,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error || !inserted) {
        toast.error("Failed to toggle live status");
        setIsLive(!checked);
        return;
      }

      setSettingsId(inserted.id);
      toast.success(checked ? "Stream is now LIVE! 🔴" : "Stream set to offline");
      return;
    }

    const { error } = await supabase
      .from("live_stream_settings")
      .update({ is_live: checked, updated_at: new Date().toISOString() })
      .eq("id", settingsId);
    if (error) {
      toast.error("Failed to toggle live status");
      setIsLive(!checked);
    } else {
      toast.success(checked ? "Stream is now LIVE! 🔴" : "Stream set to offline");
    }
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

          {/* Stream URL */}
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
            <Label htmlFor="viewer-count">Viewer Count (display)</Label>
            <Input
              id="viewer-count"
              type="number"
              min={0}
              value={viewerCount}
              onChange={(e) => setViewerCount(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Set the displayed viewer count. Set to 0 to hide.</p>
          </div>

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
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
            <p className="font-semibold text-foreground mb-1 flex items-center gap-2"><Radio className="h-4 w-4" /> Option 1: CCTV / HLS Stream</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Configure your CCTV camera or NVR to output an RTSP stream.</li>
              <li>Use a media server (MediaMTX, Nginx-RTMP, or NVR built-in) to convert RTSP → HLS.</li>
              <li>Paste the <code>.m3u8</code> URL above and toggle "Go Live".</li>
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
            <p className="font-semibold text-foreground mb-1 flex items-center gap-2"><Upload className="h-4 w-4" /> Option 3: Uploaded Video</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Upload a video file (.mp4) to any cloud storage or temple CDN.</li>
              <li>Paste the direct video URL above.</li>
              <li>This plays as a loop — useful for pre-recorded darshan replays.</li>
            </ol>
          </div>
          <p className="text-xs border-l-2 border-gold pl-3 mt-4">
            💡 Most modern NVRs (Hikvision, Dahua, etc.) support direct HLS output. YouTube Live is the simplest option for temple staff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
