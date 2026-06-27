import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useAartiTimings(activeOnly = false) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["aarti-timings", activeOnly] as const, [activeOnly]);

  useEffect(() => {
    const channel = supabase
      .channel("aarti-timings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "aarti_schedule" },
        () => {
          queryClient.invalidateQueries(queryKey, { exact: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  return useQuery<AartiTiming[]>({
    queryKey,
    queryFn: async () => {
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
        return [];
      }

      return (data || []) as AartiTiming[];
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
