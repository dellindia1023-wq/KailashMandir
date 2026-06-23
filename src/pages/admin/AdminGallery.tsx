import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGalleryTable } from "@/components/admin/AdminGalleryTable";

const AdminGallery = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-heading">Photo Gallery</CardTitle>
      <CardDescription>Upload, manage, and organize temple gallery photos</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminGalleryTable />
    </CardContent>
  </Card>
);

export default AdminGallery;
