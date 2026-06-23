import { useEffect, useState } from "react";
import { Video, Users, Wifi, Clock, Share2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HLSVideoPlayer from "@/components/HLSVideoPlayer";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreamSettings {
  stream_url: string;
  is_live: boolean;
  title: string;
  description: string | null;
  viewer_count: number;
  stream_type: "hls" | "youtube" | "upload";
}

const LiveDarshan = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<StreamSettings>({
    stream_url: "",
    is_live: false,
    title: "Live Darshan",
    description: "Watch the live darshan from Kailash Mahadev Temple Agra",
    viewer_count: 0,
    stream_type: "hls",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("live_stream_settings")
        .select("stream_url, is_live, title, description, viewer_count, stream_type")
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;
      if (error) {
        console.error("Failed to load live stream settings:", error);
        return;
      }

      if (data) {
        setSettings({
          stream_url: data.stream_url,
          is_live: data.is_live,
          title: data.title,
          description: data.description,
          viewer_count: data.viewer_count,
          stream_type: data.stream_type || "hls",
        });
      }
    };

    const syncScheduleStatus = async () => {
      try {
        await supabase.functions.invoke("toggle-live-stream");
      } catch (syncError) {
        console.error("Live schedule sync failed:", syncError);
      } finally {
        fetchSettings();
      }
    };

    fetchSettings();
    syncScheduleStatus();
    intervalId = window.setInterval(syncScheduleStatus, 60_000);

    const channel = supabase.channel("live-stream-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_stream_settings" }, (payload) => {
        const d = payload.new as any;
        if (d)
          setSettings({
            stream_url: d.stream_url,
            is_live: d.is_live,
            title: d.title,
            description: d.description,
            viewer_count: d.viewer_count,
            stream_type: d.stream_type || "hls",
          });
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
    } catch (error) {
      console.error("Unable to copy live stream link", error);
    }
  };

  return (
    <section className="py-10 md:py-24 bg-gradient-to-br from-maroon to-maroon-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 md:w-64 h-32 md:h-64 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-saffron/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] items-start">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Badge className="bg-gold/20 text-gold border-gold/30">
                {settings.is_live ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-destructive mr-2 inline-block animate-ping" />
                    {t("liveDarshan.liveNow")}
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    {t("liveDarshan.currentlyOffline")}
                  </>
                )}
              </Badge>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-white/80 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">{t("liveDarshan.streamType")}</p>
                  <p className="mt-1 font-semibold text-white">{settings.stream_type.toUpperCase()}</p>
                </div>
                <div className="rounded-3xl bg-white/10 px-4 py-3 text-sm text-white/80 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">{t("liveDarshan.viewerCount")}</p>
                  <p className="mt-1 font-semibold text-white">{settings.viewer_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {t("liveDarshan.title")} <span className="text-gold">{t("liveDarshan.titleHighlight")}</span>
              </h2>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-3xl">
                {settings.description ?? t("liveDarshan.subtitle")}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/50 p-4 md:p-6 shadow-2xl">
              <HLSVideoPlayer
                streamUrl={settings.stream_url}
                isLive={settings.is_live}
                title={settings.title}
                viewerCount={settings.viewer_count}
                streamType={settings.stream_type}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-4 text-center">
                  <Video className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-gold" />
                  <p className="font-heading font-bold text-lg text-primary-foreground">{t("liveDarshan.watchLive")}</p>
                  <p className="text-[11px] text-primary-foreground/70 mt-1">{t("liveDarshan.highQuality")}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-gold" />
                  <p className="font-heading font-bold text-lg text-primary-foreground">{t("liveDarshan.blessings")}</p>
                  <p className="text-[11px] text-primary-foreground/70 mt-1">{t("liveDarshan.blessingsFromAnywhere")}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-gold" />
                  <p className="font-heading font-bold text-lg text-primary-foreground">24/7</p>
                  <p className="text-[11px] text-primary-foreground/70 mt-1">{t("liveDarshan.neverMiss")}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="bg-white/5 border border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("liveDarshan.featureBadge")}</p>
                <h3 className="mt-3 text-2xl font-heading font-bold text-white">{t("liveDarshan.featureTitle")}</h3>
                <p className="mt-4 text-sm leading-6 text-white/75">{t("liveDarshan.featureSubtitle")}</p>
                <div className="mt-6 grid gap-3">
                  {[
                    t("liveDarshan.featurePoint1"),
                    t("liveDarshan.featurePoint2"),
                    t("liveDarshan.featurePoint3"),
                  ].map((point) => (
                    <div key={point} className="rounded-3xl bg-black/30 p-4 border border-white/10 text-sm text-white/80">
                      {point}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-white/80">
                  <Share2 className="h-5 w-5 text-gold" />
                  <p className="text-sm font-semibold text-white">{t("liveDarshan.shareLive")}</p>
                </div>
                <Button size="lg" className="w-full bg-gold text-accent-foreground hover:bg-gold-light" onClick={handleCopyLink}>
                  {copied ? t("liveDarshan.copied") : t("liveDarshan.copyLink")}
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <a href="https://wa.me/?text=Watch%20live%20darshan%20from%20Kailash%20Mahadev%20Temple%20Agra%20https://kailashmahadev.in/live-darshan" target="_blank" rel="noreferrer">
                    {t("liveDarshan.shareWithFamily")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default LiveDarshan;
