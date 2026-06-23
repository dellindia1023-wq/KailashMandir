import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPriestsTable } from "@/components/admin/AdminPriestsTable";

const AdminPriests = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Manage Priests</CardTitle>
      <CardDescription>Add priest accounts and manage temple priests</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminPriestsTable />
    </CardContent>
  </Card>
);

export default AdminPriests;
