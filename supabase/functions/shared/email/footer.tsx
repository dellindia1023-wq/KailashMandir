import React from "https://esm.sh/react@18.3.1";
import { emailTheme, footerLinkStyle } from "./styles.ts";
import { getFrontendUrl } from "./utils.ts";

const siteUrl = getFrontendUrl();

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
    <div style={{ marginBottom: "8px", fontWeight: 700 }}>Kailash Mandir Agra</div>
    <div>Shri Kailash Mahadev Temple</div>
    <div>Sikandra</div>
    <div>Agra</div>
    <div>Uttar Pradesh 282007</div>
    <div>Website: <a href={siteUrl} style={footerLinkStyle as React.CSSProperties}>{siteUrl.replace(/^https?:\/\//, "")}</a></div>
    <div>Email: kailashmahadevagra@gmail.com</div>
    <div style={{ marginTop: "10px" }}>
      <a href="https://www.facebook.com" style={footerLinkStyle as React.CSSProperties}>Facebook</a>
      {" • "}
      <a href="https://www.instagram.com" style={footerLinkStyle as React.CSSProperties}>Instagram</a>
      {" • "}
      <a href="https://www.youtube.com" style={footerLinkStyle as React.CSSProperties}>YouTube</a>
    </div>
    <div style={{ marginTop: "10px", color: "#D1D5DB" }}>© 2026 Kailash Mandir Agra. All rights reserved.</div>
    <div style={{ marginTop: "8px", color: "#9CA3AF" }}>This is an automated transactional email.</div>
  </div>
);
