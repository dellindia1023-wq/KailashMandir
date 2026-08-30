import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, ImageIcon, VideoIcon, FileText, PackageCheck } from "lucide-react";
import CompletionMediaPreview from "@/components/CompletionMediaPreview";
import { addCompletionMedia, fetchCompletionForBooking, getCompletionSettings, getCompletionWorkflowErrorMessage, normalizeDateTimeLocalInput, saveCompletionRecord, uploadCompletionMedia } from "@/lib/pujaCompletion";
import { supabase } from "@/integrations/supabase/client";

interface PriestCompletionPanelProps {
  bookingId: string;
  bookingLabel: string;
  onSaved?: () => void;
}

const PriestCompletionPanel = ({ bookingId, bookingLabel, onSaved }: PriestCompletionPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [approvalRequired, setApprovalRequired] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { record, media } = await fetchCompletionForBooking(bookingId);
      setCompletionId(record?.id ?? null);
      setNotes(record?.completion_notes ?? "");
      setCompletedAt(normalizeDateTimeLocalInput(record?.completed_at ?? ""));
      setDispatchStatus(record?.prasad_dispatch_status ?? "pending");
      setTrackingNumber(record?.courier_tracking_number ?? "");
      setCertificateUrl(record?.certificate_url ?? null);
      setMediaItems(media || []);

      const settings = await getCompletionSettings();
      setApprovalRequired(settings?.approval_required ?? false);
    } catch (error) {
      console.error(error);
      toast.error(getCompletionWorkflowErrorMessage(error, "Failed to load completion details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [bookingId]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, mediaType: "photo" | "video" | "certificate") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Ensure authenticated user
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        throw new Error("Your Priest session has expired. Please log in again.");
      }
      const userId = authData.user.id;

      // Verify booking belongs to this priest
      const { data: bookingRow, error: bookingErr } = await supabase
        .from("puja_bookings")
        .select("assigned_priest_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      if (!bookingRow || bookingRow.assigned_priest_id !== userId) {
        throw new Error("This booking is not assigned to your account.");
      }

      // Ensure we have a completion record id. If not, create/save one first and use returned id.
      let targetCompletionId = completionId;
      if (!targetCompletionId) {
        const savedRecord = await saveCompletionRecord(bookingId, {
          completion_notes: notes,
          completed_at: completedAt,
          prasad_dispatch_status: dispatchStatus,
          courier_tracking_number: trackingNumber,
          certificate_url: certificateUrl,
          approval_status: approvalRequired ? "pending" : "approved",
          approval_required: approvalRequired,
        });

        if (!savedRecord?.id) throw new Error("Completion record was not returned by Supabase. Please try saving again.");
        targetCompletionId = savedRecord.id;
        setCompletionId(savedRecord.id);
      }

      // Now upload to storage
      const uploadResult = await uploadCompletionMedia(bookingId, file, mediaType);
      const url = typeof uploadResult === "string" ? uploadResult : uploadResult?.url;
      const uploadPath = typeof uploadResult === "object" ? uploadResult?.path : undefined;

      // Insert media row with uploaded_by = authenticated user id
      // Cast payload and query results to `any` to avoid deep TypeScript generics
      const created = await addCompletionMedia(targetCompletionId, {
        media_type: mediaType,
        url,
        caption: file.name,
        approval_status: approvalRequired ? "pending" : "approved",
        is_hidden: false,
        uploaded_by: userId,
      } as any);

      // Verify the media row was persisted by querying the media table for the created id
      try {
        const resp = await (supabase as any)
          .from("puja_completion_media")
          .select("id, uploaded_by")
          .eq("id", (created as any)?.id)
          .maybeSingle();

        const verifyData = (resp && resp.data) ? resp.data : null;
        const verifyError = resp && resp.error ? resp.error : null;

        if (verifyError) {
          console.error("Verification query error", verifyError);
          throw verifyError;
        }

        if (!verifyData) {
          throw new Error("Media insert verification failed: no row found for created media id");
        }

        // verify uploaded_by matches authenticated user
        if (verifyData.uploaded_by && verifyData.uploaded_by !== userId) {
          console.warn("uploaded_by mismatch", verifyData.uploaded_by, userId);
        }
      } catch (verifyErr) {
        console.error("Failed to verify media insert:", verifyErr);
        const text = typeof verifyErr === "object" ? JSON.stringify(verifyErr, Object.getOwnPropertyNames(verifyErr)) : String(verifyErr);
        toast.error(`Upload saved to storage but media DB insert not verified: ${text}`);
      }

      setMediaItems((prev) => [...prev, created as any]);
      toast.success(`${mediaType === "certificate" ? "Certificate" : mediaType} uploaded`);
      onSaved?.();
    } catch (error) {
      console.error(error);
      const text = typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
      // Show exact Supabase error where possible, but keep toast reasonably short
      toast.error(getCompletionWorkflowErrorMessage(error, "Upload failed") + (text ? ` — ${text.substring(0, 200)}` : ""));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Ensure authenticated user
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        throw new Error("Your Priest session has expired. Please log in again.");
      }
      const userId = authData.user.id;

      // Verify booking belongs to this priest
      const { data: bookingRow, error: bookingErr } = await supabase
        .from("puja_bookings")
        .select("assigned_priest_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      if (!bookingRow || bookingRow.assigned_priest_id !== userId) {
        throw new Error("This booking is not assigned to your account.");
      }

      const record = await saveCompletionRecord(bookingId, {
        completion_notes: notes,
        completed_at: completedAt,
        prasad_dispatch_status: dispatchStatus,
        courier_tracking_number: trackingNumber,
        certificate_url: certificateUrl,
        approval_status: approvalRequired ? "pending" : "approved",
        approval_required: approvalRequired,
        admin_notes: null,
      });

      if (!record?.id) throw new Error("Completion record was not returned by Supabase.");
      setCompletionId(record.id);
      toast.success("Completion details saved");
      onSaved?.();
    } catch (error) {
      console.error(error);
      const text = typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
      const message = getCompletionWorkflowErrorMessage(error, "Failed to save completion details");
      toast.error(message + (text ? ` — ${text.substring(0, 200)}` : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!completionId) {
      toast.error("Please save completion details before marking completed.");
      return;
    }

    try {
      setSaving(true);
      // Ensure authenticated user
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        throw new Error("Your Priest session has expired. Please log in again.");
      }
      const userId = authData.user.id;

      // Verify booking belongs to this priest
      const { data: bookingRow, error: bookingErr } = await supabase
        .from("puja_bookings")
        .select("assigned_priest_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      if (!bookingRow || bookingRow.assigned_priest_id !== userId) {
        throw new Error("This booking is not assigned to your account.");
      }

      const { data, error } = await supabase
        .from("puja_bookings")
        .update({ booking_status: "completed", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .select();
      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("No booking was updated. Please refresh and try again.");
      }

      // Re-query to confirm
      const { data: confirmed, error: confErr } = await supabase
        .from("puja_bookings")
        .select("booking_status")
        .eq("id", bookingId)
        .maybeSingle();
      if (confErr) throw confErr;
      if (!confirmed || confirmed.booking_status !== "completed") {
        throw new Error("Failed to confirm booking status after update.");
      }

      toast.success("Booking marked completed");
      onSaved?.();
    } catch (err: any) {
      console.error(err);
      const text = typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      toast.error(getCompletionWorkflowErrorMessage(err, "Failed to mark booking as completed") + (text ? ` — ${text.substring(0, 200)}` : ""));
    } finally {
      setSaving(false);
    }
  };

  const visibleMedia = useMemo(() => mediaItems.filter((item) => !item.is_hidden), [mediaItems]);

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
          <PackageCheck className="h-5 w-5 text-primary" />
          Completion Workflow for {bookingLabel}
        </CardTitle>
        <CardDescription>
          Upload proof of completion, track prasad dispatch, and keep devotees informed after approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="completion-time">Completion Time</Label>
            <Input id="completion-time" type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(normalizeDateTimeLocalInput(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispatch-status">Prasad Dispatch Status</Label>
            <Select value={dispatchStatus} onValueChange={setDispatchStatus}>
              <SelectTrigger id="dispatch-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tracking-number">Courier Tracking</Label>
          <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="AWB / tracking number" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="completion-notes">Completion Notes</Label>
          <Textarea id="completion-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the ritual completion, any special blessings, or follow-up instructions." />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="rounded-xl border border-dashed border-border p-4 text-sm hover:bg-muted/50">
            <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleUpload(event, "photo")} />
            <div className="flex items-center gap-2 text-primary">
              <ImageIcon className="h-4 w-4" />
              Upload Photos
            </div>
          </label>
          <label className="rounded-xl border border-dashed border-border p-4 text-sm hover:bg-muted/50">
            <input type="file" accept="video/*" className="hidden" onChange={(event) => void handleUpload(event, "video")} />
            <div className="flex items-center gap-2 text-primary">
              <VideoIcon className="h-4 w-4" />
              Upload Videos
            </div>
          </label>
          <label className="rounded-xl border border-dashed border-border p-4 text-sm hover:bg-muted/50">
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(event) => void handleUpload(event, "certificate")} />
            <div className="flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" />
              Upload Certificate
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Completion Details
          </Button>
          <Button variant="ghost" onClick={handleMarkCompleted} disabled={saving || uploading}>
            Mark Completed
          </Button>
          <Button variant="outline" onClick={() => void fetchData()} disabled={loading || uploading}>
            <Upload className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {visibleMedia.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-heading text-lg">Uploaded Items</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleMedia.map((item) => (
                <div key={item.id}>
                  <CompletionMediaPreview item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriestCompletionPanel;
