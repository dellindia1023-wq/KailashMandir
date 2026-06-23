import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DarshanScheduleManager from "@/components/admin/DarshanScheduleManager";
import AartiTimingsManager from "@/components/admin/AartiTimingsManager";
import { Calendar, Music } from "lucide-react";

const AdminDarshanSchedule = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Temple Timings Management</CardTitle>
        <CardDescription>
          Manage darshan and aarti schedules. Changes appear immediately on the website.
        </CardDescription>
      </CardHeader>
    </Card>

    <Tabs defaultValue="darshan" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="darshan" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Darshan Schedule
        </TabsTrigger>
        <TabsTrigger value="aarti" className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          Aarti Timings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="darshan">
        <DarshanScheduleManager />
      </TabsContent>

      <TabsContent value="aarti">
        <AartiTimingsManager />
      </TabsContent>
    </Tabs>
  </div>
);

export default AdminDarshanSchedule;
