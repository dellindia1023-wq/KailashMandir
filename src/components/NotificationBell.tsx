import { useState } from "react";
import { Bell, Check, CheckCheck, BookOpen, CreditCard, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications, NotificationFilter, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, React.ReactNode> = {
  booking: <BookOpen className="h-4 w-4 text-primary" />,
  payment: <CreditCard className="h-4 w-4 text-green-600" />,
  reminder: <Clock className="h-4 w-4 text-amber-500" />,
  system: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
};

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 p-3 border-b border-border last:border-0 transition-colors cursor-pointer hover:bg-muted/50",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
    >
      <div className="mt-0.5 shrink-0">
        {typeIcons[notification.type] || typeIcons.system}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-tight", !notification.is_read && "font-semibold")}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const {
    notifications,
    loading,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const filters: { value: NotificationFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "booking", label: "Bookings" },
    { value: "payment", label: "Payments" },
    { value: "reminder", label: "Reminders" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-destructive text-destructive-foreground border-0 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-heading font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="px-3 pt-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)}>
            <TabsList className="w-full h-8">
              {filters.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs flex-1">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
