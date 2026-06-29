import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface ContactAutoReplyProps {
  recipientName?: string;
}

export const ContactAutoReply = ({ recipientName = "Devotee" }: ContactAutoReplyProps) => (
  <EmailLayout title="Thank You for Contacting Us" previewText="We have received your message and will get back to you shortly.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Thank you for reaching out to Shri Kailash Mahadev Temple. We have received your message and will respond as soon as possible.</p>
      <div style={cardStyle as React.CSSProperties}>
        <p style={{ margin: 0 }}>For urgent requests, please contact the temple office directly on the number below.</p>
      </div>
      <EmailButton href="https://kailashmahadevtemple.com/contact" label="Return to Contact Page" />
    </div>
  </EmailLayout>
);
