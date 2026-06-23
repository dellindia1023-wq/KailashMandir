import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";

interface HomepageSettings {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_images: Array<{ url: string; alt: string }> | null;
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
  const [heroImages, setHeroImages] = useState<Array<{ url: string; alt: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
          setHeroImages(data.hero_images);
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
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
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

  const uploadImage = async (file: File): Promise<string> => {
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
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let finalHeroImages = heroImages;

      // Upload new image if provided
      if (file) {
        const imageUrl = await uploadImage(file);
        finalHeroImages = [...heroImages, { url: imageUrl, alt: "Hero image" }];
        setFile(null);
        setPreviewUrl(null);
      }

      const updateData = {
        ...formData,
        hero_images: finalHeroImages,
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
          {/* Image Upload - Multiple Images */}
          <div>
            <Label>Hero Carousel Images (Auto-rotates every 5 seconds)</Label>
            <div className="mt-2">
              {/* Existing Images Gallery */}
              {heroImages.length > 0 && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {heroImages.map((image, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <button
                          onClick={() => setHeroImages(heroImages.filter((_, i) => i !== idx))}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-600 text-white text-sm rounded transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview for new file */}
              {previewUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-muted">
                  <div className="text-xs text-muted-foreground p-2">Preview (before uploading)</div>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* File Input */}
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or WebP. Max 5MB. Add multiple images for carousel effect.
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
