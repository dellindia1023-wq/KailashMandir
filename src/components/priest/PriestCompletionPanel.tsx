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
import { addCompletionMedia, fetchCompletionForBooking, getCompletionSettings, saveCompletionRecord, uploadCompletionMedia } from "@/lib/pujaCompletion";

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
  const [approvalRequired, setApprovalRequired] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { record, media } = await fetchCompletionForBooking(bookingId);
      setCompletionId(record?.id ?? null);
      setNotes(record?.completion_notes ?? "");
      setCompletedAt(record?.completed_at ?? "");
      setDispatchStatus(record?.prasad_dispatch_status ?? "pending");
      setTrackingNumber(record?.courier_tracking_number ?? "");
      setCertificateUrl(record?.certificate_url ?? null);
      setMediaItems(media || []);

      const settings = await getCompletionSettings();
      setApprovalRequired(settings?.approval_required ?? true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load completion details");
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
      const url = await uploadCompletionMedia(bookingId, file, mediaType);
      const record = await saveCompletionRecord(bookingId, {
        completion_notes: notes,
        completed_at: completedAt,
        prasad_dispatch_status: dispatchStatus,
        courier_tracking_number: trackingNumber,
        certificate_url: mediaType === "certificate" ? url : certificateUrl,
        approval_status: approvalRequired ? "pending" : "approved",
        approval_required: approvalRequired,
      });

      if (!completionId && record.id) {
        setCompletionId(record.id);
      }

      const created = await addCompletionMedia(record.id, {
        media_type: mediaType,
        url,
        caption: file.name,
        approval_status: "pending",
        is_hidden: false,
        uploaded_by: null,
      });

      setMediaItems((prev) => [...prev, created]);
      toast.success(`${mediaType === "certificate" ? "Certificate" : mediaType} uploaded`);
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
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
      setCompletionId(record.id);
      toast.success("Completion details saved");
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save completion details");
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
            <Input id="completion-time" type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
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
                <div key={item.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{item.media_type}</Badge>
                    <Badge variant="outline">{item.approval_status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground break-all">{item.url}</p>
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
