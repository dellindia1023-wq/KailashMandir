import { describe, expect, it, vi, beforeEach } from "vitest";
import { useBlogs } from "@/hooks/useBlogSystem";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock supabase client
const mockOrder = vi.fn().mockResolvedValue({
  data: [
    { id: "1", title: "Blog 1", status: "published", published_at: "2026-06-01" },
    { id: "2", title: "Blog 2", status: "draft", published_at: null, created_at: "2026-06-02" },
  ],
  error: null,
});

const mockEq = vi.fn().mockReturnValue({
  order: mockOrder,
});

const mockSelect = vi.fn().mockReturnValue({
  eq: mockEq,
  order: mockOrder,
});

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

describe("useBlogs Hook Query Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it("filters by status='published' and orders by published_at when isAdmin is false (public mode)", async () => {
    const { result } = renderHook(() => useBlogs(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("blogs");
    expect(mockEq).toHaveBeenCalledWith("status", "published");
    expect(mockOrder).toHaveBeenCalledWith("published_at", { ascending: false });
  });

  it("does not filter by status and orders by created_at when isAdmin is true (admin mode)", async () => {
    const { result } = renderHook(() => useBlogs(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith("blogs");
    expect(mockEq).not.toHaveBeenCalled();
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

