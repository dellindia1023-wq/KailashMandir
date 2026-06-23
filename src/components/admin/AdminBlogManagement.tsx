import { useState } from "react";
import { useBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog, useBlogCategories, generateSlug } from "@/hooks/useBlogSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Blog } from "@/hooks/useBlogSystem";

export const AdminBlogManagement = () => {
  const { data: blogs, isLoading: blogsLoading } = useBlogs(true);
  const { data: categories } = useBlogCategories();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category_id: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    status: "draft" as const,
    is_featured: false,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
      seo_title: title,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const blogData = {
      ...formData,
      published_at: formData.status === "published" ? new Date().toISOString() : null,
    };

    if (editingBlog) {
      await updateBlog.mutateAsync({ ...editingBlog, ...blogData });
    } else {
      await createBlog.mutateAsync(blogData as any);
    }

    resetForm();
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
      status: blog.status,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <p className="text-muted-foreground mt-1">Create, edit, and manage blog posts</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Blog
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Blog title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="blog-slug"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
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
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the blog"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Blog content"
                  rows={8}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder="SEO title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="Meta description (155 characters)"
                  maxLength={155}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="seo_keywords">SEO Keywords</Label>
                <Input
                  id="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  placeholder="Comma-separated keywords"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Featured Blog</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={createBlog.isPending || updateBlog.isPending}>
                  {createBlog.isPending || updateBlog.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blogs List */}
      <div className="space-y-2">
        {blogsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : blogs && blogs.length > 0 ? (
          blogs.map((blog) => (
            <Card key={blog.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{blog.title}</h3>
                      <Badge variant={blog.status === "published" ? "default" : "secondary"}>
                        {blog.status}
                      </Badge>
                      {blog.is_featured && <Badge className="bg-gold">Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{blog.slug}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Views: {blog.view_count}</span>
                      <span>
                        {blog.category?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(blog)}
                      disabled={createBlog.isPending || updateBlog.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(blog.id)}
                      disabled={deleteBlog.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No blogs yet. Create your first blog post!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
