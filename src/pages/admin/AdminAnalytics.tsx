import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, IndianRupee, Calendar, Users, Loader2, BarChart3, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/exportCsv";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "12m";

interface StatsCard {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

export default function AdminAnalytics() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [donationData, setDonationData] = useState<any[]>([]);
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<any[]>([]);
  const [rawDonations, setRawDonations] = useState<any[]>([]);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsCard[]>([]);

  const getRangeDate = (r: TimeRange) => {
    const now = new Date();
    switch (r) {
      case "7d": return subDays(now, 7);
      case "30d": return subDays(now, 30);
      case "90d": return subDays(now, 90);
      case "12m": return subMonths(now, 12);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const from = getRangeDate(range);
      const fromISO = from.toISOString();

      // Fetch all data in parallel
      const [donationsRes, bookingsRes, profilesRes, allDonations, allBookings] = await Promise.all([
        supabase.from("donations").select("amount,created_at,status,tier").gte("created_at", fromISO).order("created_at"),
        supabase.from("puja_bookings").select("created_at,booking_status,payment_status,amount,devotee_name,booking_date,booking_time").gte("created_at", fromISO).order("created_at"),
        supabase.from("profiles").select("created_at").gte("created_at", fromISO).order("created_at"),
        supabase.from("donations").select("amount,status"),
        supabase.from("puja_bookings").select("id,payment_status"),
      ]);

      const donations = donationsRes.data || [];
      const bookings = bookingsRes.data || [];
      const profiles = profilesRes.data || [];
      setRawDonations(donations);
      setRawBookings(bookings);

      // Summary stats
      const totalRevenue = (allDonations.data || [])
        .filter((d: any) => d.status === "completed")
        .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const totalBookings = (allBookings.data || []).length;
      const paidBookings = (allBookings.data || []).filter((b: any) => b.payment_status === "paid").length;
      const periodDonations = donations.filter(d => d.status === "completed").reduce((s: number, d: any) => s + Number(d.amount), 0);

      setStats([
        { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <IndianRupee className="h-5 w-5" /> },
        { label: "Period Revenue", value: `₹${periodDonations.toLocaleString("en-IN")}`, change: `Last ${range}`, icon: <TrendingUp className="h-5 w-5" /> },
        { label: "Total Bookings", value: totalBookings.toString(), icon: <Calendar className="h-5 w-5" /> },
        { label: "New Users", value: profiles.length.toString(), change: `Last ${range}`, icon: <Users className="h-5 w-5" /> },
      ]);

      // Group data by time buckets
      const isMonthly = range === "12m" || range === "90d";
      const now = new Date();

      if (isMonthly) {
        const months = eachMonthOfInterval({ start: from, end: now });
        const donByMonth = months.map(m => {
          const key = format(m, "MMM yy");
          const monthStart = startOfMonth(m);
          const monthEnd = endOfMonth(m);
          const rev = donations
            .filter(d => d.status === "completed" && new Date(d.created_at) >= monthStart && new Date(d.created_at) <= monthEnd)
            .reduce((s: number, d: any) => s + Number(d.amount), 0);
          const bk = bookings.filter(b => new Date(b.created_at) >= monthStart && new Date(b.created_at) <= monthEnd).length;
          const users = profiles.filter(p => new Date(p.created_at) >= monthStart && new Date(p.created_at) <= monthEnd).length;
          return { name: key, revenue: rev, bookings: bk, users };
        });
        setDonationData(donByMonth);
        setBookingData(donByMonth);
        setUserGrowth(donByMonth);
      } else {
        const days = eachDayOfInterval({ start: from, end: now });
        const byDay = days.map(d => {
          const key = format(d, "MMM d");
          const dayStr = format(d, "yyyy-MM-dd");
          const rev = donations
            .filter(dn => dn.status === "completed" && dn.created_at.startsWith(dayStr))
            .reduce((s: number, dn: any) => s + Number(dn.amount), 0);
          const bk = bookings.filter(b => b.created_at.startsWith(dayStr)).length;
          const users = profiles.filter(p => p.created_at.startsWith(dayStr)).length;
          return { name: key, revenue: rev, bookings: bk, users };
        });
        setDonationData(byDay);
        setBookingData(byDay);
        setUserGrowth(byDay);
      }

      // Booking status distribution
      const statusMap: Record<string, number> = {};
      bookings.forEach((b: any) => {
        const s = b.booking_status || "pending";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      setBookingStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      setLoading(false);
    };

    fetchAnalytics();
  }, [range]);

  const exportDonations = () => {
    exportToCsv(`donations_${range}.csv`,
      ["Date", "Amount", "Tier", "Status"],
      rawDonations.map(d => [format(new Date(d.created_at), "yyyy-MM-dd HH:mm"), String(d.amount), d.tier, d.status])
    );
  };

  const exportBookings = () => {
    exportToCsv(`bookings_${range}.csv`,
      ["Date", "Devotee", "Booking Date", "Time", "Amount", "Payment Status", "Booking Status"],
      rawBookings.map(b => [
        format(new Date(b.created_at), "yyyy-MM-dd HH:mm"),
        b.devotee_name || "",
        b.booking_date || "",
        b.booking_time || "",
        String(b.amount),
        b.payment_status,
        b.booking_status || "pending",
      ])
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track temple operations at a glance</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="12m">12M</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">{s.icon}</span>
                {s.change && (
                  <Badge variant="secondary" className="text-[10px]">{s.change}</Badge>
                )}
              </div>
              <p className="font-heading text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Revenue Trend */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Donation Revenue</CardTitle>
            <Button variant="ghost" size="sm" onClick={exportDonations} className="h-8 gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Trend */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Booking Volume</CardTitle>
            <Button variant="ghost" size="sm" onClick={exportBookings} className="h-8 gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="bookings" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="users" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {bookingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {bookingStatusData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No booking data in this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
