import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptData {
  type: "booking" | "donation";
  id: string;
  name: string;
  date: string;
  amount: number;
  details: Record<string, string>;
}

async function fetchAboutSettings() {
  try {
    const { data } = await supabase.from("about_settings").select("*").maybeSingle();
    return data as any;
  } catch (err) {
    return null;
  }
}

export async function generateReceipt(data: ReceiptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const about = await fetchAboutSettings();
  const templeName = about?.hero_title || "Shri Kailash Mahadev Temple";
  const templeSub = about?.hero_subtitle || "Agra, Uttar Pradesh | Om Namah Shivaya";

  // Header
  doc.setFillColor(234, 88, 12); // primary/saffron
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(templeName, pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(templeSub, pageWidth / 2, 28, { align: "center" });
  doc.text(data.type === "booking" ? "BOOKING RECEIPT" : "DONATION RECEIPT", pageWidth / 2, 36, { align: "center" });

  // Receipt body
  doc.setTextColor(51, 51, 51);
  let y = 55;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${data.id.slice(0, 8).toUpperCase()}`, 20, y);
  doc.text(`Date: ${data.date}`, pageWidth - 20, y, { align: "right" });
  y += 15;

  // Separator line
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.name, 20, y);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  Object.entries(data.details).forEach(([key, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${key}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 70, y);
    y += 8;
  });

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  // Amount
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(234, 88, 12);
  doc.text(`Amount: ₹${data.amount.toLocaleString("en-IN")}`, 20, y);
  y += 15;

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated receipt. Donations are eligible for tax exemption under Section 80G.", 20, y);
  y += 6;
  const contactEmail = about?.contact_email || "temple@kailashmahadevagra.com";
  doc.text(`For queries, contact: ${contactEmail}`, 20, y);

  // Footer with social links if available
  const footerY = doc.internal.pageSize.getHeight() - 35;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (about?.social_links) {
    const socials = about.social_links as Record<string, string>;
    let sx = 20;
    Object.entries(socials).forEach(([k, v]) => {
      if (!v) return;
      doc.text(`${k.toUpperCase()}: ${v}`, sx, footerY);
      sx += 70;
    });
  }

  // Footer
  const footerY2 = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(234, 88, 12);
  doc.rect(0, footerY2 - 5, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("|| Om Namah Shivaya || Har Har Mahadev ||", pageWidth / 2, footerY2 + 3, { align: "center" });

  doc.save(`${data.type}-receipt-${data.id.slice(0, 8)}.pdf`);
}
