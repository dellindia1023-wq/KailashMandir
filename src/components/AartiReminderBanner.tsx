import { useEffect, useState, useRef } from "react";
import { Bell, BellRing, X, Flame } from "lucide-react";
import { isAartiEnabled } from "@/hooks/useAartiNotificationPrefs";
import { Link } from "react-router-dom";

const AARTI_SCHEDULE = [
  { name: "Mangla Aarti", hour: 4, minute: 0 },
  { name: "Shringar Darshan", hour: 5, minute: 0 },
  { name: "Bhog Aarti", hour: 7, minute: 30 },
  { name: "Raj Bhog Aarti", hour: 12, minute: 0 },
  { name: "Sandhya Aarti", hour: 19, minute: 30 },
  { name: "Shayan Aarti", hour: 21, minute: 0 },
];

const REMINDER_MINUTES = 15;

const getIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
};

const formatTime = (hour: number, minute: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
};

const getUpcomingAarti = () => {
  const ist = getIST();
  const nowMinutes = ist.getHours() * 60 + ist.getMinutes();

  for (const a of AARTI_SCHEDULE) {
    const aartiMinutes = a.hour * 60 + a.minute;
    const diff = aartiMinutes - nowMinutes;
    if (diff > 0 && diff <= REMINDER_MINUTES && isAartiEnabled(a.name)) {
      return { name: a.name, minutesLeft: diff, time: formatTime(a.hour, a.minute) };
    }
  }
  return null;
};

const sendBrowserNotification = (name: string, time: string, minutesLeft: number) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const options: NotificationOptions & { renotify?: boolean } = {
      body: `Begins at ${time} · ${minutesLeft} min left\nJoin the live darshan at Kailash Mandir Agra`,
      icon: "/icons/icon-512x512.png",
      badge: "/icons/icon-512x512.png",
      tag: `aarti-${name}`,
      silent: false,
    };
    new Notification(`🔔 ${name} — Starting Soon`, options);
  } catch {
    // Notification not supported in this context
  }
};

const AartiReminderBanner = () => {
  const [reminder, setReminder] = useState(getUpcomingAarti);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const lastAlertedRef = useRef<string | null>(null);
  const lastNotifiedRef = useRef<string | null>(null);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted" && reminder) {
      sendBrowserNotification(reminder.name, reminder.time, reminder.minutesLeft);
      lastNotifiedRef.current = reminder.name;
    }
  };

  // Play a gentle chime + vibrate when a new reminder appears
  const alertUser = (name: string, time: string, minutesLeft: number) => {
    if (lastAlertedRef.current === name) return;
    lastAlertedRef.current = name;

    // Vibration API (mobile devices)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Web Audio API chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(523.25, ctx.currentTime, 0.4);
      playTone(659.25, ctx.currentTime + 0.2, 0.5);
    } catch {
      // silent fallback
    }

    // Browser push notification
    if (lastNotifiedRef.current !== name) {
      sendBrowserNotification(name, time, minutesLeft);
      lastNotifiedRef.current = name;
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      const next = getUpcomingAarti();
      if (next && next.name !== dismissed) {
        setReminder(next);
        alertUser(next.name, next.time, next.minutesLeft);
      } else if (!next) {
        setReminder(null);
        setDismissed(null);
        lastAlertedRef.current = null;
        lastNotifiedRef.current = null;
      }
    }, 10000);
    return () => clearInterval(id);
  }, [dismissed]);

  // Alert on initial mount if reminder exists
  useEffect(() => {
    if (reminder) alertUser(reminder.name, reminder.time, reminder.minutesLeft);
  }, []);

  const handleDismiss = () => {
    if (reminder) setDismissed(reminder.name);
    setReminder(null);
  };

  if (!reminder) return null;

  const showNotifPrompt = notifPermission === "default";

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-fade-in">
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card shadow-lg shadow-primary/10">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />

        <div className="relative p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="shrink-0 mt-0.5 h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="h-3.5 w-3.5 text-primary animate-diya-glow" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Starting Soon
                </span>
              </div>

              <p className="font-heading font-semibold text-sm text-foreground leading-snug">
                {reminder.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Begins at {reminder.time} ·{" "}
                <span className="font-medium text-primary">{reminder.minutesLeft} min left</span>
              </p>

              <div className="flex items-center gap-3 mt-2">
                <Link
                  to="/darshan-timings"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View Full Schedule →
                </Link>

                {showNotifPrompt && (
                  <button
                    onClick={requestNotificationPermission}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    title="Get notified even when this tab is in the background"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Enable Alerts
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AartiReminderBanner;
