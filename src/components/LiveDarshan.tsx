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
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

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
    const intervalId = window.setInterval(syncScheduleStatus, 60_000);

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
                <div className="rounded-2xl bg-gold/10 dark:bg-slate-800/50 px-6 py-3 text-sm border border-gold/30 dark:border-gold/40 shadow-md">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold/80 font-bold">{t("liveDarshan.streamType")}</p>
                  <p className="mt-1 font-bold text-gold text-base">{settings.stream_type.toUpperCase()}</p>
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
                {settings.description ?? t("liveDarshan.subtitle")}
              </p>
            </div>

            <div className="rounded-3xl border-4 border-gold/40 dark:border-gold/50 bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4 md:p-8 shadow-lg hover:shadow-2xl hover:shadow-gold/30 dark:hover:shadow-gold/40 transition-all duration-300">
              <HLSVideoPlayer
                streamUrl={settings.stream_url}
                isLive={settings.is_live}
                title={settings.title}
                viewerCount={settings.viewer_count}
                streamType={settings.stream_type}
              />
            </div>

            {!simple && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Card className="bg-gold/5 dark:bg-slate-800/60 border-2 border-gold/30 dark:border-gold/50 hover:border-gold/50 dark:hover:border-gold/70 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-flex p-3 rounded-2xl bg-gold/10 dark:bg-gold/30 group-hover:bg-gold/20 dark:group-hover:bg-gold/40 transition-all">
                      <Video className="h-6 w-6 text-gold" />
                    </div>
                    <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{t("liveDarshan.watchLive")}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium">{t("liveDarshan.highQuality")}</p>
                  </CardContent>
                </Card>
                <Card className="bg-saffron/5 dark:bg-slate-800/60 border-2 border-saffron/30 dark:border-saffron/50 hover:border-saffron/50 dark:hover:border-saffron/70 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-flex p-3 rounded-2xl bg-saffron/10 dark:bg-saffron/30 group-hover:bg-saffron/20 dark:group-hover:bg-saffron/40 transition-all">
                      <Sparkles className="h-6 w-6 text-saffron" />
                    </div>
                    <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{t("liveDarshan.blessings")}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium">{t("liveDarshan.blessingsFromAnywhere")}</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange/5 dark:bg-slate-800/60 border-2 border-orange/30 dark:border-orange/50 hover:border-orange/50 dark:hover:border-orange/70 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-flex p-3 rounded-2xl bg-orange/10 dark:bg-orange/30 group-hover:bg-orange/20 dark:group-hover:bg-orange/40 transition-all">
                      <Users className="h-6 w-6 text-orange" />
                    </div>
                    <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">24/7</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium">{t("liveDarshan.neverMiss")}</p>
                  </CardContent>
                </Card>
              </div>
            )}
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
