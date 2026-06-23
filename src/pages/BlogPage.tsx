import { useState } from "react";
import { useBlogs, useBlogCategories } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import SEOHead from "@/components/SEOHead";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Loader2, Search, Calendar, MapPin } from "lucide-react";
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

  const filteredBlogs = blogs?.filter((blog) => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || blog.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Enhanced SEO with GEO/AEO context
  const blogListingSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog & Articles - Kailash Mahadev Temple Agra",
    description: "Explore spiritual wisdom, temple news, and insights from Kailash Mahadev Temple Agra",
    url: `${BASE_URL}/blog`,
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
        item: `${BASE_URL}/blog`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog & Articles - Kailash Mahadev Temple Agra | Spiritual Wisdom"
        description="Discover spiritual wisdom, temple history, and religious insights from Kailash Mahadev Temple Agra. Read articles about Hindu traditions, temple events, and spiritual guidance."
        keywords="Kailash Mahadev blog, Agra temple articles, spiritual wisdom, Hindu temple news, temple stories, religious insights"
        canonical={`${BASE_URL}/blog`}
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
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-6">
            <div className="relative">
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Featured Blog */}
          {filteredBlogs?.find((b) => b.is_featured) && (
            <div className={`max-w-4xl mx-auto mb-12 ${revealBlogs.className}`} ref={revealBlogs.ref}>
              <Card className="overflow-hidden border-2 border-primary/20">
                <div className="md:flex">
                  {filteredBlogs.find((b) => b.is_featured)?.featured_image_url && (
                    <div className="md:w-1/2 h-40 md:h-auto overflow-hidden">
                      <img
                        src={filteredBlogs.find((b) => b.is_featured)?.featured_image_url}
                        alt={`${filteredBlogs.find((b) => b.is_featured)?.title} - Kailash Mahadev Temple Agra`}
                        title={`Featured Article: ${filteredBlogs.find((b) => b.is_featured)?.title}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-8 md:w-1/2 flex flex-col justify-center">
                    <Badge className="w-fit mb-2">Featured</Badge>
                    <h2 className="text-2xl font-bold mb-2">
                      {filteredBlogs.find((b) => b.is_featured)?.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {filteredBlogs.find((b) => b.is_featured)?.excerpt}
                    </p>
                    <Link
                      to={`/blog/${filteredBlogs.find((b) => b.is_featured)?.slug}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      Read More →
                    </Link>
                  </CardContent>
                </div>
              </Card>
            </div>
          )}

          {/* Blogs Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto ${revealBlogs.className}`} ref={revealBlogs.ref}>
              {filteredBlogs?.map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {blog.featured_image_url && (
                      <div className="overflow-hidden h-40">
                        <img
                          src={blog.featured_image_url}
                          alt={`${blog.title} - Kailash Mahadev Temple Article`}
                          title={blog.title}
                          className="h-full w-full object-cover hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{blog.status}</Badge>
                        {blog.is_featured && <Badge>Featured</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(blog.created_at).toLocaleDateString()}
                        </div>
                        <span>{blog.view_count} views</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && filteredBlogs?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No blogs found</p>
            </div>
          )}
        </div>
        </section>
      </main>

      <TempleDivider />
      <Footer />
    </div>
  );
}
