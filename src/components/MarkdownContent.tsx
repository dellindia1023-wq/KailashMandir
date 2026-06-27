import React, { useMemo } from "react";

const YOUTUBE_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;
const VIDEO_EXTENSIONS = [".mp4", ".webm"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getYouTubeEmbedUrl = (href: string): string | null => {
  const match = href.match(YOUTUBE_REGEX);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?rel=0&showinfo=0`;
};

const isVideoUrl = (href: string): boolean => {
  return VIDEO_EXTENSIONS.some((ext) => href.toLowerCase().endsWith(ext));
};

const isImageUrl = (href: string): boolean => {
  return IMAGE_EXTENSIONS.some((ext) => href.toLowerCase().endsWith(ext));
};

const renderInlineMarkdown = (text: string): string => {
  let html = escapeHtml(text);

  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_match, alt, src, title) => {
    const safeSrc = escapeHtml(src);
    const safeAlt = escapeHtml(alt || "");
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
    return `<figure class="my-6"><img src="${safeSrc}" alt="${safeAlt}"${safeTitle} loading="lazy" decoding="async" class="w-full rounded-2xl object-cover" /><figcaption class="mt-2 text-sm text-muted-foreground">${safeAlt || escapeHtml(title || "")}</figcaption></figure>`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(href);
    const safeLabel = label.replace(/<[^>]+>/g, "");
    const youtubeEmbedUrl = getYouTubeEmbedUrl(href);
    if (youtubeEmbedUrl) {
      return `<div class="mb-6 overflow-hidden rounded-2xl border border-border bg-black/5"><iframe src="${escapeHtml(youtubeEmbedUrl)}" allowfullscreen loading="lazy" class="aspect-video w-full" title="YouTube video"></iframe></div>`;
    }
    if (isVideoUrl(href)) {
      return `<div class="mb-6 overflow-hidden rounded-2xl border border-border bg-black/5"><video src="${safeHref}" controls preload="metadata" data-testid="markdown-video" class="aspect-video w-full object-cover"></video></div>`;
    }
    if (isImageUrl(href)) {
      return `<figure class="my-6"><img src="${safeHref}" alt="${escapeHtml(safeLabel)}" loading="lazy" decoding="async" class="w-full rounded-2xl object-cover" /></figure>`;
    }
    return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener" class="text-primary underline-offset-4 hover:underline">${escapeHtml(safeLabel)}</a>`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code class=\"rounded bg-muted px-1.5 py-0.5 text-sm\">$1</code>");
  return html;
};

const convertMarkdownToHtml = (content: string) => {
  const lines = content.split(/\r?\n/);
  const htmlBlocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const heading = line.replace(/^#{1,6}\s+/, "");
      htmlBlocks.push(`<h${level} class="mt-8 scroll-mt-24 text-${level === 1 ? "3xl" : level === 2 ? "2xl" : level === 3 ? "xl" : "lg"} font-semibold tracking-tight">${renderInlineMarkdown(heading)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        quoteLines.push(lines[index].replace(/^>\s+/, ""));
        index += 1;
      }
      htmlBlocks.push(`<blockquote class="my-6 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">${quoteLines.map((block) => renderInlineMarkdown(block)).join("<br />")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      htmlBlocks.push(`<ul class="my-6 list-disc space-y-2 pl-6 text-foreground">${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      htmlBlocks.push(`<ol class="my-6 list-decimal space-y-2 pl-6 text-foreground">${items.join("")}</ol>`);
      continue;
    }

    if (line.includes("|") && lines[index + 1]?.trim().match(/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/)) {
      const rows = [line];
      index += 1;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(lines[index]);
        index += 1;
      }
      const parsedRows = rows.map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
      const [header, ...bodyRows] = parsedRows;
      const headerHtml = header.map((cell) => `<th class="border border-border px-3 py-2 text-left font-semibold">${renderInlineMarkdown(cell)}</th>`).join("");
      const bodyHtml = bodyRows.map((row) => `<tr>${row.map((cell) => `<td class="border border-border px-3 py-2">${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("");
      htmlBlocks.push(`<div class="my-6 overflow-x-auto"><table class="min-w-full border-collapse rounded-lg border border-border text-sm"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim() !== "") {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    const paragraph = paragraphLines.join(" ");
    if (paragraph) {
      htmlBlocks.push(`<p class="my-4 leading-8 text-foreground">${renderInlineMarkdown(paragraph)}</p>`);
    }
  }

  return htmlBlocks.join("");
};

export const MarkdownContent = ({ content }: { content: string }) => {
  const html = useMemo(() => convertMarkdownToHtml(content || ""), [content]);

  return <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
};
