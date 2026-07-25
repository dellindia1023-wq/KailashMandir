import { Link, useParams } from "react-router-dom";
import { useBlogBySlug, useBlogs, useKnowledgeArticles } from "@/hooks/useBlog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Eye, Share2, Clock3, ArrowLeft, ArrowRight, MessageCircleShare, Facebook, Twitter, Linkedin, Copy, BookOpen, Compass, HandCoins, Images, PhoneCall, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_URL } from "@/constants/seo";
import { buildBlogContentMetadata, buildContentAutomationMetadata } from "@/lib/contentSeo";
import { MarkdownContent } from "@/components/MarkdownContent";
import ImageShimmer from "@/components/ImageShimmer";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { data: blog, isLoading } = useBlogBySlug(slug || "");
  const { data: allBlogs } = useBlogs("published");
  const { data: knowledgeArticles = [] } = useKnowledgeArticles();

  const sortedBlogs = allBlogs || [];
  const currentIndex = sortedBlogs.findIndex((entry) => entry.slug === slug);
  const previousBlog = currentIndex >= 0 ? sortedBlogs[currentIndex + 1] : undefined;
  const nextBlog = currentIndex >= 0 ? sortedBlogs[currentIndex - 1] : undefined;

  const relatedBlogs = sortedBlogs.filter(
    (b) => b.category_id === blog?.category_id && b.id !== blog?.id
  ).slice(0, 6);

  const relatedKnowledge = knowledgeArticles
    .filter((article) => article.category?.toLowerCase().includes((blog?.category?.name || "").toLowerCase()) || article.question?.toLowerCase().includes(blog?.title?.toLowerCase() || ""))
    .slice(0, 4);

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

  const handleShare = async (platform?: string) => {
    const shareUrl = window.location.href;
    const shareText = `${blog.title} — ${blog.excerpt || "Explore more about Kailash Mahadev Temple Agra."}`;

    if (platform === "copy") {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    const shareLinks: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };

    if (platform && shareLinks[platform]) {
      window.open(shareLinks[platform], "_blank", "noopener,noreferrer");
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: shareText,
        url: shareUrl,
      });
    }
  };

  // SEO Configuration
  const seoTitle = blog.seo_title || `${blog.title} | Kailash Mahadev Temple Agra`;
  const seoDescription = blog.seo_description || `${blog.excerpt || blog.title} - Learn about Kailash Mahadev Temple Agra's history, significance, and spiritual wisdom.`;
  const seoKeywords = blog.seo_keywords ? `${blog.seo_keywords}, Kailash Mahadev Agra, Agra Temple` : `${blog.title}, Kailash Mahadev Temple, Agra, temple`;
  const relatedCategorySlug = blog.category?.slug || blog.category?.name?.toLowerCase().replace(/\s+/g, "-");
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
  const relatedTopicLinks = smartLinking?.contextual_links || [];

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
      "@type": "Person",
      name: "Kailash Mahadev Temple Agra Editorial Team",
      url: `${BASE_URL}/author/kailash-mahadev-temple-agra`,
      description: "Editorial team creating devotional and temple guidance content for visitors.",
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
        item: `${BASE_URL}/blogs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: `${BASE_URL}/blog/${blog.slug}`,
      },
    ],
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Kailash Mahadev Temple Agra Editorial Team",
    url: `${BASE_URL}/author/kailash-mahadev-temple-agra`,
    description: "Editorial team publishing temple history, darshan, ritual, and spiritual guidance content.",
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
      urlTemplate: `${BASE_URL}/knowledge?query={search_term_string}`,
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
        articlePublishedTime={blog.published_at || blog.created_at}
        articleModifiedTime={blog.updated_at}
        section={blog.category?.name || "Temple Wisdom"}
        tags={blog.tags?.map((tag) => tag.name) || []}
        jsonLd={[articleSchema, breadcrumbSchema, personSchema, localBusinessSchema, imageObjectSchema, searchActionSchema]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-24">
          {(blog.featured_image_url || ogImage) && (
            <div className="w-full h-80 overflow-hidden md:h-[28rem]">
              <img
                src={blog.featured_image_url || ogImage}
                alt={imageAlt}
                width={1600}
                height={900}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="container mx-auto px-4 py-10 md:px-6 lg:py-16">
            <div className="mx-auto grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <article className="max-w-4xl">
                <Breadcrumb className="mb-6">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Home</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/blogs">Blogs</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{blog.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <div className="mb-8">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge>{blog.category?.name || "Temple Wisdom"}</Badge>
                    <Badge variant="outline">{blog.status}</Badge>
                    {blog.is_featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{blog.title}</h1>
                  <p className="mt-4 text-lg text-muted-foreground">{blog.excerpt}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {articleMetadata.reading_time_minutes} min read
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {blog.view_count} views
                    </div>
                  </div>
                </div>

                <div className="mb-8 flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2" onClick={() => handleShare()}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleShare("facebook")}>
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleShare("twitter")}>
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleShare("linkedin")}>
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleShare("copy")}>
                    <Copy className="h-4 w-4" />
                    Copy link
                  </Button>
                </div>

                {articleMetadata.table_of_contents.length > 0 && (
                  <nav className="mb-8 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm" aria-label="Table of contents">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">On this page</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {articleMetadata.table_of_contents.map((item) => {
                        const headingId = item.text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
                        return (
                          <li key={item.text} className="ml-2">
                            <a href={`#${headingId}`} className="transition hover:text-primary">
                              {item.text}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                )}

                <section className="mb-8 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm" aria-label="Author details">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src="/placeholder.svg"
                        alt="Kailash Mahadev Temple Agra editorial team"
                        className="h-14 w-14 rounded-full object-cover markdown-img"
                      />
                      <div>
                        <h2 className="text-xl font-semibold">Kailash Mahadev Temple Agra Editorial Team</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Temple history, rituals, darshan, and spiritual guidance</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />Published {new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />Last updated {new Date(blog.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Author profile</p>
                      <p className="mt-2">The team helps devotees navigate temple history, sacred rituals, and practical visit guidance with clarity and care.</p>
                      <Link to="/author/kailash-mahadev-temple-agra" className="mt-3 inline-flex items-center gap-2 text-primary hover:underline">
                        View author profile <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </section>

                {contextBlocks.length > 0 && (
                  <section className="mb-8 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm" aria-label="Context at a glance">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Context at a glance</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                      {contextBlocks.slice(0, 4).map((block) => (
                        <div key={block.title} className="rounded-xl border border-border/60 bg-background/70 p-3">
                          <p className="text-sm font-semibold">{block.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{block.summary}</p>
                        </div>
                      ))}
                    </div>
                    {internalLinks.length > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold">Helpful links</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {internalLinks.map((link) => (
                            <a key={link.href} href={link.href} className="rounded-full border border-primary/20 px-3 py-1 text-sm text-primary transition hover:bg-primary/10">
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <MarkdownContent content={blog.content} />
                  <ImageShimmer />
                </div>

                <section className="mt-10 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Related topics</h2>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {relatedTopicLinks.map((link) => (
                      <Link key={link.href} to={link.href} className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="mt-10 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold">Explore more</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Link to="/darshan-timings" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><Compass className="h-4 w-4" /> <span className="font-medium">Darshan Timings</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Plan your visit with current temple timings and guidance.</p>
                    </Link>
                    <Link to="/about" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> <span className="font-medium">Temple History</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Learn the heritage and significance of the sacred temple.</p>
                    </Link>
                    <Link to="/pujas" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> <span className="font-medium">Puja Booking</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Reserve rituals and special services for your visit.</p>
                    </Link>
                    <Link to="/knowledge" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> <span className="font-medium">Knowledge Hub</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Find clear answers for common temple questions and visitor guidance.</p>
                    </Link>
                    <Link to="/gallery" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><Images className="h-4 w-4" /> <span className="font-medium">Gallery</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Browse temple visuals and sacred spaces.</p>
                    </Link>
                    <Link to="/contact" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> <span className="font-medium">Contact</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Speak with the temple team for support and information.</p>
                    </Link>
                    <Link to="/donate" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                      <div className="flex items-center gap-2"><HandCoins className="h-4 w-4" /> <span className="font-medium">Donation</span></div>
                      <p className="mt-2 text-sm text-muted-foreground">Support temple services and charitable initiatives.</p>
                    </Link>
                  </div>
                </section>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-8">
                  {previousBlog ? (
                    <Link to={`/blog/${previousBlog.slug}`} className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                      <ArrowLeft className="h-4 w-4" />
                      Previous article
                    </Link>
                  ) : <span />}
                  {nextBlog ? (
                    <Link to={`/blog/${nextBlog.slug}`} className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                      Next article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : <span />}
                </div>
              </article>

              <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
                <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Related Blogs</h2>
                  <div className="mt-5 space-y-3">
                    {relatedBlogs.length > 0 ? relatedBlogs.map((relatedBlog) => (
                      <Link key={relatedBlog.id} to={`/blog/${relatedBlog.slug}`} className="block rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary hover:text-primary">
                        <p className="font-medium">{relatedBlog.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{relatedBlog.excerpt}</p>
                      </Link>
                    )) : <p className="text-sm text-muted-foreground">No related articles found yet.</p>}
                  </div>
                </section>
                <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Related Knowledge Hub</h2>
                  <div className="mt-5 space-y-3">
                    {relatedKnowledge.length > 0 ? relatedKnowledge.map((article) => {
                      const slug = article.slug?.trim() || article.question?.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") || article.id;
                      return (
                        <Link key={article.id} to={`/knowledge/${slug}`} className="block rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary hover:text-primary">
                          <p className="font-medium">{article.question}</p>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.answer}</p>
                        </Link>
                      );
                    }) : <p className="text-sm text-muted-foreground">Explore the Knowledge Hub for more answers.</p>}
                  </div>
                </section>
                <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">Share this article</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleShare("facebook")}><Facebook className="h-4 w-4" />Facebook</Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleShare("twitter")}><Twitter className="h-4 w-4" />Twitter</Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleShare("linkedin")}><Linkedin className="h-4 w-4" />LinkedIn</Button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
