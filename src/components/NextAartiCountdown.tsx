import { useEffect, useState } from "react";
import { Flame, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAartiTimings, timeToMinutes, type AartiTiming } from "@/hooks/useAartiTimings";

/** Return IST Date */
const getIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
};

const getNext = (timings: AartiTiming[]) => {
  const ist = getIST();
  const nowMinutes = ist.getHours() * 60 + ist.getMinutes();

  const activeTimings = timings.filter((t) => t.is_active);
  
  for (const aarti of activeTimings) {
    const aartiMinutes = timeToMinutes(aarti.start_time);
    if (aartiMinutes > nowMinutes) {
      const diffSec = (aartiMinutes - nowMinutes) * 60 - ist.getSeconds();
      return { name: aarti.name, diffSec };
    }
  }
  
  // wrap to next day's first aarti
  if (activeTimings.length === 0) {
    return { name: "Next Aarti", diffSec: 0 };
  }
  
  const first = activeTimings[0];
  const tomorrowMinutes = (24 - ist.getHours()) * 60 - ist.getMinutes() + timeToMinutes(first.start_time);
  return { name: first.name, diffSec: tomorrowMinutes * 60 - ist.getSeconds() };
};

const pad = (n: number) => String(n).padStart(2, "0");

const NextAartiCountdown = () => {
  const { data: aartiTimings } = useAartiTimings(true); // activeOnly = true
  const [next, setNext] = useState<{ name: string; diffSec: number }>({ 
    name: "Next Aarti", 
    diffSec: 0 
  });

  useEffect(() => {
    if (aartiTimings && aartiTimings.length > 0) {
      setNext(getNext(aartiTimings));
      const id = setInterval(() => setNext(getNext(aartiTimings)), 1000);
      return () => clearInterval(id);
    }
  }, [aartiTimings]);

  const hours = Math.floor(next.diffSec / 3600);
  const minutes = Math.floor((next.diffSec % 3600) / 60);
  const seconds = next.diffSec % 60;

  return (
    <Link to="/darshan-timings" className="block">
      <div className="bg-card border-b border-border py-3 md:py-4">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3 md:gap-5">
          <Flame className="h-5 w-5 text-primary shrink-0 animate-diya-glow" />

          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Next:
            </span>
            <span className="font-heading font-semibold text-sm md:text-base text-foreground">
              {next.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
            {[
              { value: pad(hours), label: "h" },
              { value: pad(minutes), label: "m" },
              { value: pad(seconds < 0 ? 0 : seconds), label: "s" },
            ].map((u, i) => (
              <span key={i} className="flex items-baseline gap-px">
                <span className="font-mono text-base md:text-lg font-bold text-primary tabular-nums">
                  {u.value}
                </span>
                <span className="text-[10px] text-muted-foreground">{u.label}</span>
                {i < 2 && <span className="text-muted-foreground mx-0.5">:</span>}
              </span>
            ))}
          </div>

          <Flame className="h-5 w-5 text-primary shrink-0 animate-diya-glow hidden md:block" />
        </div>
      </div>
    </Link>
  );
};

export default NextAartiCountdown;
