import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useBlogs, useKnowledgeArticles, useBlogCategories } from "@/hooks/useBlog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Compass, Sparkles } from "lucide-react";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { BASE_URL } from "@/constants/seo";
import { buildCollectionPageMetadata } from "@/lib/contentSeo";

interface CollectionPageProps {
  contentType: "blog" | "knowledge";
}

export default function CollectionPage({ contentType }: CollectionPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { data: blogs = [] } = useBlogs("published");
  const { data: knowledgeArticles = [] } = useKnowledgeArticles();
  const { data: categories = [] } = useBlogCategories();

  const isKnowledge = contentType === "knowledge";
  const collectionItems = useMemo(() => {
    if (isKnowledge) {
      return knowledgeArticles.filter((item) => (item.category || "").toLowerCase() === (slug || "").toLowerCase());
    }
    return blogs.filter((blog) => {
      const category = categories.find((entry) => entry.id === blog.category_id);
      return (category?.slug || "").toLowerCase() === (slug || "").toLowerCase();
    });
  }, [blogs, categories, knowledgeArticles, isKnowledge, slug]);

  const collectionMetadata = buildCollectionPageMetadata({
    kind: "category",
    type: contentType,
    slug,
    title: `${slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) : "Category"} | Kailash Mahadev Temple Agra`,
    description: isKnowledge
      ? `Explore knowledge articles and temple guidance about ${slug || "this topic"} at Kailash Mahadev Temple Agra.`
      : `Read temple stories, updates, and spiritual insights about ${slug || "this topic"} at Kailash Mahadev Temple Agra.`,
    baseUrl: BASE_URL,
    itemCount: collectionItems.length,
    breadcrumbLabel: slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) : "Category",
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={collectionMetadata.title}
        description={collectionMetadata.description}
        canonical={collectionMetadata.canonical_url}
        keywords={`${slug || "temple"}, kailash mahadev temple agra, content hub, spiritual guidance`}
        ogType="website"
        jsonLd={[collectionMetadata.schema, collectionMetadata.breadcrumb]}
      />
      <Header />
      <PageHeroBanner
        image={templeHero}
        title={slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()) : "Category"}
        highlight="Collection"
        subtitle={collectionMetadata.description}
        mantra="ॐ नमः शिवाय"
      />
      <main>
        <TempleDivider />
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{collectionItems.length} {isKnowledge ? "knowledge articles" : "articles"}</Badge>
            <Badge className="bg-saffron/15 text-saffron">Admin-managed content</Badge>
          </div>
          {collectionItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {collectionItems.map((item) => {
                const slugValue = isKnowledge ? (item as any).slug || (item as any).question : (item as any).slug;
                const href = isKnowledge ? `/knowledge/${slugValue}` : `/blog/${slugValue}`;
                const title = isKnowledge ? (item as any).question : (item as any).title;
                const excerpt = isKnowledge ? (item as any).answer : (item as any).excerpt;
                return (
                  <Card key={(item as any).id} className="border-border/70 transition hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-center gap-2 text-sm text-primary">
                        {isKnowledge ? <Compass className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        <span>{isKnowledge ? "Knowledge" : "Article"}</span>
                      </div>
                      <h2 className="text-xl font-semibold">{title}</h2>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
                      <Button asChild className="mt-5">
                        <Link to={href}>
                          Read more <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
                <p className="text-lg text-muted-foreground">No content is available for this collection yet.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
