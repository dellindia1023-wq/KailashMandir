import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";

const AdminBookings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">All Bookings</CardTitle>
      <CardDescription>View all puja bookings, assign priests, and track payments</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminBookingsTable />
    </CardContent>
  </Card>
);

export default AdminBookings;
