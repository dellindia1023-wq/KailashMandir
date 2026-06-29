import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface WelcomeEmailProps {
  recipientName?: string;
}

export const WelcomeEmail = ({ recipientName = "Devotee" }: WelcomeEmailProps) => (
  <EmailLayout title="Welcome to Kailash Mahadev Temple" previewText="Welcome to the temple community and experience sacred services with us.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>
        We are delighted to welcome you to the Kailash Mahadev Temple community. You can now book pujas, make donations, and receive sacred updates directly in your inbox.
      </p>
      <div style={cardStyle as React.CSSProperties}>
        <p style={{ margin: "0 0 8px", fontWeight: 700 }}>आपका स्वागत है</p>
        <p style={{ margin: 0 }}>Temple services, booking updates, and devotional notifications will now be shared in English and Hindi.</p>
      </div>
      <EmailButton href="https://kailashmahadevtemple.com" label="Explore Temple Services" />
    </div>
  </EmailLayout>
);
