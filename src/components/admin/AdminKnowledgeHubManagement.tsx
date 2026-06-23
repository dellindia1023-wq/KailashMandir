import { useState } from "react";
import { useKnowledgeArticles, useCreateKnowledgeArticle, useUpdateKnowledgeArticle, useDeleteKnowledgeArticle } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeArticle } from "@/hooks/useBlog";

export const AdminKnowledgeHubManagement = () => {
  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles();
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    seo_title: "",
    seo_description: "",
    seo_keywords_field: "",
    search_keywords: "",
    is_featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingArticle) {
      await updateArticle.mutateAsync({
        ...editingArticle,
        ...formData,
      });
    } else {
      await createArticle.mutateAsync({
        ...formData,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Hub Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage FAQ/knowledge articles</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>{editingArticle ? "Edit Article" : "Create New Knowledge Article"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Darshan, Puja, Location, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Question"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Detailed answer"
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">SEO Settings</h4>
                
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    placeholder={`${formData.question} | Kailash Mahadev Temple`}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.seo_title.length} / 60 (recommended)
                  </p>
                </div>

                <div className="mt-3">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                    placeholder="Meta description for search results..."
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.seo_description.length} / 160 (recommended)
                  </p>
                </div>

                <div className="mt-3">
                  <Label htmlFor="seo_keywords_field">SEO Keywords</Label>
                  <Input
                    id="seo_keywords_field"
                    value={formData.seo_keywords_field}
                    onChange={(e) => setFormData({ ...formData, seo_keywords_field: e.target.value })}
                    placeholder="Comma-separated keywords"
                    className="mt-1"
                  />
                </div>

                <div className="mt-3">
                  <Label htmlFor="search_keywords">Search Keywords</Label>
                  <Input
                    id="search_keywords"
                    value={formData.search_keywords}
                    onChange={(e) => setFormData({ ...formData, search_keywords: e.target.value })}
                    placeholder="Additional search terms"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Featured Article</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={createArticle.isPending || updateArticle.isPending}>
                  {createArticle.isPending || updateArticle.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editingArticle ? "Update Article" : "Create Article"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div className="space-y-2">
        {articlesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : articles && articles.length > 0 ? (
          articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{article.question}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.answer}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.view_count}
                      </span>
                      <span>{article.category}</span>
                      {article.is_featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(article)}
                      disabled={createArticle.isPending || updateArticle.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                      disabled={deleteArticle.isPending}
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
              No knowledge articles yet. Create your first article!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
