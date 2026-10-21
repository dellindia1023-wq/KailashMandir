import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminBlogManagement } from "@/components/admin/AdminBlogManagement";
import * as blogSystemHooks from "@/hooks/useBlogSystem";
import type { Blog } from "@/hooks/useBlogSystem";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/image.jpg" } }),
      }),
    },
  },
}));

vi.mock("@/lib/contentSeo", () => ({
  analyzeContentQuality: () => ({
    seoScore: 85,
    geoScore: 80,
    aeoScore: 80,
    wordCount: 100,
    readingTime: 1,
    headingCount: 1,
    imageCount: 1,
    videoCount: 0,
    internalLinkCount: 1,
    externalLinkCount: 0,
    faqCount: 0,
    schemaStatus: "Valid",
    slugPreview: "test-slug",
    canonicalPreview: "https://example.com/test-slug",
    metaPreview: "Meta snippet",
  }),
  buildContentAutomationMetadata: () => ({
    slug: "test-slug",
    seo_title: "Test SEO Title",
    seo_description: "Test SEO Description",
    seo_keywords: "test, blog",
  }),
  autoGenerateBlogSEO: () => ({
    seo_title: "Generated Title",
    seo_description: "Generated Desc",
    seo_keywords: "generated, keywords",
  }),
  generateSlug: (title: string) => title.toLowerCase().replace(/\s+/g, "-"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminBlogManagement — Regression tests for Draft blog visibility", () => {
  const mockCreateBlog = { mutateAsync: vi.fn(), isPending: false };
  const mockUpdateBlog = { mutateAsync: vi.fn(), isPending: false };
  const mockDeleteBlog = { mutate: vi.fn(), isPending: false };

  const sampleBlogs: Blog[] = [
    {
      id: "blog-1",
      title: "Ancient History of Kailash Mahadev",
      slug: "ancient-history",
      content: "Full content of the ancient history...",
      excerpt: "Brief excerpt",
      category_id: "cat-1",
      status: "published",
      is_featured: false,
      view_count: 120,
      created_at: "2026-06-01T10:00:00Z",
      updated_at: "2026-06-01T10:00:00Z",
      published_at: "2026-06-01T10:00:00Z",
      created_by: "user-1",
      category: { id: "cat-1", name: "History", slug: "history", created_at: "2026-01-01" },
    },
    {
      id: "blog-2",
      title: "Draft Article: Upcoming Mahashivratri Celebrations",
      slug: "upcoming-mahashivratri",
      content: "Draft content for Mahashivratri...",
      excerpt: "Draft excerpt",
      category_id: "cat-2",
      status: "draft",
      is_featured: false,
      view_count: 0,
      created_at: "2026-06-02T10:00:00Z",
      updated_at: "2026-06-02T10:00:00Z",
      published_at: undefined,
      created_by: "user-1",
      category: { id: "cat-2", name: "Events", slug: "events", created_at: "2026-01-01" },
    },
  ];

  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminBlogManagement />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes isAdmin=true to useBlogs so that Draft blogs are included in admin query", () => {
    const useBlogsSpy = vi.spyOn(blogSystemHooks, "useBlogs").mockReturnValue({
      data: sampleBlogs,
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(blogSystemHooks, "useBlogCategories").mockReturnValue({
      data: [{ id: "cat-1", name: "History", slug: "history", created_at: "2026-01-01" }],
    } as any);
    vi.spyOn(blogSystemHooks, "useCreateBlog").mockReturnValue(mockCreateBlog as any);
    vi.spyOn(blogSystemHooks, "useUpdateBlog").mockReturnValue(mockUpdateBlog as any);
    vi.spyOn(blogSystemHooks, "useDeleteBlog").mockReturnValue(mockDeleteBlog as any);

    renderComponent();

    // Verify useBlogs was called with true (isAdmin)
    expect(useBlogsSpy).toHaveBeenCalledWith(true);

    // Verify both published and draft blogs appear in the admin UI
    expect(screen.getByText("Ancient History of Kailash Mahadev")).toBeTruthy();
    expect(screen.getByText("Draft Article: Upcoming Mahashivratri Celebrations")).toBeTruthy();

    // Verify status badges
    expect(screen.getByText("published")).toBeTruthy();
    expect(screen.getByText("draft")).toBeTruthy();
  });

  it("allows filtering between All, Drafts, and Published blogs", () => {
    vi.spyOn(blogSystemHooks, "useBlogs").mockReturnValue({
      data: sampleBlogs,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(blogSystemHooks, "useBlogCategories").mockReturnValue({ data: [] } as any);
    vi.spyOn(blogSystemHooks, "useCreateBlog").mockReturnValue(mockCreateBlog as any);
    vi.spyOn(blogSystemHooks, "useUpdateBlog").mockReturnValue(mockUpdateBlog as any);
    vi.spyOn(blogSystemHooks, "useDeleteBlog").mockReturnValue(mockDeleteBlog as any);

    renderComponent();

    // Filter by Drafts
    const draftsButton = screen.getByRole("button", { name: /Drafts \(1\)/i });
    fireEvent.click(draftsButton);

    expect(screen.getByText("Draft Article: Upcoming Mahashivratri Celebrations")).toBeTruthy();
    expect(screen.queryByText("Ancient History of Kailash Mahadev")).toBeNull();

    // Filter by Published
    const publishedButton = screen.getByRole("button", { name: /Published \(1\)/i });
    fireEvent.click(publishedButton);

    expect(screen.getByText("Ancient History of Kailash Mahadev")).toBeTruthy();
    expect(screen.queryByText("Draft Article: Upcoming Mahashivratri Celebrations")).toBeNull();

    // Filter by All
    const allButton = screen.getByRole("button", { name: /All \(2\)/i });
    fireEvent.click(allButton);

    expect(screen.getByText("Ancient History of Kailash Mahadev")).toBeTruthy();
    expect(screen.getByText("Draft Article: Upcoming Mahashivratri Celebrations")).toBeTruthy();
  });

  it("filters blogs by search query across title, slug, and excerpt", () => {
    vi.spyOn(blogSystemHooks, "useBlogs").mockReturnValue({
      data: sampleBlogs,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(blogSystemHooks, "useBlogCategories").mockReturnValue({ data: [] } as any);
    vi.spyOn(blogSystemHooks, "useCreateBlog").mockReturnValue(mockCreateBlog as any);
    vi.spyOn(blogSystemHooks, "useUpdateBlog").mockReturnValue(mockUpdateBlog as any);
    vi.spyOn(blogSystemHooks, "useDeleteBlog").mockReturnValue(mockDeleteBlog as any);

    renderComponent();

    const searchInput = screen.getByPlaceholderText("Search blogs...");
    fireEvent.change(searchInput, { target: { value: "mahashivratri" } });

    expect(screen.getByText("Draft Article: Upcoming Mahashivratri Celebrations")).toBeTruthy();
    expect(screen.queryByText("Ancient History of Kailash Mahadev")).toBeNull();
  });

  it("submits with status='draft' when Save Draft button is clicked", async () => {
    vi.spyOn(blogSystemHooks, "useBlogs").mockReturnValue({
      data: sampleBlogs,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(blogSystemHooks, "useBlogCategories").mockReturnValue({
      data: [{ id: "cat-1", name: "History", slug: "history", created_at: "2026-01-01" }],
    } as any);
    vi.spyOn(blogSystemHooks, "useCreateBlog").mockReturnValue(mockCreateBlog as any);
    vi.spyOn(blogSystemHooks, "useUpdateBlog").mockReturnValue(mockUpdateBlog as any);
    vi.spyOn(blogSystemHooks, "useDeleteBlog").mockReturnValue(mockDeleteBlog as any);

    renderComponent();

    // Open create form
    fireEvent.click(screen.getByRole("button", { name: /New Blog/i }));

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: "New Draft Post" } });
    fireEvent.change(screen.getByLabelText(/Category \*/i), { target: { value: "cat-1" } });
    fireEvent.change(screen.getByPlaceholderText("Write your article in Markdown..."), {
      target: { value: "Draft content..." },
    });

    // Click "Save Draft"
    const saveDraftBtn = screen.getByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveDraftBtn);

    expect(mockCreateBlog.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Draft Post",
        status: "draft",
        category_id: "cat-1",
        published_at: null,
      })
    );
  });

  it("submits with status='published' and timestamp when Publish button is clicked", async () => {
    vi.spyOn(blogSystemHooks, "useBlogs").mockReturnValue({
      data: sampleBlogs,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(blogSystemHooks, "useBlogCategories").mockReturnValue({
      data: [{ id: "cat-1", name: "History", slug: "history", created_at: "2026-01-01" }],
    } as any);
    vi.spyOn(blogSystemHooks, "useCreateBlog").mockReturnValue(mockCreateBlog as any);
    vi.spyOn(blogSystemHooks, "useUpdateBlog").mockReturnValue(mockUpdateBlog as any);
    vi.spyOn(blogSystemHooks, "useDeleteBlog").mockReturnValue(mockDeleteBlog as any);

    renderComponent();

    // Open create form
    fireEvent.click(screen.getByRole("button", { name: /New Blog/i }));

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: "New Published Post" } });
    fireEvent.change(screen.getByLabelText(/Category \*/i), { target: { value: "cat-1" } });
    fireEvent.change(screen.getByPlaceholderText("Write your article in Markdown..."), {
      target: { value: "Published content..." },
    });

    // Click "Publish Blog"
    const publishBtn = screen.getByRole("button", { name: /Publish Blog/i });
    fireEvent.click(publishBtn);

    expect(mockCreateBlog.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Published Post",
        status: "published",
        category_id: "cat-1",
        published_at: expect.any(String),
      })
    );
  });
});
