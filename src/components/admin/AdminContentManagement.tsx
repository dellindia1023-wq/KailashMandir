import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle } from "lucide-react";

type HeroMediaItem = {
  url: string;
  alt?: string;
  media_type?: "image" | "video";
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  display_order?: number;
  active?: boolean;
};

interface HomepageSettings {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_images: HeroMediaItem[] | null;
  years_of_heritage: number;
  daily_devotees: number;
  days_open: number;
  announcement: string | null;
  announcement_enabled: boolean;
  updated_at: string;
}

export const AdminContentManagement = () => {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroItems, setHeroItems] = useState<HeroMediaItem[]>([]);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMediaType, setUploadMediaType] = useState<"image" | "video" | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_button_text: "",
    hero_button_link: "",
    years_of_heritage: 0,
    daily_devotees: 0,
    days_open: 0,
    announcement: "",
    announcement_enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("homepage_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          hero_title: data.hero_title,
          hero_subtitle: data.hero_subtitle,
          hero_button_text: data.hero_button_text,
          hero_button_link: data.hero_button_link,
          years_of_heritage: data.years_of_heritage,
          daily_devotees: data.daily_devotees,
          days_open: data.days_open,
          announcement: data.announcement || "",
          announcement_enabled: data.announcement_enabled,
        });
        if (data.hero_images && Array.isArray(data.hero_images)) {
          setHeroItems(data.hero_images.map((item: HeroMediaItem) => ({
            ...item,
            active: item.active !== false,
            media_type: item.media_type || (item.url?.match(/\.(mp4|webm)(?:\?.*)?$/i) ? "video" : "image"),
          })));
        } else if (data.hero_image_url) {
          setHeroItems([{ url: data.hero_image_url, alt: "Hero image", media_type: "image", active: true }]);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith("image/");
      const isVideo = selectedFile.type.startsWith("video/");
      if (!isImage && !isVideo) {
        toast.error("Please select an image or video file");
        return;
      }
      // Validate file size (20MB max)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      setUploadMediaType(isVideo ? "video" : "image");
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const updateHeroItem = (index: number, changes: Partial<HeroMediaItem>) => {
    setHeroItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  };

  const uploadMedia = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `homepage/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("content").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload media");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let finalHeroItems = heroItems;

      if (file) {
        const mediaUrl = await uploadMedia(file);
        const mediaType = uploadMediaType || (file.type.startsWith("video/") ? "video" : "image");
        const currentDisplayOrder =
          selectedHeroIndex !== null && heroItems[selectedHeroIndex]
            ? heroItems[selectedHeroIndex].display_order ?? selectedHeroIndex
            : heroItems.length;

        const mediaItem: HeroMediaItem = {
          url: mediaUrl,
          alt: `Hero ${mediaType}`,
          media_type: mediaType,
          active: true,
          display_order: currentDisplayOrder,
        };

        if (selectedHeroIndex !== null && heroItems[selectedHeroIndex]) {
          finalHeroItems = heroItems.map((item, index) =>
            index === selectedHeroIndex ? { ...item, ...mediaItem } : item
          );
          setSelectedHeroIndex(null);
        } else {
          finalHeroItems = [...heroItems, mediaItem];
        }

        setFile(null);
        setPreviewUrl(null);
        setUploadMediaType(null);
      }

      const updateData = {
        ...formData,
        hero_images: finalHeroItems,
        hero_image_url: finalHeroItems.length > 0 ? finalHeroItems[0].url : null,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from("homepage_settings")
          .update(updateData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new if doesn't exist
        const { error } = await supabase
          .from("homepage_settings")
          .insert([{ ...updateData, is_active: true }]);

        if (error) throw error;
      }

      toast.success("Homepage settings saved successfully!");
      await fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Hero Section
            <Badge variant="outline">Primary</Badge>
          </CardTitle>
          <CardDescription>
            Manage the homepage hero banner content and image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Media Upload */}
          <div>
            <Label>Hero Media Items (Images & Videos)</Label>
            <div className="mt-2">
              {heroItems.length > 0 && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {heroItems.map((item, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-border bg-background">
                      <div className="relative">
                        {item.media_type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-32 object-cover"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.alt || "Hero media"}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">
                          {item.media_type || "image"}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title || item.alt || `Slide ${idx + 1}`}</p>
                            {item.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</p>}
                          </div>
                          <span className={`text-[10px] rounded-full px-2 py-1 ${item.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                            {item.active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedHeroIndex(idx)}
                            className="rounded-md border border-border px-2 py-2 text-left text-primary hover:bg-primary/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroItems(heroItems.filter((_, i) => i !== idx))}
                            className="rounded-md border border-border px-2 py-2 text-left text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const itemToCopy = heroItems[idx];
                              const copy = { ...itemToCopy, display_order: heroItems.length };
                              setHeroItems([...heroItems.slice(0, idx + 1), copy, ...heroItems.slice(idx + 1)]);
                            }}
                            className="rounded-md border border-border px-2 py-2 text-left text-primary hover:bg-primary/10"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (idx === 0) return;
                              const nextItems = [...heroItems];
                              [nextItems[idx - 1], nextItems[idx]] = [nextItems[idx], nextItems[idx - 1]];
                              setHeroItems(nextItems.map((item, index) => ({ ...item, display_order: index })));
                            }}
                            className="rounded-md border border-border px-2 py-2 text-left text-primary hover:bg-primary/10"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (idx === heroItems.length - 1) return;
                              const nextItems = [...heroItems];
                              [nextItems[idx + 1], nextItems[idx]] = [nextItems[idx], nextItems[idx + 1]];
                              setHeroItems(nextItems.map((item, index) => ({ ...item, display_order: index })));
                            }}
                            className="rounded-md border border-border px-2 py-2 text-left text-primary hover:bg-primary/10"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHeroItems(heroItems.map((item, index) => index === idx ? { ...item, active: !item.active } : item));
                            }}
                            className="rounded-md border border-border px-2 py-2 text-left text-primary hover:bg-primary/10"
                          >
                            {item.active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {previewUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-muted">
                  <div className="text-xs text-muted-foreground p-2">Preview (before uploading)</div>
                  {uploadMediaType === "video" ? (
                    <video
                      src={previewUrl}
                      className="w-full h-40 object-cover"
                      muted
                      loop
                      playsInline
                      controls={false}
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                  )}
                </div>
              )}

              {selectedHeroIndex !== null && heroItems[selectedHeroIndex] && (
                <div className="space-y-4 rounded-2xl border border-border bg-muted p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Edit Selected Hero Item</p>
                      <p className="text-xs text-muted-foreground">Changes are saved with the main Save button.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHeroIndex(null)}
                      className="text-xs text-primary hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="hero_item_title">Item Title</Label>
                      <Input
                        id="hero_item_title"
                        value={heroItems[selectedHeroIndex].title || ""}
                        onChange={(e) => updateHeroItem(selectedHeroIndex, { title: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero_item_subtitle">Item Subtitle</Label>
                      <Input
                        id="hero_item_subtitle"
                        value={heroItems[selectedHeroIndex].subtitle || ""}
                        onChange={(e) => updateHeroItem(selectedHeroIndex, { subtitle: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero_item_button_text">Item Button Text</Label>
                      <Input
                        id="hero_item_button_text"
                        value={heroItems[selectedHeroIndex].button_text || ""}
                        onChange={(e) => updateHeroItem(selectedHeroIndex, { button_text: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero_item_button_link">Item Button Link</Label>
                      <Input
                        id="hero_item_button_link"
                        value={heroItems[selectedHeroIndex].button_link || ""}
                        onChange={(e) => updateHeroItem(selectedHeroIndex, { button_link: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero_item_alt">Alt Text</Label>
                      <Input
                        id="hero_item_alt"
                        value={heroItems[selectedHeroIndex].alt || ""}
                        onChange={(e) => updateHeroItem(selectedHeroIndex, { alt: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WebP, MP4, WebM. Max 20MB. Add or replace hero media items.
              </p>
            </div>
          </div>

          {/* Hero Title */}
          <div>
            <Label htmlFor="hero_title">Hero Title</Label>
            <Input
              id="hero_title"
              name="hero_title"
              value={formData.hero_title}
              onChange={handleInputChange}
              placeholder="Enter hero title"
              className="mt-2"
            />
          </div>

          {/* Hero Subtitle */}
          <div>
            <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
            <Input
              id="hero_subtitle"
              name="hero_subtitle"
              value={formData.hero_subtitle}
              onChange={handleInputChange}
              placeholder="Enter hero subtitle"
              className="mt-2"
            />
          </div>

          {/* Button Text */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hero_button_text">Button Text</Label>
              <Input
                id="hero_button_text"
                name="hero_button_text"
                value={formData.hero_button_text}
                onChange={handleInputChange}
                placeholder="e.g., Book Puja"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="hero_button_link">Button Link</Label>
              <Input
                id="hero_button_link"
                name="hero_button_link"
                value={formData.hero_button_link}
                onChange={handleInputChange}
                placeholder="e.g., /pujas"
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Statistics
            <Badge variant="outline">Display Stats</Badge>
          </CardTitle>
          <CardDescription>
            Update temple statistics displayed on homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="years_of_heritage">Years of Heritage</Label>
              <Input
                id="years_of_heritage"
                name="years_of_heritage"
                type="number"
                value={formData.years_of_heritage}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="daily_devotees">Daily Devotees</Label>
              <Input
                id="daily_devotees"
                name="daily_devotees"
                type="number"
                value={formData.daily_devotees}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="days_open">Days Open Per Year</Label>
              <Input
                id="days_open"
                name="days_open"
                type="number"
                value={formData.days_open}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Announcement
            <Badge variant="outline">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Display a temporary announcement on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="announcement_enabled"
              name="announcement_enabled"
              checked={formData.announcement_enabled}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="announcement_enabled" className="cursor-pointer">
              Enable Announcement
            </Label>
          </div>

          {formData.announcement_enabled && (
            <div>
              <Label htmlFor="announcement">Announcement Text</Label>
              <Textarea
                id="announcement"
                name="announcement"
                value={formData.announcement}
                onChange={handleInputChange}
                placeholder="Enter announcement text..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {settings?.updated_at && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => fetchSettings()}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="gap-2"
        >
          {saving || uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
