import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminRescheduleRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reschedule_requests').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Failed to load reschedule requests');
      setLoading(false);
      return;
    }
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { void fetchRequests(); }, []);

  const handleDecision = async (id: string, approve: boolean) => {
    try {
      const status = approve ? 'approved' : 'rejected';
      const { error } = await supabase.from('reschedule_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      // If approved, apply to booking
      if (approve) {
        const { data: req } = await supabase.from('reschedule_requests').select('booking_id, requested_date, requested_time').eq('id', id).maybeSingle();
        if (req) {
          const { error: updErr } = await supabase.from('puja_bookings').update({ booking_date: req.requested_date, booking_time: req.requested_time, updated_at: new Date().toISOString() }).eq('id', req.booking_id);
          if (updErr) throw updErr;
        }
      }
      toast.success('Request updated');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update request');
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Reschedule Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {!loading && requests.length === 0 && <div>No pending requests</div>}
          <div className="space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="rounded border p-4 flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground">Booking: {r.booking_id}</div>
                  <div className="font-medium">Requested: {r.requested_date} at {r.requested_time}</div>
                  <div className="text-xs text-muted-foreground">By: {r.user_id} • Status: {r.status}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleDecision(r.id, true)} size="sm">Approve</Button>
                  <Button variant="outline" onClick={() => handleDecision(r.id, false)} size="sm">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
