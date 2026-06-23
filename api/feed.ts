import { createClient } from "@supabase/supabase-js";

// Declare environment variables for TypeScript
declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  };
};

const BASE_URL = "https://kailashmahadev.in";
const SITE_TITLE = "Kailash Mahadev Temple Agra";
const SITE_DESCRIPTION =
  "Discover the spiritual wisdom of Kailash Mahadev Temple Agra through our blog and knowledge base.";

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

function formatRssDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toUTCString();
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

    // Fetch all published blogs with category info
    const { data: blogs, error: blogsError } = await supabase
      .from("blogs")
      .select("id, title, slug, excerpt, content, featured_image_url, category_id, published_at, updated_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);

    if (blogsError) {
      console.error("Error fetching blogs for RSS:", blogsError);
      throw blogsError;
    }

    // Build RSS items
    const rssItems = (blogs || [])
      .map((blog) => {
        const link = `${BASE_URL}/blog/${blog.slug}`;
        const pubDate = blog.published_at || blog.created_at;
        const description = blog.excerpt || blog.content?.substring(0, 200) || "";

        return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${formatRssDate(pubDate)}</pubDate>
      <lastBuildDate>${formatRssDate(blog.updated_at || pubDate)}</lastBuildDate>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${blog.content || ""}]]></content:encoded>
      ${
        blog.featured_image_url
          ? `<image>
        <url>${escapeXml(blog.featured_image_url)}</url>
        <title>${escapeXml(blog.title)}</title>
        <link>${escapeXml(link)}</link>
      </image>`
          : ""
      }
      <author>Kailash Mahadev Temple Agra</author>
      <category>${blog.category_id ? "Temple Blog" : "General"}</category>
    </item>`;
      })
      .join("");

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(BASE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <copyright>© 2026 Kailash Mahadev Temple Agra. All rights reserved.</copyright>
    <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>
    <atom:link href="${escapeXml(BASE_URL)}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(BASE_URL)}/logo.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${escapeXml(BASE_URL)}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(rss);
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    res.status(500).json({
      error: "Failed to generate RSS feed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
