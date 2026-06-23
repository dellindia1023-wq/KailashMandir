import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, UserPlus, Users, Trash2 } from "lucide-react";
import { AddPriestDialog } from "./AddPriestDialog";
import { toast } from "sonner";

interface PriestInfo {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  booking_count: number;
}

export const AdminPriestsTable = () => {
  const [priests, setPriests] = useState<PriestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removePriest, setRemovePriest] = useState<PriestInfo | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchPriests = async () => {
    setLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "priest");

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) {
        setPriests([]);
        setLoading(false);
        return;
      }

      const priestIds = rolesData.map(r => r.user_id);

      const [{ data: profilesData }, { data: bookingsData }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, phone").in("user_id", priestIds),
        supabase.from("puja_bookings").select("assigned_priest_id").in("assigned_priest_id", priestIds),
      ]);

      const bookingCounts = new Map<string, number>();
      bookingsData?.forEach(b => {
        if (b.assigned_priest_id) {
          bookingCounts.set(b.assigned_priest_id, (bookingCounts.get(b.assigned_priest_id) || 0) + 1);
        }
      });

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const enrichedPriests: PriestInfo[] = rolesData.map(r => ({
        user_id: r.user_id,
        full_name: profilesMap.get(r.user_id)?.full_name || null,
        phone: profilesMap.get(r.user_id)?.phone || null,
        created_at: r.created_at,
        booking_count: bookingCounts.get(r.user_id) || 0,
      }));

      setPriests(enrichedPriests);
    } catch (error) {
      console.error("Error fetching priests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriests();
  }, []);

  const handleRemovePriest = async () => {
    if (!removePriest) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", removePriest.user_id)
        .eq("role", "priest");

      if (error) throw error;
      toast.success(`${removePriest.full_name || "Priest"} has been removed`);
      setRemovePriest(null);
      fetchPriests();
    } catch (error) {
      console.error("Error removing priest:", error);
      toast.error("Failed to remove priest");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{priests.length} priest(s) registered</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPriests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-saffron">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Priest
          </Button>
        </div>
      </div>

      {priests.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-lg font-medium mb-2">No Priests Added Yet</h3>
          <p className="text-muted-foreground mb-4">Add your first priest to start assigning pujas</p>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-saffron">
            <UserPlus className="h-4 w-4 mr-2" />
            Add First Priest
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Pujas</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priests.map((priest) => (
                <TableRow key={priest.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-saffron flex items-center justify-center text-primary-foreground text-sm font-heading">
                        {priest.full_name?.[0] || "P"}
                      </div>
                      <span className="font-medium">{priest.full_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {priest.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{priest.booking_count} pujas</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(priest.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setRemovePriest(priest)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddPriestDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPriests}
      />

      <AlertDialog open={!!removePriest} onOpenChange={(open) => !open && setRemovePriest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Priest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removePriest?.full_name || "this priest"}</strong>?
              Their priest role will be revoked and they will become a regular user. This action can be undone by re-adding them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePriest}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing..." : "Remove Priest"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};