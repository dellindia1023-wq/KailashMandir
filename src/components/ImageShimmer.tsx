import React, { useEffect } from "react";

export default function ImageShimmer() {
  useEffect(() => {
    const observed = Array.from(document.querySelectorAll<HTMLImageElement>(".markdown-figure .markdown-img"));

    const listeners: Array<{ img: HTMLImageElement; onLoad: () => void; onError: () => void }> = [];

    observed.forEach((img) => {
      const figure = img.closest(".markdown-figure") as HTMLElement | null;
      if (figure) figure.classList.add("img-loading");

      const onLoad = () => {
        img.classList.add("loaded");
        if (figure) {
          figure.classList.add("img-loaded");
          figure.classList.remove("img-loading");
        }
      };

      const onError = () => {
        img.classList.add("loaded");
        if (figure) {
          figure.classList.add("img-error");
          figure.classList.remove("img-loading");
        }
      };

      if (img.complete && img.naturalWidth) {
        onLoad();
      } else {
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onError);
        listeners.push({ img, onLoad, onError });
      }
    });

    return () => {
      listeners.forEach(({ img, onLoad, onError }) => {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      });
    };
  }, []);

  return null;
}
