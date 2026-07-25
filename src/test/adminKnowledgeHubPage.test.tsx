import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminKnowledgeHubPage from "@/pages/admin/AdminKnowledgeHubPage";

vi.mock("@/hooks/useBlog", () => ({
  useKnowledgeArticles: () => ({ data: [], isLoading: false }),
  useCreateKnowledgeArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateKnowledgeArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteKnowledgeArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/contentSeo", () => ({
  analyzeContentQuality: () => ({
    seoScore: 0,
    geoScore: 0,
    aeoScore: 0,
    wordCount: 0,
    readingTime: 0,
    headingCount: 0,
    imageCount: 0,
    videoCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    faqCount: 0,
    schemaStatus: "Not started",
    slugPreview: "",
    canonicalPreview: "",
    metaPreview: "",
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
describe("AdminKnowledgeHubPage", () => {
  it("renders the richer knowledge hub editor experience", () => {
    render(<AdminKnowledgeHubPage />);

    expect(screen.getByText("Manage questions and answers with the full editor experience")).toBeTruthy();
    expect(screen.getByText("New Article")).toBeTruthy();
  });
});
