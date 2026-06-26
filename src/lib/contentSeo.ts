                                    const TEMPLE_KEYWORDS = [
  "kailash mandir",
  "kailash mahadev",
  "kailash temple",
  "kailash temple agra",
  "Agra temple",
  "Shiva temple",
];

const toPlainText = (value?: string) =>
  stripHtml(value || "")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, length: number) => {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value;
};

const buildEntityContext = (value?: string) => {
  const lowerValue = (value || "").toLowerCase();
  const entities: Array<{ name: string; type: string; description: string; related_terms: string[] }> = [];

  if (lowerValue.includes("puja") || lowerValue.includes("seva")) {
    entities.push({
      name: "Puja",
      type: "Puja Entity",
      description: "Temple puja and seva services for devotees.",
      related_terms: ["darshan", "aarti", "prasad"],
    });
  }

  if (lowerValue.includes("darshan") || lowerValue.includes("timing")) {
    entities.push({
      name: "Darshan",
      type: "Temple Entity",
      description: "Temple visit and darshan guidance for visitors.",
      related_terms: ["timings", "entry", "aarti"],
    });
  }

  if (lowerValue.includes("aarti") || lowerValue.includes("prarthana")) {
    entities.push({
      name: "Aarti",
      type: "Aarti Entity",
      description: "Devotional rituals and sacred chanting at the temple.",
      related_terms: ["darshan", "puja", "prasad"],
    });
  }

  if (lowerValue.includes("prasad") || lowerValue.includes("bhog")) {
    entities.push({
      name: "Prasad",
      type: "Prasad Entity",
      description: "Blessed offerings distributed to devotees.",
      related_terms: ["puja", "aarti", "seva"],
    });
  }

  if (lowerValue.includes("shivaratri") || lowerValue.includes("festival")) {
    entities.push({
      name: "Shivaratri",
      type: "Festival Entity",
      description: "Major annual festival celebrated with devotion and ritual.",
      related_terms: ["aarti", "puja", "darshan"],
    });
  }

  if (lowerValue.includes("agra") || lowerValue.includes("temple")) {
    entities.push({
      name: "Kailash Mahadev Temple Agra",
      type: "Temple Entity",
      description: "Historic Shiva temple in Agra with spiritual and cultural significance.",
      related_terms: ["agra", "shiva", "darshan"],
    });
  }

  if (lowerValue.includes("shiva") || lowerValue.includes("mahadev")) {
    entities.push({
      name: "Shiva",
      type: "Deity Entity",
      description: "The principal deity revered by devotees at the temple.",
      related_terms: ["temple", "aarti", "puja"],
    });
  }

  return entities;
};

const tokenizeKeywords = (value?: string) => {
  const words = (value || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "about",
    "from",
    "your",
    "into",
    "that",
    "this",
    "what",
    "when",
    "how",
    "why",
    "are",
    "can",
    "our",
    "you",
    "at",
    "in",
    "of",
    "to",
    "is",
    "a",
    "an",
    "be",
    "on",
    "it",
    "as",
    "we",
    "will",
    "or",
    "by",
    "the",
  ]);

  return words.filter((word) => word.length > 3 && !stopWords.has(word));
};

const inferCategory = (value?: string, fallback?: string) => {
  const lowerValue = (value || "").toLowerCase();
  if (lowerValue.includes("puja") || lowerValue.includes("seva")) return "Puja & Rituals";
  if (lowerValue.includes("darshan") || lowerValue.includes("timing")) return "Darshan & Visit Guide";
  if (lowerValue.includes("festival") || lowerValue.includes("shivaratri")) return "Festivals & Celebrations";
  if (lowerValue.includes("donat") || lowerValue.includes("offer")) return "Donation & Support";
  if (fallback) return fallback;
  return "Temple Guidance";
};

const buildContentIntelligence = (content: {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
}) => {
  const combinedText = `${content.title || ""} ${content.content || ""} ${content.excerpt || ""}`;
  const plainText = toPlainText(combinedText);
  const normalizedText = plainText.toLowerCase();
  const entities = buildEntityContext(combinedText);
  const keywords = tokenizeKeywords(plainText).slice(0, 12);
  const secondaryTopics = [
    ...(normalizedText.includes("puja") ? ["Puja booking"] : []),
    ...(normalizedText.includes("darshan") ? ["Darshan timings"] : []),
    ...(normalizedText.includes("aarti") ? ["Aarti schedule"] : []),
    ...(normalizedText.includes("prasad") ? ["Prasad and offerings"] : []),
    ...(normalizedText.includes("festival") || normalizedText.includes("shivaratri") ? ["Festivals and celebrations"] : []),
  ].slice(0, 4);
  const religiousConcepts = [
    ...(normalizedText.includes("puja") ? ["Puja"] : []),
    ...(normalizedText.includes("darshan") ? ["Darshan"] : []),
    ...(normalizedText.includes("aarti") ? ["Aarti"] : []),
    ...(normalizedText.includes("prasad") ? ["Prasad"] : []),
    ...(normalizedText.includes("mantra") ? ["Mantra"] : []),
  ].slice(0, 5);

  return {
    primary_topic: content.title || "Temple guidance",
    secondary_topics: secondaryTopics.length ? secondaryTopics : ["Temple experiences"],
    content_category: inferCategory(plainText, content.category),
    temple_entity: "Kailash Mahadev Temple Agra",
    deity_entity: normalizedText.includes("shiva") || normalizedText.includes("mahadev") ? "Shiva" : "Shiva",
    festival_entity: normalizedText.includes("shivaratri") || normalizedText.includes("festival") ? "Shivaratri" : "Festival",
    puja_entity: normalizedText.includes("puja") || normalizedText.includes("seva") ? "Puja & Seva" : "Puja",
    religious_concepts: religiousConcepts.length ? religiousConcepts : ["Darshan", "Puja"],
    important_keywords: keywords,
    long_tail_keywords: keywords.map((keyword) => `${keyword} kailash mahadev temple agra`).slice(0, 6),
    semantic_keywords: [...new Set([...keywords, "temple visit", "spiritual guidance", "agra temple", "shiva temple"])].slice(0, 8),
    related_entities: entities.slice(0, 5).map((entity) => ({
      name: entity.name,
      type: entity.type,
      description: entity.description,
    })),
    entity_relationships: entities.slice(0, 4).map((entity, index) => ({
      source: "temple",
      target: `entity-${index + 1}`,
      relation: index === 0 ? "supports" : "relates_to",
      entity: entity.name,
    })),
    topic_cluster: {
      primary_topic: content.title || "Temple guidance",
      related_topics: secondaryTopics.length ? secondaryTopics : ["Temple experiences"],
      relationship_summary: "The article connects ritual guidance, temple services, and devotional context.",
    },
    context_summary: truncate(plainText, 220),
    ai_summary: truncate(plainText, 320),
    short_summary: truncate(plainText, 160),
    meta_summary: truncate(plainText, 240),
  };
};

const buildQuestionEngine = (content: {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  type?: "blog" | "knowledge";
}) => {
  const plainText = toPlainText(`${content.title || ""} ${content.content || ""} ${content.excerpt || ""}`);
  const titleText = content.title || "Temple article";
  const queries = [
    titleText,
    ...(content.category ? [content.category] : []),
    ...tokenizeKeywords(plainText).slice(0, 4),
  ].filter(Boolean);

  const baseFaqs = queries.slice(0, 3).map((query) => ({
    question: `${query} at Kailash Mahadev Temple Agra?`,
    answer: truncate(plainText, 180),
  }));

  return {
    faq_candidates: baseFaqs,
    question_variations: [
      `${titleText} explained`,
      `How to find ${titleText}`,
      `What should I know about ${titleText}`,
    ].slice(0, 4),
    people_also_ask: baseFaqs.slice(0, 3),
    voice_search_questions: [
      `${titleText} in Agra`,
      `${titleText} today`,
      `What is ${titleText}`,
    ].slice(0, 3),
    short_answers: baseFaqs.map((entry) => entry.answer).slice(0, 3),
    long_answers: baseFaqs.map((entry) => `${entry.question} ${entry.answer}`).slice(0, 3),
  };
};

const buildSmartLinking = (content: {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  type?: "blog" | "knowledge";
}) => {
  const plainText = toPlainText(`${content.title || ""} ${content.content || ""} ${content.excerpt || ""}`).toLowerCase();
  const contextualLinks = [
    ...(plainText.includes("puja") ? [{ label: "Puja Booking", href: "/pujas" }] : []),
    ...(plainText.includes("darshan") ? [{ label: "Darshan Timings", href: "/darshan-timings" }] : []),
    ...(plainText.includes("donat") ? [{ label: "Donation", href: "/donate" }] : []),
    ...(plainText.includes("festival") || plainText.includes("shivaratri") ? [{ label: "Temple Events", href: "/events" }] : []),
  ];

  return {
    related_articles: contextualLinks.slice(0, 3),
    internal_link_suggestions: contextualLinks.slice(0, 3),
    previous_article: null,
    next_article: null,
    related_knowledge_articles: contextualLinks.slice(0, 2),
    contextual_links: contextualLinks.slice(0, 4),
  };
};

export const autoGenerateBlogSEO = (blog: {
  title?: string;
  excerpt?: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  category?: { name?: string } | null;
}) => {
  const cleanedContent = stripHtml(blog.content || blog.excerpt || "");
  const fallbackTitle = blog.title ? `${blog.title} | Kailash Mahadev Temple Agra` : "Kailash Mahadev Temple Agra";
  const fallbackDescription = truncate(
    stripHtml(blog.excerpt || cleanedContent || "Explore spiritual insights from Kailash Mahadev Temple Agra."),
    160
  );

  const seo_keywords = blog.seo_keywords?.trim()
    ? blog.seo_keywords
    : [
        blog.title,
        blog.category?.name,
        ...TEMPLE_KEYWORDS.slice(0, 3),
        "Agra",
      ]
        .filter(Boolean)
        .slice(0, 10)
        .join(", ");

  return {
    seo_title: blog.seo_title?.trim() || fallbackTitle,
    seo_description: blog.seo_description?.trim() || fallbackDescription,
    seo_keywords,
  };
};

export const autoGenerateKnowledgeSEO = (article: {
  question?: string;
  answer?: string;
  category?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords_field?: string;
}) => {
  const question = article.question?.trim() || "Knowledge article";
  const answer = stripHtml(article.answer || "");
  const fallbackTitle = `${question} | Kailash Mahadev Temple Agra`;
  const fallbackDescription = truncate(answer, 160) || `Find answers about ${question.toLowerCase()} at Kailash Mahadev Temple Agra.`;
  const keywords = article.seo_keywords_field?.trim()
    ? article.seo_keywords_field
    : [question, article.category, ...TEMPLE_KEYWORDS.slice(0, 3), "Agra"]
        .filter(Boolean)
        .join(", ");

  return {
    seo_title: article.seo_title?.trim() || fallbackTitle,
    seo_description: article.seo_description?.trim() || fallbackDescription,
    seo_keywords_field: keywords,
  };
};

export const buildBlogContentMetadata = (content: {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  baseUrl?: string;
  category?: string;
}) => {
  const plainText = toPlainText(content.content || content.excerpt || "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const headings = Array.from((content.content || "").matchAll(/^(#{1,6})\s+(.+)$/gm)).map(([, , heading]) => ({
    level: heading.length,
    text: heading.trim(),
  }));
  const tableOfContents = headings.map((heading) => ({
    text: heading.text,
    level: heading.level,
  }));
  const canonicalUrl = `${content.baseUrl || "https://kailashmahadev.in"}/blog/${content.slug || "article"}`;
  const lowerContent = (content.content || content.excerpt || "").toLowerCase();
  const internalLinks = [
    ...(lowerContent.includes("puja") ? [{ label: "Puja Booking", href: "/pujas" }] : []),
    ...(lowerContent.includes("darshan") ? [{ label: "Darshan Timings", href: "/darshan-timings" }] : []),
    ...(lowerContent.includes("donat") ? [{ label: "Donation", href: "/donate" }] : []),
  ];
  const entityContext = buildEntityContext((content.content || content.excerpt || "") + " " + (content.title || ""));
  const contextBlocks = [
    {
      title: "Temple Entity",
      summary: "Kailash Mahadev Temple Agra is a revered Shiva temple in Agra with spiritual and cultural significance.",
      related_terms: ["Shiva", "darshan", "aarti"],
    },
    ...entityContext.slice(0, 4).map((entity) => ({
      title: entity.type,
      summary: entity.description,
      related_terms: entity.related_terms,
    })),
  ];

  return {
    word_count: wordCount,
    reading_time_minutes: readingTimeMinutes,
    table_of_contents: tableOfContents,
    canonical_url: canonicalUrl,
    semantic_headings: tableOfContents,
    semantic_html_structure: {
      article: true,
      header: true,
      section: true,
      figure: true,
      aside: true,
      nav: true,
    },
    internal_links: internalLinks,
    image_dimensions: {
      width: 1200,
      height: 630,
    },
    prevent_cls: true,
    entity_first_content: true,
    context_blocks: contextBlocks,
    rich_context_sections: contextBlocks,
    topic_cluster: {
      primary_topic: content.title || "Temple wisdom",
      related_topics: entityContext.slice(0, 4).map((entity) => entity.name),
      relationship_summary: "Temple guidance, ritual information, and visitor services are linked for easier AI understanding.",
    },
    knowledge_graph: {
      nodes: [
        { id: "temple", type: "Temple Entity", name: "Kailash Mahadev Temple Agra" },
        ...entityContext.slice(0, 4).map((entity, index) => ({
          id: `entity-${index + 1}`,
          type: entity.type,
          name: entity.name,
        })),
      ],
      relationships: [
        { source: "temple", target: "entity-1", relation: "supports" },
      ],
    },
    ai_search_context: {
      summary: truncate(plainText, 220),
      entity_keywords: entityContext.slice(0, 4).map((entity) => entity.name).join(", "),
      answer_style: "direct",
    },
    related_entities: entityContext.slice(0, 4).map((entity) => ({
      name: entity.name,
      type: entity.type,
      description: entity.description,
    })),
    entity_metadata: {
      temple_entity: "Kailash Mahadev Temple Agra",
      location_entity: "Agra, Uttar Pradesh",
      festival_entity: "Shivaratri",
      puja_entity: "Puja Booking",
      deity_entity: "Shiva",
      prasad_entity: "Prasad",
      aarti_entity: "Aarti",
    },
  };
};

export const buildContentAutomationMetadata = (content: {
  title?: string;
  question?: string;
  content?: string;
  answer?: string;
  excerpt?: string;
  slug?: string;
  baseUrl?: string;
  category?: string;
  type?: "blog" | "knowledge";
}) => {
  const contentText = content.content || content.answer || content.excerpt || "";
  const titleText = content.title || content.question || "Temple content";
  const slug = content.slug || (titleText ? titleText.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") : "content");
  const seo = content.type === "knowledge"
    ? autoGenerateKnowledgeSEO({
        question: content.question,
        answer: content.answer,
        category: content.category,
        seo_title: undefined,
        seo_description: undefined,
        seo_keywords_field: undefined,
      })
    : autoGenerateBlogSEO({
        title: content.title,
        excerpt: content.excerpt,
        content: content.content,
        category: content.category ? { name: content.category } : null,
      });
  const seoKeywords = content.type === "knowledge"
    ? ("seo_keywords_field" in seo ? seo.seo_keywords_field : "")
    : ("seo_keywords" in seo ? seo.seo_keywords : "");
  const baseUrl = content.baseUrl || "https://kailashmahadev.in";
  const blogMetadata = buildBlogContentMetadata({
    title: content.title,
    content: content.content,
    excerpt: content.excerpt,
    slug,
    baseUrl,
    category: content.category,
  });
  const knowledgeMetadata = buildKnowledgeContentMetadata({
    question: content.question,
    answer: content.answer,
    category: content.category,
    slug,
    baseUrl,
  });
  const imageAlt = `${titleText} - Kailash Mahadev Temple Agra`;
  const entityContext = buildEntityContext(`${titleText} ${contentText}`);
  const shortAnswer = truncate(toPlainText(contentText), 220);
  const intelligence = buildContentIntelligence({
    title: content.title || content.question,
    content: content.content || content.answer,
    excerpt: content.excerpt,
    category: content.category,
  });
  const questionEngine = buildQuestionEngine({
    title: content.title || content.question,
    content: content.content || content.answer,
    excerpt: content.excerpt,
    category: content.category,
    type: content.type,
  });
  const smartLinking = buildSmartLinking({
    title: content.title || content.question,
    content: content.content || content.answer,
    excerpt: content.excerpt,
    category: content.category,
    type: content.type,
  });

  return {
    slug,
    seo_title: seo.seo_title,
    seo_description: seo.seo_description,
    seo_keywords: seoKeywords,
    canonical_url: content.type === "knowledge"
      ? `${baseUrl}/knowledge-hub#${slug}`
      : `${baseUrl}/blog/${slug}`,
    open_graph: {
      title: seo.seo_title,
      description: seo.seo_description,
      type: "article",
      image: `${baseUrl}/icons/icon-512x512.png`,
    },
    twitter_card: {
      card: "summary_large_image",
      title: seo.seo_title,
      description: seo.seo_description,
      image: `${baseUrl}/icons/icon-512x512.png`,
    },
    schema: {
      article: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: titleText,
        description: seo.seo_description,
        keywords: seoKeywords || titleText,
        author: {
          "@type": "Organization",
          name: "Kailash Mahadev Temple Agra",
        },
      },
      breadcrumb: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          { "@type": "ListItem", position: 2, name: content.type === "knowledge" ? "Knowledge Hub" : "Blog", item: content.type === "knowledge" ? `${baseUrl}/knowledge-hub` : `${baseUrl}/blog` },
          { "@type": "ListItem", position: 3, name: titleText, item: content.type === "knowledge" ? `${baseUrl}/knowledge-hub#${slug}` : `${baseUrl}/blog/${slug}` },
        ],
      },
      faq: content.type === "knowledge" ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: titleText, acceptedAnswer: { "@type": "Answer", text: shortAnswer } }] } : null,
      organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Kailash Mahadev Temple Agra",
        url: baseUrl,
      },
      author: {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Kailash Mahadev Temple Agra",
      },
      webpage: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: titleText,
        url: content.type === "knowledge" ? `${baseUrl}/knowledge-hub#${slug}` : `${baseUrl}/blog/${slug}`,
        description: seo.seo_description,
        inLanguage: "en",
      },
      image_object: {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        url: `${baseUrl}/icons/icon-512x512.png`,
        caption: imageAlt,
        alt: imageAlt,
      },
      search_action: {
        "@context": "https://schema.org",
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/knowledge-hub?query={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    reading_time_minutes: blogMetadata.reading_time_minutes,
    word_count: blogMetadata.word_count,
    table_of_contents: blogMetadata.table_of_contents,
    related_articles: blogMetadata.internal_links,
    previous_article: null,
    next_article: null,
    internal_links: blogMetadata.internal_links,
    external_link_attributes: [{ rel: "nofollow", target: "_blank" }],
    sitemap: {
      changefreq: "weekly",
      priority: "0.8",
    },
    rss_feed: {
      include: true,
      summary: shortAnswer,
    },
    last_modified: new Date().toISOString(),
    published_date: new Date().toISOString(),
    image_metadata: {
      alt_text: imageAlt,
      caption: titleText,
      width: 1200,
      height: 630,
      lazy_loading: true,
      cls_safe: true,
    },
    entity_metadata: {
      temple_entity: "Kailash Mahadev Temple Agra",
      location_entity: "Agra, Uttar Pradesh",
      festival_entity: "Shivaratri",
      puja_entity: "Puja Booking",
      deity_entity: "Shiva",
      prasad_entity: "Prasad",
      aarti_entity: "Aarti",
    },
    topic_cluster: {
      primary_topic: titleText,
      related_topics: entityContext.slice(0, 4).map((entity) => entity.name),
      relationship_summary: "Temple content is linked to rituals, darshan, and devotee guidance.",
    },
    knowledge_graph: blogMetadata.knowledge_graph,
    context_blocks: blogMetadata.context_blocks,
    question_blocks: content.type === "knowledge" ? [{ question: titleText, answer: shortAnswer }] : [],
    answer_blocks: content.type === "knowledge" ? [{ question: titleText, answer: shortAnswer }] : [],
    voice_search: content.type === "knowledge" ? [{ question: titleText, answer: shortAnswer }] : [],
    featured_snippet_layout: content.type === "knowledge" ? { short_answer: shortAnswer, long_answer: shortAnswer } : null,
    people_also_ask: content.type === "knowledge" ? [{ question: titleText, answer: shortAnswer }] : [],
    ai_overview_friendly: true,
    semantic_headings: blogMetadata.semantic_headings,
    knowledge_metadata: knowledgeMetadata,
    intelligence,
    question_engine: questionEngine,
    smart_linking: smartLinking,
  };
};

export const buildKnowledgeContentMetadata = (content: {
  question?: string;
  answer?: string;
  category?: string;
  slug?: string;
  baseUrl?: string;
}) => {
  const plainText = toPlainText(content.answer || "");
  const answerFirstParagraph = plainText.slice(0, 220);
  const faqSections = [
    {
      question: content.question || "Common question",
      answer: answerFirstParagraph,
    },
  ];
  const canonicalUrl = `${content.baseUrl || "https://kailashmahadev.in"}/knowledge-hub${content.slug ? `#${content.slug}` : ""}`;
  const entityContext = buildEntityContext((content.answer || "") + " " + (content.question || ""));

  return {
    faq_sections: faqSections,
    answer_first_paragraph: answerFirstParagraph,
    canonical_url: canonicalUrl,
    question_variants: [content.question || "Common question"],
    speakable_structure: true,
    entity_first_content: true,
    semantic_html_structure: {
      article: true,
      section: true,
      header: true,
      figure: true,
      aside: false,
      nav: false,
    },
    context_blocks: [
      {
        title: "Temple Entity",
        summary: "The answer relates to Kailash Mahadev Temple Agra and its spiritual services.",
        related_terms: ["darshan", "puja", "aarti"],
      },
      ...entityContext.slice(0, 3).map((entity) => ({
        title: entity.type,
        summary: entity.description,
        related_terms: entity.related_terms,
      })),
    ],
    topic_cluster: {
      primary_topic: content.question || "Temple information",
      related_topics: entityContext.slice(0, 3).map((entity) => entity.name),
      relationship_summary: "The knowledge answer is connected to temple rituals and visitor information.",
    },
    ai_search_context: {
      summary: truncate(plainText, 220),
      entity_keywords: entityContext.slice(0, 3).map((entity) => entity.name).join(", "),
      answer_style: "direct",
    },
    related_entities: entityContext.slice(0, 3).map((entity) => ({
      name: entity.name,
      type: entity.type,
      description: entity.description,
    })),
    entity_metadata: {
      temple_entity: "Kailash Mahadev Temple Agra",
      location_entity: "Agra, Uttar Pradesh",
      festival_entity: "Shivaratri",
      puja_entity: "Puja Booking",
      deity_entity: "Shiva",
      prasad_entity: "Prasad",
      aarti_entity: "Aarti",
    },
  };
};
