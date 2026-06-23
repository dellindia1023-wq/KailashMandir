import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PushPrefs {
  booking_enabled: boolean;
  payment_enabled: boolean;
  reminder_enabled: boolean;
  system_enabled: boolean;
}

const DEFAULT_PREFS: PushPrefs = {
  booking_enabled: true,
  payment_enabled: true,
  reminder_enabled: true,
  system_enabled: true,
};

export function usePushNotificationPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("push_notification_prefs" as any)
      .select("booking_enabled, payment_enabled, reminder_enabled, system_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setPrefs(data as unknown as PushPrefs);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePref = useCallback(
    async (key: keyof PushPrefs, value: boolean) => {
      if (!user) return;
      setSaving(true);

      const updated = { ...prefs, [key]: value };
      setPrefs(updated); // optimistic

      const { error } = await supabase
        .from("push_notification_prefs" as any)
        .upsert(
          { user_id: user.id, ...updated } as any,
          { onConflict: "user_id" }
        );

      if (error) {
        setPrefs(prefs); // revert
        toast.error("Failed to save preference");
      } else {
        toast.success("Preference updated");
      }
      setSaving(false);
    },
    [user, prefs]
  );

  return { prefs, loading, saving, updatePref };
}
