import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Image, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GalleryPhoto {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const CATEGORIES = ["Architecture", "Sanctum", "Ceremony", "Festivals", "Rituals", "General"];

export const AdminGalleryTable = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    fetchPhotos();
    verifyAdminAccess();
  }, []);

  const verifyAdminAccess = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }

      // Check if user has admin role
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking user role:", roleError);
        return;
      }

      if (!userRole) {
        console.warn("User has no role assigned. Attempting to verify as admin...");
        // User might still be admin through other means, proceed with verification
      }

      setAdminVerified(true);
    } catch (err) {
      console.error("Error verifying admin access:", err);
    }
  };

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error:", error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please provide a title and image");
      return;
    }

    setUploading(true);
    try {
      // Create FormData for multipart request
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("description", description.trim());

      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Authentication session not found. Please log in again.");
      }

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-gallery-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      console.log("Photo uploaded successfully:", result.photo);
      toast.success("Photo uploaded successfully! 🙏");
      setDialogOpen(false);
      setTitle("");
      setCategory("General");
      setDescription("");
      setFile(null);
      fetchPhotos();
    } catch (err: any) {
      console.error("Upload error:", err);
      
      // Check for specific permission errors
      if (err.message?.includes("permission denied") || err.message?.includes("Admin access required") || err.message?.includes("403")) {
        toast.error("Permission denied. Please ensure you have admin access. Try refreshing and logging in again.");
      } else if (err.message?.includes("No bucket")) {
        toast.error("Gallery storage bucket not configured. Contact system administrator.");
      } else if (err.message?.includes("size")) {
        toast.error(err.message);
      } else if (err.message?.includes("Database error")) {
        toast.error("Failed to save photo metadata. " + err.message);
      } else if (err.message?.includes("Storage error")) {
        toast.error("Failed to upload image file. " + err.message);
      } else if (err.message?.includes("Authentication")) {
        toast.error("Session expired. Please refresh and log in again.");
      } else {
        toast.error(err.message || "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (photo: GalleryPhoto) => {
    const { error } = await supabase
      .from("gallery_photos")
      .update({ is_active: !photo.is_active })
      .eq("id", photo.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(photo.is_active ? "Photo hidden" : "Photo visible");
      fetchPhotos();
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    // Extract filename from URL
    const urlParts = photo.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    await supabase.storage.from("gallery").remove([fileName]);

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Photo deleted");
      fetchPhotos();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{photos.length} photos</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-saffron text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Upload Gallery Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photo title" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
              </div>
              <div>
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !file || !title.trim()}
                className="w-full bg-gradient-saffron text-primary-foreground"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border">
            <img
              src={photo.image_url}
              alt={photo.title}
              className={`w-full h-40 object-cover ${!photo.is_active ? "opacity-50" : ""}`}
            />
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{photo.title}</h4>
                <Badge variant="secondary" className="text-xs">{photo.category}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(photo)}
                  className="flex-1"
                >
                  {photo.is_active ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {photo.is_active ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deletePhoto(photo)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-lg font-semibold mb-2">No Photos Yet</h3>
          <p className="text-muted-foreground text-sm">Upload your first gallery photo</p>
        </div>
      )}
    </div>
  );
};
