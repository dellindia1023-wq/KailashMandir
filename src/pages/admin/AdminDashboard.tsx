import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Calendar, IndianRupee, Users, TrendingUp, Loader2, Heart, Package, AlertTriangle, Crown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

interface DashboardStats {
  totalPujas: number;
  totalBookings: number;
  totalRevenue: number;
  totalPriests: number;
  paidBookings: number;
  pendingBookings: number;
  totalDonations: number;
  donationRevenue: number;
  lowStockItems: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--saffron))", "hsl(var(--gold))", "hsl(var(--maroon))", "#6366f1", "#06b6d4"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext<{ isSuperAdmin: boolean } | undefined>();
  const isSuperAdmin = outletContext?.isSuperAdmin ?? false;
  const [stats, setStats] = useState<DashboardStats>({
    totalPujas: 0, totalBookings: 0, totalRevenue: 0,
    totalPriests: 0, paidBookings: 0, pendingBookings: 0,
    totalDonations: 0, donationRevenue: 0, lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bookingsByMonth, setBookingsByMonth] = useState<any[]>([]);
  const [donationsByTier, setDonationsByTier] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [pujasRes, bookingsRes, priestsRes, donationsRes, inventoryRes] = await Promise.all([
        supabase.from("pujas").select("id", { count: "exact", head: true }),
        supabase.from("puja_bookings").select("amount, payment_status, booking_date, created_at"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "priest"),
        supabase.from("donations").select("amount, tier, status, created_at"),
        supabase.from("pooja_samagri").select("id, current_stock, min_stock_level"),
      ]);

      const bookings = bookingsRes.data || [];
      const paidBookings = bookings.filter(b => b.payment_status === "paid" || b.payment_status === "completed");
      const pendingBookings = bookings.filter(b => b.payment_status === "pending");
      const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.amount), 0);

      const donations = donationsRes.data || [];
      const paidDonations = donations.filter(d => d.status === "completed" || d.status === "paid");
      const donationRevenue = paidDonations.reduce((sum, d) => sum + Number(d.amount), 0);

      const inventory = inventoryRes.data || [];
      const lowStockItems = inventory.filter(i => Number(i.current_stock) <= Number(i.min_stock_level)).length;

      setStats({
        totalPujas: pujasRes.count || 0,
        totalBookings: bookings.length,
        totalRevenue,
        totalPriests: priestsRes.count || 0,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
        totalDonations: donations.length,
        donationRevenue,
        lowStockItems,
      });

      // Bookings by month (last 6 months)
      const monthMap: Record<string, number> = {};
      const revenueMap: Record<string, { bookings: number; donations: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthMap[key] = 0;
        revenueMap[key] = { bookings: 0, donations: 0 };
      }

      bookings.forEach(b => {
        const d = new Date(b.booking_date || b.created_at);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (key in monthMap) monthMap[key]++;
        if (key in revenueMap && (b.payment_status === "paid" || b.payment_status === "completed")) {
          revenueMap[key].bookings += Number(b.amount);
        }
      });

      donations.forEach(d => {
        const dt = new Date(d.created_at);
        const key = dt.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (key in revenueMap && (d.status === "completed" || d.status === "paid")) {
          revenueMap[key].donations += Number(d.amount);
        }
      });

      setBookingsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));
      setRevenueByMonth(Object.entries(revenueMap).map(([month, val]) => ({ month, ...val })));

      // Donations by tier
      const tierCounts: Record<string, number> = {};
      paidDonations.forEach(d => {
        tierCounts[d.tier] = (tierCounts[d.tier] || 0) + 1;
      });
      setDonationsByTier(Object.entries(tierCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), value
      })));

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            {isSuperAdmin && (
              <Badge className="bg-gold/20 text-gold border-gold/30">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">Overview of temple operations</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stats.totalPujas}</p>
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
            <p className="text-2xl font-heading font-bold text-foreground">{stats.totalBookings}</p>
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
              ₹{(stats.totalRevenue + stats.donationRevenue).toLocaleString("en-IN")}
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
            <p className="text-2xl font-heading font-bold text-foreground">{stats.totalPriests}</p>
            <p className="text-xs text-muted-foreground mt-1">Registered Priests</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xl font-heading font-bold">{stats.totalDonations}</p>
              <p className="text-xs text-muted-foreground">Donations (₹{stats.donationRevenue.toLocaleString("en-IN")})</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-heading font-bold">{stats.lowStockItems}</p>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>
        {stats.lowStockItems > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-5 flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {stats.lowStockItems} samagri item(s) below minimum stock level!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Booking Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Booking Trends (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donation Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Donations by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {donationsByTier.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donationsByTier}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {donationsByTier.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No donation data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Revenue Trends (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
              <Legend />
              <Line type="monotone" dataKey="bookings" name="Booking Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="donations" name="Donation Revenue" stroke="hsl(var(--gold))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
