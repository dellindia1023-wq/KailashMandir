import { useState, useCallback } from "react";

export const AARTI_LIST = [
  { key: "Mangla Aarti", label: "Mangla Aarti", time: "4:00 AM" },
  { key: "Shringar Darshan", label: "Shringar Darshan", time: "5:00 AM" },
  { key: "Bhog Aarti", label: "Bhog Aarti", time: "7:30 AM" },
  { key: "Raj Bhog Aarti", label: "Raj Bhog Aarti", time: "12:00 PM" },
  { key: "Sandhya Aarti", label: "Sandhya Aarti", time: "7:30 PM" },
  { key: "Shayan Aarti", label: "Shayan Aarti", time: "9:00 PM" },
] as const;

const STORAGE_KEY = "aarti-notification-prefs";

type AartiPrefs = Record<string, boolean>;

const getDefaultPrefs = (): AartiPrefs =>
  Object.fromEntries(AARTI_LIST.map((a) => [a.key, true]));

const loadPrefs = (): AartiPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPrefs();
    const parsed = JSON.parse(raw) as AartiPrefs;
    // Ensure all keys exist (in case new aartis are added)
    const defaults = getDefaultPrefs();
    return { ...defaults, ...parsed };
  } catch {
    return getDefaultPrefs();
  }
};

export const isAartiEnabled = (name: string): boolean => {
  const prefs = loadPrefs();
  return prefs[name] ?? true;
};

export const useAartiNotificationPrefs = () => {
  const [prefs, setPrefs] = useState<AartiPrefs>(loadPrefs);

  const toggleAarti = useCallback((key: string) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const enableAll = useCallback(() => {
    const all = getDefaultPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setPrefs(all);
  }, []);

  const disableAll = useCallback(() => {
    const none = Object.fromEntries(AARTI_LIST.map((a) => [a.key, false]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(none));
    setPrefs(none);
  }, []);

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return { prefs, toggleAarti, enableAll, disableAll, enabledCount };
};
