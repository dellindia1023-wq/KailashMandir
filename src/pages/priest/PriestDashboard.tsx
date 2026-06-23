import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Priest Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your assigned pujas and schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
          <CardContent className="p-5">
            <BookOpen className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-heading font-bold">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-5">
            <Calendar className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-2xl font-heading font-bold">{todayCount}</p>
            <p className="text-xs text-muted-foreground">Today's Pujas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-5">
            <Circle className="h-5 w-5 text-yellow-600 mb-2" />
            <p className="text-2xl font-heading font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-5">
            <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
            <p className="text-2xl font-heading font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading">My Assigned Pujas</CardTitle>
            <CardDescription>View and update status of your assigned puja bookings</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading text-lg font-medium mb-2">No Pujas Assigned Yet</h3>
              <p className="text-muted-foreground">When admin assigns pujas to you, they will appear here.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
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
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className={dateLabel === "today" ? "font-semibold text-primary" : ""}>
                                {format(new Date(booking.booking_date), "dd MMM yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(booking.booking_time)}
                            </div>
                            {dateLabel === "today" && (
                              <Badge className="mt-1 bg-primary/10 text-primary text-xs">Today</Badge>
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
