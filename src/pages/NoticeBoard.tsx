import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone, AlertTriangle, Info, Search } from "lucide-react";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  description: string;
  priority: "normal" | "important" | "urgent";
  publish_date: string;
  expiry_date: string | null;
  created_at: string;
}

const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("publish_date", { ascending: false });

      setNotices((data as Notice[]) || []);
      setLoading(false);
    };
    fetchNotices();
  }, []);

  const filtered = notices.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || n.priority === filter;
    return matchSearch && matchFilter;
  });

  const urgentNotices = filtered.filter((n) => n.priority === "urgent");
  const otherNotices = filtered.filter((n) => n.priority !== "urgent");

  const priorityConfig = {
    urgent: { icon: AlertTriangle, label: "Urgent", className: "bg-destructive text-destructive-foreground", border: "border-destructive/50" },
    important: { icon: Megaphone, label: "Important", className: "bg-orange-500 text-white", border: "border-orange-500/50" },
    normal: { icon: Info, label: "Normal", className: "bg-secondary text-secondary-foreground", border: "border-border" },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Notice Board | Temple Updates"
        description="Latest announcements and news from Kailash mandir agra (Kailash Mahadev Temple) — schedules, festivals, darshan updates and important notices."
        canonical="/notice-board"
        breadcrumbLabel="Notice Board"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Notice Board – Kailash Mahadev Temple Agra",
          "description": "Stay updated with important announcements, schedules, and news from Kailash Mahadev Temple Agra.",
          "url": "https://kailashmahadev.in/notice-board",
          "isPartOf": {
            "@type": "WebSite",
            "name": "Kailash Mahadev Temple Agra",
            "url": "https://kailashmahadev.in"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Kailash Mahadev Temple Trust",
            "url": "https://kailashmahadev.in"
          }
        }}
      />
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Megaphone className="h-3 w-3 mr-1" />
              Temple Announcements
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Notice <span className="text-gradient-sacred">Board</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stay updated with important announcements from Kailash Mandir Agra.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No notices found.</p>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Sticky Urgent Notices */}
              {urgentNotices.map((notice) => {
                const config = priorityConfig[notice.priority];
                const Icon = config.icon;
                return (
                  <Card key={notice.id} className={`border-2 ${config.border} bg-destructive/5 animate-pulse-slow`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-heading text-lg flex items-center gap-2 text-destructive">
                          <Icon className="h-5 w-5" />
                          {notice.title}
                        </CardTitle>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/90 mb-3 whitespace-pre-wrap">{notice.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Published: {format(new Date(notice.publish_date), "dd MMM yyyy")}
                        {notice.expiry_date && ` • Expires: ${format(new Date(notice.expiry_date), "dd MMM yyyy")}`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Other Notices */}
              {otherNotices.map((notice) => {
                const config = priorityConfig[notice.priority];
                const Icon = config.icon;
                return (
                  <Card key={notice.id} className={`border ${config.border} hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-heading text-lg flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          {notice.title}
                        </CardTitle>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3 whitespace-pre-wrap">{notice.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Published: {format(new Date(notice.publish_date), "dd MMM yyyy")}
                        {notice.expiry_date && ` • Expires: ${format(new Date(notice.expiry_date), "dd MMM yyyy")}`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NoticeBoard;
