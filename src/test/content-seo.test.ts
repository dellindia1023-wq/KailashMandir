import { describe, expect, it } from "vitest";
import { autoGenerateBlogSEO, autoGenerateKnowledgeSEO, buildBlogContentMetadata, buildKnowledgeContentMetadata, buildContentAutomationMetadata } from "@/lib/contentSeo";

describe("content SEO helpers", () => {
  it("creates fallback SEO metadata for blogs", () => {
    const blog = {
      title: "Temple Rituals",
      content: "<p>Ancient rituals for devotees.</p>",
      excerpt: "Spiritual insights for visitors",
      category: { name: "Temple Updates" },
    } as any;

    const seo = autoGenerateBlogSEO(blog);

    expect(seo.seo_title).toContain("Temple Rituals");
    expect(seo.seo_description).toContain("Spiritual insights");
    expect(seo.seo_keywords).toContain("Temple Updates");
  });

  it("creates SEO metadata for knowledge articles from the question and answer", () => {
    const article = {
      question: "What is the darshan timing?",
      answer: "The temple opens early in the morning for devotees.",
      category: "Darshan",
    } as any;

    const seo = autoGenerateKnowledgeSEO(article);

    expect(seo.seo_title).toContain("What is the darshan timing?");
    expect(seo.seo_description).toContain("The temple opens");
    expect(seo.seo_keywords_field).toContain("darshan");
  });

  it("creates reading time, word count, and section metadata for blog content", () => {
    const metadata = buildBlogContentMetadata({
      title: "Temple Rituals",
      content: "## Morning Rituals\n\nThe temple begins at dawn.\n\n## Evening Aarti\n\nDevotees gather in the evening.",
      slug: "temple-rituals",
      baseUrl: "https://kailashmahadev.in",
    } as any);

    expect(metadata.word_count).toBeGreaterThan(0);
    expect(metadata.reading_time_minutes).toBeGreaterThan(0);
    expect(metadata.table_of_contents).toHaveLength(2);
    expect(metadata.canonical_url).toContain("/blog/temple-rituals");
  });

  it("creates FAQ-ready metadata for knowledge articles", () => {
    const metadata = buildKnowledgeContentMetadata({
      question: "What is the darshan timing?",
      answer: "The temple opens early in the morning for devotees.",
      category: "Darshan",
      slug: "darshan-timing",
      baseUrl: "https://kailashmahadev.in",
    } as any);

    expect(metadata.faq_sections).toHaveLength(1);
    expect(metadata.answer_first_paragraph).toContain("The temple opens");
    expect(metadata.canonical_url).toContain("/knowledge-hub");
  });

  it("adds internal links and image sizing metadata for blog content", () => {
    const metadata = buildBlogContentMetadata({
      title: "Puja booking and darshan timings",
      content: "Learn about puja booking and darshan timings at Kailash Mahadev Temple.",
      slug: "puja-booking",
      baseUrl: "https://kailashmahadev.in",
    } as any);

    expect(metadata.internal_links.some((link: { href: string }) => link.href === "/pujas")).toBe(true);
    expect(metadata.image_dimensions.width).toBeGreaterThan(0);
    expect(metadata.image_dimensions.height).toBeGreaterThan(0);
    expect(metadata.prevent_cls).toBe(true);
  });

  it("builds publish-time automation metadata for blogs", () => {
    const metadata = buildContentAutomationMetadata({
      title: "Shivaratri Puja Guide",
      content: "Learn about puja booking and darshan timings during Shivaratri.",
      excerpt: "A helpful guide for devotees.",
      slug: "shivaratri-puja-guide",
      baseUrl: "https://kailashmahadev.in",
      type: "blog",
    } as any);

    expect(metadata.slug).toBe("shivaratri-puja-guide");
    expect(metadata.canonical_url).toContain("/blog/shivaratri-puja-guide");
    expect(metadata.open_graph.title).toContain("Shivaratri");
    expect(metadata.twitter_card.card).toBe("summary_large_image");
    expect(metadata.image_metadata.alt_text).toContain("Shivaratri");
    expect(metadata.schema.article["@type"]).toBe("Article");
  });
});
