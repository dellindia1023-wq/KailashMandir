import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon, Clock } from "lucide-react";

interface RescheduleBookingDialogProps {
  booking: {
    id: string;
    booking_date: string;
    booking_time: string;
    pujas: {
      name: string;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "16:00", "16:30", "17:00", "17:30", "18:00",
];

export const RescheduleBookingDialog = ({ 
  booking, 
  open, 
  onOpenChange, 
  onSuccess 
}: RescheduleBookingDialogProps) => {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!booking || !date || !time) {
      toast.error("Please select both date and time");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("puja_bookings")
        .update({
          booking_date: format(date, "yyyy-MM-dd"),
          booking_time: time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking rescheduled successfully! 🙏");
      onSuccess();
      onOpenChange(false);
      setDate(undefined);
      setTime("");
    } catch (error: any) {
      console.error("Reschedule error:", error);
      toast.error("Failed to reschedule booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Reschedule Booking
          </DialogTitle>
          <DialogDescription>
            Select a new date and time for <span className="font-medium">{booking.pujas.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Schedule */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-1">Current Schedule</p>
            <p className="font-medium">
              {format(new Date(booking.booking_date), "MMMM d, yyyy")} at {booking.booking_time}
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select New Date
            </Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < tomorrow}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select New Time
            </Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={loading || !date || !time}
            className="flex-1 bg-gradient-saffron hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
