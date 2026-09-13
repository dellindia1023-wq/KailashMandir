import { useRef, useEffect, useState, useMemo } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";

interface HLSVideoPlayerProps {
  streamUrl: string;
  backupStreamUrl?: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  streamType?: "hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc";
}

const isYouTubeUrl = (url: string): boolean => /(?:youtu\.be\/|youtube\.com\/)/i.test(url);
const getYouTubeId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(parsed.hostname)) return null;
    if (parsed.hostname.toLowerCase() === "youtu.be") return parsed.pathname.slice(1).match(/^[a-zA-Z0-9_-]{11}/)?.[0] ?? null;
    const queryId = parsed.searchParams.get("v");
    if (queryId) return queryId.match(/^[a-zA-Z0-9_-]{11}/)?.[0] ?? null;
    return parsed.pathname.match(/\/(?:embed|v|live)\/([a-zA-Z0-9_-]{11})/)?.[1] ?? null;
  } catch {
    return null;
  }
};
const isHlsUrl = (url: string): boolean => /\.m3u8(\?|$)/i.test(url);
const isVideoFileUrl = (url: string): boolean => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || url.startsWith("blob:");

const HLSVideoPlayer = ({
  streamUrl,
  backupStreamUrl = "",
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
  const [activeStreamUrl, setActiveStreamUrl] = useState(streamUrl);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    setActiveStreamUrl(streamUrl);
    setError(false);
    setPlaying(false);
  }, [streamUrl, backupStreamUrl, streamType]);

  const resolvedStreamType = useMemo<"hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc">(() => {
    const url = activeStreamUrl?.trim() || streamUrl?.trim();
    if (isYouTubeUrl(url)) return "youtube";
    if (isHlsUrl(url)) return "hls";
    if (isVideoFileUrl(url)) return "upload";
    if (streamType === "rtmp") return "hls";
    if (streamType === "rtsp" && url.startsWith("rtsp://")) return "rtsp";
    if (streamType === "webrtc") return "webrtc";
    return streamType as "hls" | "youtube" | "upload" | "mobile" | "rtmp" | "rtsp" | "webrtc";
  }, [activeStreamUrl, streamUrl, streamType]);

  // HLS playback
  useEffect(() => {
    if (resolvedStreamType !== "hls") return;
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
      });
      hls.loadSource(activeStreamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (
            backupStreamUrl &&
            activeStreamUrl !== backupStreamUrl &&
            data.type === Hls.ErrorTypes.NETWORK_ERROR
          ) {
            setActiveStreamUrl(backupStreamUrl);
            return;
          }
          setError(true);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls?.startLoad(), 5000);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = activeStreamUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
    }

    return () => { hls?.destroy(); };
  }, [activeStreamUrl, resolvedStreamType, backupStreamUrl]);

  // Upload video playback
  useEffect(() => {
    if (resolvedStreamType !== "upload") return;
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;
    video.src = activeStreamUrl;
    video.load();
    video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [activeStreamUrl, resolvedStreamType]);

  // WebRTC playback for MediaMTX / WHEP endpoints
  useEffect(() => {
    if (resolvedStreamType !== "webrtc") return;
    const video = videoRef.current;
    const url = activeStreamUrl?.trim();
    if (!video || !url) return;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      video.srcObject = event.streams[0];
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    const start = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const response = await fetch(url, {
          method: "POST",
          body: offer.sdp,
          headers: {
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },
        });

        if (!response.ok) {
          throw new Error(`WebRTC connection failed with status ${response.status}`);
        }

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch {
        setError(true);
      }
    };

    start();

    return () => {
      pc.close();
      peerConnectionRef.current = null;
    };
  }, [activeStreamUrl, resolvedStreamType]);

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

  if (!isLive || !activeStreamUrl) {
    return (
      <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background dark:bg-card flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <WifiOff className="h-10 w-10 mx-auto mb-3" />
          <p className="font-heading text-xl font-bold">Stream Offline</p>
          <p className="text-sm mt-1">Live darshan is not available right now.</p>
        </div>
      </div>
    );
  }

  if (resolvedStreamType === "rtsp") {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background/95 dark:bg-card text-center p-8 flex flex-col items-center justify-center gap-4">
        <Wifi className="h-10 w-10 text-gold" />
        <div>
          <p className="font-heading text-xl font-bold">RTSP feed configured</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            The direct RTSP source is saved, but browsers need it to be exposed via HLS/WebRTC to play natively. Use a media server or convert the feed before displaying it here.
          </p>
        </div>
        {viewerCount > 0 && (
          <Badge className="bg-muted/70 text-foreground border-none">
            <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
          </Badge>
        )}
      </div>
    );
  }

  // Mobile stream placeholder
  if (resolvedStreamType === "mobile") {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background/95 dark:bg-card text-center p-8 flex flex-col items-center justify-center gap-4">
        <Wifi className="h-10 w-10 text-gold" />
        <div>
          <p className="font-heading text-xl font-bold">Mobile Camera Stream</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            The live darshan source is currently set to a mobile camera feed. Visitors will see the stream when the temple camera source is active.
          </p>
        </div>
        {viewerCount > 0 && (
          <Badge className="bg-muted/70 text-foreground border-none">
            <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
          </Badge>
        )}
      </div>
    );
  }

  if (resolvedStreamType === "youtube") {
    const ytId = getYouTubeId(activeStreamUrl || streamUrl);
    return (
      <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background dark:bg-card">
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

  if (resolvedStreamType === "upload") {
    if (!activeStreamUrl) {
      return (
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background/95 dark:bg-card">
          <img src={shivaLingam} alt="Temple Darshan Preview" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/20 border-2 border-border/30 flex items-center justify-center">
              <WifiOff className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="font-heading text-xl font-bold mb-1">Stream Offline</p>
              <p className="text-sm text-foreground/70 max-w-xs">
                Live darshan is not available right now. Please check back during darshan hours.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background dark:bg-card group cursor-pointer"
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
          loop
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
            <Badge variant="secondary" className="bg-muted/50 text-foreground border-none">
              <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
            </Badge>
          )}
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
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
              <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
              <div className="relative w-20 h-20 rounded-full bg-gold text-accent-foreground glow-gold flex items-center justify-center">
                <Play className="h-8 w-8 ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (resolvedStreamType === "youtube") {
    const ytId = getYouTubeId(activeStreamUrl);
    return (
      <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background dark:bg-card">
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

  // HLS / RTSP / Upload native video player
  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-lg bg-background dark:bg-card group cursor-pointer"
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
          <Badge variant="secondary" className="bg-muted/50 text-foreground border-none">
            <Wifi className="h-3 w-3 mr-1" /> {viewerCount.toLocaleString()} watching
          </Badge>
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
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
            <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
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
