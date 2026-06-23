import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, Trash2, Loader2, CalendarClock } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string;
  is_active: boolean;
}

const DarshanScheduleManager = () => {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New slot form
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("05:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [newLabel, setNewLabel] = useState("Morning Darshan");

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from("darshan_schedule")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      toast.error("Failed to load schedule");
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleAdd = async () => {
    if (newStart >= newEnd) {
      toast.error("Start time must be before end time");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("darshan_schedule").insert({
      day_of_week: parseInt(newDay),
      start_time: newStart,
      end_time: newEnd,
      label: newLabel || "Darshan",
    });
    if (error) {
      toast.error("Failed to add slot: " + error.message);
    } else {
      toast.success("Schedule slot added");
      fetchSlots();
    }
    setAdding(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("darshan_schedule")
      .update({ is_active: active })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
    } else {
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: active } : s)));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("darshan_schedule").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slot removed");
    }
  };

  // Group slots by day
  const grouped = DAYS.map((dayName, idx) => ({
    dayName,
    dayIndex: idx,
    daySlots: slots.filter((s) => s.day_of_week === idx),
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Darshan Schedule (Auto Live Toggle)
        </CardTitle>
        <CardDescription>
          Configure darshan timings per day. The live stream will automatically turn on/off based on this schedule (IST).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new slot */}
        <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Time Slot
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Day</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Time</Label>
              <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Time</Label>
              <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Morning Darshan" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={adding} size="sm">
            {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add Slot
          </Button>
        </div>

        <Separator />

        {/* Schedule by day */}
        <div className="space-y-4">
          {grouped.map(({ dayName, daySlots }) => (
            <div key={dayName}>
              <h4 className="font-heading font-semibold text-sm mb-2">{dayName}</h4>
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground italic ml-2">No slots configured</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-md border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </span>
                        <Badge variant="outline" className="text-xs">{slot.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(v) => handleToggle(slot.id, v)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground border-l-2 border-gold pl-3">
          💡 The system checks this schedule every minute and automatically toggles the live stream on/off.
          All times are in IST (Indian Standard Time). You can still manually override via the toggle above.
        </p>
      </CardContent>
    </Card>
  );
};

export default DarshanScheduleManager;
