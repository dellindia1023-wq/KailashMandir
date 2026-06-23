import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const features = [
    { icon: "🕉️", title: "Darshan Timings", desc: "Get daily aarti schedules" },
    { icon: "📺", title: "Live Darshan", desc: "Watch temple from anywhere" },
    { icon: "🔔", title: "Notifications", desc: "Festival & event alerts" },
    { icon: "📸", title: "Photo Gallery", desc: "Divine temple moments" },
    { icon: "🙏", title: "Easy Donations", desc: "Secure online offerings" },
    { icon: "📍", title: "Temple Navigation", desc: "Get directions instantly" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Install App — Kailash Mahadev Temple Agra"
        description="Install the Kailash Mahadev Temple Agra app on your phone for darshan timings, live streaming, and temple updates."
        canonical="/install"
        noindex
      />
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-saffron flex items-center justify-center shadow-lg glow-saffron">
              <span className="text-5xl text-primary-foreground font-heading">ॐ</span>
            </div>
            
            <Badge className="mb-4 bg-primary/10 text-primary">
              <Smartphone className="h-3 w-3 mr-1" />
              Available on All Devices
            </Badge>
            
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Install <span className="text-gradient-sacred">Kailash Mahadev</span>
            </h1>
            
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Get instant access to darshan timings, live streaming, event notifications, 
              and more. Install our app for a seamless devotional experience.
            </p>
          </div>

          {/* Install Status */}
          {isStandalone ? (
            <Card className="max-w-md mx-auto mb-12 border-2 border-green-500 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="font-heading font-semibold text-xl text-green-700 mb-2">
                  App Already Installed!
                </h3>
                <p className="text-green-600">
                  You're using the installed version of Kailash Mahadev Temple app.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-2xl mx-auto mb-12">
              {/* Android/Desktop Install */}
              {isInstallable && (
                <Card className="mb-6 border-2 border-gold bg-gold/5">
                  <CardContent className="p-6 text-center">
                    <Button
                      size="lg"
                      onClick={handleInstall}
                      className="bg-gradient-saffron hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg glow-saffron"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Install App Now
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Works on Android, Windows, macOS & Linux
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <Card className="border-2 border-primary">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-xl text-center mb-6">
                      Install on iPhone/iPad
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Share className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Step 1: Tap Share</p>
                          <p className="text-sm text-muted-foreground">
                            Tap the Share button in Safari's toolbar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Step 2: Add to Home Screen</p>
                          <p className="text-sm text-muted-foreground">
                            Scroll down and tap "Add to Home Screen"
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold">Step 3: Confirm Installation</p>
                          <p className="text-sm text-muted-foreground">
                            Tap "Add" to install the app on your home screen
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generic Browser Instructions */}
              {!isInstallable && !isIOS && (
                <Card className="border-2 border-muted">
                  <CardContent className="p-6 text-center">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-heading font-semibold text-xl mb-2">
                      Install from Browser Menu
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Look for "Install" or "Add to Home Screen" in your browser's menu (⋮)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Works best in Chrome, Edge, or Safari
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Features Grid */}
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              App Features
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl mb-2 block">{feature.icon}</span>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Platform Support */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Works on all platforms</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Badge variant="outline" className="px-4 py-2">
                <span className="mr-2">🍎</span> iOS
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <span className="mr-2">🤖</span> Android
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <span className="mr-2">🪟</span> Windows
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <span className="mr-2">🍏</span> macOS
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <span className="mr-2">🐧</span> Linux
              </Badge>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
