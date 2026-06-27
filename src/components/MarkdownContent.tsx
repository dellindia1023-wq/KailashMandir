import React from "react";
import ReactMarkdown from "react-markdown";

const YOUTUBE_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;
const VIDEO_EXTENSIONS = [".mp4", ".webm"];

const getYouTubeEmbedUrl = (href: string): string | null => {
  const match = href.match(YOUTUBE_REGEX);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?rel=0&showinfo=0`;
};

const isVideoUrl = (href: string): boolean => {
  return VIDEO_EXTENSIONS.some((ext) => href.toLowerCase().endsWith(ext));
};

export const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      components={{
        img: ({ src, alt, title }) => {
          return (
            <figure className="mb-6">
              <img
                src={src ?? ""}
                alt={alt ?? ""}
                title={title ?? undefined}
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl object-cover"
              />
              {title && (
                <figcaption className="mt-2 text-sm text-muted-foreground">{title}</figcaption>
              )}
            </figure>
          );
        },
        a: ({ href, children }) => {
          if (!href) {
            return <a>{children}</a>;
          }

          const youtubeEmbedUrl = getYouTubeEmbedUrl(href);
          if (youtubeEmbedUrl) {
            return (
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-black/5">
                <iframe
                  src={youtubeEmbedUrl}
                  allowFullScreen
                  loading="lazy"
                  className="w-full aspect-video"
                  title="YouTube video"
                />
              </div>
            );
          }

          if (isVideoUrl(href)) {
            return (
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-black/5">
                <video
                  src={href}
                  controls
                  preload="metadata"
                  className="w-full aspect-video object-cover"
                />
              </div>
            );
          }

          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline-offset-4 hover:underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
