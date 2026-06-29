import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface PasswordResetEmailProps {
  recipientName?: string;
  resetUrl?: string;
}

export const PasswordResetEmail = ({ recipientName = "Devotee", resetUrl = "https://kailashmahadevtemple.com/reset-password" }: PasswordResetEmailProps) => (
  <EmailLayout title="Reset Your Password" previewText="Use the secure link below to reset your temple account password.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>A password reset request was received for your account. If this was you, click the button below to continue.</p>
      <div style={cardStyle as React.CSSProperties}>
        <p style={{ margin: 0 }}>If you did not request this change, you can safely ignore this email.</p>
      </div>
      <EmailButton href={resetUrl} label="Reset Password" />
    </div>
  </EmailLayout>
);
