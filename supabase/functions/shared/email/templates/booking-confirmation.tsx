import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";
import { formatDate, formatTime } from "../utils.ts";

export interface BookingConfirmationEmailProps {
  recipientName?: string;
  pujaName?: string;
  bookingDate?: string;
  bookingTime?: string;
  amount?: number;
  referenceCode?: string;
}

export const BookingConfirmationEmail = ({ recipientName = "Devotee", pujaName = "Puja", bookingDate, bookingTime, amount, referenceCode }: BookingConfirmationEmailProps) => (
  <EmailLayout title="Booking Confirmed" previewText="Your sacred puja booking is confirmed and ready for the temple calendar.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Your puja booking has been confirmed. Please arrive a little early and carry your devotion with you.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{pujaName}</div>
        <div>📅 Date: {formatDate(bookingDate)}</div>
        <div>⏰ Time: {formatTime(bookingTime)}</div>
        {typeof amount === "number" ? <div>💰 Amount: ₹{amount.toLocaleString("en-IN")}</div> : null}
        {referenceCode ? <div>🧾 Reference: {referenceCode}</div> : null}
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/bookings" label="View Booking Details" />
    </div>
  </EmailLayout>
);
