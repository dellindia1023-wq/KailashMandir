import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
          <BellOff className="h-5 w-5" />
          <p className="text-sm">Push notifications are not supported in this browser.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Push Notifications</CardTitle>
          </div>
          {permission === "denied" ? (
            <Badge variant="destructive" className="text-xs">Blocked</Badge>
          ) : isSubscribed ? (
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Active</Badge>
          ) : null}
        </div>
        <CardDescription className="text-xs">
          Get instant alerts for puja reminders, booking updates, and temple announcements
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {permission === "denied" ? (
          <p className="text-xs text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {isSubscribed ? "Receiving push notifications" : "Enable push notifications"}
            </span>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => (checked ? subscribe() : unsubscribe())}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
