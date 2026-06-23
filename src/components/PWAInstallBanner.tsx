import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-banner-dismissed";
const DISMISS_DAYS = 7;

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DAYS * 86400000) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setTimeout(() => setVisible(true), 300);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 p-2 sm:p-0">
      <div className="bg-white/95 border border-slate-200 shadow-2xl backdrop-blur-xl rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center w-14 h-14 rounded-3xl bg-primary/10 text-primary text-2xl font-bold shrink-0">
          ॐ
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install Kailash Mahadev Temple App</p>
          <p className="text-sm text-muted-foreground mt-1">
            Open the app faster with one tap, get live darshan, event alerts, donations, and temple updates.
          </p>

          {isIOS ? (
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Share className="h-4 w-4" /> Tap <span className="font-medium">Share</span>
              </p>
              <p className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Select <span className="font-medium">Add to Home Screen</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">✓</span> Confirm by tapping <span className="font-medium">Add</span>
              </p>
            </div>
          ) : isInstallable ? (
            <Button size="sm" onClick={install} className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" /> Install App
            </Button>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              If you do not see the install button, open browser menu and choose <span className="font-medium">Install</span> or <span className="font-medium">Add to Home Screen</span>.
            </p>
          )}
        </div>

        <button
          onClick={dismiss}
          className="self-end sm:self-auto text-muted-foreground hover:text-foreground rounded-full p-2"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
