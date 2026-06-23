import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminEventsTable } from "@/components/admin/AdminEventsTable";

const AdminEvents = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Event Management</CardTitle>
      <CardDescription>Create, edit, and manage temple events and festivals</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminEventsTable />
    </CardContent>
  </Card>
);

export default AdminEvents;
