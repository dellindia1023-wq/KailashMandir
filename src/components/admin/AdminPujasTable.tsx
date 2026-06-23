import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { AdminPujaDialog } from "./AdminPujaDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Puja {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

export const AdminPujasTable = () => {
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pujaToDelete, setPujaToDelete] = useState<Puja | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPujas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pujas")
        .select("*")
        .order("name");

      if (error) throw error;
      setPujas(data || []);
    } catch (error) {
      console.error("Error fetching pujas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPujas();
  }, []);

  const handleEdit = (puja: Puja) => {
    setSelectedPuja(puja);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPuja(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pujaToDelete) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from("pujas").delete().eq("id", pujaToDelete.id);
      if (error) throw error;
      toast.success("Puja deleted successfully");
      fetchPujas();
    } catch (error: any) {
      console.error("Error deleting puja:", error);
      toast.error(error.message || "Failed to delete puja");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPujaToDelete(null);
    }
  };

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      abhishekam: "Abhishekam",
      jaap: "Jaap & Mantra",
      path: "Path & Recitation",
      puja: "Special Puja",
      special: "Festival Special",
      sponsorship: "Sponsorship",
    };
    return category ? labels[category] || category : "—";
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
        <p className="text-sm text-muted-foreground">{pujas.length} pujas total</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPujas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddNew} className="bg-gradient-saffron">
            <Plus className="h-4 w-4 mr-2" />
            Add Puja
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pujas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No pujas found. Add your first puja!
                </TableCell>
              </TableRow>
            ) : (
              pujas.map((puja) => (
                <TableRow key={puja.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{puja.name}</p>
                      {puja.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{puja.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(puja.category)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">₹{puja.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{puja.duration_minutes ? `${puja.duration_minutes} mins` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={puja.is_active ? "default" : "outline"}>
                      {puja.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(puja)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setPujaToDelete(puja);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPujaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        puja={selectedPuja}
        onSuccess={fetchPujas}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Puja</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pujaToDelete?.name}"? This action cannot be undone.
              Existing bookings for this puja will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
