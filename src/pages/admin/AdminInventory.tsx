import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, AlertTriangle, Package } from "lucide-react";

interface SamagriItem {
  id: string;
  item_name: string;
  description: string | null;
  category: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  price_per_unit: number;
  supplier: string | null;
  is_active: boolean;
  last_restocked_at: string | null;
  created_at: string;
}

const categories = ["general", "flowers", "incense", "oils", "grains", "cloth", "utensils", "other"];
const units = ["pcs", "kg", "gm", "litre", "ml", "packet", "bundle", "box"];

const emptyForm = {
  item_name: "", description: "", category: "general", unit: "pcs",
  current_stock: 0, min_stock_level: 5, price_per_unit: 0, supplier: "",
};

const AdminInventory = () => {
  const [items, setItems] = useState<SamagriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SamagriItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [restockDialog, setRestockDialog] = useState<{ open: boolean; item: SamagriItem | null; quantity: string }>({ open: false, item: null, quantity: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pooja_samagri")
      .select("*")
      .order("item_name");
    if (error) { toast.error("Failed to load inventory"); console.error(error); }
    else setItems(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.item_name.trim()) { toast.error("Item name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        item_name: form.item_name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        unit: form.unit,
        current_stock: Number(form.current_stock),
        min_stock_level: Number(form.min_stock_level),
        price_per_unit: Number(form.price_per_unit),
        supplier: form.supplier.trim() || null,
      };

      if (editingItem) {
        const { error } = await supabase.from("pooja_samagri").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("pooja_samagri").insert(payload);
        if (error) throw error;
        toast.success("Item added");
      }

      await supabase.from("audit_log").insert({
        action: editingItem ? "update_inventory" : "add_inventory",
        module_name: "inventory",
        details: { item_name: payload.item_name },
      });

      setDialogOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SamagriItem) => {
    if (!confirm(`Delete "${item.item_name}"?`)) return;
    const { error } = await supabase.from("pooja_samagri").delete().eq("id", item.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Item deleted");
    fetchItems();
  };

  const openRestockDialog = (item: SamagriItem) => {
    setRestockDialog({ open: true, item, quantity: "" });
  };

  const handleRestockSubmit = async () => {
    if (!restockDialog.item) return;
    const qty = parseFloat(restockDialog.quantity);
    if (isNaN(qty) || qty <= 0 || qty > 10000) {
      toast.error("Please enter a valid quantity between 1 and 10,000");
      return;
    }
    if (!Number.isInteger(qty) && restockDialog.item.unit === "pcs") {
      toast.error("Quantity must be a whole number for pieces");
      return;
    }
    const newStock = Number(restockDialog.item.current_stock) + qty;
    const { error } = await supabase.from("pooja_samagri")
      .update({ current_stock: newStock, last_restocked_at: new Date().toISOString() })
      .eq("id", restockDialog.item.id);
    if (error) { toast.error("Failed to restock"); return; }
    toast.success(`Restocked +${qty} ${restockDialog.item.unit}`);
    setRestockDialog({ open: false, item: null, quantity: "" });
    fetchItems();
  };

  const openEdit = (item: SamagriItem) => {
    setEditingItem(item);
    setForm({
      item_name: item.item_name,
      description: item.description || "",
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      price_per_unit: item.price_per_unit,
      supplier: item.supplier || "",
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = i.item_name.toLowerCase().includes(q) || (i.supplier?.toLowerCase().includes(q) ?? false);
    const matchCat = filterCategory === "all" || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_level).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <Package className="h-5 w-5" /> Pooja Samagri Inventory
            </CardTitle>
            <CardDescription>Manage temple ritual materials and supplies</CardDescription>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {lowStockCount} item(s) below minimum stock level
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="outline">{filtered.length} items</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Price/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const isLow = item.current_stock <= item.min_stock_level;
                  return (
                    <TableRow key={item.id} className={isLow ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">
                        {item.item_name}
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                      <TableCell>
                        <span className={isLow ? "text-destructive font-semibold" : ""}>
                          {item.current_stock} {item.unit}
                        </span>
                        {isLow && <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-destructive" />}
                      </TableCell>
                      <TableCell>{item.min_stock_level} {item.unit}</TableCell>
                      <TableCell>₹{Number(item.price_per_unit).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{item.supplier || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openRestockDialog(item)}>Restock</Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No items found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Restock Dialog */}
        <Dialog open={restockDialog.open} onOpenChange={(open) => !open && setRestockDialog({ open: false, item: null, quantity: "" })}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Restock: {restockDialog.item?.item_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Quantity to Add ({restockDialog.item?.unit})</Label>
                <Input
                  type="number"
                  min="0.01"
                  max="10000"
                  step={restockDialog.item?.unit === "pcs" ? "1" : "0.01"}
                  value={restockDialog.quantity}
                  onChange={(e) => setRestockDialog(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>
              <Button onClick={handleRestockSubmit} className="w-full">Restock</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Item Name *</Label>
                <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Current Stock</Label>
                  <Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <Input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Price/Unit (₹)</Label>
                  <Input type="number" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Supplier</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminInventory;
