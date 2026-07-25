import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import KnowledgeHubPage from "@/pages/KnowledgeHubPage";

vi.mock("@/hooks/useBlog", () => ({
  useKnowledgeArticles: () => ({
    data: [
      {
        id: "article-1",
        question: "How can I book a puja?",
        answer: "You can book a puja through the booking page.",
        category: "Puja & Offerings",
        is_featured: true,
        view_count: 12,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        slug: "how-can-i-book-a-puja",
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useScrollReveal", () => ({
  default: () => ({ ref: () => undefined, className: "" }),
}));

vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="mock-footer" />,
}));

vi.mock("@/components/PageHeroBanner", () => ({
  default: () => <div data-testid="mock-hero-banner" />,
}));

vi.mock("@/components/SEOHead", () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/MarkdownContent", () => ({
  MarkdownContent: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock("@/components/ImageShimmer", () => ({
  default: () => null,
}));

vi.mock("@/lib/contentSeo", () => ({
  buildContentAutomationMetadata: () => ({
    reading_time_minutes: 2,
    question_engine: { question_variations: [] },
  }),
  buildKnowledgeContentMetadata: () => ({
    answer_first_paragraph: "",
    context_blocks: [],
  }),
  buildKnowledgeArticleSlug: (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
}));

describe("KnowledgeHubPage", () => {
  it("renders a dedicated slug link for each knowledge article", () => {
    render(
      <MemoryRouter>
        <KnowledgeHubPage />
      </MemoryRouter>
    );

    const articleLinks = screen.getAllByRole("link", { name: /How can I book a puja\?/i });
    expect(articleLinks.length).toBeGreaterThan(0);
    expect(articleLinks.some((link) => link.getAttribute("href") === "/knowledge/how-can-i-book-a-puja")).toBe(true);
  });
});
