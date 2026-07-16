import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  width?: number | string;
  height?: number | string;
  priority?: boolean; // if true, use eager loading
};

export default function SiteImage({ width, height, priority, className = "", alt = "", ...rest }: Props) {
  const loading = priority ? "eager" : (rest.loading as string) || "lazy";

  const style: React.CSSProperties = {};
  if (width && height) {
    style.width = typeof width === "number" ? `${width}px` : width;
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <img
      {...rest}
      alt={alt}
      loading={loading as any}
      decoding="async"
      width={width as any}
      height={height as any}
      className={`markdown-img ${className}`}
      style={style}
    />
  );
}
