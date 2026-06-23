import { AdminBlogManagement } from "@/components/admin/AdminBlogManagement";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function AdminBlogs() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Blog Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage blog posts with full SEO optimization
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <AdminBlogManagement />
        </CardContent>
      </Card>
    </div>
  );
}
