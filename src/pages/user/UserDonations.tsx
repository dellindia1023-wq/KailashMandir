import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateReceipt } from "@/lib/generateReceipt";
import { CreditCard, Calendar, IndianRupee, Heart, ArrowRight, Loader2, Download } from "lucide-react";

interface Donation {
  id: string; amount: number; tier: string; status: string; created_at: string; transaction_id: string | null; payment_method: string | null;
}

const UserDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("donations").select("id, amount, tier, status, transaction_id, payment_method, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setDonations(data || []); setLoading(false); });
  }, [user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const getTierColor = (t: string) => { switch(t) { case "seva": return "bg-green-100 text-green-700"; case "archana": return "bg-blue-100 text-blue-700"; case "abhishekam": return "bg-purple-100 text-purple-700"; case "mahadan": return "bg-gold/20 text-gold"; default: return "bg-muted text-muted-foreground"; } };
  const getStatusColor = (s: string) => { switch(s) { case "completed": return "bg-green-100 text-green-700"; case "pending": return "bg-yellow-100 text-yellow-700"; case "failed": return "bg-red-100 text-red-700"; default: return "bg-muted text-muted-foreground"; } };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (donations.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Donations Yet</h3>
          <p className="text-muted-foreground mb-4">Support the temple and receive divine blessings</p>
          <Link to="/#donate"><Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">Make a Donation <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">Donation History</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-xl font-heading font-bold text-green-700">₹{donations.filter(d => d.status === "completed").reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === "completed").length} donations</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-xl font-heading font-bold text-yellow-700">₹{donations.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === "pending").length} donations</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/10 to-accent/5 border-gold/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
            <p className="text-xl font-heading font-bold text-gold">₹{donations.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">{donations.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-3">
        {donations.map((donation) => (
          <Card key={donation.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0"><IndianRupee className="h-5 w-5 text-gold" /></div>
                  <div className="space-y-1">
                    <p className="font-heading font-semibold text-lg">₹{donation.amount.toLocaleString("en-IN")}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(donation.created_at)}</span>
                      {donation.transaction_id && <span className="font-mono">TXN: {donation.transaction_id.slice(0, 16)}…</span>}
                      {donation.payment_method && <span className="capitalize">{donation.payment_method}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Receipt #{donation.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Badge className={getTierColor(donation.tier)}>{donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1)}</Badge>
                  <Badge className={getStatusColor(donation.status)}>{donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}</Badge>
                  {donation.status === "completed" && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => generateReceipt({
                      type: "donation", id: donation.id, name: `${donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1)} Donation`, date: formatDate(donation.created_at), amount: donation.amount,
                      details: { Tier: donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1), "Transaction ID": donation.transaction_id || "—", "Payment Method": donation.payment_method || "—", Date: formatDate(donation.created_at) },
                    })}>
                      <Download className="h-3 w-3 mr-1" /> Receipt
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-2">
        <Link to="/#donate"><Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5"><Heart className="h-4 w-4 mr-2" />Make Another Donation</Button></Link>
      </div>
    </div>
  );
};

export default UserDonations;
