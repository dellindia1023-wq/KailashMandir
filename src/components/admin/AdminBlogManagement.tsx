import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog, useBlogCategories, generateSlug, initializeBlogCategories } from "@/hooks/useBlogSystem";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, ImageIcon, VideoIcon, Link2, Sparkles, Heading1, Bold, Italic, List, Quote, Table2, Youtube } from "lucide-react";
import { toast } from "sonner";
import type { Blog } from "@/hooks/useBlogSystem";
import { MarkdownContent } from "@/components/MarkdownContent";
import { analyzeContentQuality } from "@/lib/contentSeo";

type BlogStatus = Blog["status"];

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  featured_image_url: string;
  featured_video_url: string;
  featured_image_caption: string;
  image_alt: string;
  status: BlogStatus;
  is_featured: boolean;
};

export const AdminBlogManagement = () => {
  const { data: blogs, isLoading: blogsLoading } = useBlogs(true);
  const { data: categories } = useBlogCategories();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      const created = await initializeBlogCategories();
      if (created) {
        queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      }
    })();
  }, [queryClient]);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const featuredVideoInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const inlineVideoInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<BlogFormState>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category_id: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    featured_image_url: "",
    featured_video_url: "",
    featured_image_caption: "",
    image_alt: "",
    status: "draft",
    is_featured: false,
  });

  const analysis = useMemo(
    () =>
      analyzeContentQuality({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        seo_keywords: formData.seo_keywords,
        category: categories?.find((cat) => cat.id === formData.category_id)?.name,
        type: "blog",
      }),
    [categories, formData.content, formData.excerpt, formData.seo_description, formData.seo_keywords, formData.seo_title, formData.slug, formData.title, formData.category_id]
  );

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      seo_title: title,
    }));
  };

  const insertAtCursor = (snippet: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      setFormData((prev) => ({ ...prev, content: `${prev.content}${snippet}` }));
      return;
    }

    const start = textarea.selectionStart ?? formData.content.length;
    const end = textarea.selectionEnd ?? formData.content.length;
    const nextContent = `${formData.content.slice(0, start)}${snippet}${formData.content.slice(end)}`;

    setFormData((prev) => ({ ...prev, content: nextContent }));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + snippet.length;
      textarea.selectionStart = cursorPosition;
      textarea.selectionEnd = cursorPosition;
    });
  };

  const uploadMediaToStorage = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("content").upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("content").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleMediaUpload = async (file: File | undefined, target: "image" | "video", mode: "featured" | "inline" = "featured") => {
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaToStorage(file, target === "image" ? "blogs/images" : "blogs/videos");
      if (mode === "inline") {
        const snippet = target === "image"
          ? `\n\n![Alt text](${url} "Uploaded image")\n`
          : `\n\n[Video](${url})\n`;
        insertAtCursor(snippet);
        toast.success(`${target === "image" ? "Inline image" : "Inline video"} inserted successfully`);
      } else if (target === "image") {
        setFormData((prev) => ({ ...prev, featured_image_url: url }));
        toast.success("Featured image uploaded successfully");
      } else {
        setFormData((prev) => ({ ...prev, featured_video_url: url }));
        toast.success("Featured video uploaded successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error(`${target === "image" ? "Image" : "Video"} upload failed`);
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

    if (!formData.title || !formData.content || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const contentWithMedia = formData.featured_video_url
      ? `${formData.content}\n\n[Featured video](${formData.featured_video_url})`
      : formData.content;

    const { featured_video_url, featured_image_caption, ...restFormData } = formData;
    const blogData = {
      ...restFormData,
      content: contentWithMedia,
      featured_image_url: formData.featured_image_url || null,
      image_alt: formData.image_alt || null,
      published_at: formData.status === "published" ? new Date().toISOString() : null,
    };

    try {
      if (editingBlog) {
        await updateBlog.mutateAsync({ ...editingBlog, ...blogData });
      } else {
        await createBlog.mutateAsync(blogData as any);
      }
      resetForm();
    } catch (error) {
      console.error("Blog save failed:", error);
      // Error toast is handled by mutation; keep form open for review.
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
      featured_image_url: "",
      featured_video_url: "",
      featured_image_caption: "",
      image_alt: "",
      status: "draft",
      is_featured: false,
    });
    setEditingBlog(null);
    setShowForm(false);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: blog.content,
      category_id: blog.category_id,
      seo_title: blog.seo_title || "",
      seo_description: blog.seo_description || "",
      seo_keywords: blog.seo_keywords || "",
      featured_image_url: blog.featured_image_url || "",
      featured_video_url: (blog as any).featured_video_url || "",
      featured_image_caption: (blog as any).featured_image_caption || "",
      image_alt: (blog as any).image_alt || "",
      status: blog.status as Blog["status"],
      is_featured: blog.is_featured,
    });
    setShowForm(true);
  };

  const handleDelete = (blogId: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      deleteBlog.mutate(blogId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <p className="mt-1 text-muted-foreground">Create, edit, and manage blog posts with a modern CMS workflow</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Blog
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/50 bg-background/90">
          <CardHeader>
            <CardTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</CardTitle>
            <CardDescription>Compose content, add media, and review live SEO quality without leaving the editor.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" value={formData.title} onChange={handleTitleChange} placeholder="Blog title" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input id="slug" name="slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="blog-slug" className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select id="category" name="category_id" value={formData.category_id} onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="">Select a category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief summary of the blog" rows={2} className="mt-1" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Label htmlFor="content">Content *</Label>
                      <span className="text-xs text-muted-foreground">Supports Markdown headings, lists, quotes, tables, links, images and videos.</span>
                    </div>
                    <div className="overflow-hidden rounded-lg border bg-background">
                      <div className="flex flex-wrap gap-2 border-b bg-muted/30 p-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n## Section heading\n\n")}> <Heading1 className="mr-2 h-4 w-4" />Heading</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("**bold text**")}> <Bold className="mr-2 h-4 w-4" />Bold</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("*italic text*")}> <Italic className="mr-2 h-4 w-4" />Italic</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n- Bullet point\n- Second point\n")}> <List className="mr-2 h-4 w-4" />List</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n> Shared insight\n")}> <Quote className="mr-2 h-4 w-4" />Quote</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Link text](https://example.com)\n")}> <Link2 className="mr-2 h-4 w-4" />Link</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n")}> <Table2 className="mr-2 h-4 w-4" />Table</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertAtCursor("\n\n[Watch on YouTube](https://www.youtube.com/watch?v=VIDEO_ID)\n")}> <Youtube className="mr-2 h-4 w-4" />YouTube</Button>
                      </div>
                      <Textarea id="content" name="content" ref={editorRef} value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} placeholder="Write your article in Markdown..." rows={16} className="min-h-[360px] rounded-none border-0 font-mono text-sm focus-visible:ring-0" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input id="seo_title" name="seo_title" value={formData.seo_title} onChange={(e) => setFormData((prev) => ({ ...prev, seo_title: e.target.value }))} placeholder="SEO title" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select id="status" name="status" value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as BlogStatus }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea id="seo_description" name="seo_description" value={formData.seo_description} onChange={(e) => setFormData((prev) => ({ ...prev, seo_description: e.target.value }))} placeholder="Meta description (155 characters)" maxLength={155} rows={2} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords">SEO Keywords</Label>
                    <Input id="seo_keywords" name="seo_keywords" value={formData.seo_keywords} onChange={(e) => setFormData((prev) => ({ ...prev, seo_keywords: e.target.value }))} placeholder="Comma-separated keywords" className="mt-1" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="featured_image_url">Featured Image URL</Label>
                      <Input id="featured_image_url" name="featured_image_url" value={formData.featured_image_url} onChange={(e) => setFormData((prev) => ({ ...prev, featured_image_url: e.target.value }))} placeholder="https://.../image.jpg" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="image_alt">Image Alt Text</Label>
                      <Input id="image_alt" name="image_alt" value={formData.image_alt} onChange={(e) => setFormData((prev) => ({ ...prev, image_alt: e.target.value }))} placeholder="Describe the featured image" className="mt-1" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="featured_video_url">Featured Video URL</Label>
                      <Input id="featured_video_url" name="featured_video_url" value={formData.featured_video_url} onChange={(e) => setFormData((prev) => ({ ...prev, featured_video_url: e.target.value }))} placeholder="https://.../video.mp4 or YouTube link" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="featured_image_caption">Featured Image Caption</Label>
                      <Input id="featured_image_caption" name="featured_image_caption" value={formData.featured_image_caption} onChange={(e) => setFormData((prev) => ({ ...prev, featured_image_caption: e.target.value }))} placeholder="Short caption for the featured image" className="mt-1" />
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
                        <p className="font-medium">Drag & drop media into the editor</p>
                        <p className="text-sm text-muted-foreground">Upload a featured image or video, or drop an image directly into the content body.</p>
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
                      <span>Featured Blog</span>
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
                      <CardDescription>Preview the article exactly as it will appear in the blog experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.featured_image_url && (
                        <img src={formData.featured_image_url} alt={formData.image_alt || formData.title || "Featured"} className="h-48 w-full rounded-lg object-cover" />
                      )}
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
                        <h3 className="text-xl font-semibold">{formData.title || "Untitled blog"}</h3>
                        {formData.excerpt ? <p className="mt-2 text-sm text-muted-foreground">{formData.excerpt}</p> : null}
                        <div className="prose prose-sm mt-4 max-w-none">
                          <MarkdownContent content={formData.content || "_Start writing to preview the article._"} />
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

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={resetForm} type="button" className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={createBlog.isPending || updateBlog.isPending || isUploading} className="w-full sm:w-auto">
                  {createBlog.isPending || updateBlog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {blogsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : blogs && blogs.length > 0 ? (
          blogs.map((blog) => (
            <Card key={blog.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">{blog.title}</h3>
                      <Badge variant={blog.status === "published" ? "default" : "secondary"}>{blog.status}</Badge>
                      {blog.is_featured && <Badge className="bg-gold">Featured</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{blog.slug}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>Views: {blog.view_count}</span>
                      <span>{blog.category?.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(blog)} disabled={createBlog.isPending || updateBlog.isPending}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(blog.id)} disabled={deleteBlog.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">No blogs yet. Create your first blog post!</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
