import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

interface UrgentNotice {
  id: string;
  title: string;
  description: string;
  priority: string;
}

const StickyNoticeBanner = () => {
  const [notices, setNotices] = useState<UrgentNotice[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUrgent = async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, description, priority")
        .in("priority", ["urgent", "important"])
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .limit(3);

      if (data) setNotices(data as UrgentNotice[]);
    };
    fetchUrgent();
  }, []);

  const visibleNotices = notices.filter((n) => !dismissed.has(n.id));
  if (visibleNotices.length === 0) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-40 space-y-0">
      {visibleNotices.map((notice) => (
        <div
          key={notice.id}
          className={`px-4 py-2.5 flex items-center justify-between gap-3 text-sm ${
            notice.priority === "urgent"
              ? "bg-destructive text-destructive-foreground"
              : "bg-orange-500 text-white"
          }`}
        >
          <Link to="/notice-board" className="flex items-center gap-2 min-w-0 flex-1">
            {notice.priority === "urgent" ? (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Megaphone className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="font-medium truncate">{notice.title}</span>
            <span className="hidden sm:inline text-xs opacity-80 truncate">— {notice.description}</span>
          </Link>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(notice.id))}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default StickyNoticeBanner;
