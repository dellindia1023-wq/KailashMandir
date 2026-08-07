import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  Pause,
  Play,
  Eye,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import {
  Campaign,
  CampaignAnalytics,
  CampaignContent,
  CampaignCTA,
  CampaignContext,
  DEFAULT_CAMPAIGN_ANALYTICS,
  buildSupabaseCampaignInsertPayload,
  buildSupabaseCampaignUpdatePayload,
  fromSupabaseCampaignRow,
  getCampaignConflictIssues,
  getCampaignHealthScore,
  getCampaignTimelineState,
  getCampaignValidationIssues,
  getEffectiveCampaignStatus,
  getLocationLabel,
  normalizeStringList,
} from "@/lib/campaigns";
import CampaignRenderer from "@/components/campaigns/CampaignRenderer";

const predefinedLocations = [
  "homepage.hero",
  "homepage.top",
  "homepage.cards",
  "homepage.announcement",
  "sticky.header",
  "sticky.footer",
  "floating.widget",
  "sidebar",
  "knowledge.top",
  "knowledge.article",
  "blog.top",
  "blog.article",
  "donate.top",
  "pujas.hero",
  "gallery",
  "live-darshan.after-player",
  "events.top",
  "contact",
  "about",
  "footer",
  "exit-intent.popup",
  "welcome.popup",
  "newsletter.popup",
  "mobile-bottom-sheet",
  "mobile-floating-button",
  "desktop.hero.slider",
  "category.pages",
  "tag.pages",
  "search.results",
  "404.page",
  "custom_route",
];

const defaultTargeting = {
  page_types: ["home"],
  url_contains: "",
  logged_in: "any",
  device: "any",
  category: "",
  tags: "",
  search_keywords: "",
};

const defaultContent: CampaignContent = {
  headline: "",
  message: "",
  image_url: "",
  mobile_image_url: "",
  background_color: "",
  badge: "",
};

const defaultCTA: CampaignCTA = {
  id: "cta-1",
  label: "Learn More",
  url: "/",
  type: "link",
  icon: "",
  open_new_tab: false,
  is_popup: false,
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "running", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
];

const AdminCampaignsTable = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "calendar" | "timeline" | "health">("overview");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "timeline">("month");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [simulatorView, setSimulatorView] = useState<"desktop" | "tablet" | "mobile" | "popup" | "hero" | "sidebar" | "announcement" | "knowledge" | "blog">("desktop");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [campaignViewFilter, setCampaignViewFilter] = useState("all");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [form, setForm] = useState<Partial<Campaign>>({
    name: "",
    slug: "",
    description: "",
    type: "",
    status: "draft",
    priority: 50,
    start_date: "",
    end_date: "",
    is_active: true,
    locations: ["homepage.hero"],
    targeting_rules: defaultTargeting,
    content: defaultContent,
    ctas: [defaultCTA],
    analytics: DEFAULT_CAMPAIGN_ANALYTICS,
  });
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      toast.error("Unable to load campaigns");
    } else {
      setCampaigns((data || []).map((row) => fromSupabaseCampaignRow(row as any)) as Campaign[]);
    }
    setLoading(false);
  };

  const uploadCampaignImage = async (file: File | undefined) => {
    if (!file) return;
    setImageUploadError(null);
    setImageUploading(true);

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `campaigns/images/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("content").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("content").getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Unable to get uploaded image URL");

      setForm((prev) => ({
        ...prev,
        content: { ...((prev.content as CampaignContent) || {}), image_url: data.publicUrl },
      }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      setImageUploadError("Image upload failed");
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      type: "",
      status: "draft",
      priority: 50,
      start_date: "",
      end_date: "",
      is_active: true,
      locations: ["homepage.hero"],
      targeting_rules: defaultTargeting,
      content: defaultContent,
      ctas: [defaultCTA],
      analytics: DEFAULT_CAMPAIGN_ANALYTICS,
    });
    setEditingCampaign(null);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      ...campaign,
      locations: campaign.locations || ["homepage.hero"],
      targeting_rules: campaign.targeting_rules || defaultTargeting,
      content: campaign.content || defaultContent,
      ctas: campaign.ctas || [defaultCTA],
      analytics: campaign.analytics || DEFAULT_CAMPAIGN_ANALYTICS,
    });
    setDialogOpen(true);
  };

  const openNewDonationCard = () => {
    setEditingCampaign(null);
    setForm({
      name: "Donation Card",
      slug: `donation-card-${Date.now()}`,
      description: "Create a donation campaign card for the donate page.",
      type: "Donation",
      status: "running",
      priority: 50,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      is_active: true,
      locations: ["donate.top"],
      targeting_rules: {
        ...defaultTargeting,
        page_types: ["donate"],
      },
      content: {
        ...defaultContent,
        headline: "Support the Temple",
        message: "Create a beautiful donation card with full amount and custom amount actions.",
        badge: "Donation",
        target_amount: undefined,
        default_full_amount: undefined,
        min_custom_amount: undefined,
        max_custom_amount: undefined,
        button_color: "#f97316",
        featured: true,
      },
      ctas: [
        {
          id: "cta-full-amount",
          label: "Donate Full Amount",
          url: "/donate",
          type: "payment",
          icon: "",
          open_new_tab: false,
          is_popup: false,
        },
        {
          id: "cta-custom-amount",
          label: "Donate Custom Amount",
          url: "/donate",
          type: "payment",
          icon: "",
          open_new_tab: false,
          is_popup: false,
        },
      ],
      analytics: DEFAULT_CAMPAIGN_ANALYTICS,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toast.error("Campaign name and slug are required");
      return;
    }

    setSaving(true);

    const validationIssues = getCampaignValidationIssues(draftCampaign, campaigns);
    if (validationIssues.length) {
      toast.error("Fix the validation issues before publishing");
      setSaving(false);
      return;
    }

    const payload: Partial<Campaign> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || "",
      type: form.type || "",
      status: (form.status as Campaign["status"]) || "draft",
      priority: typeof form.priority === "number" ? form.priority : 50,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active ?? true,
      locations: Array.isArray(form.locations)
        ? form.locations
        : normalizeStringList(form.locations as unknown as string),
      targeting_rules: form.targeting_rules || defaultTargeting,
      content: form.content || defaultContent,
      ctas: Array.isArray(form.ctas) && form.ctas.length > 0 ? form.ctas : [defaultCTA],
      analytics: form.analytics || DEFAULT_CAMPAIGN_ANALYTICS,
      updated_by: user?.id || null,
    };

    try {
      if (editingCampaign) {
        const updatePayload = buildSupabaseCampaignUpdatePayload(payload);
        const { error } = await supabase
          .from("campaigns")
          .update(updatePayload)
          .eq("id", editingCampaign.id);
        if (error) throw error;
        if ((payload.targeting_rules as Record<string, unknown>)?.group_name && (payload.targeting_rules as Record<string, unknown>)?.group_role === "parent") {
          await syncCampaignGroupState(String((payload.targeting_rules as Record<string, unknown>).group_name), payload.is_active ?? true, editingCampaign.id);
        }
        toast.success("Campaign updated");
      } else {
        const insertPayload = buildSupabaseCampaignInsertPayload(payload, {
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const { error } = await supabase.from("campaigns").insert(insertPayload);
        if (error) throw error;
        if ((payload.targeting_rules as Record<string, unknown>)?.group_name && (payload.targeting_rules as Record<string, unknown>)?.group_role === "parent") {
          await syncCampaignGroupState(String((payload.targeting_rules as Record<string, unknown>).group_name), payload.is_active ?? true, "new");
        }
        toast.success("Campaign created");
      }
      setDialogOpen(false);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error(error);
      toast.error("Unable to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete campaign");
      return;
    }
    toast.success("Campaign deleted");
    loadCampaigns();
  };

  const handleDuplicate = async (campaign: Campaign) => {
    const duplicated: Partial<Campaign> = {
      ...campaign,
      id: undefined as never,
      name: `${campaign.name} Copy`,
      slug: `${campaign.slug}-copy-${Date.now()}`,
      status: "draft",
      is_active: false,
      analytics: DEFAULT_CAMPAIGN_ANALYTICS,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const insertPayload = buildSupabaseCampaignInsertPayload(duplicated, {
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const { error } = await supabase.from("campaigns").insert(insertPayload);
    if (error) {
      toast.error("Failed to duplicate campaign");
      return;
    }
    toast.success("Campaign duplicated. Review the draft before publishing.");
    loadCampaigns();
  };

  const handleToggleStatus = async (campaign: Campaign, paused: boolean) => {
    const { error } = await supabase.from("campaigns").update({ status: paused ? "paused" : "running" }).eq("id", campaign.id);
    if (error) {
      toast.error("Unable to update campaign status");
      return;
    }
    toast.success(`Campaign ${paused ? "paused" : "resumed"}`);
    loadCampaigns();
  };

  const availableLocations = useMemo(() => predefinedLocations, []);

  const draftCampaign = useMemo<Campaign>(() => ({
    id: editingCampaign?.id || "draft",
    name: form.name || "Draft Campaign",
    slug: form.slug || "draft-campaign",
    description: form.description || null,
    type: form.type || "General",
    status: (form.status as Campaign["status"]) || "draft",
    priority: typeof form.priority === "number" ? form.priority : 50,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    is_active: form.is_active ?? true,
    locations: Array.isArray(form.locations) ? form.locations : [],
    targeting_rules: (form.targeting_rules as Record<string, unknown>) || defaultTargeting,
    content: form.content || defaultContent,
    ctas: Array.isArray(form.ctas) && form.ctas.length > 0 ? form.ctas : [defaultCTA],
    analytics: form.analytics || DEFAULT_CAMPAIGN_ANALYTICS,
    created_by: user?.id || null,
    updated_by: user?.id || null,
    created_at: null,
    updated_at: null,
  }), [editingCampaign?.id, form.analytics, form.content, form.ctas, form.description, form.end_date, form.is_active, form.locations, form.name, form.priority, form.slug, form.start_date, form.status, form.targeting_rules, form.type, user?.id]);

  const validationIssues = useMemo(() => getCampaignValidationIssues(draftCampaign, campaigns), [campaigns, draftCampaign]);
  const conflictIssues = useMemo(() => getCampaignConflictIssues(draftCampaign, campaigns), [campaigns, draftCampaign]);
  const healthScore = useMemo(() => getCampaignHealthScore(draftCampaign), [draftCampaign]);
  const groupSuggestions = useMemo(() => Array.from(new Set(campaigns.map((campaign) => (campaign.targeting_rules as Record<string, unknown>)?.group_name).filter(Boolean) as string[])), [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const effectiveStatus = getEffectiveCampaignStatus(campaign);
      const matchesSearch = [campaign.name, campaign.type || "", campaign.slug, (campaign.locations || []).join(" "), (campaign.targeting_rules as Record<string, unknown>)?.group_name || ""]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
      const matchesType = typeFilter === "all" || (campaign.type || "General").toLowerCase() === typeFilter.toLowerCase();
      const matchesPlacement = placementFilter === "all" || (campaign.locations || []).some((location) => location.toLowerCase().includes(placementFilter.toLowerCase()));
      const matchesPriority = priorityFilter === "all" || (campaign.priority ?? 50) <= Number(priorityFilter);
      const matchesGroup = groupFilter === "all" || ((campaign.targeting_rules as Record<string, unknown>)?.group_name || "standalone") === groupFilter;
      const matchesView = campaignViewFilter === "all"
        || (campaignViewFilter === "running" && effectiveStatus === "running")
        || (campaignViewFilter === "upcoming" && effectiveStatus === "scheduled")
        || (campaignViewFilter === "expired" && effectiveStatus === "expired")
        || (campaignViewFilter === "festival" && (campaign.type || "").toLowerCase().includes("festival"));
      return matchesSearch && matchesStatus && matchesType && matchesPlacement && matchesPriority && matchesGroup && matchesView;
    });
  }, [campaigns, campaignViewFilter, groupFilter, placementFilter, priorityFilter, searchTerm, statusFilter, typeFilter]);

  const calendarItems = useMemo(() => campaigns.map((campaign) => ({
    ...campaign,
    effectiveStatus: getEffectiveCampaignStatus(campaign),
    timelineState: getCampaignTimelineState(campaign),
  })), [campaigns]);

  const toggleSelection = (id: string) => {
    setSelectedCampaignIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const syncCampaignGroupState = async (groupName: string, parentActive: boolean, parentId: string) => {
    if (!groupName) return;
    const { data, error } = await supabase.from("campaigns").select("id, targeting_rules").eq("targeting_rules->>group_name", groupName);
    if (error) return;
    const siblings = (data || []).filter((item) => item.id !== parentId);
    if (!siblings.length) return;
    const updates = siblings.map((item) => supabase.from("campaigns").update({ is_active: parentActive }).eq("id", item.id));
    await Promise.all(updates);
  };

  const applyBulkAction = async (action: "pause" | "resume" | "archive" | "duplicate" | "delete") => {
    if (!selectedCampaignIds.length) return;

    const selected = campaigns.filter((campaign) => selectedCampaignIds.includes(campaign.id));
    if (action === "delete") {
      for (const campaign of selected) {
        const { error } = await supabase.from("campaigns").delete().eq("id", campaign.id);
        if (error) {
          toast.error(`Failed to delete ${campaign.name}`);
          return;
        }
      }
      toast.success(`Deleted ${selected.length} campaigns`);
    } else if (action === "duplicate") {
      for (const campaign of selected) {
        const duplicated: Partial<Campaign> = {
          ...campaign,
          id: undefined as never,
          name: `${campaign.name} Copy`,
          slug: `${campaign.slug}-copy-${Date.now()}`,
          status: "draft",
          is_active: false,
          analytics: DEFAULT_CAMPAIGN_ANALYTICS,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const insertPayload = buildSupabaseCampaignInsertPayload(duplicated, {
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const { error } = await supabase.from("campaigns").insert(insertPayload);
        if (error) {
          toast.error(`Failed to duplicate ${campaign.name}`);
          return;
        }
      }
      toast.success(`Duplicated ${selected.length} campaigns`);
    } else {
      const status = action === "pause" ? "paused" : action === "archive" ? "archived" : "running";
      for (const campaign of selected) {
        const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaign.id);
        if (error) {
          toast.error(`Failed to ${action} ${campaign.name}`);
          return;
        }
      }
      toast.success(`Applied ${action} to ${selected.length} campaigns`);
    }

    setSelectedCampaignIds([]);
    loadCampaigns();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Campaign Manager</h1>
          <p className="text-muted-foreground mt-1">Create, schedule, and target campaigns across the website without code.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setActiveView("calendar")}>Calendar</Button>
          <Button variant="outline" onClick={() => setActiveView("timeline")}>Timeline</Button>
          <Button variant="outline" onClick={() => setActiveView("health")}>Health</Button>
          <Button variant="outline" onClick={openNewDonationCard}>New Donation Card</Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-saffron text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Build a configurable campaign with display locations, rules, creative assets and CTAs.
                </p>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="campaign-slug" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Input value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Festival, Donation, Booking, Announcement" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status || "draft"} onValueChange={(value) => setForm({ ...form, status: value as Campaign["status"] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={form.priority ?? 50}
                      onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                      placeholder="Lower numbers = higher priority"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label className="block">Start Date</Label>
                      <Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <Label className="block">End Date</Label>
                      <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Display Locations</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableLocations.map((location) => {
                        const selected = (form.locations || []).includes(location);
                        return (
                          <button
                            type="button"
                            key={location}
                            onClick={() => {
                              const currentLocations = Array.isArray(form.locations) ? form.locations : [];
                              if (selected) {
                                setForm({ ...form, locations: currentLocations.filter((item) => item !== location) });
                              } else {
                                setForm({ ...form, locations: [...currentLocations, location] });
                              }
                            }}
                            className={`rounded-full border px-3 py-2 text-xs text-left transition ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}
                          >
                            {location.replace(/_/g, " ")}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Select the page sections where this campaign should appear.</p>
                  </div>
                  <div>
                    <Label>Custom Route</Label>
                    <Input
                      value={(form.targeting_rules as any)?.custom_route || ""}
                      onChange={(e) => setForm({
                        ...form,
                        targeting_rules: {
                          ...((form.targeting_rules as any) || {}),
                          custom_route: e.target.value,
                        },
                      })}
                      placeholder="/special-offer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Optional route-based targeting for custom pages.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Target Page Types</Label>
                    <Input
                      value={((form.targeting_rules as any)?.page_types || []).join(", ")}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          targeting_rules: {
                            ...((form.targeting_rules as any) || {}),
                            page_types: normalizeStringList(e.target.value),
                          },
                        });
                      }}
                      placeholder="homepage, blog, knowledge"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated content types for campaign targeting.</p>
                  </div>
                  <div>
                    <Label>Traffic Rules</Label>
                    <Select
                      value={((form.targeting_rules as any)?.logged_in as string) || "any"}
                      onValueChange={(value) => setForm({
                        ...form,
                        targeting_rules: {
                          ...((form.targeting_rules as any) || {}),
                          logged_in: value,
                        },
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any visitor</SelectItem>
                        <SelectItem value="logged_in">Logged in only</SelectItem>
                        <SelectItem value="guest">Guest only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>URL contains</Label>
                    <Input
                      value={(form.targeting_rules as any)?.url_contains || ""}
                      onChange={(e) => setForm({
                        ...form,
                        targeting_rules: {
                          ...((form.targeting_rules as any) || {}),
                          url_contains: e.target.value,
                        },
                      })}
                      placeholder="rudrabhishek"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={(form.targeting_rules as any)?.category || ""}
                      onChange={(e) => setForm({
                        ...form,
                        targeting_rules: {
                          ...((form.targeting_rules as any) || {}),
                          category: e.target.value,
                        },
                      })}
                      placeholder="Festival"
                    />
                  </div>
                  <div>
                    <Label>Keywords</Label>
                    <Input
                      value={(form.targeting_rules as any)?.search_keywords || ""}
                      onChange={(e) => setForm({
                        ...form,
                        targeting_rules: {
                          ...((form.targeting_rules as any) || {}),
                          search_keywords: e.target.value,
                        },
                      })}
                      placeholder="donation, booking"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Headline</Label>
                    <Input
                      value={(form.content?.headline) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), headline: e.target.value },
                      })}
                      placeholder="Campaign headline"
                    />
                  </div>
                  <div>
                    <Label>Badge</Label>
                    <Input
                      value={(form.content?.badge) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), badge: e.target.value },
                      })}
                      placeholder="Festival Special"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={(form.content?.message) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), message: e.target.value },
                      })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={(form.content?.image_url) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), image_url: e.target.value },
                      })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        Upload image
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void uploadCampaignImage(e.target.files?.[0])}
                        />
                      </label>
                      {imageUploading ? <span className="text-sm text-muted-foreground">Uploading…</span> : null}
                    </div>
                    {imageUploadError ? <p className="mt-1 text-sm text-destructive">{imageUploadError}</p> : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Mobile Image URL</Label>
                    <Input
                      value={(form.content?.mobile_image_url) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), mobile_image_url: e.target.value },
                      })}
                      placeholder="https://example.com/mobile-banner.jpg"
                    />
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      value={(form.content?.background_color) || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), background_color: e.target.value },
                      })}
                      placeholder="#F8E0C6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Gallery (comma-separated URLs)</Label>
                    <Textarea
                      value={((form.content as CampaignContent)?.gallery || []).join(", ")}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), gallery: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) },
                      })}
                      rows={2}
                      placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    />
                  </div>
                  <div>
                    <Label>Icon URL</Label>
                    <Input
                      value={(form.content as CampaignContent)?.icon || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), icon: e.target.value },
                      })}
                      placeholder="https://example.com/icon.svg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Target Amount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(form.content as any)?.target_amount || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), target_amount: e.target.value ? Number(e.target.value) : undefined },
                      })}
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div>
                    <Label>Default Full Amount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(form.content as any)?.default_full_amount || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), default_full_amount: e.target.value ? Number(e.target.value) : undefined },
                      })}
                      placeholder="e.g. 2100"
                    />
                  </div>
                  <div>
                    <Label>Button Color</Label>
                    <Input
                      value={(form.content as CampaignContent)?.button_color || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), button_color: e.target.value },
                      })}
                      placeholder="#F97316 or saffron"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Min Custom Amount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(form.content as any)?.min_custom_amount || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), min_custom_amount: e.target.value ? Number(e.target.value) : undefined },
                      })}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <Label>Max Custom Amount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={(form.content as any)?.max_custom_amount || ""}
                      onChange={(e) => setForm({
                        ...form,
                        content: { ...((form.content as CampaignContent) || {}), max_custom_amount: e.target.value ? Number(e.target.value) : undefined },
                      })}
                      placeholder="e.g. 100000"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={(form.content as CampaignContent)?.featured || false} onCheckedChange={(value) => setForm({ ...form, content: { ...((form.content as CampaignContent) || {}), featured: value } })} />
                      <Label>Featured</Label>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Campaign Simulator</p>
                    <div className="flex flex-wrap gap-2">
                      {(["desktop", "tablet", "mobile", "popup", "hero", "sidebar", "announcement", "knowledge", "blog"] as const).map((view) => (
                        <Button key={view} size="sm" variant={simulatorView === view ? "default" : "outline"} onClick={() => setSimulatorView(view)}>{view}</Button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <CampaignRenderer campaign={draftCampaign} />
                  </div>
                  <p className="text-xs text-muted-foreground">Preview updates using the current campaign data across desktop, mobile, popup, and content placements.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Call To Action Buttons</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const current = Array.isArray(form.ctas) ? form.ctas : [];
                        setForm({ ...form, ctas: [...current, { ...defaultCTA, id: `cta-${Date.now()}` }] });
                      }}
                    >
                      Add CTA
                    </Button>
                  </div>

                  {(Array.isArray(form.ctas) ? form.ctas : []).map((cta, index) => (
                    <Card key={cta.id} className="border-border/70">
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div>
                            <Label>Label</Label>
                            <Input
                              value={cta.label}
                              onChange={(e) => {
                                const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                                current[index] = { ...current[index], label: e.target.value } as CampaignCTA;
                                setForm({ ...form, ctas: current });
                              }}
                            />
                          </div>
                          <div>
                            <Label>URL</Label>
                            <Input
                              value={cta.url}
                              onChange={(e) => {
                                const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                                current[index] = { ...current[index], url: e.target.value } as CampaignCTA;
                                setForm({ ...form, ctas: current });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={cta.type}
                              onValueChange={(value) => {
                                const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                                current[index] = { ...current[index], type: value as CampaignCTA["type"] } as CampaignCTA;
                                setForm({ ...form, ctas: current });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={cta.open_new_tab}
                              onCheckedChange={(value) => {
                                const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                                current[index] = { ...current[index], open_new_tab: value } as CampaignCTA;
                                setForm({ ...form, ctas: current });
                              }}
                            />
                            <span className="text-sm">Open in new tab</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={cta.is_popup}
                              onCheckedChange={(value) => {
                                const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                                current[index] = { ...current[index], is_popup: value } as CampaignCTA;
                                setForm({ ...form, ctas: current });
                              }}
                            />
                            <span className="text-sm">Open as popup</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              const current = Array.isArray(form.ctas) ? [...form.ctas] : [];
                              current.splice(index, 1);
                              setForm({ ...form, ctas: current });
                            }}
                          >
                            Remove CTA
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-2xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Publishing checks</p>
                    <Badge>{validationIssues.length ? "Needs review" : "Ready"}</Badge>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {validationIssues.length > 0 ? validationIssues.map((issue) => <li key={issue}>{issue}</li>) : <li>No blocking validation issues.</li>}
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active ?? true} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
                  <Label>Active</Label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Preview</Label>
                    <div className="rounded-2xl border border-border p-4">
                      <CampaignRenderer campaign={{
                        id: editingCampaign?.id || "preview",
                        name: form.name || "Preview Campaign",
                        slug: form.slug || "preview-campaign",
                        description: form.description || null,
                        type: form.type || "Campaign",
                        status: "running",
                        priority: form.priority ?? 50,
                        start_date: form.start_date || null,
                        end_date: form.end_date || null,
                        is_active: form.is_active ?? true,
                        locations: form.locations || ["homepage.hero"],
                        targeting_rules: form.targeting_rules || defaultTargeting,
                        content: form.content || defaultContent,
                        ctas: Array.isArray(form.ctas) ? form.ctas : [defaultCTA],
                        analytics: form.analytics || DEFAULT_CAMPAIGN_ANALYTICS,
                        created_by: user?.id || null,
                        updated_by: user?.id || null,
                        created_at: null,
                        updated_at: null,
                      }} />
                    </div>
                  </div>
                  <div>
                    <div className="rounded-2xl border border-border p-4 space-y-3 bg-muted/10">
                      <p className="font-semibold">Preview details</p>
                      <p className="text-sm text-muted-foreground">Campaign slug: {form.slug || "campaign-slug"}</p>
                      <p className="text-sm text-muted-foreground">Display on: {(form.locations || []).join(", ")}</p>
                      <p className="text-sm text-muted-foreground">Targeting: {(form.targeting_rules as any)?.page_types?.join(", ") || "Any"}</p>
                      <p className="text-sm text-muted-foreground">CTA buttons: {(Array.isArray(form.ctas) ? form.ctas.length : 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {editingCampaign ? "Update Campaign" : "Save Campaign"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Operations</p>
                <p className="text-sm text-muted-foreground">Group campaigns, search quickly, and manage large launches.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAdvanced((value) => !value)}>Advanced</Button>
                <Button size="sm" variant="outline" onClick={() => applyBulkAction("pause")}>Pause</Button>
                <Button size="sm" variant="outline" onClick={() => applyBulkAction("resume")}>Resume</Button>
                <Button size="sm" variant="outline" onClick={() => applyBulkAction("archive")}>Archive</Button>
                <Button size="sm" variant="outline" onClick={() => applyBulkAction("duplicate")}>Duplicate</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => applyBulkAction("delete")}>Delete</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <Input placeholder="Search campaigns" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(campaigns.map((campaign) => campaign.type || "General"))).map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={campaignViewFilter} onValueChange={setCampaignViewFilter}>
                <SelectTrigger><SelectValue placeholder="View" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Views</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groupSuggestions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showAdvanced ? <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={placementFilter} onValueChange={setPlacementFilter}>
                <SelectTrigger><SelectValue placeholder="Placement" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Placements</SelectItem>
                  {predefinedLocations.map((location) => <SelectItem key={location} value={location}>{getLocationLabel(location)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="25">Up to 25</SelectItem>
                  <SelectItem value="50">Up to 50</SelectItem>
                  <SelectItem value="75">Up to 75</SelectItem>
                  <SelectItem value="100">Up to 100</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Campaign group name" value={(form.targeting_rules as Record<string, unknown>)?.group_name as string || ""} onChange={(event) => setForm({ ...form, targeting_rules: { ...((form.targeting_rules as Record<string, unknown>) || {}), group_name: event.target.value } })} />
            </div> : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="font-semibold">Campaign Groups</p>
            <p className="text-sm text-muted-foreground">Use a parent group to coordinate related child campaigns for festivals and launches.</p>
            <Input placeholder="Parent group name" value={(form.targeting_rules as Record<string, unknown>)?.group_name as string || ""} onChange={(event) => setForm({ ...form, targeting_rules: { ...((form.targeting_rules as Record<string, unknown>) || {}), group_name: event.target.value } })} />
            <Select value={((form.targeting_rules as Record<string, unknown>)?.group_role as string) || "standalone"} onValueChange={(value) => setForm({ ...form, targeting_rules: { ...((form.targeting_rules as Record<string, unknown>) || {}), group_role: value } })}>
              <SelectTrigger><SelectValue placeholder="Group role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Standalone</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Parent campaigns can drive child campaigns for related placements and launches.</p>
          </CardContent>
        </Card>
      </div>

      {activeView === "calendar" ? (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={calendarView === "month" ? "default" : "outline"} onClick={() => setCalendarView("month")}>Month</Button>
              <Button size="sm" variant={calendarView === "week" ? "default" : "outline"} onClick={() => setCalendarView("week")}>Week</Button>
              <Button size="sm" variant={calendarView === "timeline" ? "default" : "outline"} onClick={() => setCalendarView("timeline")}>Timeline</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {calendarItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge className="capitalize">{item.timelineState}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.start_date || "No start date"}</p>
                  <p className="text-xs text-muted-foreground">{item.end_date || "No end date"}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.locations.slice(0, 2).join(", ") || "No placement"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeView === "timeline" ? (
        <Card>
          <CardContent className="space-y-4 py-4">
            <p className="font-semibold">Campaign Timeline</p>
            <div className="space-y-3">
              {calendarItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge className="capitalize">{item.timelineState}</Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, 20 + (item.priority ?? 50))}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.start_date || "No start date"} → {item.end_date || "No end date"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeView === "health" ? (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Campaign Health</p>
              <Badge>{healthScore.label}</Badge>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm">Score: <span className="font-semibold">{healthScore.score}</span>/100</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {healthScore.issues.length > 0 ? healthScore.issues.map((issue) => <li key={issue}>{issue}</li>) : <li>All core checks look healthy.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="font-medium">Validation checks</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {validationIssues.length > 0 ? validationIssues.map((issue) => <li key={issue}>{issue}</li>) : <li>No blocking validation issues.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="font-medium">Conflict warnings</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {conflictIssues.length > 0 ? conflictIssues.map((issue) => <li key={issue}>{issue}</li>) : <li>No active conflicts detected.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-14 text-center text-muted-foreground">
          No campaigns found yet. Create your first campaign to start promoting festival, donation, booking, and announcement experiences.
        </div>
      ) : (
        <div className="rounded-3xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={selectedCampaignIds.length > 0 && selectedCampaignIds.length === filteredCampaigns.length} onChange={() => setSelectedCampaignIds(selectedCampaignIds.length === filteredCampaigns.length ? [] : filteredCampaigns.map((campaign) => campaign.id))} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const effectiveStatus = getEffectiveCampaignStatus(campaign);
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <input type="checkbox" checked={selectedCampaignIds.includes(campaign.id)} onChange={() => toggleSelection(campaign.id)} />
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-[180px]">{campaign.name}</TableCell>
                    <TableCell>{campaign.type || "General"}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{(campaign.locations || []).join(", ")}</TableCell>
                    <TableCell>
                      <Badge className="capitalize">{effectiveStatus}</Badge>
                    </TableCell>
                    <TableCell>{campaign.priority ?? 50}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewCampaign(campaign)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(campaign)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicate(campaign)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(campaign, effectiveStatus !== "paused")}>
                        {effectiveStatus === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPreviewCampaign(campaign)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {previewCampaign && (
        <Dialog open={Boolean(previewCampaign)} onOpenChange={(open) => { if (!open) setPreviewCampaign(null); }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Campaign Preview</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <CampaignRenderer campaign={previewCampaign} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminCampaignsTable;
