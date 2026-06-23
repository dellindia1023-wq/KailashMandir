import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";

interface HLSVideoPlayerProps {
  streamUrl: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  streamType?: "hls" | "youtube" | "upload";
}

/** Extract YouTube video ID from various URL formats */
const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
};

const HLSVideoPlayer = ({
  streamUrl,
  isLive,
  title,
  viewerCount = 0,
  streamType = "hls",
}: HLSVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // HLS playback
  useEffect(() => {
    if (streamType !== "hls") return;
    const video = videoRef.current;
    if (!video || !streamUrl || !isLive) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(true);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls?.startLoad(), 5000);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
    }

    return () => { hls?.destroy(); };
  }, [streamUrl, isLive, streamType]);

  // Upload video playback
  useEffect(() => {
    if (streamType !== "upload") return;
    const video = videoRef.current;
    if (!video || !streamUrl || !isLive) return;
    video.src = streamUrl;
    video.load();
    video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [streamUrl, isLive, streamType]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  // Offline / not live state
  if (!isLive || !streamUrl) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-gold/30 shadow-2xl bg-maroon">
        <img src={shivaLingam} alt="Temple Darshan Preview" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-primary-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/20 border-2 border-primary-foreground/30 flex items-center justify-center">
            <WifiOff className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="font-heading text-xl font-bold mb-1">Stream Offline</p>
            <p className="text-sm text-primary-foreground/70 max-w-xs">
              Live darshan is not available right now. Please check back during darshan hours.
            </p>
          </div>
        </div>
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-muted/60 text-muted-foreground">
            <WifiOff className="h-3 w-3 mr-1" /> Offline
          </Badge>
        </div>
      </div>
    );
  }

  // YouTube embed
  if (streamType === "youtube") {
    const ytId = getYouTubeId(streamUrl);
    return (
      <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden border-4 border-gold/30 shadow-2xl bg-black">
        {ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Live Darshan"}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-primary-foreground">
            <p className="text-sm">Invalid YouTube URL</p>
          </div>
        )}
        {/* Live badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
          <Badge className="bg-destructive text-destructive-foreground animate-pulse">
            <span className="w-2 h-2 rounded-full bg-destructive-foreground mr-2 inline-block animate-ping" />
            LIVE
          </Badge>
          {viewerCount > 0 && (
            <Badge variant="secondary" className="bg-black/50 text-primary-foreground border-none">
              <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // HLS / Upload native video player
  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-2xl overflow-hidden border-4 border-gold/30 shadow-2xl bg-black group cursor-pointer"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={muted}
        playsInline
        autoPlay
        {...(streamType === "upload" ? { loop: true } : {})}
      />

      {error && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-primary-foreground gap-3">
          <WifiOff className="h-10 w-10 text-destructive" />
          <p className="font-heading font-semibold">Connection Lost</p>
          <p className="text-sm text-primary-foreground/70">Attempting to reconnect…</p>
        </div>
      )}

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Badge className="bg-destructive text-destructive-foreground animate-pulse">
          <span className="w-2 h-2 rounded-full bg-destructive-foreground mr-2 inline-block animate-ping" />
          LIVE
        </Badge>
        {viewerCount > 0 && (
          <Badge variant="secondary" className="bg-black/50 text-primary-foreground border-none">
            <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
          </Badge>
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9" onClick={togglePlay}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9" onClick={toggleMute}>
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            {title && <span className="text-primary-foreground text-sm font-medium ml-2">{title}</span>}
          </div>
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9" onClick={toggleFullscreen}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!playing && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-gold/30" />
            <div className="relative w-20 h-20 rounded-full bg-gold text-accent-foreground glow-gold flex items-center justify-center">
              <Play className="h-8 w-8 ml-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSVideoPlayer;
