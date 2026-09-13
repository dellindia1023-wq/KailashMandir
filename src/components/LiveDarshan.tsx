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

    const syncScheduleStatus = async () => {
      try {
        await supabase.functions.invoke("toggle-live-stream");
      } catch {
        setLoadError("Unable to synchronize live schedule status.");
      } finally {
        fetchSettings();
        fetchSchedule();
      }
    };

    fetchSettings();
    fetchSchedule();
    syncScheduleStatus();
    const intervalId = window.setInterval(syncScheduleStatus, 60_000);

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
    <section className="py-10 md:py-24 bg-maroon/70 dark:bg-maroon/95 text-foreground relative overflow-hidden border-t-4 border-gold/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(218,165,32,0.08),rgba(218,165,32,0))]" />
      <div className="absolute top-0 left-0 w-32 md:w-96 h-32 md:h-96 bg-gold/15 dark:bg-gold/20 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 right-0 w-48 md:w-[500px] h-48 md:h-[500px] bg-saffron/15 dark:bg-saffron/20 rounded-full blur-3xl opacity-40" />
      <div className="absolute top-1/2 left-1/3 w-64 md:w-96 h-64 md:h-96 bg-orange/10 dark:bg-orange/15 rounded-full blur-3xl opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] items-start">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Badge className="bg-gold/15 dark:bg-gold/10 text-gold border-gold/30 dark:border-gold/20 shadow-md">
                {displayIsLive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-destructive mr-2 inline-block animate-ping" />
                    {liveBadgeLabel}
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    {liveBadgeLabel}
                  </>
                )}
              </Badge>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-2xl bg-gold/10 dark:bg-slate-800/50 px-6 py-3 text-sm border border-gold/30 dark:border-gold/40 shadow-md">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold/80 font-bold">{t("liveDarshan.streamType")}</p>
                  <p className="mt-1 font-bold text-gold text-base">{effectiveStreamType.toUpperCase()}</p>
                </div>
                <div className="rounded-2xl bg-saffron/10 dark:bg-slate-800/50 px-6 py-3 text-sm border border-saffron/30 dark:border-saffron/40 shadow-md">
                  <p className="text-xs uppercase tracking-[0.25em] text-saffron/80 font-bold">{t("liveDarshan.viewerCount")}</p>
                  <p className="mt-1 font-bold text-saffron text-base">{settings.viewer_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 drop-shadow-lg">
                {t("liveDarshan.title")} <span className="bg-gradient-to-r from-gold via-orange to-saffron bg-clip-text text-transparent">{t("liveDarshan.titleHighlight")}</span>
              </h2>
              <p className="text-gray-800 dark:text-white/90 text-base md:text-lg max-w-3xl font-medium leading-relaxed">
                {effectiveDescription ?? t("liveDarshan.subtitle")}
              </p>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-3xl">
                {statusDescription}
              </p>
              {loadError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                  <p className="font-semibold">Live darshan unavailable</p>
                  <p className="mt-1 text-sm">{loadError} Please refresh the page or check your stream configuration.</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border-4 border-gold/40 dark:border-gold/50 bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4 md:p-8 shadow-lg hover:shadow-2xl hover:shadow-gold/30 dark:hover:shadow-gold/40 transition-all duration-300">
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

          {!simple && (
            <aside className="space-y-6">
            <Card className="bg-gold/5 dark:bg-slate-800/60 border-2 border-gold/30 dark:border-gold/50 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-7">
                <p className="text-xs uppercase tracking-[0.4em] text-gold font-bold">{t("liveDarshan.featureBadge")}</p>
                <h3 className="mt-4 text-2xl font-heading font-bold text-gray-900 dark:text-white drop-shadow">{t("liveDarshan.featureTitle")}</h3>
                <p className="mt-4 text-sm leading-6 text-gray-800 dark:text-gray-200 font-medium">{t("liveDarshan.featureSubtitle")}</p>
                <div className="mt-6 grid gap-3">
                  {[
                    t("liveDarshan.featurePoint1"),
                    t("liveDarshan.featurePoint2"),
                    t("liveDarshan.featurePoint3"),
                  ].map((point) => (
                    <div key={point} className="rounded-xl bg-white dark:bg-slate-700/60 p-4 border border-gold/20 dark:border-gold/40 text-sm text-gray-800 dark:text-gray-100 font-medium hover:bg-gold/5 dark:hover:bg-slate-600 transition-all hover:shadow-md">
                      {point}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-saffron/5 dark:bg-slate-800/60 border-2 border-saffron/30 dark:border-saffron/50 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-7 space-y-5">
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 rounded-lg bg-saffron/10 dark:bg-saffron/30">
                    <Share2 className="h-5 w-5 text-saffron" />
                  </div>
                  <p className="text-sm font-bold tracking-wide">{t("liveDarshan.shareLive")}</p>
                </div>
                <Button size="lg" className="w-full bg-gradient-to-r from-gold to-orange hover:from-gold/80 hover:to-orange/80 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl" onClick={handleCopyLink}>
                  {copied ? t("liveDarshan.copied") : t("liveDarshan.copyLink")}
                </Button>
                <Button asChild size="lg" className="w-full border-2 border-saffron/40 dark:border-saffron/60 text-gray-900 dark:text-white bg-white dark:bg-slate-700 hover:bg-saffron/5 dark:hover:bg-slate-600 font-bold text-base transition-all">
                  <a href="https://wa.me/?text=Watch%20live%20darshan%20from%20Kailash%20Mahadev%20Temple%20Agra%20https://kailashmahadev.in/live-darshan" target="_blank" rel="noreferrer">
                    {t("liveDarshan.shareWithFamily")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveDarshan;
