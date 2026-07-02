import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface PaymentLinkEmailProps {
  recipientName?: string;
  pujaName?: string;
  amount?: number;
  payUrl?: string;
}

export const PaymentLinkEmail = ({ recipientName = "Devotee", pujaName = "Puja", amount = 0, payUrl = "#" }: PaymentLinkEmailProps) => (
  <EmailLayout title="Complete your payment" previewText="Complete payment to confirm your booking.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Thank you for reserving a puja at Kailash Mandir Agra. To confirm your booking for <strong>{pujaName}</strong>, please complete the payment of <strong>₹{amount}</strong>.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{pujaName}</div>
        <div>Amount: ₹{amount}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <EmailButton href={payUrl} label="Pay Now" />
      </div>
    </div>
  </EmailLayout>
);
