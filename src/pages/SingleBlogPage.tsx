import { useBlogBySlug, useRelatedBlogs } from "@/hooks/useBlogSystem";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Eye, ArrowLeft, MapPin } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { BASE_URL } from "@/constants/seo";

export const SingleBlogPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: blog, isLoading } = useBlogBySlug(slug || "");
  const { data: relatedBlogs } = useRelatedBlogs(
    blog?.id || "",
    blog?.category_id || "",
    3
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Blog not found</p>
            <Link to="/blogs" className="text-primary hover:underline">
              Back to Blogs
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Improved SEO with GEO/AEO context
  const seoTitle = blog.seo_title || `${blog.title} | Kailash Mahadev Temple Agra`;
  const seoDescription = blog.seo_description || `${blog.excerpt || blog.title} - Learn about Kailash Mahadev Temple Agra's history, significance, and spiritual wisdom.`;
  const seoKeywords = blog.seo_keywords ? `${blog.seo_keywords}, Kailash Mahadev Agra, Agra Temple` : `${blog.title}, Kailash Mahadev Temple, Agra, temple`;
  
  // Article Schema with AEO support
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt || blog.seo_description,
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
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntity: {
      "@type": "CreativeWork",
      name: blog.title,
      description: blog.excerpt,
    },
    keywords: seoKeywords,
    articleSection: blog.category?.name || "Temple Wisdom",
    articleBody: blog.content,
  };

  // Breadcrumb Schema for AEO
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
        name: "Blog",
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.category?.name || "Articles",
        item: `${BASE_URL}/blog?category=${blog.category_id}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: blog.title,
        item: `${BASE_URL}/blog/${blog.slug}`,
      },
    ],
  };

  // Local Business Schema with GEO context
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

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={`/blog/${blog.slug}`}
        ogImage={blog.featured_image_url}
        ogType="article"
        jsonLd={[articleSchema, breadcrumbSchema, localBusinessSchema]}
      />

      <div className="min-h-screen bg-background">
        {/* Breadcrumb & Header */}
        <section className="py-8 border-b bg-gradient-to-br from-saffron/5 to-orange/5">
          <div className="container mx-auto px-4">
            <Link
              to="/blog"
              className="flex items-center gap-2 text-primary hover:underline mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blogs
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Kailash Mahadev Temple, Agra
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.view_count} views
              </span>
              <Badge variant="outline">{blog.category?.name}</Badge>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {blog.featured_image_url && (
          <section className="py-8 bg-background">
            <div className="container mx-auto px-4">
              <figure className="w-full">
                <img
                  src={blog.featured_image_url}
                  alt={`${blog.title} - Kailash Mahadev Temple Agra`}
                  title={`${blog.title} at Kailash Mahadev Temple, Agra`}
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                  loading="lazy"
                  itemProp="image"
                />
                <figcaption className="text-sm text-muted-foreground text-center mt-3 italic">
                  {blog.title} - Kailash Mahadev Temple, Agra
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <article className="lg:col-span-2 prose prose-sm max-w-none dark:prose-invert">
                <div className="bg-card border rounded-lg p-6 md:p-8 space-y-6">
                  {/* Excerpt */}
                  {blog.excerpt && (
                    <p className="text-lg italic text-muted-foreground border-l-4 border-saffron pl-4">
                      {blog.excerpt}
                    </p>
                  )}

                  {/* Content */}
                  <div className="prose dark:prose-invert prose-headings:font-heading max-w-none">
                    {blog.content.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="text-base leading-7">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-20 space-y-6">
                  {/* Related Articles */}
                  {relatedBlogs && relatedBlogs.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-heading text-lg font-semibold mb-4">
                          Related Articles
                        </h3>
                        <div className="space-y-4">
                          {relatedBlogs.map((relatedBlog) => (
                            <Link
                              key={relatedBlog.id}
                              to={`/blog/${relatedBlog.slug}`}
                              className="group block p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                              <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                {relatedBlog.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(relatedBlog.published_at || relatedBlog.created_at).toLocaleDateString()}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Share Info */}
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-heading font-semibold mb-4">About This Article</h3>
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Category</dt>
                          <dd className="font-medium">{blog.category?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Published</dt>
                          <dd className="font-medium">
                            {new Date(blog.published_at || blog.created_at).toLocaleDateString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Views</dt>
                          <dd className="font-medium">{blog.view_count.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
