import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBookingEmail = () => {
  const sendConfirmationEmail = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-booking-email", {
        body: { bookingId, type: "confirmation" },
      });

      if (error) {
        console.error("Failed to send confirmation email:", error);
        // Don't show error to user - email is secondary to booking
        return false;
      }

      console.log("Confirmation email sent:", data);
      return true;
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      return false;
    }
  };

  const sendReminderEmail = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-booking-email", {
        body: { bookingId, type: "reminder" },
      });

      if (error) {
        console.error("Failed to send reminder email:", error);
        return false;
      }

      console.log("Reminder email sent:", data);
      toast.success("Reminder email sent successfully!");
      return true;
    } catch (error) {
      console.error("Error sending reminder email:", error);
      toast.error("Failed to send reminder email");
      return false;
    }
  };

  return { sendConfirmationEmail, sendReminderEmail };
};
