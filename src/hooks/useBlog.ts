import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
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
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  category_id?: string;
  status: "draft" | "published";
  is_featured: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by?: string;
  tags?: BlogTag[];
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
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Default categories to initialize
const DEFAULT_CATEGORIES = [
  { name: "Spiritual Insights", slug: "spiritual-insights", description: "Spiritual teachings and wisdom" },
  { name: "Temple Updates", slug: "temple-updates", description: "News and updates from the temple" },
  { name: "Rituals & Traditions", slug: "rituals-traditions", description: "Information about temple rituals" },
  { name: "Events", slug: "events", description: "Upcoming events and celebrations" },
];

// Initialize categories if they don't exist
let initPromise: Promise<void> | null = null;
export const initializeBlogCategories = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from("blog_categories")
        .select("id")
        .limit(1);

      if (checkError) {
        console.warn("Failed to check categories:", checkError.message);
        return;
      }

      // If no categories exist, insert defaults
      if (!existing || existing.length === 0) {
        const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          created_by: null,
        }));

        const { error: insertError } = await supabase
          .from("blog_categories")
          .insert(categoriesToInsert);

        if (insertError) {
          console.warn("Failed to initialize categories:", insertError.message);
        } else {
          console.log("Default categories initialized");
        }
      }
    } catch (err: any) {
      console.warn("Error checking/initializing categories:", err.message);
    }
  })();

  return initPromise;
};

// Blog Hooks

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ["blogCategories"],
    queryFn: async () => {
      try {
        // Simple query without explicit column selection
        const { data, error } = await supabase
          .from("blog_categories")
          .select();

        if (error) {
          console.error("Supabase error:", error.message);
          // Return empty array instead of throwing
          return [];
        }
        
        return (data as BlogCategory[]) || [];
      } catch (err: any) {
        console.error("Exception fetching categories:", err.message);
        // Return empty array on error - don't break the page
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useBlogs = (status?: "draft" | "published") => {
  return useQuery({
    queryKey: ["blogs", status],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

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
        .select(`*, blog_tag_relationships(tag_id)`)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;

      // Increment view count
      if (data) {
        await supabase
          .from("blogs")
          .update({ view_count: data.view_count + 1 })
          .eq("id", data.id);
      }

      return data as Blog;
    },
    enabled: !!slug,
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blog: Partial<Blog>) => {
      const { data, error } = await supabase
        .from("blogs")
        .insert([blog])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create blog");
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...blog
    }: { id: string } & Partial<Blog>) => {
      const { data, error } = await supabase
        .from("blogs")
        .update(blog)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update blog");
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete blog");
    },
  });
};

export const useBlogTags = () => {
  return useQuery({
    queryKey: ["blogTags"],
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

export const useCreateBlogTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: Partial<BlogTag>) => {
      const { data, error } = await supabase
        .from("blog_tags")
        .insert([tag])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogTags"] });
      toast.success("Tag created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tag");
    },
  });
};

// Knowledge Hub Hooks

export const useKnowledgeArticles = (category?: string) => {
  return useQuery({
    queryKey: ["knowledgeArticles", category],
    queryFn: async () => {
      try {
        let query = supabase
          .from("knowledge_articles")
          .select("*")
          .order("created_at", { ascending: false });

        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching knowledge articles:", error);
          throw error;
        }
        return data as KnowledgeArticle[];
      } catch (error: any) {
        console.error("Knowledge articles fetch failed:", error.message);
        return [];
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useSearchKnowledge = (query: string) => {
  return useQuery({
    queryKey: ["searchKnowledge", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("*")
        .or(
          `question.ilike.%${query}%,answer.ilike.%${query}%,search_keywords.ilike.%${query}%`
        )
        .order("is_featured", { ascending: false });

      if (error) throw error;
      return data as KnowledgeArticle[];
    },
    enabled: query.length > 0,
  });
};

// Helper function to auto-generate SEO fields for Knowledge Hub articles if empty
export const autoGenerateKnowledgeSEO = (article: Partial<KnowledgeArticle> | KnowledgeArticle) => {
  const TEMPLE_KEYWORDS = [
    "kailash mandir",
    "kailash mahadev",
    "kailash temple",
    "kailash temple agra",
    "Agra temple",
    "FAQ",
  ];

  const seo_title = article.seo_title?.trim()
    ? article.seo_title
    : `${article.question || "Article"} | Kailash Mahadev Temple Agra`;

  const seo_description = article.seo_description?.trim()
    ? article.seo_description
    : (article.answer || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 160)
        .trim() + (article.answer && article.answer.length > 160 ? "..." : "");

  const seo_keywords_field = article.seo_keywords_field?.trim()
    ? article.seo_keywords_field
    : [
        article.question,
        article.category,
        ...TEMPLE_KEYWORDS.slice(0, 2),
        "Agra",
      ]
        .filter((k) => k && k.length > 0)
        .slice(0, 10)
        .join(", ");

  return {
    ...article,
    seo_title,
    seo_description,
    seo_keywords_field,
  };
};

export const useCreateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Partial<KnowledgeArticle>) => {
      const enrichedArticle = autoGenerateKnowledgeSEO(article);
      const { data, error } = await supabase
        .from("knowledge_articles")
        .insert([enrichedArticle])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeArticles"] });
      toast.success("Knowledge article created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create article");
    },
  });
};

export const useUpdateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...article
    }: { id: string } & Partial<KnowledgeArticle>) => {
      const enrichedArticle = autoGenerateKnowledgeSEO(article);
      const { data, error } = await supabase
        .from("knowledge_articles")
        .update(enrichedArticle)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeArticles"] });
      toast.success("Article updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update article");
    },
  });
};

export const useDeleteKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_articles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeArticles"] });
      toast.success("Article deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete article");
    },
  });
};

// Utility function to generate slug
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
