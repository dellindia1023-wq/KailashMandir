import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;

export type CompletionApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "needs_revision";
export type CompletionMediaType = "photo" | "video" | "certificate";
export type PrasadDispatchStatus = "pending" | "packed" | "dispatched" | "delivered";

export interface CompletionRecord {
  id: string;
  booking_id: string;
  completion_notes: string | null;
  completed_at: string | null;
  prasad_dispatch_status: PrasadDispatchStatus | string;
  courier_tracking_number: string | null;
  certificate_url: string | null;
  approval_status: CompletionApprovalStatus;
  approval_required: boolean;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletionMediaItem {
  id: string;
  completion_id: string;
  media_type: CompletionMediaType;
  url: string;
  caption: string | null;
  approval_status: CompletionApprovalStatus;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

export interface CompletionSettings {
  id: string;
  approval_required: boolean;
  updated_at: string;
}

const isMissingCompletionTableError = (error: any) => {
  const message = String(error?.message ?? "");
  const code = String(error?.code ?? "");

  return code === "42P01" || code === "PGRST205" || message.includes("does not exist") || message.includes("Could not find the table") || message.includes("not found") || message.includes("doesn't exist");
};

export const getVisibleCompletionMedia = (media: CompletionMediaItem[]) =>
  media.filter((item) => item.approval_status === "approved" && !item.is_hidden);

export const getCompletionWorkflowSummary = (record: Partial<CompletionRecord> | null, media: CompletionMediaItem[]) => {
  if (!record) {
    return { badgeLabel: "Draft", badgeVariant: "outline" as const, canShowMedia: false };
  }

  if (record.approval_status === "approved") {
    return { badgeLabel: "Approved", badgeVariant: "default" as const, canShowMedia: true };
  }

  if (record.approval_status === "rejected") {
    return { badgeLabel: "Rejected", badgeVariant: "destructive" as const, canShowMedia: false };
  }

  if (record.approval_status === "needs_revision") {
    return { badgeLabel: "Needs Revision", badgeVariant: "secondary" as const, canShowMedia: true };
  }

  return { badgeLabel: "Pending Review", badgeVariant: "secondary" as const, canShowMedia: media.length > 0 };
};

export const getCompletionSettings = async () => {
  const { data, error } = await supabaseAny
    .from("puja_completion_settings")
    .select("id, approval_required, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: CompletionSettings | null; error: any };

  if (error) {
    if (isMissingCompletionTableError(error)) {
      console.warn("Completion workflow tables are not available yet. Skipping settings lookup.");
      return null;
    }
    console.error("Failed to load completion settings", error);
    return null;
  }

  return (data as CompletionSettings | null) ?? null;
};

export const setCompletionApprovalRequirement = async (approvalRequired: boolean) => {
  const { data, error } = await supabaseAny
    .from("puja_completion_settings")
    .upsert({ approval_required: approvalRequired, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("id, approval_required, updated_at")
    .maybeSingle() as { data: CompletionSettings | null; error: any };

  if (error) throw error;
  return data as CompletionSettings | null;
};

export const uploadCompletionMedia = async (bookingId: string, file: File, mediaType: CompletionMediaType) => {
  const extension = file.name.split(".").pop() || "bin";
  const fileName = `${bookingId}/${mediaType}/${crypto.randomUUID()}.${extension}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("content")
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("content").getPublicUrl(uploadData?.path || fileName);
  return data.publicUrl;
};

export const fetchCompletionForBooking = async (bookingId: string) => {
  const { data: recordData, error: recordError } = await supabaseAny
    .from("puja_completion_records")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle() as { data: CompletionRecord | null; error: any };

  if (recordError) {
    if (isMissingCompletionTableError(recordError)) {
      return { record: null, media: [] as CompletionMediaItem[] };
    }
    throw recordError;
  }

  if (!recordData) {
    return { record: null, media: [] as CompletionMediaItem[] };
  }

  const { data: mediaData, error: mediaError } = await supabaseAny
    .from("puja_completion_media")
    .select("*")
    .eq("completion_id", recordData.id)
    .order("created_at", { ascending: true }) as { data: CompletionMediaItem[] | null; error: any };

  if (mediaError) {
    if (isMissingCompletionTableError(mediaError)) {
      return { record: recordData as CompletionRecord, media: [] as CompletionMediaItem[] };
    }
    throw mediaError;
  }

  return { record: recordData as CompletionRecord, media: (mediaData || []) as CompletionMediaItem[] };
};

export const saveCompletionRecord = async (bookingId: string, payload: Partial<CompletionRecord>) => {
  const { data: existingRecord, error: existingSelectError } = await supabaseAny
    .from("puja_completion_records")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle() as { data: { id: string } | null; error: any };

  if (existingSelectError) {
    if (isMissingCompletionTableError(existingSelectError)) {
      throw new Error("The puja completion workflow tables are missing in Supabase. Please run the completion migration.");
    }
    throw existingSelectError;
  }

  const recordPayload = {
    booking_id: bookingId,
    completion_notes: payload.completion_notes ?? null,
    completed_at: payload.completed_at ?? null,
    prasad_dispatch_status: payload.prasad_dispatch_status ?? "pending",
    courier_tracking_number: payload.courier_tracking_number ?? null,
    certificate_url: payload.certificate_url ?? null,
    approval_status: payload.approval_status ?? "draft",
    approval_required: payload.approval_required ?? true,
    admin_notes: payload.admin_notes ?? null,
    approved_at: payload.approved_at ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existingRecord?.id) {
    const { data, error } = await supabaseAny
      .from("puja_completion_records")
      .update(recordPayload)
      .eq("id", existingRecord.id)
      .select()
      .maybeSingle() as { data: CompletionRecord | null; error: any };

    if (error) throw error;
    return data as CompletionRecord;
  }

  const { data, error } = await supabaseAny
    .from("puja_completion_records")
    .insert(recordPayload)
    .select()
    .maybeSingle() as { data: CompletionRecord | null; error: any };

  if (error) throw error;
  return data as CompletionRecord;
};

export const addCompletionMedia = async (completionId: string, payload: Omit<CompletionMediaItem, "id" | "completion_id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabaseAny
    .from("puja_completion_media")
    .insert({
      completion_id: completionId,
      media_type: payload.media_type,
      url: payload.url,
      caption: payload.caption ?? null,
      approval_status: payload.approval_status,
      is_hidden: payload.is_hidden,
      uploaded_by: payload.uploaded_by ?? null,
    })
    .select()
    .maybeSingle() as { data: CompletionMediaItem | null; error: any };

  if (error) throw error;
  return data as CompletionMediaItem;
};

export const updateCompletionMedia = async (mediaId: string, updates: Partial<CompletionMediaItem>) => {
  const { data, error } = await supabaseAny
    .from("puja_completion_media")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", mediaId)
    .select()
    .maybeSingle() as { data: CompletionMediaItem | null; error: any };

  if (error) throw error;
  return data as CompletionMediaItem;
};

export const deleteCompletionMedia = async (mediaId: string) => {
  // Use a relaxed generic to avoid strict DB typings if the table is not present in generated types
  const { error } = await supabaseAny.from("puja_completion_media").delete().eq("id", mediaId);
  if (error) throw error;
};

export const updateCompletionRecordStatus = async (recordId: string, updates: Partial<CompletionRecord>) => {
  const { data, error } = await supabaseAny
    .from("puja_completion_records")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", recordId)
    .select()
    .maybeSingle() as { data: CompletionRecord | null; error: any };

  if (error) throw error;
  return data as CompletionRecord;
};
