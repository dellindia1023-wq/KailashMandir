import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ImagePlus } from "lucide-react";

interface PersonEntry {
  name: string;
  role?: string;
  designation?: string;
  title?: string;
  photo?: string;
  desc?: string;
  bio?: string;
  specialty?: string;
  exp?: string;
  [key: string]: any;
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [trustCommittee, setTrustCommittee] = useState<PersonEntry[]>([]);
  const [headPriests, setHeadPriests] = useState<PersonEntry[]>([]);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("about_settings").select("*").maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setForm(data);
        setTrustCommittee(Array.isArray(data.trust_committee) ? data.trust_committee : []);
        setHeadPriests(Array.isArray(data.head_priests) ? data.head_priests : []);
      } else {
        const empty = { hero_title: "", hero_subtitle: "", hero_image_url: "", trust_committee: [], head_priests: [], rituals: [] };
        setForm(empty);
        setTrustCommittee([]);
        setHeadPriests([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load about settings (falling back to defaults)");
      const empty = { hero_title: "", hero_subtitle: "", hero_image_url: "", trust_committee: [], head_priests: [], rituals: [] };
      setForm(empty);
      setTrustCommittee([]);
      setHeadPriests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const updateList = (type: "trust_committee" | "head_priests", list: PersonEntry[]) => {
    handleChange(type, list);
    if (type === "trust_committee") setTrustCommittee(list);
    if (type === "head_priests") setHeadPriests(list);
  };

  const addEntry = (type: "trust_committee" | "head_priests") => {
    const base = type === "trust_committee"
      ? { name: "New Member", role: "Member", desc: "Add description" }
      : { name: "New Priest", exp: "Years", specialty: "Specialty", desc: "Add description" };
    const list = type === "trust_committee" ? [...trustCommittee, base] : [...headPriests, base];
    updateList(type, list);
  };

  const removeEntry = (type: "trust_committee" | "head_priests", index: number) => {
    const source = type === "trust_committee" ? trustCommittee : headPriests;
    const updated = source.filter((_, i) => i !== index);
    updateList(type, updated);
  };

  const updateEntry = (type: "trust_committee" | "head_priests", index: number, field: string, value: string) => {
    const source = type === "trust_committee" ? trustCommittee : headPriests;
    const updated = source.map((item, i) => i === index ? { ...item, [field]: value } : item);
    updateList(type, updated);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `about/${Date.now()}.${ext}`;
    try {
      const { error: uploadError } = await supabase.storage.from('content').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('content').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
      return null;
    }
  };

  const handleHeroImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadImage(f);
    if (url) handleChange('hero_image_url', url);
  };

  const handleEntryImageUpload = async (type: "trust_committee" | "head_priests", index: number, file?: File) => {
    if (!file) return;
    const url = await uploadImage(file);
    if (!url) return;
    if (type === "trust_committee") {
      const updated = trustCommittee.map((item, i) => i === index ? { ...item, photo: url } : item);
      updateList(type, updated);
    } else {
      const updated = headPriests.map((item, i) => i === index ? { ...item, photo: url } : item);
      updateList(type, updated);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        trust_committee: trustCommittee,
        head_priests: headPriests,
        updated_at: new Date().toISOString(),
      };

      // Try update first
      const { data: existing } = await supabase.from("about_settings").select("id").maybeSingle();
      if (existing && existing.id) {
        const { error } = await supabase.from("about_settings").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("about_settings").insert([{ ...payload, is_active: true }]);
        if (error) throw error;
      }

      toast.success("About page updated");
      await fetchAbout();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save about settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>About Page Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Title</Label>
            <Input value={form.hero_title || ""} onChange={(e) => handleChange("hero_title", e.target.value)} />
          </div>
          <div>
            <Label>Hero Subtitle</Label>
            <Textarea value={form.hero_subtitle || ""} onChange={(e) => handleChange("hero_subtitle", e.target.value)} />
          </div>
          <div>
            <Label>Hero Image URL</Label>
            <div className="flex items-center gap-3">
              <Input value={form.hero_image_url || ""} onChange={(e) => handleChange("hero_image_url", e.target.value)} />
              <input type="file" accept="image/*" onChange={handleHeroImageFile} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Trust Committee</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addEntry("trust_committee")}>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </div>
            {trustCommittee.map((member, index) => (
              <Card key={`trust-${index}`} className="border-border/70">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Member #{index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry("trust_committee", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <Input value={member.name || ""} onChange={(e) => updateEntry("trust_committee", index, "name", e.target.value)} />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input value={member.role || ""} onChange={(e) => updateEntry("trust_committee", index, "role", e.target.value)} />
                    </div>
                    <div>
                      <Label>Photo URL</Label>
                      <Input value={member.photo || ""} onChange={(e) => updateEntry("trust_committee", index, "photo", e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-background px-3 text-sm text-muted-foreground">
                        <ImagePlus className="mr-2 h-4 w-4" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEntryImageUpload("trust_committee", index, e.target.files?.[0])} />
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={member.desc || ""} onChange={(e) => updateEntry("trust_committee", index, "desc", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Head Priests</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addEntry("head_priests")}>
                <Plus className="mr-2 h-4 w-4" /> Add Priest
              </Button>
            </div>
            {headPriests.map((priest, index) => (
              <Card key={`priest-${index}`} className="border-border/70">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Priest #{index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry("head_priests", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <Input value={priest.name || ""} onChange={(e) => updateEntry("head_priests", index, "name", e.target.value)} />
                    </div>
                    <div>
                      <Label>Experience</Label>
                      <Input value={priest.exp || ""} onChange={(e) => updateEntry("head_priests", index, "exp", e.target.value)} />
                    </div>
                    <div>
                      <Label>Specialty</Label>
                      <Input value={priest.specialty || ""} onChange={(e) => updateEntry("head_priests", index, "specialty", e.target.value)} />
                    </div>
                    <div>
                      <Label>Photo URL</Label>
                      <Input value={priest.photo || ""} onChange={(e) => updateEntry("head_priests", index, "photo", e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-background px-3 text-sm text-muted-foreground">
                        <ImagePlus className="mr-2 h-4 w-4" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleEntryImageUpload("head_priests", index, e.target.files?.[0])} />
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={priest.desc || ""} onChange={(e) => updateEntry("head_priests", index, "desc", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            <Button variant="outline" onClick={fetchAbout}>Reload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
