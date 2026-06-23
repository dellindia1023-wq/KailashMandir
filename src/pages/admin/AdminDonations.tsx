import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDonationsTable } from "@/components/admin/AdminDonationsTable";

const AdminDonations = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Donations & Revenue</CardTitle>
      <CardDescription>View all donations, revenue analytics, and donor activity</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminDonationsTable />
    </CardContent>
  </Card>
);

export default AdminDonations;
