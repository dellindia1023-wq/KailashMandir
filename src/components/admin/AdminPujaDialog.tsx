import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { normalizeSlug } from "@/lib/pujaCms";

interface PujaCategory {
  id: string;
  name: string;
  slug: string;
}

interface PujaMediaItem {
  id?: string;
  media_type: string;
  role: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

interface Puja {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes?: number | null;
  durationMinutes?: number | null;
  category?: string | null;
  category_id?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  is_active?: boolean | null;
  active?: boolean | null;
  featured?: boolean | null;
  sort_order?: number | null;
  puja_details?: Array<Record<string, any>> | Record<string, any> | null;
  puja_booking_settings?: Array<Record<string, any>> | Record<string, any> | null;
  puja_seo?: Array<Record<string, any>> | Record<string, any> | null;
  puja_media?: Array<Record<string, any>> | null;
  puja_benefits?: Array<{ benefit?: string | null }> | null;
}

interface AdminPujaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puja: Puja | null;
  onSuccess: () => void;
}

const defaultFormState = {
  name: "",
  category_id: "",
  category_text: "",
  slug: "",
  subtitle: "",
  short_description: "",
  description: "",
  long_description: "",
  icon_url: "",
  price: 0,
  discount_price: 0,
  duration_minutes: 60,
  estimated_completion: "",
  booking_enabled: true,
  donation_enabled: true,
  online_puja: true,
  offline_puja: true,
  home_puja: false,
  temple_puja: true,
  featured: false,
  popular: false,
  trending: false,
  recommended: false,
  priority: 0,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  image_url: "",
  is_active: true,
  benefits: [] as string[],
  additional_charges: [] as Array<{ label: string; amount: number }>,
  media: [] as PujaMediaItem[],
};

export const AdminPujaDialog = ({ open, onOpenChange, puja, onSuccess }: AdminPujaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ ...defaultFormState });
  const [categories, setCategories] = useState<PujaCategory[]>([]);

  const supabaseAny = supabase as any;

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

  const restInsertPuja = async (payload: Record<string, any>) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pujas`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`REST insert failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      return data?.[0]?.id || null;
    } catch (err) {
      console.error("REST insert pujas failed:", err);
      throw err;
    }
  };

  const restUpdatePuja = async (id: string, payload: Record<string, any>) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pujas?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`REST update failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      return data?.[0]?.id || id;
    } catch (err) {
      console.error("REST update pujas failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    if (!open) return;

    if (puja) {
      const details = Array.isArray(puja.puja_details) ? puja.puja_details[0] : puja.puja_details || {};
      const settings = Array.isArray(puja.puja_booking_settings)
        ? puja.puja_booking_settings[0]
        : puja.puja_booking_settings || {};
      const seo = Array.isArray(puja.puja_seo) ? puja.puja_seo[0] : puja.puja_seo || {};
      const benefits = Array.isArray(puja.puja_benefits)
        ? puja.puja_benefits.map((item) => item?.benefit).filter(Boolean) as string[]
        : [];
      const media = Array.isArray(puja.puja_media)
        ? puja.puja_media
            .filter((item) => item?.url)
            .map((item, index) => ({
              id: item?.id,
              media_type: item?.media_type || "image",
              role: item?.role || `image-${index}`,
              url: item?.url || "",
              alt_text: item?.alt_text || "",
              is_primary: item?.is_primary ?? false,
              sort_order: item?.sort_order ?? index,
            }))
        : [];

      setFormData({
        name: puja.name,
        category_id: puja.category_id || "",
        category_text: puja.category || "",
        slug: details.slug || "",
        subtitle: details.subtitle || "",
        short_description: details.short_description || "",
        description: details.description || puja.description || "",
        long_description: details.long_description || "",
        icon_url: details.icon_url || "",
        price: settings.price ?? puja.price ?? 0,
        discount_price: settings.discount_price ?? puja.price ?? 0,
        duration_minutes: settings.duration_minutes ?? puja.duration_minutes ?? puja.durationMinutes ?? 60,
        estimated_completion: settings.estimated_completion || "",
        booking_enabled: settings.booking_enabled ?? true,
        donation_enabled: settings.donation_enabled ?? true,
        online_puja: settings.online_puja ?? true,
        offline_puja: settings.offline_puja ?? true,
        home_puja: settings.home_puja ?? false,
        temple_puja: settings.temple_puja ?? true,
        featured: settings.featured ?? false,
        popular: settings.popular ?? false,
        trending: settings.trending ?? false,
        recommended: settings.recommended ?? false,
        priority: settings.priority ?? 0,
        sort_order: settings.sort_order ?? puja.sort_order ?? 0,
        additional_charges: Array.isArray(settings.additional_charges)
          ? settings.additional_charges.map((item: any) => ({
              label: item?.label || "",
              amount: Number(item?.amount ?? 0),
            }))
          : [],
        seo_title: seo.seo_title || "",
        seo_description: seo.seo_description || "",
        seo_keywords: seo.seo_keywords || "",
        image_url: puja.image_url || puja.banner_url || puja.thumbnail_url || "",
        is_active: puja.is_active ?? puja.active ?? true,
        benefits,
        media,
      });
    } else {
      setFormData({ ...defaultFormState });
    }
  }, [puja, open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseAny
        .from("puja_categories")
        .select("id, name, slug")
        .order("name");

      if (error) {
        console.warn("Category table or relationship unavailable, skipping category load:", error);
        setCategories([]);
        return;
      }
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading category options:", error);
      setCategories([]);
    }
  };

  const uploadMediaToStorage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop() || "bin";
      const filePath = `pujas/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("content").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("content").getPublicUrl(filePath);
      return data.publicUrl as string;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadMediaToStorage(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      event.target.value = "";
    }
  };

  const ensureCategoryId = async (): Promise<string | null> => {
    const trimmed = formData.category_text.trim();
    if (formData.category_id) return formData.category_id;
    if (!trimmed) return null;

    const existing = categories.find((category) => category.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const slug = normalizeSlug(trimmed);
    try {
      const { data, error } = await supabaseAny
        .from("puja_categories")
        .insert({ name: trimmed, slug })
        .select("id")
        .maybeSingle();

      if (error) {
        console.warn("Unable to insert puja category, falling back to raw category text:", error);
        return null;
      }
      await fetchCategories();
      return data?.id || null;
    } catch (err) {
      console.warn("Unable to insert puja category, falling back to raw category text:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const categoryId = await ensureCategoryId();
      const categoryName = formData.category_text.trim() || categories.find((category) => category.id === categoryId)?.name || "";
      const buildPujaPayload = (includeCategoryId = true) => {
        const base: Record<string, any> = {
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          duration_minutes: formData.duration_minutes,
          category: categoryName || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
        };
        if (includeCategoryId && categoryId) base.category_id = categoryId;
        return base;
      };

      let pujaId = puja?.id;
      if (pujaId) {
        // Try updating with category_id if available, otherwise retry without it.
        try {
          const { error } = await supabaseAny.from("pujas").update(buildPujaPayload(true)).eq("id", pujaId);
          if (error) throw error;
        } catch (err: any) {
          if (err?.message?.includes("category_id") || String(err).includes("category_id") || (err?.code === "PGRST204")) {
            try {
              const { error } = await supabaseAny.from("pujas").update(buildPujaPayload(false)).eq("id", pujaId);
              if (error) throw error;
            } catch (e) {
              throw e;
            }
          } else {
            // Try REST fallback for update when supabase client fails (schema/cache issues)
            try {
              await restUpdatePuja(pujaId, buildPujaPayload(true));
            } catch (restErr) {
              throw err;
            }
          }
        }
      } else {
        // Insert new puja. Try with category_id first, then without if the column/table is missing.
        try {
          const { data, error } = await supabaseAny
            .from("pujas")
            .insert(buildPujaPayload(true))
            .select("id")
            .maybeSingle();
          if (error) throw error;
          pujaId = data?.id;
        } catch (err: any) {
          if (String(err)?.includes("category_id") || (err?.code === "PGRST204")) {
            const { data, error } = await supabaseAny
              .from("pujas")
              .insert(buildPujaPayload(false))
              .select("id")
              .maybeSingle();
            if (error) throw error;
            pujaId = data?.id;
          } else {
            // Try REST fallback for insert when supabase client fails
            try {
              const restId = await restInsertPuja(buildPujaPayload(true));
              if (restId) pujaId = restId;
              else throw err;
            } catch (restErr) {
              throw err;
            }
          }
        }
      }

      if (!pujaId) {
        throw new Error("Failed to identify puja ID after save");
      }

      const detailsPayload = {
        puja_id: pujaId,
        subtitle: formData.subtitle || null,
        slug: formData.slug?.trim() || normalizeSlug(formData.name),
        short_description: formData.short_description || null,
        description: formData.description || null,
        long_description: formData.long_description || null,
        icon_url: formData.icon_url || null,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabaseAny
          .from("puja_details")
          .upsert(detailsPayload, { onConflict: "puja_id" });
      } catch (err) {
        console.warn("puja_details upsert failed, falling back to updating pujas table:", err);
        // Fallback: update legacy columns on `pujas` if normalized table is unavailable
        try {
          await supabaseAny.from("pujas").update({
            subtitle: detailsPayload.subtitle,
            slug: detailsPayload.slug,
            short_description: detailsPayload.short_description,
            description: detailsPayload.description,
            long_description: detailsPayload.long_description,
            icon_url: detailsPayload.icon_url,
            updated_at: detailsPayload.updated_at,
          }).eq("id", pujaId);
        } catch (e) {
          console.error("Fallback update to pujas for details also failed:", e);
        }
      }

      try {
        await supabaseAny
          .from("puja_booking_settings")
          .upsert(
            {
              puja_id: pujaId,
              price: formData.price,
              discount_price: formData.discount_price || formData.price,
              duration_minutes: formData.duration_minutes,
              estimated_completion: formData.estimated_completion || null,
              booking_enabled: formData.booking_enabled,
              donation_enabled: formData.donation_enabled,
              online_puja: formData.online_puja,
              offline_puja: formData.offline_puja,
              home_puja: formData.home_puja,
              temple_puja: formData.temple_puja,
              featured: formData.featured,
              popular: formData.popular,
              trending: formData.trending,
              recommended: formData.recommended,
              priority: formData.priority,
              sort_order: formData.sort_order,
              additional_charges: formData.additional_charges.length > 0 ? formData.additional_charges : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "puja_id" }
          );
      } catch (err) {
        console.warn("puja_booking_settings upsert failed, falling back to updating pujas table:", err);
        try {
          await supabaseAny.from("pujas").update({
            price: formData.price,
            discount_price: formData.discount_price || formData.price,
            duration_minutes: formData.duration_minutes,
            estimated_completion: formData.estimated_completion || null,
            booking_enabled: formData.booking_enabled,
            donation_enabled: formData.donation_enabled,
            online_puja: formData.online_puja,
            offline_puja: formData.offline_puja,
            home_puja: formData.home_puja,
            temple_puja: formData.temple_puja,
            featured: formData.featured,
            popular: formData.popular,
            trending: formData.trending,
            recommended: formData.recommended,
            priority: formData.priority,
            sort_order: formData.sort_order,
            updated_at: new Date().toISOString(),
          }).eq("id", pujaId);
        } catch (e) {
          console.error("Fallback update to pujas for booking settings also failed:", e);
        }
      }

      try {
        await supabaseAny
          .from("puja_seo")
          .upsert(
            {
              puja_id: pujaId,
              seo_title: formData.seo_title || null,
              seo_description: formData.seo_description || null,
              seo_keywords: formData.seo_keywords || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "puja_id" }
          );
      } catch (err) {
        console.warn("puja_seo upsert failed, falling back to updating pujas table:", err);
        try {
          await supabaseAny.from("pujas").update({
            seo_title: formData.seo_title || null,
            seo_description: formData.seo_description || null,
            seo_keywords: formData.seo_keywords || null,
            updated_at: new Date().toISOString(),
          }).eq("id", pujaId);
        } catch (e) {
          console.error("Fallback update to pujas for seo also failed:", e);
        }
      }

      try {
        if (Array.isArray(formData.benefits) && formData.benefits.length > 0) {
          await supabaseAny.from("puja_benefits").delete().eq("puja_id", pujaId);
          const benefitsPayload = formData.benefits
            .map((benefit, index) => ({ puja_id: pujaId, benefit: benefit.trim(), sort_order: index }))
            .filter((item) => item.benefit);
          if (benefitsPayload.length > 0) {
            await supabaseAny.from("puja_benefits").insert(benefitsPayload);
          }
        } else {
          await supabaseAny.from("puja_benefits").delete().eq("puja_id", pujaId);
        }
      } catch (err) {
        console.warn("puja_benefits upsert/delete failed, skipping benefits persistence:", err);
      }

      const normalizedMedia = [...formData.media]
        .map((item, index) => ({
          media_type: item.media_type || "image",
          role: item.role || `image-${index}`,
          url: item.url,
          alt_text: item.alt_text || `${formData.name} image`,
          is_primary: Boolean(item.is_primary),
          sort_order: item.sort_order ?? index,
        }))
        .filter((item) => item.url);

      const matchingImageIndex = normalizedMedia.findIndex((item) => item.url === formData.image_url);
      if (formData.image_url && matchingImageIndex !== -1) {
        normalizedMedia[matchingImageIndex].is_primary = true;
      }

      const hasImageRole = normalizedMedia.some((item) => item.role === "image");
      if (formData.image_url && matchingImageIndex === -1 && !hasImageRole) {
        normalizedMedia.unshift({
          media_type: "image",
          role: "image",
          url: formData.image_url,
          alt_text: `${formData.name} image`,
          is_primary: true,
          sort_order: 0,
        });
      }

      let primaryFound = false;
      normalizedMedia.forEach((item) => {
        if (item.is_primary) {
          if (primaryFound) {
            item.is_primary = false;
          } else {
            primaryFound = true;
          }
        }
      });
      if (!primaryFound && normalizedMedia.length > 0) {
        normalizedMedia[0].is_primary = true;
      }

      try {
        await supabaseAny.from("puja_media").delete().eq("puja_id", pujaId);
        const mediaPayload = normalizedMedia
          .map((item, index) => ({
            puja_id: pujaId,
            media_type: item.media_type || "image",
            role: item.role,
            url: item.url,
            alt_text: item.alt_text || null,
            is_primary: item.is_primary,
            sort_order: item.sort_order ?? index,
          }))
          .filter((item) => item.role && item.url);

        if (mediaPayload.length > 0) {
          await supabaseAny.from("puja_media").insert(mediaPayload);
        }
      } catch (err) {
        console.warn("puja_media update failed, skipping media persistence:", err);
      }

      toast.success(`Puja ${puja ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving puja:", error);
      toast.error(error?.message || "Failed to save puja");
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((item, idx) => (idx === index ? value : item)),
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, idx) => idx !== index),
    }));
  };

  const addAdditionalCharge = () => {
    setFormData((prev) => ({
      ...prev,
      additional_charges: [...prev.additional_charges, { label: "", amount: 0 }],
    }));
  };

  const updateAdditionalCharge = (index: number, key: "label" | "amount", value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      additional_charges: prev.additional_charges.map((item, idx) =>
        idx !== index
          ? item
          : {
              ...item,
              [key]: key === "amount" ? Number(value) : value,
            }
      ),
    }));
  };

  const removeAdditionalCharge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additional_charges: prev.additional_charges.filter((_, idx) => idx !== index),
    }));
  };

  const mediaRoles = ["image", "thumbnail", "banner", "icon", "mobile_banner", "desktop_banner"] as const;

  const addMediaItem = () => {
    setFormData((prev) => {
      const usedRoles = new Set(prev.media.map((item) => item.role));
      const nextRole = mediaRoles.find((role) => !usedRoles.has(role)) ?? "image";
      return {
        ...prev,
        media: [
          ...prev.media,
          {
            media_type: "image",
            role: nextRole,
            url: "",
            alt_text: "",
            is_primary: false,
            sort_order: prev.media.length,
          },
        ],
      };
    });
  };

  const updateMediaItem = (index: number, key: keyof PujaMediaItem, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.map((item, idx) =>
        idx !== index
          ? item
          : {
              ...item,
              [key]: value,
            }
      ),
    }));
  };

  const removeMediaItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, idx) => idx !== index),
    }));
  };

  const handleMediaUploadItem = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadMediaToStorage(file);
      updateMediaItem(index, "url", url);
      updateMediaItem(index, "media_type", file.type.startsWith("video/") ? "video" : "image");
      if (!formData.media[index]?.alt_text) {
        updateMediaItem(index, "alt_text", `${formData.name} ${file.name}`);
      }
      toast.success("Media uploaded successfully");
    } catch (error) {
      console.error("Media upload failed:", error);
      toast.error("Failed to upload media");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {puja ? "Edit Puja" : "Add New Puja"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_text">Category</Label>
                <div className="grid gap-2">
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => {
                      const selected = categories.find((category) => category.id === value);
                      setFormData({
                        ...formData,
                        category_id: value,
                        category_text: selected?.name || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="category_text"
                    value={formData.category_text}
                    onChange={(e) => setFormData({ ...formData, category_text: e.target.value, category_id: "" })}
                    placeholder="Enter category name or choose existing"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Automatically generated from name if blank"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_price">Discount Price (₹)</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    min="0"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_completion">Estimated Completion</Label>
                  <Input
                    id="estimated_completion"
                    value={formData.estimated_completion}
                    onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                    placeholder="e.g. 2 hours"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  rows={3}
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description">Long Description</Label>
                <Textarea
                  id="long_description"
                  rows={5}
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon_url">Icon URL</Label>
                <Input
                  id="icon_url"
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="image_url">Primary Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_upload">Upload Image</Label>
              <Input
                id="image_upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Additional Media</Label>
              <Button type="button" variant="outline" onClick={addMediaItem} disabled={formData.media.length >= 6}>
                Add Media
              </Button>
            </div>
            {formData.media.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add media items to map banner, thumbnail, or icon assets.</p>
            ) : (
              <div className="space-y-4">
                {formData.media.map((item, index) => (
                  <div key={`${item.role}-${index}`} className="grid gap-3 rounded-lg border border-input p-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={item.role}
                        onValueChange={(value) => updateMediaItem(index, "role", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose role" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "image",
                            "thumbnail",
                            "banner",
                            "icon",
                            "mobile_banner",
                            "desktop_banner",
                          ].map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={item.url}
                        onChange={(e) => updateMediaItem(index, "url", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Upload</Label>
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(event) => handleMediaUploadItem(index, event)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Alt text</Label>
                      <Input
                        value={item.alt_text}
                        onChange={(e) => updateMediaItem(index, "alt_text", e.target.value)}
                        placeholder="Alternative text for accessibility"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Primary</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_primary}
                          onCheckedChange={(value) => updateMediaItem(index, "is_primary", value)}
                        />
                        <span className="text-sm text-muted-foreground">Primary media</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex items-end justify-between md:col-span-1">
                      <Button type="button" variant="outline" onClick={() => removeMediaItem(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Booking Options</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2">
                  <span>Booking Enabled</span>
                  <Switch
                    checked={formData.booking_enabled}
                    onCheckedChange={(value) => setFormData({ ...formData, booking_enabled: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Donation Enabled</span>
                  <Switch
                    checked={formData.donation_enabled}
                    onCheckedChange={(value) => setFormData({ ...formData, donation_enabled: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Online Puja</span>
                  <Switch
                    checked={formData.online_puja}
                    onCheckedChange={(value) => setFormData({ ...formData, online_puja: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Offline Puja</span>
                  <Switch
                    checked={formData.offline_puja}
                    onCheckedChange={(value) => setFormData({ ...formData, offline_puja: value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visibility & Promotion</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2">
                  <span>Featured</span>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(value) => setFormData({ ...formData, featured: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Popular</span>
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(value) => setFormData({ ...formData, popular: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Trending</span>
                  <Switch
                    checked={formData.trending}
                    onCheckedChange={(value) => setFormData({ ...formData, trending: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Recommended</span>
                  <Switch
                    checked={formData.recommended}
                    onCheckedChange={(value) => setFormData({ ...formData, recommended: value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="home_puja">Home Puja</Label>
              <Switch
                id="home_puja"
                checked={formData.home_puja}
                onCheckedChange={(value) => setFormData({ ...formData, home_puja: value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temple_puja">Temple Puja</Label>
              <Switch
                id="temple_puja"
                checked={formData.temple_puja}
                onCheckedChange={(value) => setFormData({ ...formData, temple_puja: value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={formData.is_active}
                onCheckedChange={(value) => setFormData({ ...formData, is_active: value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              rows={3}
              value={formData.seo_description}
              onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Additional Charges</Label>
              <Button type="button" variant="outline" onClick={addAdditionalCharge}>
                Add Charge
              </Button>
            </div>
            {formData.additional_charges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add optional charge items that users can select during booking.</p>
            ) : (
              <div className="space-y-3">
                {formData.additional_charges.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-input p-4 md:grid-cols-[1fr_auto]">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Charge Label</Label>
                        <Input
                          value={item.label}
                          onChange={(e) => updateAdditionalCharge(index, "label", e.target.value)}
                          placeholder="e.g. Puja Samagri"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => updateAdditionalCharge(index, "amount", Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-end justify-end">
                      <Button type="button" variant="outline" onClick={() => removeAdditionalCharge(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Benefits</Label>
              <Button type="button" variant="outline" onClick={addBenefit}>
                Add Benefit
              </Button>
            </div>
            {formData.benefits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No benefits added yet.</p>
            ) : (
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder={`Benefit ${index + 1}`}
                    />
                    <Button type="button" variant="outline" onClick={() => removeBenefit(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} className="w-full md:w-auto bg-gradient-saffron">
              {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {puja ? "Update Puja" : "Create Puja"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
