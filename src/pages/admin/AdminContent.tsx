import { AdminContentManagement } from "@/components/admin/AdminContentManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3 } from "lucide-react";

export default function AdminContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Edit3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Content Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage homepage hero section, statistics, and announcements without coding
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <AdminContentManagement />
        </CardContent>
      </Card>
    </div>
  );
}
