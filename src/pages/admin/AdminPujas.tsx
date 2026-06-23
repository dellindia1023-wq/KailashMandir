import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPujasTable } from "@/components/admin/AdminPujasTable";

const AdminPujas = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Manage Pujas</CardTitle>
      <CardDescription>Add, edit, or remove puja offerings from the catalog</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminPujasTable />
    </CardContent>
  </Card>
);

export default AdminPujas;
