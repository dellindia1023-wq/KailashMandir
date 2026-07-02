import React, { type ReactNode } from "https://esm.sh/react@18.3.1";
import { EmailFooter } from "./footer.tsx";
import { EmailHeader } from "./header.tsx";
import { containerStyle, sectionStyle, emailTheme, baseTextStyle } from "./styles.ts";

export interface EmailLayoutProps {
  title: string;
  previewText?: string;
  children: ReactNode;
}

export const EmailLayout = ({ title, previewText, children }: EmailLayoutProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>{`body{margin:0;padding:0;background:#FFF8E1;}@media only screen and (max-width: 620px){.email-shell{width:100% !important;}}`}</style>
    </head>
    <body style={{ margin: 0, padding: 0, backgroundColor: emailTheme.background }}>
      <div style={{ padding: "24px 12px", backgroundColor: emailTheme.background }}>
        <div className="email-shell" style={{ ...containerStyle, width: "100%" } as Record<string, string>}>
          <div style={{ fontFamily: "Arial, sans-serif" }}>
            <EmailHeader />
            <div style={{ ...sectionStyle, ...baseTextStyle } as Record<string, string>}>
              <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: emailTheme.primary }}>{title}</div>
              {previewText ? <div style={{ fontSize: "14px", color: emailTheme.muted, marginBottom: "18px" }}>{previewText}</div> : null}
              {children}
            </div>
            <EmailFooter />
          </div>
        </div>
      </div>
    </body>
  </html>
);
