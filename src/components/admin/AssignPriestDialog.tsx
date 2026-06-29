import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";

interface Priest {
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface AssignPriestDialogProps {
  booking: {
    id: string;
    devotee_name: string;
    pujas: {
      name: string;
    };
    assigned_priest_id: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignPriestDialog = ({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: AssignPriestDialogProps) => {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [selectedPriest, setSelectedPriest] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingPriests, setFetchingPriests] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPriests();
      setSelectedPriest(booking?.assigned_priest_id || "");
    }
  }, [open, booking]);

  const fetchPriests = async () => {
    setFetchingPriests(true);
    try {
      // Get all users with priest role
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "priest");

      if (rolesError) throw rolesError;

      const priestIds = (rolesData || []).map((r) => r.user_id);
      if (priestIds.length === 0) {
        setPriests([]);
        return;
      }

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", priestIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const enrichedPriests: Priest[] = priestIds.map((uid) => ({
        user_id: uid,
        profiles: profilesMap.get(uid) || null,
      }));

      setPriests(enrichedPriests);
    } catch (error) {
      console.error("Error fetching priests:", error);
      toast.error("Failed to load priests");
    } finally {
      setFetchingPriests(false);
    }
  };

  const handleAssign = async () => {
    if (!booking) return;
    setLoading(true);

    try {
      // Call Edge Function to perform update + notify priest
      const priestUserId = selectedPriest === "unassign" ? null : selectedPriest;
      const { data, error } = await supabase.functions.invoke("assign-priest", {
        body: { bookingId: booking.id, priestUserId },
      });

      if (error) throw error;

      toast.success(priestUserId ? "Priest assigned successfully" : "Priest unassigned");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error assigning priest:", error);
      toast.error("Failed to assign priest");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Assign Priest
          </DialogTitle>
          <DialogDescription>
            Assign a priest to perform <span className="font-medium">{booking.pujas.name}</span> for{" "}
            <span className="font-medium">{booking.devotee_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Priest</Label>
            {fetchingPriests ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : priests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No priests found.</p>
                <p className="text-sm">Add users with the "priest" role first.</p>
              </div>
            ) : (
              <Select value={selectedPriest} onValueChange={setSelectedPriest}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a priest..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">
                    <span className="text-muted-foreground">No priest (unassign)</span>
                  </SelectItem>
                  {priests.map((priest) => (
                    <SelectItem key={priest.user_id} value={priest.user_id}>
                      {priest.profiles?.full_name || "Unknown Priest"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || fetchingPriests}
            className="flex-1 bg-gradient-saffron hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              "Confirm Assignment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
