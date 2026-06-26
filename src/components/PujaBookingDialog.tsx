import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, CalendarIcon, Clock, User, Sparkles } from "lucide-react";

interface Puja {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

interface PujaBookingDialogProps {
  puja: Puja | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "16:00", "16:30", "17:00", "17:30", "18:00",
];

export const PujaBookingDialog = ({ puja, open, onOpenChange }: PujaBookingDialogProps) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [devoteeName, setDevoteeName] = useState("");
  const [devoteeGotra, setDevoteeGotra] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setDate(undefined);
    setTime("");
    setDevoteeName("");
    setDevoteeGotra("");
    setSpecialInstructions("");
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    if (!puja || !date || !time || !devoteeName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      toast.error("Please sign in to book a puja");
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            pujaId: puja.id,
            amount: puja.price,
            bookingDate: format(date, "yyyy-MM-dd"),
            bookingTime: time,
            devoteeName,
            devoteeGotra: devoteeGotra || undefined,
            specialInstructions: specialInstructions || undefined,
          },
        }
      );

      if (orderError) {
        throw new Error(orderError.message || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Shri Kailash Mahadev Temple",
        description: `${puja.name} Booking`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  bookingId: orderData.bookingId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              }
            );

            if (verifyError) {
              throw new Error(verifyError.message || "Payment verification failed");
            }

            // Surface backend error details (verify-razorpay-payment now returns meaningful `error`)
            if (!verifyData?.success) {
              const backendMessage = (verifyData as any)?.error || "Payment verification failed";
              throw new Error(backendMessage);
            }

            toast.success("Puja booked successfully! 🙏 Confirmation email sent.");
            resetForm();
            onOpenChange(false);

            // Navigate to bookings to show confirmation
            window.location.href = "/dashboard/bookings";
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#ea580c",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to initiate booking");
    } finally {
      setLoading(false);
    }
  };

  if (!puja) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Book {puja.name}
          </DialogTitle>
          <DialogDescription>
            Complete the form below to book this sacred puja. Payment will be processed securely via Razorpay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Puja Details */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{puja.duration_minutes} minutes</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-heading text-xl font-bold text-primary">
                  ₹{puja.price.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date *
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
              Select Time *
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

          {/* Devotee Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Devotee Name *
              </Label>
              <Input
                placeholder="Enter devotee's name"
                value={devoteeName}
                onChange={(e) => setDevoteeName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Gotra (Optional)</Label>
              <Input
                placeholder="Enter gotra if known"
                value={devoteeGotra}
                onChange={(e) => setDevoteeGotra(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any specific prayers or requests..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>
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
            onClick={handleBooking}
            disabled={loading || !date || !time || !devoteeName}
            className="flex-1 bg-gradient-saffron hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>Pay ₹{puja.price.toLocaleString("en-IN")}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};            466
