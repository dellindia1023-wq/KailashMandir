import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RescheduleBookingDialog } from "@/components/RescheduleBookingDialog";
import { CancelBookingDialog } from "@/components/CancelBookingDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookingEmail } from "@/hooks/useBookingEmail";
import { generateReceipt } from "@/lib/generateReceipt";
import {
  Calendar, Clock, ArrowRight, Loader2, Mail, CalendarClock, X, Download
} from "lucide-react";

interface PujaBooking {
  id: string;
  puja_id: string;
  devotee_name: string;
  devotee_gotra: string | null;
  booking_date: string;
  booking_time: string;
  amount: number;
  payment_status: string;
  special_instructions: string | null;
  created_at: string;
  pujas: { id: string; name: string; category: string };
}

const UserBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<PujaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<PujaBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<PujaBooking | null>(null);
  const { sendReminderEmail } = useBookingEmail();

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("puja_bookings")
      .select("id, puja_id, devotee_name, devotee_gotra, booking_date, booking_time, amount, payment_status, special_instructions, created_at, pujas (id, name, category)")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false });
    setBookings((data as unknown as PujaBooking[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (t: string) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };

  const getBookingStatus = (booking: PujaBooking) => {
    const bookingDate = new Date(booking.booking_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (booking.payment_status === "cancelled") return { label: "Cancelled", color: "bg-gray-100 text-gray-700", isUpcoming: false, canModify: false };
    if (booking.payment_status !== "completed" && booking.payment_status !== "paid") return { label: "Payment Pending", color: "bg-yellow-100 text-yellow-700", isUpcoming: false, canModify: false };
    if (bookingDate < today) return { label: "Completed", color: "bg-green-100 text-green-700", isUpcoming: false, canModify: false };
    if (bookingDate.getTime() === today.getTime()) return { label: "Today", color: "bg-blue-100 text-blue-700", isUpcoming: true, canModify: false };
    return { label: "Upcoming", color: "bg-purple-100 text-purple-700", isUpcoming: true, canModify: true };
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case "completed": case "paid": return { color: "bg-green-100 text-green-700", label: "Paid" };
      case "pending": return { color: "bg-yellow-100 text-yellow-700", label: "Pending" };
      case "failed": return { color: "bg-red-100 text-red-700", label: "Failed" };
      case "cancelled": return { color: "bg-gray-100 text-gray-700", label: "Cancelled" };
      default: return { color: "bg-muted text-muted-foreground", label: status };
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (bookings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Bookings Yet</h3>
          <p className="text-muted-foreground mb-4">Book a puja to receive divine blessings</p>
          <Link to="/pujas">
            <Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">
              Browse Pujas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">My Bookings</h2>
      {bookings.map((booking) => {
        const status = getBookingStatus(booking);
        const paymentStatus = getPaymentStatusConfig(booking.payment_status);
        return (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-saffron" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-heading font-semibold text-lg">{booking.pujas.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      For: <span className="text-foreground">{booking.devotee_name}</span>
                      {booking.devotee_gotra && <span className="ml-2">• Gotra: {booking.devotee_gotra}</span>}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(booking.booking_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(booking.booking_time)}</span>
                    </div>
                    {booking.special_instructions && <p className="text-xs text-muted-foreground italic mt-1">"{booking.special_instructions}"</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold text-lg text-primary">₹{booking.amount.toLocaleString("en-IN")}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={status.color}>{status.label}</Badge>
                    <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
                  </div>
                  {(booking.payment_status === "completed" || booking.payment_status === "paid") && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => generateReceipt({
                      type: "booking", id: booking.id, name: booking.pujas.name, date: formatDate(booking.booking_date), amount: booking.amount,
                      details: { Devotee: booking.devotee_name, Gotra: booking.devotee_gotra || "—", Date: formatDate(booking.booking_date), Time: formatTime(booking.booking_time), Category: booking.pujas.category },
                    })}>
                      <Download className="h-3 w-3 mr-1" /> Receipt
                    </Button>
                  )}
                  {status.isUpcoming && (booking.payment_status === "completed" || booking.payment_status === "paid") && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={async () => { setSendingReminder(booking.id); await sendReminderEmail(booking.id); setSendingReminder(null); }} disabled={sendingReminder === booking.id} className="text-xs">
                        {sendingReminder === booking.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />} Reminder
                      </Button>
                      {status.canModify && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setRescheduleBooking(booking)} className="text-xs"><CalendarClock className="h-3 w-3 mr-1" /> Reschedule</Button>
                          <Button variant="outline" size="sm" onClick={() => setCancelBooking(booking)} className="text-xs text-destructive hover:text-destructive"><X className="h-3 w-3 mr-1" /> Cancel</Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <RescheduleBookingDialog booking={rescheduleBooking} open={!!rescheduleBooking} onOpenChange={(open) => !open && setRescheduleBooking(null)} onSuccess={fetchBookings} />
      <CancelBookingDialog booking={cancelBooking} open={!!cancelBooking} onOpenChange={(open) => !open && setCancelBooking(null)} onSuccess={fetchBookings} />
    </div>
  );
};

export default UserBookings;
