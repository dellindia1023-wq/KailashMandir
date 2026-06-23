import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Edit2, Trash2, Search } from "lucide-react";
import {
  useKnowledgeArticles,
  useCreateKnowledgeArticle,
  useUpdateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  KnowledgeArticle,
} from "@/hooks/useBlog";

const KNOWLEDGE_CATEGORIES = [
  "Rituals & Ceremonies",
  "Spiritual Practices",
  "Temple Information",
  "Puja & Offerings",
  "General FAQ",
  "Darshan & Timings",
];

export const AdminKnowledgeHub = () => {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: articles, isLoading } = useKnowledgeArticles();
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({
    question: "",
    answer: "",
    category: "",
    search_keywords: "",
    seo_title: "",
    seo_description: "",
    seo_keywords_field: "",
    is_featured: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({ ...formData, category });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle.mutateAsync({ id: editingArticle.id, ...formData });
      } else {
        await createArticle.mutateAsync(formData as KnowledgeArticle);
      }

      resetForm();
      setIsEditing(false);
      setActiveTab("list");
    } catch (error: any) {
      toast.error(error.message || "Failed to save article");
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      search_keywords: "",
      seo_title: "",
      seo_description: "",
      seo_keywords_field: "",
      is_featured: false,
    });
    setEditingArticle(null);
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setFormData(article);
    setIsEditing(true);
    setActiveTab("create");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete article");
    }
  };

  const filteredArticles = articles?.filter((article) => {
    return (
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
          <TabsTrigger value="list">Knowledge Articles</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            icon={<Search className="h-4 w-4" />}
          />

          {/* Articles List */}
          <div className="grid gap-4">
            {filteredArticles?.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{article.question}</h3>
                        {article.is_featured && <Badge variant="outline">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {article.answer}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">{article.category}</Badge>
                        <span>Views: {article.view_count}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(article.id)}
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
              <CardTitle>
                {editingArticle ? "Edit Article" : "Create New Article"}
              </CardTitle>
              <CardDescription>
                {editingArticle ? "Update knowledge article" : "Create a new knowledge article"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question */}
                <div>
                  <Label htmlFor="question">Question *</Label>
                  <Input
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="What is the question?"
                    className="mt-2"
                  />
                </div>

                {/* Answer */}
                <div>
                  <Label htmlFor="answer">Answer *</Label>
                  <Textarea
                    id="answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed answer"
                    rows={6}
                    className="mt-2"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label>Category *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {KNOWLEDGE_CATEGORIES.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={formData.category === cat ? "default" : "outline"}
                        onClick={() => handleCategoryChange(cat)}
                        className="justify-start"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search Keywords */}
                <div>
                  <Label htmlFor="search_keywords">Search Keywords</Label>
                  <Input
                    id="search_keywords"
                    name="search_keywords"
                    value={formData.search_keywords}
                    onChange={handleInputChange}
                    placeholder="keyword1, keyword2, keyword3"
                    className="mt-2"
                  />
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
                      <Label htmlFor="seo_keywords_field">SEO Keywords</Label>
                      <Input
                        id="seo_keywords_field"
                        name="seo_keywords_field"
                        value={formData.seo_keywords_field}
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
                  <Button
                    type="submit"
                    disabled={createArticle.isPending || updateArticle.isPending}
                  >
                    {createArticle.isPending || updateArticle.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {editingArticle ? "Update Article" : "Create Article"}
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
          <AlertDialogTitle>Delete Article</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this article? This action cannot be undone.
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
