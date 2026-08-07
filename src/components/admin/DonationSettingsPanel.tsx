import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { DEFAULT_DONATION_SETTINGS, fetchDonationSettings, saveDonationSettings, type DonationSettings } from "@/lib/donationSettings";

const DonationSettingsPanel = () => {
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestedAmounts, setSuggestedAmounts] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [proofUploadLoading, setProofUploadLoading] = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);
  const proofVideoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await fetchDonationSettings();
        setSettings(loaded);
        setSuggestedAmounts(loaded.suggested_amounts.map((value) => String(value)));
        setPaymentMethods(loaded.payment_methods);
      } catch (error) {
        console.error("Failed to load donation settings", error);
        setSettings(DEFAULT_DONATION_SETTINGS);
        setSuggestedAmounts(DEFAULT_DONATION_SETTINGS.suggested_amounts.map((value) => String(value)));
        setPaymentMethods(DEFAULT_DONATION_SETTINGS.payment_methods);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateSetting = <K extends keyof DonationSettings>(key: K, value: DonationSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateSuggestedAmount = (index: number, value: string) => {
    setSuggestedAmounts((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addSuggestedAmount = () => {
    setSuggestedAmounts((current) => [...current, ""]);
  };

  const addPaymentMethod = () => {
    setPaymentMethods((current) => [...current, ""]);
  };

  const removeSuggestedAmount = (index: number) => {
    setSuggestedAmounts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveSuggestedAmount = (index: number, direction: -1 | 1) => {
    setSuggestedAmounts((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const updatePaymentMethod = (index: number, value: string) => {
    setPaymentMethods((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const isYouTubeUrl = (url: string) => /(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(url);

  const clearProofVideo = () => {
    setSettings((current) => ({ ...current, proof_video_url: "" }));
    setProofUploadError(null);
  };

  const uploadProofVideo = async (file: File | undefined) => {
    if (!file) return;

    setProofUploadError(null);
    setProofUploadLoading(true);

    try {
      const fileExt = file.name.split(".").pop() || "mp4";
      const filePath = `donation/proof-videos/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("content").upload(filePath, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("content").getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Unable to get proof video URL");

      setSettings((current) => ({ ...current, proof_video_url: data.publicUrl }));
      toast.success("Proof video uploaded successfully.");
    } catch (error) {
      console.error(error);
      setProofUploadError("Unable to upload proof video.");
      toast.error("Proof video upload failed.");
    } finally {
      setProofUploadLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedAmounts = suggestedAmounts
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);

      const payload: DonationSettings = {
        ...settings,
        default_amount: Number(settings.default_amount),
        minimum_amount: Number(settings.minimum_amount),
        maximum_amount: Number(settings.maximum_amount),
        proof_video_url: settings.proof_video_url || "",
        suggested_amounts: parsedAmounts,
        payment_methods: paymentMethods.map((value) => value.trim()).filter(Boolean),
      };

      const saved = await saveDonationSettings(payload);
      setSettings(saved);
      setSuggestedAmounts(saved.suggested_amounts.map((value) => String(value)));
      setPaymentMethods(saved.payment_methods);
      toast.success("Donation settings saved.");
    } catch (error: any) {
      console.error("Failed to save donation settings", error);
      toast.error(error?.message || "Failed to save donation settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Donation Configuration</CardTitle>
        <CardDescription>Manage donation amounts, quick picks, and payment toggles from one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Default Donation Amount</Label>
            <Input
              type="number"
              min="1"
              value={settings.default_amount}
              onChange={(event) => updateSetting("default_amount", Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Minimum Donation</Label>
            <Input
              type="number"
              min="1"
              value={settings.minimum_amount}
              onChange={(event) => updateSetting("minimum_amount", Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Donation</Label>
            <Input
              type="number"
              min="1"
              value={settings.maximum_amount}
              onChange={(event) => updateSetting("maximum_amount", Number(event.target.value || 0))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Card Title</Label>
            <Input value={settings.card_title} onChange={(event) => updateSetting("card_title", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Card CTA Text</Label>
            <Input value={settings.card_cta_text} onChange={(event) => updateSetting("card_cta_text", event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Card Subtitle</Label>
          <Input value={settings.card_subtitle} onChange={(event) => updateSetting("card_subtitle", event.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Hero Image URL
            </Label>
            <Input value={settings.hero_image_url} onChange={(event) => updateSetting("hero_image_url", event.target.value)} placeholder="https://example.com/hero.jpg" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Proof Video URL
            </Label>
            <div className="space-y-2">
              <Input value={settings.proof_video_url} onChange={(event) => updateSetting("proof_video_url", event.target.value)} placeholder="https://example.com/proof.mp4" />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  Upload proof video
                  <input
                    ref={proofVideoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadProofVideo(file);
                      }
                    }}
                  />
                </label>
                {settings.proof_video_url ? (
                  <Button type="button" variant="outline" size="sm" onClick={clearProofVideo}>
                    Clear
                  </Button>
                ) : null}
              </div>
              {proofUploadLoading ? <span className="text-sm text-muted-foreground">Uploading…</span> : null}
              {proofUploadError ? <p className="text-sm text-destructive">{proofUploadError}</p> : null}
            </div>
            {settings.proof_video_url ? (
              <div className="rounded-lg border border-border p-3 bg-surface">
                {isYouTubeUrl(settings.proof_video_url) ? (
                  <div className="overflow-hidden rounded-lg aspect-video">
                    <iframe
                      src={settings.proof_video_url.includes("youtube.com/watch?v=")
                        ? settings.proof_video_url.replace("watch?v=", "embed/")
                        : settings.proof_video_url.replace("youtu.be/", "www.youtube.com/embed/")}
                      title="Proof video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <video controls className="w-full rounded-lg border border-border" src={settings.proof_video_url} />
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Payment Methods</Label>
              <p className="text-sm text-muted-foreground">Configure the chips shown below the donation form.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addPaymentMethod}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {paymentMethods.map((method, index) => (
              <div key={`${method}-${index}`} className="flex items-center gap-2">
                <Input value={method} onChange={(event) => updatePaymentMethod(index, event.target.value)} placeholder="UPI" />
                <Button type="button" variant="outline" size="icon" onClick={() => removePaymentMethod(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Suggested Amounts</Label>
              <p className="text-sm text-muted-foreground">Add, remove, or reorder the quick select values shown to donors.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addSuggestedAmount}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {suggestedAmounts.map((amount, index) => (
              <div key={`${amount}-${index}`} className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => updateSuggestedAmount(index, event.target.value)}
                  placeholder="Enter amount"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => moveSuggestedAmount(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => moveSuggestedAmount(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => removeSuggestedAmount(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enable Suggested Amounts</Label>
              <p className="text-sm text-muted-foreground">Show the amount chips on the donation form.</p>
            </div>
            <Switch checked={settings.enable_suggested_amounts} onCheckedChange={(value) => updateSetting("enable_suggested_amounts", value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enable Custom Amount</Label>
              <p className="text-sm text-muted-foreground">Allow donors to enter their own amount.</p>
            </div>
            <Switch checked={settings.enable_custom_amount} onCheckedChange={(value) => updateSetting("enable_custom_amount", value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enable Razorpay</Label>
              <p className="text-sm text-muted-foreground">Turn the donation checkout on or off.</p>
            </div>
            <Switch checked={settings.enable_razorpay} onCheckedChange={(value) => updateSetting("enable_razorpay", value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enable Quick UPI</Label>
              <p className="text-sm text-muted-foreground">Show the UPI payment method chip.</p>
            </div>
            <Switch checked={settings.enable_quick_upi} onCheckedChange={(value) => updateSetting("enable_quick_upi", value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Show QR Code</Label>
              <p className="text-sm text-muted-foreground">Display the donation QR card below the form.</p>
            </div>
            <Switch checked={settings.show_qr_code} onCheckedChange={(value) => updateSetting("show_qr_code", value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Show Payment Methods</Label>
              <p className="text-sm text-muted-foreground">Display the accepted payment chips under the form.</p>
            </div>
            <Switch checked={settings.show_payment_methods} onCheckedChange={(value) => updateSetting("show_payment_methods", value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Donation Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationSettingsPanel;
