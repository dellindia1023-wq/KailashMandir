import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, LayoutDashboard, Calendar, BookOpen, ShieldCheck,
  Users, IndianRupee, TrendingUp, LogOut, Heart, Image, Megaphone, CalendarDays,
  Settings, Clock
} from "lucide-react";
import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";
import { AdminPujasTable } from "@/components/admin/AdminPujasTable";
import { AdminPriestsTable } from "@/components/admin/AdminPriestsTable";
import { AdminDonationsTable } from "@/components/admin/AdminDonationsTable";
import { AdminGalleryTable } from "@/components/admin/AdminGalleryTable";
import { AdminNoticesTable } from "@/components/admin/AdminNoticesTable";
import { AdminEventsTable } from "@/components/admin/AdminEventsTable";
import { AdminContentManagement } from "@/components/admin/AdminContentManagement";
import DarshanScheduleManager from "@/components/admin/DarshanScheduleManager";
import { toast } from "sonner";

interface DashboardStats {
  totalPujas: number;
  totalBookings: number;
  totalRevenue: number;
  totalPriests: number;
  paidBookings: number;
  pendingBookings: number;
}

const Admin = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPujas: 0, totalBookings: 0, totalRevenue: 0,
    totalPriests: 0, paidBookings: 0, pendingBookings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // These are now handled by synchronous Navigate below

  useEffect(() => {
    if (isAdmin && user) fetchStats();
  }, [isAdmin, user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [pujasRes, bookingsRes, priestsRes] = await Promise.all([
        supabase.from("pujas").select("id", { count: "exact", head: true }),
        supabase.from("puja_bookings").select("amount, payment_status"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "priest"),
      ]);

      const bookings = bookingsRes.data || [];
      const paidBookings = bookings.filter(b => b.payment_status === "paid");
      const pendingBookings = bookings.filter(b => b.payment_status === "pending");
      const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.amount), 0);

      setStats({
        totalPujas: pujasRes.count || 0,
        totalBookings: bookings.length,
        totalRevenue,
        totalPriests: priestsRes.count || 0,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-saffron flex items-center justify-center glow-saffron">
                <ShieldCheck className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    Temple Admin
                  </h1>
                  <Badge className="bg-primary/10 text-primary">Admin</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Manage pujas, bookings, priests & temple operations
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="text-destructive border-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {statsLoading ? "—" : stats.totalPujas}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active Pujas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{stats.pendingBookings} pending</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {statsLoading ? "—" : stats.totalBookings}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Bookings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{stats.paidBookings} paid</Badge>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {statsLoading ? "—" : `₹${stats.totalRevenue.toLocaleString("en-IN")}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-saffron/10 to-gold/5 border-saffron/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-saffron/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-saffron" />
                  </div>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {statsLoading ? "—" : stats.totalPriests}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Registered Priests</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="flex flex-wrap w-full max-w-5xl gap-1">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Content Management
              </TabsTrigger>
              <TabsTrigger value="darshan" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Darshan Timings
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="pujas" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Pujas
              </TabsTrigger>
              <TabsTrigger value="priests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Priests
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Donations
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="notices" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Notices
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Homepage Content Management</CardTitle>
                  <CardDescription>
                    Manage homepage hero section, statistics, and announcements without coding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminContentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="darshan">
              <DarshanScheduleManager />
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">All Bookings</CardTitle>
                  <CardDescription>
                    View all puja bookings, assign priests, and track payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminBookingsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pujas">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Manage Pujas</CardTitle>
                  <CardDescription>
                    Add, edit, or remove puja offerings from the catalog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPujasTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priests">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Manage Priests</CardTitle>
                  <CardDescription>
                    Add priest accounts and manage temple priests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPriestsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Donations & Revenue</CardTitle>
                  <CardDescription>
                    View all donations, revenue analytics, and donor activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminDonationsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Event Management</CardTitle>
                  <CardDescription>
                    Create, edit, and manage temple events and festivals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminEventsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notices">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Notice Board</CardTitle>
                  <CardDescription>
                    Manage temple announcements visible to all devotees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminNoticesTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Photo Gallery</CardTitle>
                  <CardDescription>
                    Upload, manage, and organize temple gallery photos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminGalleryTable />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
