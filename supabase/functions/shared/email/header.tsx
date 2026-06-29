import React from "https://esm.sh/react@18.3.1";
import { emailTheme } from "./styles.ts";

export const EmailHeader = () => (
  <div
    style={{
      background: `linear-gradient(135deg, ${emailTheme.primary} 0%, ${emailTheme.accent} 100%)`,
      padding: "32px 24px",
      textAlign: "center",
      color: "#FFFFFF",
    }}
  >
    <div style={{ fontSize: "42px", marginBottom: "8px" }}>🕉️</div>
    <div style={{ fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>Kailash Mahadev Temple</div>
    <div style={{ fontSize: "14px", opacity: 0.9 }}>Shri Kailash Mahadev Temple • Agra</div>
  </div>
);
