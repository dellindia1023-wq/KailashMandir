import { useMemo, useState } from "react";
import { useBlogs, useBlogCategories } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import SEOHead from "@/components/SEOHead";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Loader2, Search, Calendar, Clock3, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { BASE_URL } from "@/constants/seo";

export default function BlogPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const revealBlogs = useScrollReveal();
  
  const { data: blogs, isLoading } = useBlogs("published");
  const { data: categories } = useBlogCategories();

  const filteredBlogs = useMemo(() => {
    return (blogs || []).filter((blog) => {
      const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || (blog.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || blog.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [blogs, searchQuery, selectedCategory]);

  const featuredBlog = filteredBlogs.find((blog) => blog.is_featured) || filteredBlogs[0];
  const latestBlogs = filteredBlogs.filter((blog) => blog.id !== featuredBlog?.id).slice(0, 6);
  const popularBlogs = [...filteredBlogs].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);

  // Enhanced SEO with GEO/AEO context
  const blogListingSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog & Articles - Kailash Mahadev Temple Agra",
    description: "Explore spiritual wisdom, temple news, and insights from Kailash Mahadev Temple Agra",
    url: `${BASE_URL}/blogs`,
    mainEntity: {
      "@type": "BlogPosting",
      headline: "Kailash Mahadev Temple Blog",
      description: "Religious and spiritual blog about Kailash Mahadev Temple in Agra",
    },
    areaServed: {
      "@type": "City",
      name: "Agra",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Agra",
        addressRegion: "Uttar Pradesh",
        addressCountry: "IN",
      },
    },
  };

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
        item: `${BASE_URL}/blogs`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog & Articles - Kailash Mahadev Temple Agra | Spiritual Wisdom"
        description="Discover spiritual wisdom, temple history, and religious insights from Kailash Mahadev Temple Agra. Read articles about Hindu traditions, temple events, and spiritual guidance."
        keywords="Kailash Mahadev blog, Agra temple articles, spiritual wisdom, Hindu temple news, temple stories, religious insights"
        canonical={`${BASE_URL}/blogs`}
        jsonLd={[blogListingSchema, breadcrumbSchema]}
      />
      <Header />
      <PageHeroBanner
        image={templeHero}
        title="Blog"
        highlight="& Insights"
        subtitle="Explore spiritual wisdom and temple news from Kailash Mahadev Temple, Agra"
        mantra="ॐ नमः शिवाय"
      />

      <main>
        <TempleDivider />
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 space-y-10">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="relative">
                <Input
                  placeholder="Search stories, rituals, and temple wisdom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-base"
                />
                <Search className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant={!selectedCategory ? "default" : "outline"} onClick={() => setSelectedCategory(null)}>
                  All Topics
                </Button>
                {categories?.map((cat) => (
                  <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} onClick={() => setSelectedCategory(cat.id)}>
                    {cat.name}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {categories?.slice(0, 6).map((cat) => (
                  <Link key={cat.id} to={`/blog/category/${cat.slug}`} className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {featuredBlog && (
                  <div className={`mx-auto max-w-6xl ${revealBlogs.className}`} ref={revealBlogs.ref}>
                    <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-background via-background to-saffron/10 shadow-sm">
                      <div className="md:grid md:grid-cols-[1.1fr_0.9fr]">
                        {featuredBlog.featured_image_url && (
                          <div className="h-64 overflow-hidden md:h-full">
                            <img src={featuredBlog.featured_image_url} alt={featuredBlog.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                          </div>
                        )}
                        <CardContent className="flex flex-col justify-center p-8">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge className="bg-saffron/15 text-saffron">Featured story</Badge>
                            <Badge variant="outline">{featuredBlog.category?.name || "Temple wisdom"}</Badge>
                          </div>
                          <h2 className="text-3xl font-semibold tracking-tight">{featuredBlog.title}</h2>
                          <p className="mt-3 text-base text-muted-foreground">{featuredBlog.excerpt}</p>
                          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(featuredBlog.created_at).toLocaleDateString()}</span>
                            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{featuredBlog.content?.length ? Math.max(1, Math.ceil(featuredBlog.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length / 180)) : 4} min read</span>
                          </div>
                          <div className="mt-6 flex flex-wrap gap-3">
                            <Link to={`/blog/${featuredBlog.slug}`}><Button>Read full story</Button></Link>
                            <Link to="/knowledge"><Button variant="outline">Explore knowledge hub</Button></Link>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      <Sparkles className="h-4 w-4" /> Latest articles
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {latestBlogs.map((blog) => (
                        <Link key={blog.id} to={`/blog/${blog.slug}`} className="group block">
                          <Card className="h-full overflow-hidden border-border/70 transition hover:-translate-y-1 hover:shadow-lg">
                            {blog.featured_image_url && (
                              <div className="h-40 overflow-hidden">
                                <img src={blog.featured_image_url} alt={blog.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                              </div>
                            )}
                            <CardContent className="p-5">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                {blog.category?.name && <Badge variant="secondary">{blog.category.name}</Badge>}
                                {blog.is_featured && <Badge>Featured</Badge>}
                              </div>
                              <h3 className="text-lg font-semibold line-clamp-2">{blog.title}</h3>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{blog.excerpt}</p>
                              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(blog.created_at).toLocaleDateString()}</span>
                                <span>{blog.view_count} views</span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>

                  <aside className="space-y-6">
                    <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                        <TrendingUp className="h-4 w-4" /> Popular now
                      </div>
                      <div className="mt-5 space-y-3">
                        {popularBlogs.map((blog, index) => (
                          <Link key={blog.id} to={`/blog/${blog.slug}`} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary">
                            <span className="mt-1 text-sm font-semibold text-primary">0{index + 1}</span>
                            <div>
                              <p className="font-medium">{blog.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                    <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                        <BookOpen className="h-4 w-4" /> Browse by topic
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {categories?.map((cat) => (
                          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="rounded-full border border-border/70 px-3 py-2 text-sm transition hover:border-primary hover:text-primary">
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </section>
                  </aside>
                </div>

                {!isLoading && filteredBlogs.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No stories match your current search.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <TempleDivider />
      <Footer />
    </div>
  );
}
