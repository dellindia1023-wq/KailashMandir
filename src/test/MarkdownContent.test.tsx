import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/MarkdownContent";

describe("MarkdownContent", () => {
  it("renders youtube embeds and video links from markdown content", () => {
    render(
      <MarkdownContent
        content={[
          "Watch this video:",
          "[YouTube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
          "",
          "[Demo video](https://example.com/demo.mp4)",
        ].join("\n")}
      />
    );

    expect(screen.getByTitle("YouTube video")).toBeInTheDocument();
    expect(screen.getByTestId("markdown-video")).toBeInTheDocument();
  });
});
