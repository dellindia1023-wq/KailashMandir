import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, Eye, Search } from "lucide-react";
import {
  useBlogs,
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  useBlogCategories,
  generateSlug,
  initializeBlogCategories,
  Blog,
} from "@/hooks/useBlog";

export const AdminBlogs = () => {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("published");

  // Initialize categories on mount
  useEffect(() => {
    initializeBlogCategories();
  }, []);

  const { data: blogs, isLoading } = useBlogs();
  const { data: categories } = useBlogCategories();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  const [formData, setFormData] = useState<Partial<Blog>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category_id: "",
    status: "draft",
    is_featured: false,
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "title") {
      setFormData({ ...formData, title: value, slug: generateSlug(value) });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "status") {
      setFormData({ ...formData, [name]: value as "draft" | "published" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingBlog) {
        await updateBlog.mutateAsync({ id: editingBlog.id, ...formData });
      } else {
        await createBlog.mutateAsync(formData as Blog);
      }

      resetForm();
      setIsEditing(false);
      setActiveTab("list");
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      category_id: "",
      status: "draft",
      is_featured: false,
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
    });
    setEditingBlog(null);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData(blog);
    setIsEditing(true);
    setActiveTab("create");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlog.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete blog");
    }
  };

  const filteredBlogs = blogs?.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.slug.includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || blog.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Blogs</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            New Blog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4" />}
            />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blogs List */}
          <div className="grid gap-4">
            {filteredBlogs?.map((blog) => (
              <Card key={blog.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{blog.title}</h3>
                        <Badge variant={blog.status === "published" ? "default" : "secondary"}>
                          {blog.status}
                        </Badge>
                        {blog.is_featured && <Badge variant="outline">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{blog.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Views: {blog.view_count}</span>
                        <span>
                          {new Date(blog.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(blog)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(blog.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</CardTitle>
              <CardDescription>
                {editingBlog ? "Update blog post details" : "Create a new blog post"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Blog title"
                    className="mt-2"
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="blog-slug"
                    className="mt-2"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the blog"
                    rows={2}
                    className="mt-2"
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Blog content"
                    rows={8}
                    className="mt-2"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id || ""}
                    onValueChange={(v) => handleSelectChange("category_id", v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categories && categories.length === 0 && "Please create categories first"}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleSelectChange("status", v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SEO Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">SEO Optimization</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        name="seo_title"
                        value={formData.seo_title}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Textarea
                        id="seo_description"
                        name="seo_description"
                        value={formData.seo_description}
                        onChange={handleInputChange}
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_keywords">SEO Keywords</Label>
                      <Input
                        id="seo_keywords"
                        name="seo_keywords"
                        value={formData.seo_keywords}
                        onChange={handleInputChange}
                        placeholder="keyword1, keyword2, keyword3"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBlog.isPending || updateBlog.isPending}>
                    {createBlog.isPending || updateBlog.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {editingBlog ? "Update Blog" : "Create Blog"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Blog</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this blog? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
