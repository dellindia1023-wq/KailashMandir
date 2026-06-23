import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const STATIC_URLS = [
  { loc: "https://kailashmahadev.in/", lastmod: "2026-06-22", changefreq: "daily", priority: "1.0" },
  { loc: "https://kailashmahadev.in/about", lastmod: "2026-05-24", changefreq: "monthly", priority: "0.95" },
  { loc: "https://kailashmahadev.in/darshan-timings", lastmod: "2026-05-24", changefreq: "weekly", priority: "0.95" },
  { loc: "https://kailashmahadev.in/contact", lastmod: "2026-05-24", changefreq: "monthly", priority: "0.90" },
  { loc: "https://kailashmahadev.in/donate", lastmod: "2026-05-24", changefreq: "weekly", priority: "0.85" },
  { loc: "https://kailashmahadev.in/pujas", lastmod: "2026-05-24", changefreq: "weekly", priority: "0.90" },
  { loc: "https://kailashmahadev.in/gallery", lastmod: "2026-05-24", changefreq: "weekly", priority: "0.85" },
  { loc: "https://kailashmahadev.in/live-darshan", lastmod: "2026-05-24", changefreq: "daily", priority: "0.85" },
  { loc: "https://kailashmahadev.in/events", lastmod: "2026-05-24", changefreq: "weekly", priority: "0.85" },
  { loc: "https://kailashmahadev.in/social", lastmod: "2026-05-24", changefreq: "daily", priority: "0.80" },
  { loc: "https://kailashmahadev.in/notice-board", lastmod: "2026-05-24", changefreq: "daily", priority: "0.75" },
  { loc: "https://kailashmahadev.in/horoscope", lastmod: "2026-05-24", changefreq: "daily", priority: "0.75" },
  { loc: "https://kailashmahadev.in/panchang", lastmod: "2026-05-24", changefreq: "daily", priority: "0.80" },
  { loc: "https://kailashmahadev.in/terms-and-conditions", lastmod: "2026-05-24", changefreq: "yearly", priority: "0.30" },
  { loc: "https://kailashmahadev.in/privacy-policy", lastmod: "2026-05-24", changefreq: "yearly", priority: "0.30" },
  { loc: "https://kailashmahadev.in/refund-policy", lastmod: "2026-05-24", changefreq: "yearly", priority: "0.30" },
];

const BASE_URL = "https://kailashmahadev.in";

export default async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Fetch all published blogs
    const { data: blogs, error: blogsError } = await supabase
      .from("blogs")
      .select("id, slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (blogsError) {
      console.error("Error fetching blogs:", blogsError);
      throw blogsError;
    }

    // Fetch all knowledge articles (optional - can be toggled)
    const { data: knowledge, error: knowledgeError } = await supabase
      .from("knowledge_articles")
      .select("id, question, updated_at")
      .order("updated_at", { ascending: false });

    if (knowledgeError) {
      console.error("Error fetching knowledge articles:", knowledgeError);
      // Don't fail - just skip knowledge articles
    }

    // Build URL entries for blogs
    const blogEntries = (blogs || []).map((blog) => ({
      loc: `${BASE_URL}/blog/${blog.slug}`,
      lastmod: blog.updated_at ? new Date(blog.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      changefreq: "weekly",
      priority: "0.80",
    }));

    // Add blog listing page
    const blogListEntry = {
      loc: `${BASE_URL}/blogs`,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "daily",
      priority: "0.90",
    };

    // Add knowledge hub listing page
    const knowledgeHubEntry = {
      loc: `${BASE_URL}/knowledge-hub`,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "daily",
      priority: "0.85",
    };

    // Combine all URLs
    const allUrls = [
      ...STATIC_URLS,
      blogListEntry,
      knowledgeHubEntry,
      ...blogEntries,
    ];

    // Generate XML
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlStart = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const xmlEnd = "</urlset>";

    const urlEntries = allUrls
      .map(
        (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
      )
      .join("");

    const xml = `${xmlHeader}\n${xmlStart}${urlEntries}\n${xmlEnd}`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate sitemap",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
