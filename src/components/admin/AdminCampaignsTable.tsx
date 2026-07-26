import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Campaign, CampaignAnalytics, CampaignContent, CampaignCTA, CampaignContext, DEFAULT_CAMPAIGN_ANALYTICS, getEffectiveCampaignStatus, normalizeStringList } from "@/lib/campaigns";
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
    locations: ["homepage_top_banner"],
    targeting_rules: defaultTargeting,
    content: defaultContent,
    ctas: [defaultCTA],
    analytics: DEFAULT_CAMPAIGN_ANALYTICS,
  });

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
      setCampaigns((data as Campaign[]) || []);
    }
    setLoading(false);
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
      locations: ["homepage_top_banner"],
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
      locations: campaign.locations || ["homepage_top_banner"],
      targeting_rules: campaign.targeting_rules || defaultTargeting,
      content: campaign.content || defaultContent,
      ctas: campaign.ctas || [defaultCTA],
      analytics: campaign.analytics || DEFAULT_CAMPAIGN_ANALYTICS,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toast.error("Campaign name and slug are required");
      return;
    }

    setSaving(true);

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
        const { error } = await supabase
          .from("campaigns")
          .update(payload)
          .eq("id", editingCampaign.id);
        if (error) throw error;
        toast.success("Campaign updated");
      } else {
        const insertPayload = {
          ...payload,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("campaigns").insert(insertPayload);
        if (error) throw error;
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
    const { error } = await supabase.from("campaigns").insert(duplicated);
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
                        locations: form.locations || ["homepage_top_banner"],
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

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-14 text-center text-muted-foreground">
          No campaigns found yet. Create your first campaign to start promoting festival, donation, booking, and announcement experiences.
        </div>
      ) : (
        <div className="rounded-3xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const effectiveStatus = getEffectiveCampaignStatus(campaign);
                return (
                  <TableRow key={campaign.id}>
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
