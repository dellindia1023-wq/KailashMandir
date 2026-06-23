import { AdminKnowledgeHubManagement } from "@/components/admin/AdminKnowledgeHubManagement";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function AdminKnowledgeHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Knowledge Hub</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage FAQ and knowledge articles
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <AdminKnowledgeHubManagement />
        </CardContent>
      </Card>
    </div>
  );
}
