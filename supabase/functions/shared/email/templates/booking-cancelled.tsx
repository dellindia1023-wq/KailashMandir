import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface BookingCancelledEmailProps {
  recipientName?: string;
  pujaName?: string;
  refundNote?: string;
}

export const BookingCancelledEmail = ({ recipientName = "Devotee", pujaName = "Puja", refundNote }: BookingCancelledEmailProps) => (
  <EmailLayout title="Booking Cancelled" previewText="Your temple booking has been cancelled successfully.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Your booking for {pujaName} has been cancelled. If a refund is applicable, it will be processed as per temple policy.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{pujaName}</div>
        {refundNote ? <div>{refundNote}</div> : <div>Please contact the temple office if you need assistance.</div>}
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/contact" label="Contact Temple Support" />
    </div>
  </EmailLayout>
);
