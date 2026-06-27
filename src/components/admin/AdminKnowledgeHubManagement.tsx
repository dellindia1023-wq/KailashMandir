import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useKnowledgeArticles, useCreateKnowledgeArticle, useUpdateKnowledgeArticle, useDeleteKnowledgeArticle } from "@/hooks/useBlog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye, ImageIcon, VideoIcon, Link2, Sparkles, Heading1, Bold, Italic, List, Quote, Table2, Youtube } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeArticle } from "@/hooks/useBlog";
import { MarkdownContent } from "@/components/MarkdownContent";
import { analyzeContentQuality } from "@/lib/contentSeo";

export const AdminKnowledgeHubManagement = () => {
  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles();
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const featuredVideoInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const inlineVideoInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    seo_title: "",
    seo_description: "",
    seo_keywords_field: "",
    search_keywords: "",
    featured_image_url: "",
    featured_video_url: "",
    image_alt: "",
    is_featured: false,
  });

  const analysis = useMemo(
    () =>
      analyzeContentQuality({
        title: formData.question,
        content: formData.answer,
        excerpt: formData.seo_description,
        slug: formData.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        seo_keywords_field: formData.seo_keywords_field,
        category: formData.category,
        type: "knowledge",
      }),
    [formData.answer, formData.category, formData.question, formData.seo_description, formData.seo_keywords_field, formData.seo_title]
  );

  const insertAtCursor = (snippet: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      setFormData((prev) => ({ ...prev, answer: `${prev.answer}${snippet}` }));
      return;
    }

    const start = textarea.selectionStart ?? formData.answer.length;
    const end = textarea.selectionEnd ?? formData.answer.length;
    const nextContent = `${formData.answer.slice(0, start)}${snippet}${formData.answer.slice(end)}`;

    setFormData((prev) => ({ ...prev, answer: nextContent }));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + snippet.length;
      textarea.selectionStart = cursorPosition;
      textarea.selectionEnd = cursorPosition;
    });
  };

  const uploadFeaturedImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `knowledge/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("content").upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("content").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleMediaUpload = async (file: File | undefined, kind: "image" | "video", mode: "featured" | "inline" = "featured") => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFeaturedImage(file);
      if (mode === "inline") {
        const snippet = kind === "image"
          ? `\n\n![Alt text](${url} "Uploaded image")\n`
          : `\n\n[Video](${url})\n`;
        insertAtCursor(snippet);
        toast.success(`${kind === "image" ? "Inline image" : "Inline video"} inserted successfully`);
      } else if (kind === "image") {
        setFormData((prev) => ({ ...prev, featured_image_url: url }));
        toast.success("Featured image uploaded successfully");
      } else {
        setFormData((prev) => ({ ...prev, featured_video_url: url }));
        toast.success("Featured video uploaded successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error(`${kind === "image" ? "Image" : "Video"} upload failed`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleMediaUpload(file, file.type.startsWith("video/") ? "video" : "image", "inline");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      ...formData,
      featured_image_url: formData.featured_image_url || null,
      image_alt: formData.image_alt || null,
      answer: formData.answer,
    };

    if (editingArticle) {
      await updateArticle.mutateAsync({
        ...editingArticle,
        ...payload,
      });
    } else {
      await createArticle.mutateAsync({
        ...payload,
        view_count: 0,
      } as any);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      seo_title: "",
      seo_description: "",
      seo_keywords_field: "",
      search_keywords: "",
      featured_image_url: "",
      featured_video_url: "",
      image_alt: "",
      is_featured: false,
    });
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setFormData({
      question: article.question,
      answer: article.answer,
      category: article.category,
      seo_title: article.seo_title || "",
      seo_description: article.seo_description || "",
      seo_keywords_field: article.seo_keywords_field || "",
      search_keywords: article.search_keywords || "",
      featured_image_url: article.featured_image_url || "",
      featured_video_url: (article as any).featured_video_url || "",
      image_alt: (article as any).image_alt || "",
      is_featured: article.is_featured,
    });
    setShowForm(true);
  };

  const handleDelete = (articleId: string) => {
    if (confirm("Are you sure you want to delete this knowledge article?")) {
      deleteArticle.mutate(articleId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Hub Management</h2>
          <p className="mt-1 text-muted-foreground">Create and manage FAQ/knowledge articles with a polished CMS editor</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50/70">
          <CardHeader>
            <CardTitle>{editingArticle ? "Edit Article" : "Create New Knowledge Article"}</CardTitle>
            <CardDescription>Write in Markdown, enrich with media, and review live preview and SEO guidance.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input id="category" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} placeholder="e.g., Darshan, Puja, Location, etc." className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="question">Question *</Label>
                    <Input id="question" value={formData.question} onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))} placeholder="Question" className="mt-1" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Label htmlFor="answer">Answer *</Label>
                      <span className="text-xs text-muted-foreground">Supports Markdown headings, lists, quotes, tables, links, images and videos.</span>
                    </div>
                    <div className="overflow-hidden rounded-lg border bg-background">
                      <div className="flex flex-wrap gap-2 border-b bg-muted/30 p-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n## Answer section\n\n")}> <Heading1 className="mr-2 h-4 w-4" />Heading</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("**Important**")}> <Bold className="mr-2 h-4 w-4" />Bold</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("*emphasis*")}> <Italic className="mr-2 h-4 w-4" />Italic</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n- Point one\n- Point two\n")}> <List className="mr-2 h-4 w-4" />List</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n> Shared insight\n")}> <Quote className="mr-2 h-4 w-4" />Quote</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Link text](https://example.com)\n")}> <Link2 className="mr-2 h-4 w-4" />Link</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n")}> <Table2 className="mr-2 h-4 w-4" />Table</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Watch on YouTube](https://www.youtube.com/watch?v=VIDEO_ID)\n")}> <Youtube className="mr-2 h-4 w-4" />YouTube</Button>
                      </div>
                      <Textarea id="answer" ref={editorRef} value={formData.answer} onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))} placeholder="Write the answer in Markdown..." rows={14} className="min-h-[320px] rounded-none border-0 font-mono text-sm focus-visible:ring-0" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input id="seo_title" value={formData.seo_title} onChange={(e) => setFormData((prev) => ({ ...prev, seo_title: e.target.value }))} placeholder={`${formData.question || "Knowledge article"} | Kailash Mahadev Temple`} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea id="seo_description" value={formData.seo_description} onChange={(e) => setFormData((prev) => ({ ...prev, seo_description: e.target.value }))} placeholder="Meta description for search results..." rows={3} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords_field">SEO Keywords</Label>
                    <Input id="seo_keywords_field" value={formData.seo_keywords_field} onChange={(e) => setFormData((prev) => ({ ...prev, seo_keywords_field: e.target.value }))} placeholder="Comma-separated keywords" className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="search_keywords">Search Keywords</Label>
                    <Input id="search_keywords" value={formData.search_keywords} onChange={(e) => setFormData((prev) => ({ ...prev, search_keywords: e.target.value }))} placeholder="Additional search terms" className="mt-1" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="featured_image_url">Featured Image URL</Label>
                      <Input id="featured_image_url" value={formData.featured_image_url} onChange={(e) => setFormData((prev) => ({ ...prev, featured_image_url: e.target.value }))} placeholder="https://.../image.jpg" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="image_alt">Image Alt Text</Label>
                      <Input id="image_alt" value={formData.image_alt} onChange={(e) => setFormData((prev) => ({ ...prev, image_alt: e.target.value }))} placeholder="Describe the featured image" className="mt-1" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                      <ImageIcon className="h-4 w-4" />
                      <span>Upload featured image</span>
                      <input ref={featuredImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleMediaUpload(e.target.files?.[0], "image", "featured")} />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                      <VideoIcon className="h-4 w-4" />
                      <span>Upload featured video</span>
                      <input ref={featuredVideoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => void handleMediaUpload(e.target.files?.[0], "video", "featured")} />
                    </label>
                  </div>

                  <div
                    className={`rounded-lg border-2 border-dashed p-4 transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border/70"}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Add media for the article</p>
                        <p className="text-sm text-muted-foreground">Upload a featured image or video, or drop an image into the content body.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                          <ImageIcon className="h-4 w-4" />
                          <span>Insert image</span>
                          <input ref={inlineImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleMediaUpload(e.target.files?.[0], "image", "inline")} />
                        </label>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                          <VideoIcon className="h-4 w-4" />
                          <span>Insert video</span>
                          <input ref={inlineVideoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => void handleMediaUpload(e.target.files?.[0], "video", "inline")} />
                        </label>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n![Alt text](https://example.com/image.jpg \"Caption\")\n")}>Insert inline image</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Watch on YouTube](https://www.youtube.com/watch?v=VIDEO_ID)\n")}>Insert YouTube embed</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Featured video](https://example.com/video.mp4)\n")}>Insert video link</Button>
                    </div>
                    {isUploading && <p className="mt-3 text-sm text-muted-foreground">Uploading media…</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                      <span>Featured Article</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4" />
                        Live Preview
                      </CardTitle>
                      <CardDescription>Preview the answer as it will appear in the public knowledge hub.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.featured_image_url && <img src={formData.featured_image_url} alt={formData.image_alt || formData.question || "Featured"} className="h-48 w-full rounded-lg object-cover" />}
                      {formData.featured_video_url && (
                        <div className="overflow-hidden rounded-lg border bg-black/5">
                          {formData.featured_video_url.includes("youtube") || formData.featured_video_url.includes("youtu.be") ? (
                            <iframe src={formData.featured_video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")} className="aspect-video w-full" title="Featured video" allowFullScreen />
                          ) : (
                            <video src={formData.featured_video_url} controls className="aspect-video w-full object-cover" />
                          )}
                        </div>
                      )}
                      <div className="rounded-lg border bg-background p-4">
                        <h3 className="text-xl font-semibold">{formData.question || "Untitled question"}</h3>
                        <div className="prose prose-sm mt-4 max-w-none">
                          <MarkdownContent content={formData.answer || "_Start writing to preview the article._"} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Link2 className="h-4 w-4" />
                        SEO & Quality Panel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">SEO score</p>
                          <p className="mt-1 text-lg font-semibold">{analysis.seoScore}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">GEO score</p>
                          <p className="mt-1 text-lg font-semibold">{analysis.geoScore}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">AEO score</p>
                          <p className="mt-1 text-lg font-semibold">{analysis.aeoScore}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Word count</p>
                          <p className="mt-1 text-lg font-semibold">{analysis.wordCount}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reading time</p>
                          <p className="mt-1 text-sm">{analysis.readingTime} min</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Headings</p>
                          <p className="mt-1 text-sm">{analysis.headingCount}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Images / videos</p>
                          <p className="mt-1 text-sm">{analysis.imageCount} / {analysis.videoCount}</p>
                        </div>
                        <div className="rounded-md border bg-background/70 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Internal / external links</p>
                          <p className="mt-1 text-sm">{analysis.internalLinkCount} / {analysis.externalLinkCount}</p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-md border bg-background/70 p-3 text-sm">
                        <p><span className="font-medium">FAQ count:</span> {analysis.faqCount}</p>
                        <p><span className="font-medium">Schema status:</span> {analysis.schemaStatus}</p>
                        <p><span className="font-medium">Slug preview:</span> {analysis.slugPreview}</p>
                        <p><span className="font-medium">Canonical:</span> {analysis.canonicalPreview}</p>
                        <p><span className="font-medium">Meta preview:</span> {analysis.metaPreview}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={resetForm} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={createArticle.isPending || updateArticle.isPending || isUploading}>
                  {createArticle.isPending || updateArticle.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingArticle ? "Update Article" : "Create Article"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {articlesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : articles && articles.length > 0 ? (
          articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{article.question}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.answer}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.view_count}
                      </span>
                      <span>{article.category}</span>
                      {article.is_featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(article)} disabled={createArticle.isPending || updateArticle.isPending}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)} disabled={deleteArticle.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">No knowledge articles yet. Create your first article!</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
