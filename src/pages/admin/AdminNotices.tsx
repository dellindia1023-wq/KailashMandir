import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNoticesTable } from "@/components/admin/AdminNoticesTable";

const AdminNotices = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Notice Board</CardTitle>
      <CardDescription>Manage temple announcements visible to all devotees</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminNoticesTable />
    </CardContent>
  </Card>
);

export default AdminNotices;
