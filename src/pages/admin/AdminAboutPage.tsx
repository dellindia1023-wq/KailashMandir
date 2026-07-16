import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("about_settings").select("*").maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (data) setForm(data);
      else setForm({ hero_title: "", hero_subtitle: "", hero_image_url: "", trust_committee: [],                                                            head_priests: [], rituals: [] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load about settings (falling back to defaults)");
      setForm({ hero_title: "", hero_subtitle: "", hero_image_url: "", trust_committee: [], head_priests: [], rituals: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
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

          <div>
            <Label>Trust Committee (JSON array)</Label>
            <Textarea value={JSON.stringify(form.trust_committee || [], null, 2)} onChange={(e) => {
              try { handleChange("trust_committee", JSON.parse(e.target.value)); } catch { handleChange("trust_committee", e.target.value); }
            }} />
          </div>

          <div>
            <Label>Head Priests (JSON array)</Label>
            <Textarea value={JSON.stringify(form.head_priests || [], null, 2)} onChange={(e) => {
              try { handleChange("head_priests", JSON.parse(e.target.value)); } catch { handleChange("head_priests", e.target.value); }
            }} />
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
