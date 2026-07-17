import { Moon, Sparkles, Sunrise, Sun, Clock, Sunset } from "lucide-react";

export const getDefaultRituals = () => [
  { time: "4:00 AM", name: "Mangla Aarti", icon: Moon, desc: "The first aarti of the day, performed in the sacred pre-dawn hours. The temple resonates with the sound of bells and conch shells.", special: true },
  { time: "4:30 AM", name: "Abhishek & Shringar", icon: Sparkles, desc: "The sacred Shivling is bathed with milk, honey, curd, ghee, and gangajal, followed by elaborate decoration.", special: false },
  { time: "5:00 AM", name: "Shringar Darshan", icon: Sunrise, desc: "First darshan of the day where devotees witness the beautifully adorned Shivling with flowers and chandan.", special: false },
  { time: "7:30 AM", name: "Bhog Aarti", icon: Sun, desc: "Morning bhog (food offering) is prepared and offered to Lord Shiva with devotional hymns.", special: false },
  { time: "12:00 PM", name: "Raj Bhog Aarti", icon: Sun, desc: "The grand midday aarti with elaborate bhog offering. Temple doors close after this for afternoon rest.", special: true },
  { time: "4:00 PM", name: "Temple Reopens", icon: Clock, desc: "Evening darshan begins. Devotees gather for the sacred evening atmosphere.", special: false },
  { time: "7:30 PM", name: "Sandhya Aarti", icon: Sunset, desc: "The most attended aarti of the day. Hundreds of diyas are lit creating a mesmerizing divine atmosphere.", special: true },
  { time: "9:00 PM", name: "Shayan Aarti", icon: Moon, desc: "The final aarti of the day. Lord Shiva is offered rest for the night with lullaby bhajans.", special: false },
];

export const normalizeRitualItems = (items: any[] | null | undefined) => {
  if (!Array.isArray(items) || items.length === 0) return getDefaultRituals();

  const normalized = items.map((item) => {
    const name = item?.name || item?.title || "Ritual";
    const desc = item?.desc || item?.description || "Daily worship offering.";
    const time = item?.time || item?.schedule || "";
    const special = Boolean(item?.special ?? item?.is_special ?? false);
    const icon = item?.icon || Moon;

    return {
      time,
      name,
      desc,
      special,
      icon,
    };
  });

  return normalized.length ? normalized : getDefaultRituals();
};

export const getVisibleAboutEntries = (items: any[] | null | undefined) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const values = Object.values(item as Record<string, unknown>);
    return values.some((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      return value !== null && value !== undefined && value !== false;
    });
  });
};
