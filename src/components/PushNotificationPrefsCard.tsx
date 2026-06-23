import { Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { usePushNotificationPrefs, type PushPrefs } from "@/hooks/usePushNotificationPrefs";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PREF_OPTIONS: { key: keyof PushPrefs; label: string; description: string }[] = [
  { key: "booking_enabled", label: "Booking Updates", description: "New bookings, status changes, priest assignments" },
  { key: "payment_enabled", label: "Payment Alerts", description: "Payment confirmations and receipts" },
  { key: "reminder_enabled", label: "Puja Reminders", description: "24-hour reminders before scheduled pujas" },
  { key: "system_enabled", label: "Temple Announcements", description: "Events, notices, and general updates" },
];

export function PushNotificationPrefsCard() {
  const { isSubscribed } = usePushNotifications();
  const { prefs, loading, saving, updatePref } = usePushNotificationPrefs();

  if (!isSubscribed) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Choose which types of push notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))
        ) : (
          PREF_OPTIONS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={prefs[key]}
                disabled={saving}
                onCheckedChange={(v) => updatePref(key, v)}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
