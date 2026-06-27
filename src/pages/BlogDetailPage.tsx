import { useParams } from "react-router-dom";
import { useBlogBySlug, useBlogs } from "@/hooks/useBlog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Eye, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";
import { BASE_URL } from "@/constants/seo";
import { buildBlogContentMetadata, buildContentAutomationMetadata } from "@/lib/contentSeo";
import { MarkdownContent } from "@/components/MarkdownContent";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { data: blog, isLoading } = useBlogBySlug(slug || "");
  const { data: allBlogs } = useBlogs("published");

  const relatedBlogs = allBlogs?.filter(
    (b) => b.category_id === blog?.category_id && b.id !== blog?.id
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-lg">Blog not found</p>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: window.location.href,
      });
    }
  };

  // SEO Configuration
  const seoTitle = blog.seo_title || `${blog.title} | Kailash Mahadev Temple Agra`;
  const seoDescription = blog.seo_description || `${blog.excerpt || blog.title} - Learn about Kailash Mahadev Temple Agra's history, significance, and spiritual wisdom.`;
  const seoKeywords = blog.seo_keywords ? `${blog.seo_keywords}, Kailash Mahadev Agra, Agra Temple` : `${blog.title}, Kailash Mahadev Temple, Agra, temple`;
  const ogImage = blog.featured_image_url || "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&q=80";
  const imageAlt = (blog as any).image_alt || `${blog.title} - Kailash Mahadev Temple Agra`;
  const articleMetadata = buildBlogContentMetadata({
    title: blog.title,
    content: blog.content,
    excerpt: blog.excerpt,
    slug: blog.slug,
    baseUrl: BASE_URL,
    category: blog.category?.name,
  });
  const automationMetadata = buildContentAutomationMetadata({
    title: blog.title,
    content: blog.content,
    excerpt: blog.excerpt,
    slug: blog.slug,
    baseUrl: BASE_URL,
    category: blog.category?.name,
    type: "blog",
  });
  const contextBlocks = articleMetadata.context_blocks || [];
  const internalLinks = articleMetadata.internal_links || [];
  const intelligence = automationMetadata.intelligence;
  const questionEngine = automationMetadata.question_engine;
  const smartLinking = automationMetadata.smart_linking;

  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt || seoDescription,
    image: blog.featured_image_url,
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at,
    author: {
      "@type": "Organization",
      name: "Kailash Mahadev Temple Agra",
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
    },
    publisher: {
      "@type": "Organization",
      name: "Kailash Mahadev Temple Agra",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
        width: 250,
        height: 250,
      },
    },
    mainEntity: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${blog.slug}`,
    },
    keywords: seoKeywords,
    articleSection: blog.category?.name || "Temple Wisdom",
    wordCount: articleMetadata.word_count,
    timeRequired: `PT${articleMetadata.reading_time_minutes}M`,
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blogs",
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.category_id ? "Category" : "Blog",
        item: blog.category_id ? `${BASE_URL}/blog?category=${blog.category_id}` : `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: blog.title,
        item: `${BASE_URL}/blog/${blog.slug}`,
      },
    ],
  };

  // Local Business Schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Kailash Mahadev Temple Agra",
    description: "Ancient Shiva Temple in Agra with rich spiritual heritage",
    url: BASE_URL,
    telephone: "+91-9XXXXXXXXX",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sikandra",
      addressLocality: "Agra",
      addressRegion: "UP",
      postalCode: "282007",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 27.1767,
      longitude: 77.9568,
    },
    areaServed: {
      "@type": "City",
      name: "Agra",
    },
  };
  const imageObjectSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    url: blog.featured_image_url || ogImage,
    caption: imageAlt,
    alt: imageAlt,
  };
  const searchActionSchema = {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/knowledge-hub?query={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={`/blog/${blog.slug}`}
        ogImage={ogImage}
        ogType="article"
        jsonLd={[articleSchema, breadcrumbSchema, localBusinessSchema, imageObjectSchema, searchActionSchema]}
      />
      <main className="min-h-screen bg-background">
        {/* Hero Image */}
      {(blog.featured_image_url || ogImage) && (
        <div className="w-full h-96 overflow-hidden">
          <img
            src={blog.featured_image_url || ogImage}
            alt={imageAlt}
            width={1200}
            height={630}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {blog.view_count} views
              </div>
            </div>

            {articleMetadata.table_of_contents.length > 0 && (
              <nav className="mb-6 rounded-lg border bg-muted/20 p-4" aria-label="Table of contents">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">On this page</h2>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {articleMetadata.table_of_contents.map((item) => (
                    <li key={item.text} className="ml-2">
                      • {item.text}
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {contextBlocks.length > 0 && (
              <section className="mb-6 rounded-lg border bg-card/60 p-4" aria-label="Context at a glance">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Context at a glance</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {contextBlocks.slice(0, 4).map((block) => (
                    <div key={block.title} className="rounded-md border bg-background/70 p-3">
                      <p className="text-sm font-semibold">{block.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{block.summary}</p>
                    </div>
                  ))}
                </div>
                {internalLinks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Helpful links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {internalLinks.map((link) => (
                        <a key={link.href} href={link.href} className="text-sm text-primary underline-offset-4 hover:underline">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {intelligence && (
              <section className="mb-6 rounded-lg border bg-muted/20 p-4" aria-label="Content intelligence">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Content intelligence</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border bg-background/70 p-3">
                    <p className="text-sm font-semibold">Primary topic</p>
                    <p className="mt-1 text-sm text-muted-foreground">{intelligence.primary_topic}</p>
                  </div>
                  <div className="rounded-md border bg-background/70 p-3">
                    <p className="text-sm font-semibold">Category</p>
                    <p className="mt-1 text-sm text-muted-foreground">{intelligence.content_category}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {intelligence.secondary_topics.map((topic) => (
                    <Badge key={topic} variant="outline">{topic}</Badge>
                  ))}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Keywords:</span> {intelligence.important_keywords.join(", ")}
                </div>
              </section>
            )}

            {smartLinking.contextual_links.length > 0 && (
              <section className="mb-6 rounded-lg border bg-card/60 p-4" aria-label="Smart links">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Smart links</h2>
                <div className="flex flex-wrap gap-2">
                  {smartLinking.contextual_links.map((link) => (
                    <a key={link.href} href={link.href} className="rounded-full border px-3 py-1 text-sm text-primary hover:underline">
                      {link.label}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {questionEngine.faq_candidates.length > 0 && (
              <section className="mb-6 rounded-lg border bg-card/60 p-4" aria-label="Suggested questions">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Suggested questions</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {questionEngine.faq_candidates.slice(0, 3).map((entry) => (
                    <li key={entry.question} className="rounded-md border bg-background/70 p-2">
                      {entry.question}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge>{blog.status}</Badge>
              {blog.is_featured && <Badge variant="outline">Featured</Badge>}
            </div>

            {/* Share Button */}
            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Blog Content */}
          <div className="prose prose-invert max-w-none mb-12">
            <MarkdownContent content={blog.content} />
          </div>

          {/* Related Articles */}
          {relatedBlogs && relatedBlogs.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedBlogs.map((relatedBlog) => (
                  <a
                    key={relatedBlog.id}
                    href={`/blog/${relatedBlog.slug}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {relatedBlog.featured_image_url && (
                        <div className="overflow-hidden h-40">
                          <img
                            src={relatedBlog.featured_image_url}
                            alt={relatedBlog.title}
                            width={800}
                            height={420}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary">
                          {relatedBlog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedBlog.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
