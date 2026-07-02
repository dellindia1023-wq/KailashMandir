import { useState } from "react";
import { useBlogs, useBlogCategories } from "@/hooks/useBlogSystem";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Loader2, Calendar, Eye, Folder } from "lucide-react";

export const BlogListingPage = () => {
  const { data: blogs, isLoading } = useBlogs(false);
  const { data: categories } = useBlogCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBlogs = blogs?.filter((blog) => {
    const matchesCategory = !selectedCategory || blog.category_id === selectedCategory;
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-saffron/10 via-orange/5 to-gold/10 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              Blog & Articles
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore insights, stories, and spiritual wisdom from Kailash Mahadev Temple
            </p>

            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <h3 className="font-heading text-lg font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Articles
                  </Button>
                  {categories?.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blog List */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredBlogs && filteredBlogs.length > 0 ? (
                <div className="space-y-6">
                  {filteredBlogs.map((blog) => (
                    <Card
                      key={blog.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Featured Image */}
                        {blog.featured_image_url && (
                          <div className="md:col-span-1 h-48 md:h-auto overflow-hidden">
                            <img
                              src={blog.featured_image_url}
                              alt={blog.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <CardContent className={`p-6 ${blog.featured_image_url ? "md:col-span-2" : "md:col-span-3"}`}>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {blog.is_featured && (
                              <Badge className="bg-gold text-white">Featured</Badge>
                            )}
                            <Badge variant="outline">{blog.category?.name}</Badge>
                          </div>

                          <Link to={`/blog/${blog.slug}`}>
                            <h2 className="text-2xl font-bold font-heading hover:text-primary transition-colors mb-2">
                              {blog.title}
                            </h2>
                          </Link>

                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {blog.excerpt || blog.content.substring(0, 150)}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(blog.published_at || blog.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {blog.view_count} views
                            </span>
                          </div>

                          <Link to={`/blog/${blog.slug}`}>
                            <Button className="mt-4" variant="ghost" className="pl-0">
                              Read More →
                            </Button>
                          </Link>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-12 text-center">
                    <p className="text-muted-foreground text-lg">
                      {searchTerm ? "No articles found matching your search" : "No articles available"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
