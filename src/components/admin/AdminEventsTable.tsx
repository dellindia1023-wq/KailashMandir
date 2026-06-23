import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  event_name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const AdminEventsTable = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    event_name: "",
    description: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    location: "Kailash Mandir, Agra",
    image_url: "",
    is_active: true,
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) toast.error("Failed to load events");
    else setEvents((data as Event[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ event_name: "", description: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "", location: "Kailash Mandir, Agra", image_url: "", is_active: true });
    setEditingEvent(null);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setForm({
      event_name: event.event_name,
      description: event.description || "",
      start_date: event.start_date,
      end_date: event.end_date || "",
      location: event.location || "",
      image_url: event.image_url || "",
      is_active: event.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.event_name.trim() || !form.start_date) {
      toast.error("Event name and start date are required");
      return;
    }
    setSaving(true);

    const payload = {
      event_name: form.event_name.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      location: form.location.trim() || null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    if (editingEvent) {
      const { error } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
      if (error) toast.error("Failed to update event");
      else toast.success("Event updated");
    } else {
      const { error } = await supabase.from("events").insert({ ...payload, created_by: user?.id });
      if (error) toast.error("Failed to create event");
      else toast.success("Event created");
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Failed to delete event");
    else { toast.success("Event deleted"); fetchEvents(); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-saffron text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {editingEvent ? "Edit Event" : "Create Event"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Event Name *</Label>
                <Input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} maxLength={200} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={2000} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={200} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-saffron text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No events yet.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{e.event_name}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(e.start_date), "dd MMM yyyy")}
                    {e.end_date && ` - ${format(new Date(e.end_date), "dd MMM yyyy")}`}
                  </TableCell>
                  <TableCell className="text-sm">{e.location || "—"}</TableCell>
                  <TableCell><Badge variant={e.is_active ? "default" : "secondary"}>{e.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
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
