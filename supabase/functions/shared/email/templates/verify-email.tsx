import React from "https://esm.sh/react@18.3.1";
import { EmailButton } from "../button.tsx";
import { EmailLayout } from "../layout.tsx";
import { cardStyle } from "../styles.ts";

export interface VerifyEmailProps {
  recipientName?: string;
  verificationUrl?: string;
}

import { getFrontendUrl } from "../utils.ts";
const siteUrl = getFrontendUrl();

export const VerifyEmail = ({ recipientName = "Devotee", verificationUrl = `${siteUrl}/verify-email` }: VerifyEmailProps) => (
  <EmailLayout title="Verify Your Email" previewText="Verify your email address to secure your temple account.">
    <div>
      <p style={{ margin: "0 0 12px" }}>Namaste {recipientName},</p>
      <p style={{ margin: "0 0 16px" }}>Please verify your email address to activate your account and receive important temple updates.</p>
      <div style={cardStyle as React.CSSProperties}>
        <p style={{ margin: 0 }}>This link will confirm your inbox and help us keep your account secure.</p>
      </div>
      <EmailButton href={verificationUrl} label="Verify Email Address" />
    </div>
  </EmailLayout>
);
