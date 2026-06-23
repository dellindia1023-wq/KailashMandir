import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const NoticeMarquee = () => {
  const [notices, setNotices] = useState<{ id: string; title: string; priority: string }[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, priority")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("publish_date", { ascending: false })
        .limit(10);
      if (data) setNotices(data);
    };
    fetch();
  }, []);

  if (notices.length === 0) return null;

  const tickerText = notices.map((n) => n.title).join("   •   ");
  const fullText = `${tickerText}   •   ${tickerText}`;

  return (
    <div className="bg-secondary text-secondary-foreground overflow-hidden relative">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-accent-foreground font-semibold text-xs shrink-0 z-10">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("noticeMarquee.latest")}</span>
        </div>
        <Link to="/notice-board" className="flex-1 overflow-hidden py-1.5">
          <div className="animate-marquee whitespace-nowrap text-xs md:text-sm font-medium">
            {fullText}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default NoticeMarquee;
