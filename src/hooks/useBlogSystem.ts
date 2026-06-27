import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { autoGenerateBlogSEO, buildContentAutomationMetadata } from "@/lib/contentSeo";

// Types
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
  created_at: string;
  created_by?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category_id: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  view_count: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  tags?: BlogTag[];
  category?: BlogCategory;
}

export interface KnowledgeArticle {
  id: string;
  question: string;
  answer: string;
  category: string;
  search_keywords?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords_field?: string;
  featured_image_url?: string;
  image_alt?: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Blog Categories Hooks
export const useBlogCategories = () => {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("blog_categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Failed to fetch blog categories:", error.message);
          return [] as BlogCategory[];
        }

        return (data as BlogCategory[]) || [];
      } catch (err: any) {
        console.error("Exception fetching blog categories:", err.message);
        return [] as BlogCategory[];
      }
    },
  });
};

export const initializeBlogCategories = async (): Promise<boolean> => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("blog_categories")
      .select("id")
      .limit(1);

    if (existingError) {
      console.warn("Failed to check existing blog categories:", existingError.message);
      return false;
    }

    if (!existing || existing.length === 0) {
      const defaultCategories = [
        { name: "Spiritual Insights", slug: "spiritual-insights", description: "Spiritual teachings and wisdom" },
        { name: "Temple Updates", slug: "temple-updates", description: "News and updates from the temple" },
        { name: "Rituals & Traditions", slug: "rituals-traditions", description: "Information about temple rituals" },
        { name: "Events", slug: "events", description: "Upcoming events and celebrations" },
      ];

      const { error: insertError } = await supabase
        .from("blog_categories")
        .insert(defaultCategories);

      if (insertError) {
        console.warn("Failed to insert default blog categories:", insertError.message);
        return false;
      }

      console.log("Default blog categories initialized");
      return true;
    }

    return false;
  } catch (err: any) {
    console.warn("Error initializing blog categories:", err.message);
    return false;
  }
};

export const useCreateBlogCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<BlogCategory, "id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating category: ${error.message}`);
    },
  });
};

// Blog Tags Hooks
export const useBlogTags = () => {
  return useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_tags")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as BlogTag[];
    },
  });
};

// Blogs Hooks
export const useBlogs = (isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ["blogs", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select(
          `
          *,
          category:blog_categories(id, name, slug)
          `
        );

      if (!isAdmin) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      return data as Blog[];
    },
  });
};

export const useFeaturedBlogs = () => {
  return useQuery({
    queryKey: ["featured-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(
          `
          *,
          category:blog_categories(id, name, slug)
          `
        )
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Blog[];
    },
  });
};

export const useBlogBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(
          `
          *,
          category:blog_categories(id, name, slug)
          `
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from("blogs")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id)
        .catchError(() => null); // Silent fail if view count update fails

      return data as Blog;
    },
    enabled: !!slug,
  });
};

export const useRelatedBlogs = (blogId: string, categoryId: string, limit: number = 3) => {
  return useQuery({
    queryKey: ["related-blogs", blogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(
          `
          *,
          category:blog_categories(id, name, slug)
          `
        )
        .eq("category_id", categoryId)
        .eq("status", "published")
        .neq("id", blogId)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Blog[];
    },
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blog: Omit<Blog, "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "view_count">) => {
      const automationMetadata = buildContentAutomationMetadata({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        slug: blog.slug,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        category: blog.category?.name,
        type: "blog",
      });
      const enrichedBlog = {
        ...blog,
        ...autoGenerateBlogSEO(blog),
        slug: blog.slug?.trim() || automationMetadata.slug,
        seo_title: blog.seo_title?.trim() || automationMetadata.seo_title,
        seo_description: blog.seo_description?.trim() || automationMetadata.seo_description,
        seo_keywords: blog.seo_keywords?.trim() || automationMetadata.seo_keywords,
      };
      
      const { data, error } = await supabase
        .from("blogs")
        .insert([{ ...enrichedBlog, view_count: 0 }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating blog: ${error.message}`);
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blog: Blog) => {
      const automationMetadata = buildContentAutomationMetadata({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        slug: blog.slug,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        category: blog.category?.name,
        type: "blog",
      });
      const enrichedBlog = {
        ...blog,
        ...autoGenerateBlogSEO(blog),
        slug: blog.slug?.trim() || automationMetadata.slug,
        seo_title: blog.seo_title?.trim() || automationMetadata.seo_title,
        seo_description: blog.seo_description?.trim() || automationMetadata.seo_description,
        seo_keywords: blog.seo_keywords?.trim() || automationMetadata.seo_keywords,
      };
      
      const { data, error } = await supabase
        .from("blogs")
        .update(enrichedBlog)
        .eq("id", blog.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Blog updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating blog: ${error.message}`);
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blogId: string) => {
      const { error } = await supabase
        .from("blogs")
        .delete()
        .eq("id", blogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting blog: ${error.message}`);
    },
  });
};

// Knowledge Articles Hooks
export const useKnowledgeArticles = (categoryId?: string) => {
  return useQuery({
    queryKey: ["knowledge-articles", categoryId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("knowledge_articles")
          .select("*")
          .order("created_at", { ascending: false });

        if (categoryId) {
          query = query.eq("category", categoryId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching knowledge articles:", error);
          throw error;
        }
        
        console.log("Knowledge articles fetched from DB:", data?.length || 0, "articles");
        return data || [];
      } catch (error) {
        console.error("Knowledge articles hook error:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useSearchKnowledgeArticles = (searchTerm: string) => {
  return useQuery({
    queryKey: ["knowledge-search", searchTerm],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("knowledge_articles")
          .select("*")
          .or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%,search_keywords.ilike.%${searchTerm}%`);

        if (error) {
          console.error("Search knowledge articles error:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Search knowledge hook error:", error);
        throw error;
      }
    },
    enabled: searchTerm.length > 2,
  });
};

export const useCreateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Omit<KnowledgeArticle, "id" | "created_at" | "updated_at" | "created_by">) => {
      const automationMetadata = buildContentAutomationMetadata({
        question: article.question,
        answer: article.answer,
        content: article.answer,
        category: article.category,
        slug: (article as any).slug,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        type: "knowledge",
      });
      const seoPayload = {
        ...article,
        view_count: 0,
        seo_title: article.seo_title?.trim() || automationMetadata.seo_title,
        seo_description: article.seo_description?.trim() || automationMetadata.seo_description,
        seo_keywords_field: article.seo_keywords_field?.trim() || automationMetadata.seo_keywords,
      };

      const { data, error } = await supabase
        .from("knowledge_articles")
        .insert([seoPayload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast.success("Knowledge article created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating article: ${error.message}`);
    },
  });
};

export const useUpdateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: KnowledgeArticle) => {
      const automationMetadata = buildContentAutomationMetadata({
        question: article.question,
        answer: article.answer,
        content: article.answer,
        category: article.category,
        slug: (article as any).slug,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        type: "knowledge",
      });
      const seoPayload = {
        ...article,
        seo_title: article.seo_title?.trim() || automationMetadata.seo_title,
        seo_description: article.seo_description?.trim() || automationMetadata.seo_description,
        seo_keywords_field: article.seo_keywords_field?.trim() || automationMetadata.seo_keywords,
      };

      const { data, error } = await supabase
        .from("knowledge_articles")
        .update(seoPayload)
        .eq("id", article.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast.success("Article updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating article: ${error.message}`);
    },
  });
};

export const useDeleteKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from("knowledge_articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-articles"] });
      toast.success("Article deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting article: ${error.message}`);
    },
  });
};

// Helper function to generate slug
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Helper function to auto-generate SEO fields if empty
export const autoGenerateBlogSEO = (blog: Omit<Blog, "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "view_count"> | Blog) => {
  const TEMPLE_KEYWORDS = [
    "kailash mandir",
    "kailash mahadev",
    "kailash temple",
    "kailash temple agra",
    "Agra temple",
    "Shiva temple",
  ];

  const seo_title = blog.seo_title?.trim()
    ? blog.seo_title
    : `${blog.title} | Kailash Mahadev Temple Agra`;

  const seo_description = blog.seo_description?.trim()
    ? blog.seo_description
    : (blog.excerpt || blog.content.substring(0, 160))
        .replace(/<[^>]*>/g, "")
        .substring(0, 160)
        .trim() + (blog.content.length > 160 ? "..." : "");

  const seo_keywords = blog.seo_keywords?.trim()
    ? blog.seo_keywords
    : [
        blog.title,
        ...(blog.category?.name ? [blog.category.name] : []),
        ...TEMPLE_KEYWORDS.slice(0, 3),
        "Agra",
      ]
        .filter((k) => k && k.length > 0)
        .slice(0, 10)
        .join(", ");

  return {
    ...blog,
    seo_title,
    seo_description,
    seo_keywords,
  };
};
