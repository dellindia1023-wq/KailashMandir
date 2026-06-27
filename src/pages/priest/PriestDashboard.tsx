import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Loader2, Calendar, Clock, User,
  CheckCircle2, Circle, RefreshCw, BookOpen, AlertCircle
} from "lucide-react";

interface AssignedBooking {
  id: string;
  devotee_name: string;
  devotee_gotra: string | null;
  booking_date: string;
  booking_time: string;
  amount: number;
  booking_status: string;
  special_instructions: string | null;
  pujas: { name: string; category: string };
}

const BOOKING_STATUSES = [
  { value: "pending", label: "Pending", icon: Circle },
  { value: "in_progress", label: "In Progress", icon: AlertCircle },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

const PriestDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("puja_bookings")
        .select("id, devotee_name, devotee_gotra, booking_date, booking_time, amount, booking_status, special_instructions, pujas (name, category)")
        .eq("assigned_priest_id", user.id)
        .eq("payment_status", "paid")
        .order("booking_date", { ascending: true });

      setBookings((data as unknown as AssignedBooking[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from("puja_bookings")
        .update({ booking_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, booking_status: newStatus } : b));
      toast.success("Status updated");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const getDateLabel = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date < today) return "past";
    if (date.getTime() === today.getTime()) return "today";
    return "upcoming";
  };

  const todayCount = bookings.filter(b => getDateLabel(b.booking_date) === "today").length;
  const completedCount = bookings.filter(b => b.booking_status === "completed").length;
  const pendingCount = bookings.filter(b => b.booking_status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-6 py-16 px-4 lg:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Priest Dashboard
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-4">Assigned Pujas & Schedule</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">A premium overview of your upcoming rituals, status updates, and daily activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 to-saffron/5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">{bookings.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Assigned</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">{todayCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Today's Pujas</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-600">
                <Circle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">{pendingCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Pending</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">{completedCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="rounded-3xl border border-border shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-heading text-2xl">My Assigned Pujas</CardTitle>
            <CardDescription className="max-w-2xl">Review your upcoming rituals and update the status with one click.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/50 p-10 text-center">
              <BookOpen className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">No Pujas Assigned Yet</h3>
              <p className="text-sm text-muted-foreground">When admin assigns pujas to you, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border bg-background shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Puja</TableHead>
                    <TableHead>Devotee</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const dateLabel = getDateLabel(booking.booking_date);
                    return (
                      <TableRow key={booking.id} className={dateLabel === "today" ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <p className={dateLabel === "today" ? "font-semibold text-primary" : "font-medium text-foreground"}>
                                  {format(new Date(booking.booking_date), "dd MMM yyyy")}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(booking.booking_time)}
                                </p>
                              </div>
                            </div>
                            {dateLabel === "today" && (
                              <Badge className="mt-2 inline-flex bg-primary/10 text-primary text-xs">Today</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{booking.pujas?.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">{booking.pujas?.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{booking.devotee_name}</p>
                              {booking.devotee_gotra && (
                                <p className="text-xs text-muted-foreground">Gotra: {booking.devotee_gotra}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.special_instructions ? (
                            <p className="text-sm text-muted-foreground max-w-[200px] truncate">{booking.special_instructions}</p>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.booking_status}
                            onValueChange={(value) => updateBookingStatus(booking.id, value)}
                            disabled={updatingStatus === booking.id}
                          >
                            <SelectTrigger className="w-[140px]">
                              {updatingStatus === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {BOOKING_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  <span className="flex items-center gap-2">
                                    <status.icon className="h-3.5 w-3.5" />
                                    {status.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriestDashboard;
