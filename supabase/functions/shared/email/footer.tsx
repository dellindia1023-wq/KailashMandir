import React from "https://esm.sh/react@18.3.1";
import { emailTheme, footerLinkStyle } from "./styles.ts";

export const EmailFooter = () => (
  <div
    style={{
      backgroundColor: "#1F2937",
      color: "#F9FAFB",
      padding: "24px 28px",
      fontSize: "13px",
      lineHeight: 1.6,
    }}
  >
    <div style={{ marginBottom: "8px", fontWeight: 700 }}>Shri Kailash Mahadev Temple</div>
    <div>Temple Address: 18/2, Agra Road, Mathura, Uttar Pradesh</div>
    <div>Website: <a href="https://kailashmahadevtemple.com" style={footerLinkStyle as React.CSSProperties}>kailashmahadevtemple.com</a></div>
    <div>Contact: +91-98765-43210</div>
    <div>Email: info@kailashmahadevtemple.com</div>
    <div style={{ marginTop: "10px" }}>
      <a href="https://www.facebook.com" style={footerLinkStyle as React.CSSProperties}>Facebook</a>
      {" • "}
      <a href="https://www.instagram.com" style={footerLinkStyle as React.CSSProperties}>Instagram</a>
      {" • "}
      <a href="https://www.youtube.com" style={footerLinkStyle as React.CSSProperties}>YouTube</a>
    </div>
    <div style={{ marginTop: "10px", color: "#D1D5DB" }}>© 2026 Kailash Mahadev Temple. All rights reserved.</div>
    <div style={{ marginTop: "8px", color: "#9CA3AF" }}>This is an automated transactional email.</div>
  </div>
);
