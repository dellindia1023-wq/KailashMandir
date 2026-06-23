import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { IndianRupee, TrendingUp, Users, Loader2, Download, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToCsv } from "@/lib/exportCsv";

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  tier: string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

interface DonorProfile {
  user_id: string;
  full_name: string | null;
}

interface RevenueByTier {
  tier: string;
  total: number;
  count: number;
}

export const AdminDonationsTable = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);

      // Fetch donor names
      const userIds = [...new Set((data || []).map((d) => d.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const map: Record<string, string> = {};
        (profileData || []).forEach((p: DonorProfile) => {
          map[p.user_id] = p.full_name || "Unknown";
        });
        setProfiles(map);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const uniqueDonors = new Set(donations.map((d) => d.user_id)).size;

  const revenueByTier: RevenueByTier[] = Object.values(
    donations
      .filter((d) => d.status === "completed")
      .reduce<Record<string, RevenueByTier>>((acc, d) => {
        const tier = d.tier || "seva";
        if (!acc[tier]) acc[tier] = { tier, total: 0, count: 0 };
        acc[tier].total += Number(d.amount);
        acc[tier].count += 1;
        return acc;
      }, {})
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const tierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      seva: "Seva",
      bhakta: "Bhakta",
      dharma: "Dharma Patron",
      mahadaan: "Mahadaan",
    };
    return labels[tier] || tier;
  };

  const filteredDonations = donations.filter((d) => {
    const donorName = profiles[d.user_id] || "";
    const matchesSearch =
      donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.transaction_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search, Filter & Export */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by donor name or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchDonations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const headers = ["Donor", "Amount", "Tier", "Status", "Payment Method", "Transaction ID", "Date"];
            const rows = filteredDonations.map((d) => [
              profiles[d.user_id] || "Unknown",
              String(d.amount),
              tierLabel(d.tier),
              d.status,
              d.payment_method || "",
              d.transaction_id || "",
              new Date(d.created_at).toLocaleDateString("en-IN"),
            ]);
            exportToCsv(`donations-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
          }}
          disabled={filteredDonations.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground">Unique Donors</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{uniqueDonors}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Total Donations</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{donations.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Tier */}
      {revenueByTier.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {revenueByTier.map((t) => (
            <Badge key={t.tier} variant="outline" className="px-3 py-1.5 text-sm">
              {tierLabel(t.tier)}: ₹{t.total.toLocaleString("en-IN")} ({t.count})
            </Badge>
          ))}
        </div>
      )}

      {/* Donations Table */}
      {filteredDonations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No donations found.</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {profiles[d.user_id] || "Unknown"}
                  </TableCell>
                  <TableCell>₹{Number(d.amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tierLabel(d.tier)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {d.payment_method || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(d.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Showing {filteredDonations.length} of {donations.length} donations
      </p>
    </div>
  );
};
