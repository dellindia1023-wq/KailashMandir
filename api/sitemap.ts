import { createClient } from "@supabase/supabase-js";

// Declare environment variables for TypeScript
declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  };
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

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export default async function handler(req: any, res: any) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
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

    // Fetch all knowledge articles
    const { data: knowledge, error: knowledgeError } = await supabase
      .from("knowledge_articles")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });

    if (knowledgeError) {
      console.error("Error fetching knowledge articles:", knowledgeError);
      // Don't fail - just skip knowledge articles if error
    }

    // Build URL entries for blogs
    const blogEntries = (blogs || []).map((blog) => ({
      loc: `${BASE_URL}/blog/${blog.slug}`,
      lastmod: formatDate(blog.updated_at),
      changefreq: "weekly" as const,
      priority: "0.80",
    }));

    // Add blog listing page
    const blogListEntry = {
      loc: `${BASE_URL}/blogs`,
      lastmod: formatDate(new Date()),
      changefreq: "daily" as const,
      priority: "0.90",
    };

    // Add knowledge hub listing page
    const knowledgeHubEntry = {
      loc: `${BASE_URL}/knowledge-hub`,
      lastmod: formatDate(new Date()),
      changefreq: "daily" as const,
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

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({
      error: "Failed to generate sitemap",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
