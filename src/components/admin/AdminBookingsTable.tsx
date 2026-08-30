import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, RefreshCw, UserPlus, Download, Mail } from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import { format } from "date-fns";
import { AssignPriestDialog } from "./AssignPriestDialog";
import { toast } from "sonner";
import { Trash2, CreditCard, RefreshCw as RefreshIcon } from "lucide-react";
import { deleteCompletionMedia, fetchCompletionForBooking, getCompletionSettings, getCompletionWorkflowSummary, getVisibleCompletionMedia, setCompletionApprovalRequirement, updateCompletionMedia, updateCompletionRecordStatus, type CompletionApprovalStatus, type CompletionMediaItem, type CompletionRecord } from "@/lib/pujaCompletion";
import CompletionMediaPreview from "@/components/CompletionMediaPreview";

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
  const [completionMap, setCompletionMap] = useState<Record<string, { record: CompletionRecord | null; media: CompletionMediaItem[] }>>({});
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingAction, setReviewingAction] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from("puja_bookings")
        .select("id, user_id, puja_id, devotee_name, devotee_gotra, booking_date, booking_time, amount, payment_status, booking_status, assigned_priest_id, special_instructions, created_at, updated_at, pujas(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingsWithPriests = bookingsData || [];
      const priestIds = [...new Set(bookingsWithPriests
        .filter(b => b.assigned_priest_id)
        .map(b => b.assigned_priest_id))];

      let enrichedBookings = bookingsWithPriests;

      if (priestIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", priestIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        enrichedBookings = bookingsWithPriests.map(b => ({
          ...b,
          assigned_priest: b.assigned_priest_id ? profilesMap.get(b.assigned_priest_id) || null : null
        }));
      }

      setBookings(enrichedBookings);

      const completionEntries = await Promise.all(
        enrichedBookings.map(async (booking) => {
          try {
            const { record, media } = await fetchCompletionForBooking(booking.id);
            return [booking.id, { record, media }] as const;
          } catch {
            return [booking.id, { record: null, media: [] }] as const;
          }
        })
      );

      setCompletionMap(Object.fromEntries(completionEntries));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, []);

  useEffect(() => {
    const loadApprovalSettings = async () => {
      try {
        const settings = await getCompletionSettings();
        setApprovalRequired(settings?.approval_required ?? true);
      } catch (error) {
        console.error("Failed to load completion settings", error);
      }
    };

    void loadApprovalSettings();
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

  const handleReviewDecision = async (status: CompletionApprovalStatus) => {
    if (!reviewBookingId) return;
    const reviewData = completionMap[reviewBookingId];
    if (!reviewData?.record) return;

    setReviewingAction(true);
    try {
      const updated = await updateCompletionRecordStatus(reviewData.record.id, {
        approval_status: status,
        approval_required: approvalRequired,
        admin_notes: reviewNotes || null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      });
      setCompletionMap((prev) => ({
        ...prev,
        [reviewBookingId]: {
          ...reviewData,
          record: updated,
        },
      }));
      toast.success(`Completion marked as ${status}`);
    } catch (error) {
      console.error("Failed to update completion status", error);
      toast.error("Failed to update completion status");
    } finally {
      setReviewingAction(false);
    }
  };

  const handleMediaAction = async (mediaId: string, action: "hide" | "show" | "delete") => {
    const reviewData = reviewBookingId ? completionMap[reviewBookingId] : null;
    if (!reviewData) return;

    try {
      if (action === "delete") {
        await deleteCompletionMedia(mediaId);
      } else {
        const mediaItem = reviewData.media.find((item) => item.id === mediaId);
        if (!mediaItem) return;
        await updateCompletionMedia(mediaId, { is_hidden: action === "hide" });
      }

      const refreshed = await fetchCompletionForBooking(reviewBookingId!);
      setCompletionMap((prev) => ({
        ...prev,
        [reviewBookingId!]: refreshed,
      }));
    } catch (error) {
      console.error("Failed to update media", error);
      toast.error("Failed to update media");
    }
  };

  const handleToggleApprovalRequirement = async () => {
    try {
      const nextValue = !approvalRequired;
      const settings = await setCompletionApprovalRequirement(nextValue);
      setApprovalRequired(settings?.approval_required ?? nextValue);
      toast.success(`Approval requirement ${nextValue ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to update approval setting", error);
      toast.error("Failed to update approval setting");
    }
  };

  const getSessionAccessToken = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error("Authentication session not found. Please log in again.");
    }
    return session.access_token;
  };

  const callBookingFunction = async (functionName: string, body: unknown) => {
    const accessToken = await getSessionAccessToken();
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey,
      },
    });
    if (error) throw error;
    return data;
  };

  const handleEdgeFunctionError = (err: unknown, fallbackMessage: string) => {
    console.error("Edge function error:", err);
    const message = typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err && typeof (err as any).message === "string"
      ? (err as any).message
      : err && typeof err === "object" && "error" in err && typeof (err as any).error === "string"
      ? (err as any).error
      : fallbackMessage;

    toast.error(message || fallbackMessage);
  };

  const selectedReviewBooking = bookings.find((booking) => booking.id === reviewBookingId) || null;
  const selectedReviewData = reviewBookingId ? completionMap[reviewBookingId] : null;
  const selectedReviewSummary = getCompletionWorkflowSummary(selectedReviewData?.record ?? null, selectedReviewData?.media ?? []);
  const visibleReviewMedia = getVisibleCompletionMedia(selectedReviewData?.media ?? []);

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
              <TableHead>Completion</TableHead>
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
                    {(() => {
                      const completionSummary = getCompletionWorkflowSummary(completionMap[booking.id]?.record ?? null, completionMap[booking.id]?.media ?? []);
                      return <Badge variant={completionSummary.badgeVariant as any}>{completionSummary.badgeLabel}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewBookingId(booking.id);
                          setReviewNotes(completionMap[booking.id]?.record?.admin_notes ?? "");
                        }}
                      >
                        Review
                      </Button>

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

                      {(booking.payment_status === "pending" || booking.payment_status === "failed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Mark this booking as PAID?")) return;
                            try {
                              await callBookingFunction("admin-mark-paid", { bookingId: booking.id });
                              toast.success("Booking marked paid");
                              fetchBookings();
                            } catch (err: any) {
                              handleEdgeFunctionError(err, "Failed to mark paid");
                            }
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}

                      {booking.payment_status !== "paid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await callBookingFunction("resend-payment-link", { bookingId: booking.id });
                              toast.success("Payment link emailed to user");
                              fetchBookings();
                            } catch (err: any) {
                              handleEdgeFunctionError(err, "Failed to resend payment link");
                            }
                          }}
                        >
                          <RefreshIcon className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await callBookingFunction("admin-send-booking-email", { bookingId: booking.id, type: "reminder" });
                            toast.success("Reminder email sent");
                          } catch (err: any) {
                            handleEdgeFunctionError(err, "Failed to send reminder");
                          }
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Reminder
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={async () => {
                          if (!confirm("Delete this booking? This cannot be undone.")) return;
                          try {
                            const { error } = await supabase.from("puja_bookings").delete().eq("id", booking.id);
                            if (error) throw error;
                            toast.success("Booking deleted");
                            fetchBookings();
                          } catch (err: any) {
                            console.error(err);
                            toast.error(err?.message || "Failed to delete booking");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {reviewBookingId && selectedReviewBooking && (
        <Card className="border-primary/20 bg-background">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Review completion for {selectedReviewBooking.devotee_name}</CardTitle>
                <CardDescription>
                  Approve, request revision, or reject the priest’s completion report and manage visibility of shared media.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Approval required: {approvalRequired ? "On" : "Off"}</Badge>
                <Button variant="outline" size="sm" onClick={handleToggleApprovalRequirement}>Toggle</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedReviewData?.record ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedReviewSummary.badgeVariant as any}>{selectedReviewSummary.badgeLabel}</Badge>
                      <Badge variant="outline">Dispatch: {selectedReviewData.record.prasad_dispatch_status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{selectedReviewData.record.completion_notes || "No completion notes recorded yet."}</p>
                    {selectedReviewData.record.courier_tracking_number && <p className="mt-2 text-sm">Tracking: {selectedReviewData.record.courier_tracking_number}</p>}
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <Label className="text-sm">Admin notes</Label>
                    <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Add review notes for the priest or devotee" className="mt-2" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void handleReviewDecision("approved")} disabled={reviewingAction}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => void handleReviewDecision("needs_revision")} disabled={reviewingAction}>Needs Revision</Button>
                      <Button size="sm" variant="destructive" onClick={() => void handleReviewDecision("rejected")} disabled={reviewingAction}>Reject</Button>
                    </div>
                  </div>
                </div>

                {selectedReviewData.media.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Media review</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedReviewData.media.map((item) => (
                        <div key={item.id}>
                          <CompletionMediaPreview item={item} />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => void handleMediaAction(item.id, item.is_hidden ? "show" : "hide")}>{item.is_hidden ? "Show" : "Hide"}</Button>
                            <Button variant="destructive" size="sm" onClick={() => void handleMediaAction(item.id, "delete")}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No completion workflow has been created for this booking yet.</p>
            )}
          </CardContent>
        </Card>
      )}

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
