import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface PriestAssignedEmailProps {
  recipientName?: string;
  priestName?: string;
  pujaName?: string;
}

export const PriestAssignedEmail = ({ recipientName = "Devotee", priestName = "Priest", pujaName = "Puja" }: PriestAssignedEmailProps) => (
  <EmailLayout title="Priest Assigned" previewText="Your priest assignment has been updated for your booking.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>A priest has been assigned for your sacred puja. You will receive further instructions closer to the ceremony time.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{pujaName}</div>
        <div>🙏 Assigned Priest: {priestName}</div>
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/bookings" label="View Booking Schedule" />
    </div>
  </EmailLayout>
);
