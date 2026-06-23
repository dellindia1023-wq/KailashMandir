import jsPDF from "jspdf";

interface KundliPdfData {
  title: string;
  birthName: string | null;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  kundliData: any;
}

export function generateKundliPdf(data: KundliPdfData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;

  // ── Header Banner ──
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, pw, 44, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Shri Kailash Mahadev Temple", pw / 2, 16, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Agra, Uttar Pradesh | Om Namah Shivaya", pw / 2, 25, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("KUNDLI / BIRTH CHART", pw / 2, 37, { align: "center" });

  // ── Title & Birth Details ──
  let y = 56;
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const birthInfo = [
    ["Name", data.birthName || "Devotee"],
    ["Date of Birth", new Date(data.birthDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
    ["Time of Birth", data.birthTime],
    ["Place of Birth", data.birthPlace],
  ];

  birthInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, y);
    y += 7;
  });

  y += 4;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 10;

  // ── Core Details: Rashi, Nakshatra, Lagna ──
  const kd = data.kundliData || {};
  const coreItems = [
    ["Rashi", kd.rashi],
    ["Nakshatra", kd.nakshatra],
    ["Lagna", kd.lagna],
  ].filter(([, v]) => v);

  if (coreItems.length > 0) {
    const boxW = contentW / coreItems.length;
    coreItems.forEach(([label, value], i) => {
      const bx = margin + i * boxW;
      doc.setFillColor(255, 243, 230);
      doc.roundedRect(bx, y, boxW - 4, 20, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(label, bx + (boxW - 4) / 2, y + 7, { align: "center" });
      doc.setFontSize(11);
      doc.setTextColor(51, 51, 51);
      doc.setFont("helvetica", "bold");
      doc.text(value, bx + (boxW - 4) / 2, y + 16, { align: "center" });
      doc.setFont("helvetica", "normal");
    });
    y += 28;
  }

  // ── Helper: section with auto page-break ──
  const checkPage = (needed: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - 30) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (title: string) => {
    checkPage(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 88, 12);
    doc.text(title, margin, y);
    y += 8;
    doc.setTextColor(51, 51, 51);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const wrapText = (text: string) => {
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach((line: string) => {
      checkPage(7);
      doc.text(line, margin, y);
      y += 6;
    });
    y += 3;
  };

  // ── Personality ──
  if (kd.personality) {
    sectionTitle("Personality");
    wrapText(kd.personality);
  }

  // ── Career ──
  if (kd.career) {
    sectionTitle("Career");
    wrapText(kd.career);
  }

  // ── Marriage ──
  if (kd.marriage) {
    sectionTitle("Marriage");
    wrapText(kd.marriage);
  }

  // ── Remedies ──
  if (kd.remedies?.length) {
    sectionTitle("Recommended Remedies");
    kd.remedies.forEach((r: string, i: number) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${r}`, contentW - 5);
      lines.forEach((line: string) => {
        checkPage(7);
        doc.text(line, margin + 3, y);
        y += 6;
      });
    });
    y += 3;
  }

  // ── Lucky Items ──
  const luckyItems: string[] = [];
  kd.luckyGems?.forEach((g: string) => luckyItems.push(`Gem: ${g}`));
  kd.luckyNumbers?.forEach((n: string) => luckyItems.push(`Number: ${n}`));
  kd.luckyColors?.forEach((c: string) => luckyItems.push(`Color: ${c}`));

  if (luckyItems.length) {
    sectionTitle("Lucky Items");
    wrapText(luckyItems.join("  |  "));
  }

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(234, 88, 12);
    doc.rect(0, pageH - 16, pw, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("|| Om Namah Shivaya || Har Har Mahadev ||", pw / 2, pageH - 8, { align: "center" });
    doc.text(`Page ${p} of ${totalPages}`, pw - margin, pageH - 8, { align: "right" });
  }

  const safeName = (data.birthName || data.title || "kundli").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  doc.save(`kundli-${safeName}.pdf`);
}
