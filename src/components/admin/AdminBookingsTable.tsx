import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, RefreshCw, UserPlus, Download } from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import { format } from "date-fns";
import { AssignPriestDialog } from "./AssignPriestDialog";

interface Booking {
  id: string;
  devotee_name: string;
  devotee_gotra: string | null;
  booking_date: string;
  booking_time: string;
  amount: number;
  payment_status: string;
  booking_status: string | null;
  assigned_priest_id: string | null;
  created_at: string;
  pujas: {
    name: string;
  };
  assigned_priest?: {
    full_name: string | null;
  } | null;
}

export const AdminBookingsTable = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // First get bookings with pujas
      const { data: bookingsData, error } = await supabase
        .from("puja_bookings")
        .select("id, user_id, puja_id, devotee_name, devotee_gotra, booking_date, booking_time, amount, payment_status, booking_status, assigned_priest_id, special_instructions, created_at, updated_at, pujas(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If we have bookings with assigned priests, fetch their profiles
      const bookingsWithPriests = bookingsData || [];
      const priestIds = [...new Set(bookingsWithPriests
        .filter(b => b.assigned_priest_id)
        .map(b => b.assigned_priest_id))];

      if (priestIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", priestIds);

        // Map profiles to bookings
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const enrichedBookings = bookingsWithPriests.map(b => ({
          ...b,
          assigned_priest: b.assigned_priest_id ? profilesMap.get(b.assigned_priest_id) || null : null
        }));
        setBookings(enrichedBookings);
      } else {
        setBookings(bookingsWithPriests);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };
    const { variant, label } = config[status] || { variant: "secondary", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.devotee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pujas?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, puja, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchBookings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const headers = ["Booking ID", "Devotee", "Gotra", "Puja", "Date", "Time", "Amount", "Payment Status", "Booking Status", "Assigned Priest"];
            const rows = filteredBookings.map((b) => [
              b.id.slice(0, 8).toUpperCase(),
              b.devotee_name,
              b.devotee_gotra || "",
              b.pujas?.name || "",
              b.booking_date,
              b.booking_time,
              String(b.amount),
              b.payment_status,
              b.booking_status || "",
              b.assigned_priest?.full_name || "Not assigned",
            ]);
            exportToCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
          }}
          disabled={filteredBookings.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Devotee</TableHead>
              <TableHead>Puja</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Assigned Priest</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {booking.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.devotee_name}</p>
                      {booking.devotee_gotra && (
                        <p className="text-xs text-muted-foreground">{booking.devotee_gotra}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{booking.pujas?.name}</TableCell>
                  <TableCell>
                    <div>
                      <p>{format(new Date(booking.booking_date), "dd MMM yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(booking.booking_time)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">₹{booking.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{getStatusBadge(booking.payment_status)}</TableCell>
                  <TableCell>
                    {booking.assigned_priest?.full_name ? (
                      <Badge variant="secondary">{booking.assigned_priest.full_name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setAssignDialogOpen(true);
                      }}
                      disabled={booking.payment_status !== "paid"}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredBookings.length} of {bookings.length} bookings
      </p>

      <AssignPriestDialog
        booking={selectedBooking}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={fetchBookings}
      />
    </div>
  );
};
