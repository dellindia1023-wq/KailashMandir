import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell, Search, CheckCheck, Trash2, BookOpen, CreditCard,
  Clock, AlertCircle, ChevronLeft, ChevronRight, Loader2,
  MailOpen, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  role: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

type Filter = "all" | "booking" | "payment" | "reminder" | "system";

const PAGE_SIZE = 15;

const typeIcons: Record<string, React.ReactNode> = {
  booking: <BookOpen className="h-4 w-4 text-primary" />,
  payment: <CreditCard className="h-4 w-4 text-green-600" />,
  reminder: <Clock className="h-4 w-4 text-amber-500" />,
  system: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
};

const typeBadgeVariant: Record<string, string> = {
  booking: "bg-primary/10 text-primary",
  payment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reminder: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  system: "bg-muted text-muted-foreground",
};

export default function UserNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter !== "all") query = query.eq("type", filter);
    if (search.trim()) query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (!error && data) {
      setNotifications(data as unknown as Notification[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [user, filter, search, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [filter, search]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-page-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === notifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n.id)));
    }
  };

  const bulkMarkRead = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .in("id", ids);
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    );
    setSelected(new Set());
    toast.success(`${ids.length} notification(s) marked as read`);
  };

  const bulkMarkUnread = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await supabase
      .from("notifications")
      .update({ is_read: false } as any)
      .in("id", ids);
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: false } : n))
    );
    setSelected(new Set());
    toast.success(`${ids.length} notification(s) marked as unread`);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const markSingleRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "booking", label: "Bookings" },
    { value: "payment", label: "Payments" },
    { value: "reminder", label: "Reminders" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total · {unreadCount} unread on this page
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          <CheckCheck className="h-4 w-4 mr-1.5" />
          Mark all as read
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="h-9">
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs px-3">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-2 px-4">
            <p className="text-sm font-medium">
              {selected.size} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={bulkMarkRead}>
                <MailOpen className="h-3.5 w-3.5 mr-1" />
                Mark Read
              </Button>
              <Button variant="outline" size="sm" onClick={bulkMarkUnread}>
                <Mail className="h-3.5 w-3.5 mr-1" />
                Mark Unread
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification List */}
      <Card>
        <CardContent className="p-0">
          {/* Select All Header */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
              <Checkbox
                checked={selected.size === notifications.length && notifications.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications found</p>
              <p className="text-xs mt-1">
                {search ? "Try a different search term" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/40 cursor-pointer",
                  !n.is_read && "bg-primary/5"
                )}
                onClick={() => !n.is_read && markSingleRead(n.id)}
              >
                <div className="pt-1">
                  <Checkbox
                    checked={selected.has(n.id)}
                    onCheckedChange={() => toggleSelect(n.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="mt-0.5 shrink-0">
                  {typeIcons[n.type] || typeIcons.system}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-sm leading-tight", !n.is_read && "font-semibold")}>
                        {n.title}
                      </p>
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", typeBadgeVariant[n.type] || typeBadgeVariant.system)}>
                        {n.type}
                      </Badge>
                    </div>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    {format(new Date(n.created_at), "MMM d, yyyy")} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => { setPage((p) => p - 1); setSelected(new Set()); }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => { setPage((p) => p + 1); setSelected(new Set()); }}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
