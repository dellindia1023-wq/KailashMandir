import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";
import { formatDate, formatTime } from "../utils.ts";

export interface BookingReminderEmailProps {
  recipientName?: string;
  pujaName?: string;
  bookingDate?: string;
  bookingTime?: string;
}

export const BookingReminderEmail = ({ recipientName = "Devotee", pujaName = "Puja", bookingDate, bookingTime }: BookingReminderEmailProps) => (
  <EmailLayout title="Puja Reminder" previewText="This is a reminder for your upcoming temple booking tomorrow.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>This is a gentle reminder that your sacred puja is scheduled for tomorrow. Please arrive 15 minutes early.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{pujaName}</div>
        <div>📅 Date: {formatDate(bookingDate)}</div>
        <div>⏰ Time: {formatTime(bookingTime)}</div>
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/bookings" label="View Reminder Details" />
    </div>
  </EmailLayout>
);
