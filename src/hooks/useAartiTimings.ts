import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AartiTiming {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  is_special: boolean;
  order: number;
  is_active: boolean;
}

// Default aarti timings if database fetch fails
const DEFAULT_AARTI_TIMINGS: AartiTiming[] = [
  {
    id: "default-1",
    name: "Mangla Aarti",
    start_time: "04:00",
    end_time: "04:30",
    description: "Early morning worship",
    is_special: true,
    order: 1,
    is_active: true,
  },
  {
    id: "default-2",
    name: "Shringar Darshan",
    start_time: "05:00",
    end_time: "06:30",
    description: "Preparation and decoration",
    is_special: false,
    order: 2,
    is_active: true,
  },
  {
    id: "default-3",
    name: "Bhog Aarti",
    start_time: "07:30",
    end_time: "08:00",
    description: "Mid-morning prayer",
    is_special: false,
    order: 3,
    is_active: true,
  },
  {
    id: "default-4",
    name: "Raj Bhog Aarti",
    start_time: "12:00",
    end_time: "12:30",
    description: "Afternoon blessed offering",
    is_special: false,
    order: 4,
    is_active: true,
  },
  {
    id: "default-5",
    name: "Evening Darshan",
    start_time: "16:00",
    end_time: "19:00",
    description: "Evening prayer and darshan",
    is_special: false,
    order: 5,
    is_active: true,
  },
  {
    id: "default-6",
    name: "Sandhya Aarti",
    start_time: "19:30",
    end_time: "20:00",
    description: "Twilight worship",
    is_special: true,
    order: 6,
    is_active: true,
  },
  {
    id: "default-7",
    name: "Shayan Aarti",
    start_time: "21:00",
    end_time: "21:30",
    description: "Night prayer before rest",
    is_special: false,
    order: 7,
    is_active: true,
  },
];

export function useAartiTimings(activeOnly = false) {
  return useQuery({
    queryKey: ["aarti-timings", activeOnly],
    queryFn: async () => {
      try {
        const query = supabase
          .from("aarti_schedule")
          .select("*")
          .order("order", { ascending: true });

        if (activeOnly) {
          query.eq("is_active", true);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching aarti timings:", error);
          return DEFAULT_AARTI_TIMINGS.filter((t) => !activeOnly || t.is_active);
        }

        // If no data from database, return defaults
        if (!data || data.length === 0) {
          return DEFAULT_AARTI_TIMINGS.filter((t) => !activeOnly || t.is_active);
        }

        return data as AartiTiming[];
      } catch (error) {
        console.error("Error fetching aarti timings:", error);
        return DEFAULT_AARTI_TIMINGS.filter((t) => !activeOnly || t.is_active);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Convert time string "HH:MM" to minutes for easier comparison
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Get the next aarti timing
export function getNextAarti(timings: AartiTiming[]): AartiTiming | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = timings
    .filter((t) => t.is_active)
    .find((t) => timeToMinutes(t.start_time) > currentMinutes);

  // If no upcoming today, return first one (tomorrow)
  return upcoming || timings.find((t) => t.is_active) || null;
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const hour = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  return `${hour}:${minutes.toString().padStart(2, "0")} ${period}`;
}
