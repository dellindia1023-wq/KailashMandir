import { Link, useParams } from "react-router-dom";
import { useKnowledgeArticles } from "@/hooks/useBlog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Compass, HeartHandshake, PhoneCall } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { BASE_URL } from "@/constants/seo";
import { buildContentAutomationMetadata, buildKnowledgeContentMetadata, buildKnowledgeArticleSlug } from "@/lib/contentSeo";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function KnowledgeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: articles = [], isLoading } = useKnowledgeArticles();

  const article = articles.find((entry) => {
    const generatedSlug = buildKnowledgeArticleSlug(entry.slug?.trim() || entry.question || entry.id);
    return generatedSlug === slug;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-muted-foreground">Knowledge article not found.</p>
        <Link to="/knowledge" className="text-primary hover:underline">Back to the Knowledge Hub</Link>
      </div>
    );
  }

  const generatedSlug = buildKnowledgeArticleSlug(article.slug?.trim() || article.question || article.id);
  const knowledgeMetadata = buildKnowledgeContentMetadata({
    question: article.question,
    answer: article.answer,
    category: article.category,
    slug: generatedSlug,
    baseUrl: BASE_URL,
  });
  const automationMetadata = buildContentAutomationMetadata({
    question: article.question,
    answer: article.answer,
    content: article.answer,
    category: article.category,
    slug: generatedSlug,
    baseUrl: BASE_URL,
    type: "knowledge",
  });
  const relatedTopicLinks = automationMetadata.smart_linking?.contextual_links || [];
  const relatedQuestions = (automationMetadata.question_engine?.people_also_ask || []).slice(0, 4);

  const seoTitle = article.seo_title || `${article.question} | Kailash Mahadev Temple Agra`;
  const seoDescription = article.seo_description || `${article.answer?.replace(/<[^>]*>/g, "").slice(0, 160) || "Find answers about this topic at Kailash Mahadev Temple Agra."}`;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{
      "@type": "Question",
      name: article.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: article.answer?.replace(/<[^>]*>/g, "").slice(0, 500),
      },
    }],
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Knowledge Hub", item: `${BASE_URL}/knowledge` },
      { "@type": "ListItem", position: 3, name: article.question, item: `${BASE_URL}/knowledge/${generatedSlug}` },
    ],
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={article.seo_keywords_field || `${article.question}, kailash mahadev temple agra, faq`}
        canonical={`/knowledge/${generatedSlug}`}
        ogType="article"
        articlePublishedTime={article.created_at}
        articleModifiedTime={article.updated_at}
        section={article.category || "Temple Guidance"}
        tags={[article.category || "temple guidance"].filter(Boolean)}
        breadcrumbLabel={article.question}
        jsonLd={[faqSchema, breadcrumbSchema]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-24">
          <div className="container mx-auto px-4 py-10 md:px-6 lg:py-16">
            <div className="mx-auto max-w-4xl">
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
                      <Link to="/knowledge">Knowledge Hub</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{article.question}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="mb-8 rounded-3xl border border-border/70 bg-card/80 p-8 shadow-sm">
                {article.category && (
                  <Link to={`/knowledge/category/${article.category.toLowerCase().replace(/\s+/g, "-")}`} className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <BookOpen className="h-4 w-4" /> {article.category}
                  </Link>
                )}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge>{article.category || "General"}</Badge>
                  <Badge variant="outline">Knowledge Article</Badge>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.question}</h1>
                <p className="mt-4 text-lg text-muted-foreground">{seoDescription}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />{automationMetadata.reading_time_minutes} min read</span>
                  <span className="inline-flex items-center gap-2"><Compass className="h-4 w-4" />Temple guidance</span>
                </div>
              </div>

              <article className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <MarkdownContent content={article.answer || ""} />
                </div>
              </article>

              <section className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Explore related temple guidance</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link to="/knowledge" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Knowledge Hub</Link>
                  <Link to="/blogs" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Blog Archive</Link>
                  <Link to="/darshan-timings" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Darshan timings</Link>
                  <Link to="/pujas" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Puja booking</Link>
                  <Link to="/events" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Temple events</Link>
                  <Link to="/contact" className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">Contact temple</Link>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Related topics</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {relatedTopicLinks.map((link) => (
                    <Link key={link.href} to={link.href} className="rounded-full border border-primary/20 px-3 py-2 text-sm text-primary transition hover:bg-primary/10">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Related questions</h2>
                <div className="mt-5 space-y-3">
                  {relatedQuestions.map((item) => (
                    <Link key={item.question} to={`/knowledge/${buildKnowledgeArticleSlug(item.question)}`} className="block rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary hover:text-primary">
                      <p className="font-medium">{item.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.answer}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Related resources</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <Link to="/darshan-timings" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                    <div className="flex items-center gap-2"><Compass className="h-4 w-4" /> <span className="font-medium">Darshan Timings</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">Plan your visit with current timings and guidance.</p>
                  </Link>
                  <Link to="/pujas" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                    <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> <span className="font-medium">Puja Booking</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">Reserve sacred rituals and special ceremonies.</p>
                  </Link>
                  <Link to="/contact" className="rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary hover:text-primary">
                    <div className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> <span className="font-medium">Contact the temple</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">Get support, directions, or more information.</p>
                  </Link>
                </div>
              </section>

              <div className="mt-8">
                <Link to="/knowledge" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Back to the Knowledge Hub
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
