import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Music } from "lucide-react";
import { toast } from "sonner";

interface AartiSlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  is_special: boolean;
  order: number;
  is_active: boolean;
}

export default function AartiTimingsManager() {
  const [aartiSlots, setAartiSlots] = useState<AartiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("05:00");
  const [endTime, setEndTime] = useState("06:00");
  const [description, setDescription] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAartiSlots();
  }, []);

  const fetchAartiSlots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("aarti_schedule")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      setAartiSlots(data || []);
    } catch (error) {
      console.error("Error fetching aarti timings:", error);
      toast.error("Failed to load aarti timings");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Please enter aarti name");
      return;
    }

    if (startTime >= endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    try {
      setSubmitting(true);
      const maxOrder = Math.max(0, ...aartiSlots.map((s) => s.order));

      const { error } = await supabase.from("aarti_schedule").insert([
        {
          name: name.trim(),
          start_time: startTime,
          end_time: endTime,
          description: description.trim(),
          is_special: isSpecial,
          order: maxOrder + 1,
        },
      ]);

      if (error) throw error;

      toast.success("Aarti timing added!");
      setName("");
      setStartTime("05:00");
      setEndTime("06:00");
      setDescription("");
      setIsSpecial(false);
      await fetchAartiSlots();
    } catch (error) {
      console.error("Error adding aarti:", error);
      toast.error("Failed to add aarti timing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("aarti_schedule")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      await fetchAartiSlots();
      toast.success("Aarti status updated!");
    } catch (error) {
      console.error("Error updating aarti:", error);
      toast.error("Failed to update aarti status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this aarti timing?")) return;

    try {
      const { error } = await supabase
        .from("aarti_schedule")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Aarti timing deleted!");
      await fetchAartiSlots();
    } catch (error) {
      console.error("Error deleting aarti:", error);
      toast.error("Failed to delete aarti timing");
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
    <div className="space-y-6">
      {/* Add New Aarti Slot Form */}
      <Card className="border-saffron/30 bg-gradient-to-br from-saffron/5 to-gold/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Music className="h-5 w-5 text-saffron" />
            Add New Aarti Timing
          </CardTitle>
          <CardDescription>Add a new aarti slot to the temple schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Aarti Name *</label>
              <Input
                placeholder="e.g., Mangla Aarti, Bhog Aarti"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-saffron/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-saffron/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-saffron/20"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Special Aarti?</label>
                <div className="flex items-center gap-2 p-2 border border-saffron/20 rounded-md bg-background">
                  <Switch checked={isSpecial} onCheckedChange={setIsSpecial} />
                  <span className="text-sm">{isSpecial ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
            <Textarea
              placeholder="e.g., Early morning worship, family prayers, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="border-saffron/20"
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={submitting}
            className="w-full bg-gradient-saffron hover:bg-saffron/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Aarti Timing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Aarti Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Aarti Schedule</CardTitle>
          <CardDescription>
            {aartiSlots.length} aarti timing{aartiSlots.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aartiSlots.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No aarti timings configured yet</p>
          ) : (
            <div className="space-y-3">
              {aartiSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{slot.name}</h4>
                      {slot.is_special && (
                        <Badge className="bg-gold/20 text-gold text-xs">Special</Badge>
                      )}
                      {!slot.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-primary font-medium">
                      {slot.start_time} – {slot.end_time}
                    </p>
                    {slot.description && (
                      <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={slot.is_active}
                      onCheckedChange={() => handleToggle(slot.id, slot.is_active)}
                      disabled={submitting}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      disabled={submitting}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Add or edit aarti timings that will appear on the public Darshan Timings page</li>
          <li>Mark special aartis (like Mangla and Sandhya) to display with special styling</li>
          <li>Toggle aartis on/off to control visibility without deleting</li>
          <li>Changes take effect immediately across the website</li>
        </ul>
      </div>
    </div>
  );
}
