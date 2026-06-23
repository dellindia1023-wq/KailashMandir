import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  id: string;
  title: string;
  description: string;
  priority: "normal" | "important" | "urgent";
  publish_date: string;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export const AdminNoticesTable = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal" as "normal" | "important" | "urgent",
    publish_date: format(new Date(), "yyyy-MM-dd"),
    expiry_date: "",
    is_active: true,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notices");
    } else {
      setNotices((data as Notice[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      priority: "normal",
      publish_date: format(new Date(), "yyyy-MM-dd"),
      expiry_date: "",
      is_active: true,
    });
    setEditingNotice(null);
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      description: notice.description,
      priority: notice.priority,
      publish_date: notice.publish_date,
      expiry_date: notice.expiry_date || "",
      is_active: notice.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      publish_date: form.publish_date,
      expiry_date: form.expiry_date || null,
      is_active: form.is_active,
    };

    if (editingNotice) {
      const { error } = await supabase
        .from("notices")
        .update(payload)
        .eq("id", editingNotice.id);
      if (error) toast.error("Failed to update notice");
      else toast.success("Notice updated");
    } else {
      const { error } = await supabase
        .from("notices")
        .insert({ ...payload, created_by: user?.id });
      if (error) toast.error("Failed to create notice");
      else toast.success("Notice created");
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) toast.error("Failed to delete notice");
    else {
      toast.success("Notice deleted");
      fetchNotices();
    }
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>;
    if (p === "important") return <Badge className="bg-orange-500 text-white">Important</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-saffron text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {editingNotice ? "Edit Notice" : "Create Notice"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={2000} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as "normal" | "important" | "urgent" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Publish Date</Label>
                  <Input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry Date (optional)</Label>
                  <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-saffron text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingNotice ? "Update Notice" : "Create Notice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notices.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No notices yet. Create one to get started.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{n.title}</TableCell>
                  <TableCell>{priorityBadge(n.priority)}</TableCell>
                  <TableCell className="text-sm">{format(new Date(n.publish_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-sm">{n.expiry_date ? format(new Date(n.expiry_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={n.is_active ? "default" : "secondary"}>{n.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(n)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
