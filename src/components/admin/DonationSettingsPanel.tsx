import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { DEFAULT_DONATION_SETTINGS, fetchDonationSettings, saveDonationSettings, type DonationSettings } from "@/lib/donationSettings";

const DonationSettingsPanel = () => {
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestedAmounts, setSuggestedAmounts] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await fetchDonationSettings();
        setSettings(loaded);
        setSuggestedAmounts(loaded.suggested_amounts.map((value) => String(value)));
      } catch (error) {
        console.error("Failed to load donation settings", error);
        setSettings(DEFAULT_DONATION_SETTINGS);
        setSuggestedAmounts(DEFAULT_DONATION_SETTINGS.suggested_amounts.map((value) => String(value)));
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
        suggested_amounts: parsedAmounts,
      };

      const saved = await saveDonationSettings(payload);
      setSettings(saved);
      setSuggestedAmounts(saved.suggested_amounts.map((value) => String(value)));
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
