import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";
import { useEmailNotificationPrefs, EmailPrefs } from "@/hooks/useEmailNotificationPrefs";

const PREF_OPTIONS: { key: keyof EmailPrefs; label: string; description: string }[] = [
  { key: "booking_enabled", label: "Booking Updates", description: "Confirmation & status change emails" },
  { key: "payment_enabled", label: "Payment Receipts", description: "Payment confirmation emails" },
  { key: "reminder_enabled", label: "Puja Reminders", description: "Upcoming puja reminder emails" },
  { key: "system_enabled", label: "Temple Announcements", description: "Event & notice emails" },
];

export function EmailNotificationPrefsCard() {
  const { prefs, loading, saving, updatePref } = useEmailNotificationPrefs();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <Mail className="h-5 w-5 text-primary" />
          Email Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))
        ) : (
          PREF_OPTIONS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={`email-${key}`}
                checked={prefs[key]}
                onCheckedChange={(v) => updatePref(key, v)}
                disabled={saving}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
