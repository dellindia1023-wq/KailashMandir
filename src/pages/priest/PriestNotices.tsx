import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone } from "lucide-react";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  description: string;
  priority: string;
  publish_date: string;
}

const PriestNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, description, priority, publish_date")
        .eq("is_active", true)
        .order("publish_date", { ascending: false });
      setNotices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getPriorityColor = (p: string) => {
    if (p === "urgent") return "bg-destructive/10 text-destructive border-destructive/30";
    if (p === "important") return "bg-saffron/10 text-saffron border-saffron/30";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Notice Board</h1>
        <p className="text-muted-foreground text-sm mt-1">Temple announcements</p>
      </div>
      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active notices</p>
            </CardContent>
          </Card>
        ) : (
          notices.map((n) => (
            <Card key={n.id} className={`border ${getPriorityColor(n.priority)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-lg">{n.title}</CardTitle>
                  <Badge className={getPriorityColor(n.priority)}>{n.priority}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{n.description}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(n.publish_date), "dd MMM yyyy")}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PriestNotices;
