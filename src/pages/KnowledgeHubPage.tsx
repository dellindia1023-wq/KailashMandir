import { useState } from "react";
import { useKnowledgeArticles } from "@/hooks/useBlog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import SEOHead from "@/components/SEOHead";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Loader2, Search, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import { BASE_URL } from "@/constants/seo";
import { buildContentAutomationMetadata, buildKnowledgeContentMetadata } from "@/lib/contentSeo";

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

  const filteredArticles = (articles || []).filter((article) => {
    const matchesSearch = article.question?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
      article.answer?.toLowerCase?.().includes(searchQuery.toLowerCase()) ||
      (article.category || "")?.toLowerCase?.().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


  const knowledgeMetadata = (articles || []).map((article) => buildKnowledgeContentMetadata({
    question: article.question,
    answer: article.answer,
    category: article.category,
    slug: article.id,
    baseUrl: BASE_URL,
  }));
  const metadataById = new Map(knowledgeMetadata.map((metadata) => [metadata.canonical_url, metadata]));
  const automationMetadataById = new Map((articles || []).map((article) => [article.id, buildContentAutomationMetadata({
    question: article.question,
    answer: article.answer,
    content: article.answer,
    category: article.category,
    slug: article.id,
    baseUrl: BASE_URL,
    type: "knowledge",
  })]));

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
        item: `${BASE_URL}/knowledge-hub`,
      },
    ],
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
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Knowledge Hub - FAQ & Common Questions | Kailash Mahadev Temple Agra"
        description="Find answers to frequently asked questions about Kailash Mahadev Temple Agra - darshan timings, puja booking, temple location, and more"
        keywords="FAQ, knowledge hub, temple questions, kailash mahadev, frequently asked questions"
        canonical="/knowledge-hub"
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

      <main>
        <TempleDivider />

        {/* Search Section */}
        <section className="py-8 md:py-12 bg-gradient-to-br from-saffron/5 to-orange/5">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="relative">
              <Input
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-base"
              />
              <Search className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        <TempleDivider />

        {/* Main Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="space-y-4" ref={revealArticles.ref}>
                {filteredArticles.map((article) => {
                  const isExpanded = expandedArticles.has(article.id);
                  const automationMetadata = automationMetadataById.get(article.id);
                  return (
                    <Card
                      key={article.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50 border-l-4 border-l-saffron"
                    >
                      <button
                        onClick={() => toggleExpand(article.id)}
                        className="w-full text-left hover:bg-muted/30 transition-colors p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <HelpCircle className="h-5 w-5 text-saffron flex-shrink-0" />
                              <h3 className="text-lg font-semibold font-heading hover:text-primary transition-colors">
                                {article.question}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className="bg-saffron/10 text-saffron border-saffron/20">
                                {article.category || "General"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 transition-transform" />
                            ) : (
                              <ChevronDown className="h-5 w-5 transition-transform" />
                            )}
                          </div>
                        </div>
                      </button>

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
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-base">
                              {article.answer}
                            </p>
                            {metadataById.get(`${BASE_URL}/knowledge-hub#${article.id}`) && (
                              <div className="mt-4 space-y-3 rounded-md border bg-background/70 p-3 text-sm text-muted-foreground">
                                <div>
                                  <strong className="text-foreground">Quick answer:</strong>{" "}
                                  {metadataById.get(`${BASE_URL}/knowledge-hub#${article.id}`)?.answer_first_paragraph}
                                </div>
                                {metadataById.get(`${BASE_URL}/knowledge-hub#${article.id}`)?.context_blocks?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {metadataById.get(`${BASE_URL}/knowledge-hub#${article.id}`)?.context_blocks?.slice(0, 3).map((block) => (
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
