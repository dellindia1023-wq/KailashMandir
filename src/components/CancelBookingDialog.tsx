import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelBookingDialogProps {
  booking: {
    id: string;
    pujas: {
      name: string;
    };
    amount: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CancelBookingDialog = ({ 
  booking, 
  open, 
  onOpenChange, 
  onSuccess 
}: CancelBookingDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!booking) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("puja_bookings")
        .update({
          payment_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking cancelled successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="font-heading text-xl">
              Cancel Booking?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel your booking for <span className="font-medium text-foreground">{booking.pujas.name}</span>?
            </p>
            <p className="text-sm">
              Amount: <span className="font-medium">₹{booking.amount.toLocaleString("en-IN")}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the temple office for refund inquiries.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel Booking"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
