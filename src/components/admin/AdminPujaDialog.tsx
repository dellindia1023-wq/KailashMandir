import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Puja {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface AdminPujaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puja: Puja | null;
  onSuccess: () => void;
}

const categories = [
  { value: "abhishekam", label: "Abhishekam" },
  { value: "jaap", label: "Jaap & Mantra" },
  { value: "path", label: "Path & Recitation" },
  { value: "puja", label: "Special Puja" },
  { value: "special", label: "Festival Special" },
  { value: "sponsorship", label: "Sponsorship" },
];

export const AdminPujaDialog = ({ open, onOpenChange, puja, onSuccess }: AdminPujaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_minutes: 60,
    category: "puja",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    if (puja) {
      setFormData({
        name: puja.name,
        description: puja.description || "",
        price: puja.price,
        duration_minutes: puja.duration_minutes || 60,
        category: puja.category || "puja",
        image_url: puja.image_url || "",
        is_active: puja.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        duration_minutes: 60,
        category: "puja",
        image_url: "",
        is_active: true,
      });
    }
  }, [puja, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (puja) {
        // Update existing puja
        const { error } = await supabase
          .from("pujas")
          .update({
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            duration_minutes: formData.duration_minutes,
            category: formData.category,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
          })
          .eq("id", puja.id);

        if (error) throw error;
        toast.success("Puja updated successfully");
      } else {
        // Create new puja
        const { error } = await supabase.from("pujas").insert({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          duration_minutes: formData.duration_minutes,
          category: formData.category,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("Puja created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving puja:", error);
      toast.error(error.message || "Failed to save puja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {puja ? "Edit Puja" : "Add New Puja"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-saffron">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {puja ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
