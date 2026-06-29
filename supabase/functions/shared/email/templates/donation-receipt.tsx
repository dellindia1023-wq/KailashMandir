import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface DonationReceiptEmailProps {
  recipientName?: string;
  amount?: number;
  donationType?: string;
  referenceCode?: string;
}

export const DonationReceiptEmail = ({ recipientName = "Devotee", amount = 0, donationType = "Donation", referenceCode }: DonationReceiptEmailProps) => (
  <EmailLayout title="Donation Receipt" previewText="Thank you for your generous donation to the temple.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Your generous contribution has been received and is greatly appreciated. Your seva supports temple welfare and sacred services.</p>
      <div style={cardStyle as React.CSSProperties}>
        <div style={{ fontWeight: 700, color: "#B8860B", marginBottom: "10px" }}>{donationType}</div>
        <div>💰 Amount: ₹{amount.toLocaleString("en-IN")}</div>
        {referenceCode ? <div>🧾 Receipt ID: {referenceCode}</div> : null}
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/donation" label="Continue Supporting the Temple" />
    </div>
  </EmailLayout>
);
