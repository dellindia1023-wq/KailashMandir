import { useEffect, useState } from "react";
import { Video, Users, Wifi, Clock, Share2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HLSVideoPlayer from "@/components/HLSVideoPlayer";
import { useLanguage } from "@/contexts/LanguageContext";
import { DarshanScheduleSlot, formatScheduleTime, getDarshanWindowStatus, DarshanWindowStatus } from "@/lib/liveDarshanSchedule";
import { fetchLiveStreamSettings, normalizeLiveStreamSettings, resolveLiveStreamState } from "@/lib/liveStreamSettings";

type LiveStreamType = "hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc";

interface StreamSettings {
  stream_url: string;
  is_live: boolean;
  title: string;
  description: string | null;
  viewer_count: number;
  stream_type: LiveStreamType;
  source_name: string;
  backup_stream_url: string;
  source_notes: string;
  manual_override: boolean;
  manual_live: boolean;
}

interface LiveDarshanProps {
  simple?: boolean;
}

const LiveDarshan = ({ simple = false }: LiveDarshanProps) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<StreamSettings>({
    stream_url: "",
    is_live: false,
    title: "Live Darshan",
    description: "Watch the live darshan from Kailash Mahadev Temple Agra",
    viewer_count: 0,
    stream_type: "hls",
    source_name: "Primary Camera",
    backup_stream_url: "",
    source_notes: "",
    manual_override: false,
    manual_live: false,
  });
  const [copied, setCopied] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<DarshanScheduleSlot[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<DarshanWindowStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      const { data, error } = await fetchLiveStreamSettings();

      if (!isMounted) return;
      if (error) {
        setLoadError("Unable to load live stream settings.");
        return;
      }

      setLoadError(null);
      if (data) {
        const normalized = normalizeLiveStreamSettings(data as any);
        setSettings({
          stream_url: normalized.streamUrl,
          is_live: normalized.isLive,
          title: normalized.title,
          description: normalized.description,
          viewer_count: normalized.viewerCount,
          stream_type: normalized.streamType as any,
          source_name: normalized.sourceName,
          backup_stream_url: normalized.backupStreamUrl,
          source_notes: normalized.sourceNotes,
          manual_override: normalized.manualOverride,
          manual_live: normalized.manualLive,
        });
      }
    };

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from("darshan_schedule")
        .select("day_of_week, start_time, end_time, is_active, label")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (!isMounted) return;
      if (error) {
        setLoadError("Unable to load darshan schedule.");
        return;
      }

      setLoadError(null);
      const slots = (data || []) as DarshanScheduleSlot[];
      setScheduleSlots(slots);
      setScheduleStatus(getDarshanWindowStatus(new Date(), slots));
    };

    const refreshData = () => {
      fetchSettings();
      fetchSchedule();
    };

    refreshData();
    const intervalId = window.setInterval(refreshData, 60_000);

    const channel = supabase.channel("live-stream-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_stream_settings" }, (payload) => {
        const d = payload.new as any;
        if (d) {
          const normalized = normalizeLiveStreamSettings(d);
          setSettings({
            stream_url: normalized.streamUrl,
            is_live: normalized.isLive,
            title: normalized.title,
            description: normalized.description,
            viewer_count: normalized.viewerCount,
            stream_type: normalized.streamType as any,
            source_name: normalized.sourceName,
            backup_stream_url: normalized.backupStreamUrl,
            source_notes: normalized.sourceNotes,
            manual_override: normalized.manualOverride,
            manual_live: normalized.manualLive,
          });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopyLink = async () => {
    if (!settings.stream_url) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setLoadError("Unable to copy live stream link.");
    }
  };

  const resolvedLiveState = resolveLiveStreamState({
    isLive: settings.is_live,
    manualOverride: settings.manual_override,
    manualLive: settings.manual_live,
    scheduleInWindow: Boolean(scheduleStatus?.isInSchedule),
  });

  const displayIsLive = resolvedLiveState.isLive;

  const effectiveStreamUrl = settings.stream_url;
  const effectiveBackupStreamUrl = settings.backup_stream_url;
  const effectiveTitle = settings.title;
  const effectiveDescription = settings.description;
  const effectiveStreamType = settings.stream_type;

  const statusDescription = displayIsLive
    ? settings.manual_override
      ? "Live now via manual override. The stream is active outside the scheduled window."
      : scheduleStatus?.isInSchedule
        ? `Live now during the ${scheduleStatus.currentSlot?.label || "current"} darshan window.`
        : "Live now via manual override. The stream is active outside the scheduled window."
    : scheduleStatus?.currentSlot
      ? `Scheduled for ${formatScheduleTime(scheduleStatus.currentSlot.start_time)}–${formatScheduleTime(scheduleStatus.currentSlot.end_time)}${scheduleStatus.currentSlot.label ? ` (${scheduleStatus.currentSlot.label})` : ""}.`
      : scheduleStatus?.nextSlot
        ? `Next live slot starts at ${formatScheduleTime(scheduleStatus.nextSlot.start_time)}.`
        : "The temple stream will appear during scheduled darshan hours.";

  const liveBadgeLabel = displayIsLive ? t("liveDarshan.liveNow") : scheduleStatus?.isInSchedule ? "Scheduled Live" : t("liveDarshan.currentlyOffline");

  return (
    <section className="py-10 sm:py-14 md:py-20 bg-gradient-to-b from-amber-50/40 via-background to-orange-50/20 dark:from-background dark:via-slate-950/60 dark:to-background text-foreground relative overflow-hidden border-t border-border/40">
      {/* Subtle slow ambient sacred light behind section - motion safe & non-interactive */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-4xl h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-0 motion-safe:animate-pulse-slow" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -top-10 right-1/4 w-80 h-80 bg-amber-400/5 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none -z-0 motion-safe:animate-pulse-slow" 
        style={{ animationDuration: "8s" }} 
        aria-hidden="true" 
      />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="space-y-6 sm:space-y-8">
          {/* Section Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Badge className={displayIsLive ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 font-semibold" : "bg-muted text-muted-foreground border-border px-3 py-1"}>
                  {displayIsLive ? (
                    <>
                      <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      {liveBadgeLabel}
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {liveBadgeLabel}
                    </>
                  )}
                </Badge>
                {displayIsLive && settings.viewer_count > 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/60 px-2.5 py-1">
                    <Users className="h-3 w-3 mr-1" />
                    {settings.viewer_count.toLocaleString()} devotees watching
                  </Badge>
                )}
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {t("liveDarshan.title")} <span className="text-gradient-sacred">{t("liveDarshan.titleHighlight")}</span>
              </h2>
              <p className="mt-1 text-sm md:text-base text-muted-foreground max-w-2xl">
                {statusDescription}
              </p>
            </div>

            {settings.stream_url && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="rounded-xl border-border/60 hover:bg-muted text-xs sm:text-sm font-medium shadow-sm"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  {copied ? t("liveDarshan.copied") : t("liveDarshan.copyLink")}
                </Button>
              </div>
            )}
          </div>

          {loadError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
              <p className="font-semibold">Live darshan stream status</p>
              <p className="mt-0.5">{loadError}</p>
            </div>
          )}

          {/* Single Focused Player Window with Refined Temple Border & Sacred Aura */}
          <div className="relative max-w-4xl mx-auto">
            {/* Subtle sacred ambient glow behind player window - respectful of reduced motion */}
            <div
              className="absolute -inset-1 sm:-inset-2 rounded-[2rem] bg-gradient-to-r from-amber-500/25 via-saffron/20 to-gold/30 blur-xl opacity-75 dark:opacity-60 -z-10 motion-safe:animate-pulse-slow pointer-events-none"
              aria-hidden="true"
            />

            {/* Sacred gradient border frame with restrained gold/saffron accents */}
            <div className="relative p-1.5 sm:p-2 rounded-[1.8rem] bg-gradient-to-tr from-gold/60 via-saffron/40 to-gold/70 dark:from-gold/70 dark:via-amber-500/40 dark:to-gold/80 shadow-[0_20px_50px_rgba(212,143,24,0.14)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-gold/30">
              <div className="relative rounded-[1.35rem] overflow-hidden bg-black aspect-video ring-1 ring-black/20">
                <HLSVideoPlayer
                  streamUrl={effectiveStreamUrl}
                  backupStreamUrl={effectiveBackupStreamUrl}
                  isLive={displayIsLive}
                  title={effectiveTitle}
                  viewerCount={settings.viewer_count}
                  streamType={effectiveStreamType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveDarshan;
