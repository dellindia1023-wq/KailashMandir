import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useKnowledgeArticles } from "@/hooks/useBlog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CampaignSlot from "@/components/campaigns/CampaignSlot";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import SEOHead from "@/components/SEOHead";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Loader2, Search, ChevronDown, ChevronUp, HelpCircle, Sparkles, Compass, BookOpen } from "lucide-react";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { BASE_URL } from "@/constants/seo";
import { buildContentAutomationMetadata, buildKnowledgeContentMetadata, buildKnowledgeArticleSlug } from "@/lib/contentSeo";
import { MarkdownContent } from "@/components/MarkdownContent";
import ImageShimmer from "@/components/ImageShimmer";

export default function KnowledgeHubPage() {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const revealArticles = useScrollReveal();
  const { data: articles, isLoading, error } = useKnowledgeArticles();

  if (error) console.error("Knowledge Hub - Failed to load articles:", error);

  const toggleExpand = (articleId: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const filteredArticles = useMemo(() => {
    return (articles || []).filter((article) => {
      const matchesSearch = article.question?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
        article.answer?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
        (article.category || "")?.toLowerCase?.().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [articles, searchQuery]);

  const featuredArticles = filteredArticles.filter((article) => article.is_featured).slice(0, 3);
  const topicGroups = useMemo(() => {
    const groups = new Map<string, typeof articles>();
    filteredArticles.forEach((article) => {
      const key = article.category || "General";
      const existing = groups.get(key) || [];
      existing.push(article);
      groups.set(key, existing);
    });
    return Array.from(groups.entries()).slice(0, 6);
  }, [filteredArticles]);


  const knowledgeMetadata = (articles || []).map((article) => {
    const resolvedSlug = buildKnowledgeArticleSlug(article.slug?.trim() || article.question || article.id);
    return buildKnowledgeContentMetadata({
      question: article.question,
      answer: article.answer,
      category: article.category,
      slug: resolvedSlug,
      baseUrl: BASE_URL,
    });
  });
  const metadataById = new Map(knowledgeMetadata.map((metadata) => [metadata.canonical_url, metadata]));
  const automationMetadataById = new Map((articles || []).map((article) => {
    const resolvedSlug = buildKnowledgeArticleSlug(article.slug?.trim() || article.question || article.id);
    return [article.id, buildContentAutomationMetadata({
      question: article.question,
      answer: article.answer,
      content: article.answer,
      category: article.category,
      slug: resolvedSlug,
      baseUrl: BASE_URL,
      type: "knowledge",
    })];
  }))

  // Generate FAQ Schema for Knowledge Hub
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (articles || []).map((article) => ({
      "@type": "Question",
      name: article.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: article.answer.substring(0, 500), // Limit to 500 chars for schema
      },
    })),
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
        name: "Knowledge Hub",
        item: `${BASE_URL}/knowledge`,
      },
    ],
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
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Knowledge Hub - FAQ & Common Questions | Kailash Mahadev Temple Agra"
        description="Find answers to frequently asked questions about Kailash Mahadev Temple Agra - darshan timings, puja booking, temple location, and more"
        keywords="FAQ, knowledge hub, temple questions, kailash mahadev, frequently asked questions"
        canonical="/knowledge"
        breadcrumbLabel="Knowledge Hub"
        jsonLd={[faqSchema, breadcrumbSchema, searchActionSchema]}
      />
      <Header />
      <PageHeroBanner
        image={templeHero}
        title="Knowledge Hub"
        highlight="FAQ & Answers"
        subtitle="Find answers to your questions about Kailash Mahadev Temple"
        mantra="ॐ नमः शिवाय"
      />

      <ImageShimmer />

      <main>
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <CampaignSlot locationKey="knowledge.top" pageType="knowledge" />
          </div>
        </section>
        <TempleDivider />

        <section className="py-8 md:py-12 bg-gradient-to-br from-saffron/5 to-orange/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="relative">
              <Input
                placeholder="Search temple FAQs, rituals, timings, and guidance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-base"
              />
              <Search className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Compass className="h-4 w-4" />Explore temple guidance</span>
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />Browse rituals and visitor information</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(new Set((articles || []).map((article) => article.category).filter(Boolean))).slice(0, 6).map((category) => (
                <Link key={category} to={`/knowledge/category/${category.toLowerCase().replace(/\s+/g, "-")}`} className="rounded-full border border-border/70 px-3 py-2 text-sm transition hover:border-primary hover:text-primary">
                  {category}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link to="/darshan-timings" className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">Darshan timings</Link>
              <Link to="/pujas" className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">Puja booking</Link>
              <Link to="/events" className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">Temple events</Link>
              <Link to="/about" className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">Temple history</Link>
              <Link to="/blogs" className="rounded-full border border-border/70 px-3 py-2 transition hover:border-primary hover:text-primary">Blog archive</Link>
            </div>
          </div>
        </section>

        <TempleDivider />

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="space-y-8" ref={revealArticles.ref}>
                {featuredArticles.length > 0 && (
                  <section className="grid gap-4 lg:grid-cols-3">
                    {featuredArticles.map((article) => {
                      const resolvedSlug = buildKnowledgeArticleSlug(article.slug?.trim() || article.question || article.id);
                      return (
                        <Link key={article.id} to={`/knowledge/${resolvedSlug}`} className="group block">
                          <Card className="h-full border border-primary/20 bg-gradient-to-br from-background to-saffron/10 transition hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-5">
                              <div className="mb-3 flex items-center gap-2 text-sm text-primary"><Sparkles className="h-4 w-4" /> Featured</div>
                              <h3 className="text-lg font-semibold">{article.question}</h3>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{article.answer}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </section>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {topicGroups.map(([category, entries]) => (
                    <Card key={category} className="border-border/70 bg-card/80">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary"><BookOpen className="h-4 w-4" /> {category}</div>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          {entries.slice(0, 4).map((entry) => {
                            const resolvedSlug = buildKnowledgeArticleSlug(entry.slug?.trim() || entry.question || entry.id);
                            return (
                              <li key={entry.id}><Link to={`/knowledge/${resolvedSlug}`} className="transition hover:text-primary">• {entry.question}</Link></li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </section>

                <div className="space-y-4">
                {filteredArticles.map((article) => {
                  const isExpanded = expandedArticles.has(article.id);
                  const automationMetadata = automationMetadataById.get(article.id);
                  const resolvedSlug = buildKnowledgeArticleSlug(article.slug?.trim() || article.question || article.id);
                  return (
                    <Card
                      key={article.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50 border-l-4 border-l-saffron"
                    >
                      <div className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <HelpCircle className="h-5 w-5 text-saffron flex-shrink-0" />
                              <Link to={`/knowledge/${resolvedSlug}`} className="text-lg font-semibold font-heading hover:text-primary transition-colors">
                                {article.question}
                              </Link>
                            </div>
                            <Link to={`/knowledge/${resolvedSlug}`} className="mt-1 block text-sm text-muted-foreground line-clamp-2 hover:text-primary">
                              {article.answer}
                            </Link>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className="bg-saffron/10 text-saffron border-saffron/20">
                                {article.category || "General"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                            <Link to={`/knowledge/${resolvedSlug}`} className="text-sm font-medium text-primary hover:underline">
                              Open
                            </Link>
                            <button
                              onClick={() => toggleExpand(article.id)}
                              className="rounded-md p-1 transition hover:bg-background"
                              aria-label={isExpanded ? "Collapse answer" : "Expand answer"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 transition-transform" />
                              ) : (
                                <ChevronDown className="h-5 w-5 transition-transform" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t bg-muted/20">
                          <CardContent className="pt-6">
                            {article.featured_image_url && (
                              <img
                                src={article.featured_image_url}
                                alt={article.image_alt || article.question}
                                className="mb-4 h-48 w-full rounded-lg object-cover"
                              />
                            )}
                            <div className="text-muted-foreground leading-relaxed text-base">
                              <MarkdownContent content={article.answer || ""} />
                            </div>
                            {metadataById.get(`${BASE_URL}/knowledge/${resolvedSlug}`) && (
                              <div className="mt-4 space-y-3 rounded-md border bg-background/70 p-3 text-sm text-muted-foreground">
                                <div>
                                  <strong className="text-foreground">Quick answer:</strong>{" "}
                                  {metadataById.get(`${BASE_URL}/knowledge/${resolvedSlug}`)?.answer_first_paragraph}
                                </div>
                                {metadataById.get(`${BASE_URL}/knowledge/${resolvedSlug}`)?.context_blocks?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {metadataById.get(`${BASE_URL}/knowledge/${resolvedSlug}`)?.context_blocks?.slice(0, 3).map((block) => (
                                      <span key={block.title} className="rounded-full border px-2 py-1 text-xs text-foreground">
                                        {block.title}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                            {automationMetadata?.question_engine?.question_variations?.length ? (
                              <div className="mt-4 rounded-md border bg-background/70 p-3 text-sm text-muted-foreground">
                                <p className="font-semibold text-foreground">Suggested follow-ups</p>
                                <ul className="mt-2 space-y-1">
                                  {automationMetadata.question_engine.question_variations.slice(0, 3).map((question) => (
                                    <li key={question}>• {question}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            <div className="text-sm pt-6 text-muted-foreground border-t mt-6">
                              👁️ Views: {article.view_count.toLocaleString()}
                            </div>
                          </CardContent>
                        </div>
                      )}
                    </Card>
                  );
                })}
                </div>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? "No articles found matching your search" : "No articles available"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-primary hover:underline font-semibold"
                    >
                      Clear search
                    </button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <TempleDivider />
      </main>

      <Footer />
    </div>
  );
}
