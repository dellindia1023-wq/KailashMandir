import React from "https://esm.sh/react@18.3.1";
import { buttonStyle } from "./styles.ts";

export interface EmailButtonProps {
  href: string;
  label: string;
}

export const EmailButton = ({ href, label }: EmailButtonProps) => (
  <div style={{ marginTop: "24px", marginBottom: "8px" }}>
    <a href={href} style={buttonStyle as React.CSSProperties}>
      {label}
    </a>
  </div>
);
