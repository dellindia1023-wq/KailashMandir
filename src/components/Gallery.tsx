import { useState, useEffect } from "react";
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
import shivaLingam from "@/assets/gallery/shivling-chandan.jpg";
import aartiCeremony from "@/assets/gallery/shivling-shringar-1.jpg";
import festival from "@/assets/gallery/shivling-flowers-3.jpg";

const fallbackImages = [
  { id: "1", src: templeHero, title: "Temple Exterior", category: "Architecture" },
  { id: "2", src: shivaLingam, title: "Sacred Shiva Lingam", category: "Sanctum" },
  { id: "3", src: aartiCeremony, title: "Evening Aarti", category: "Ceremony" },
  { id: "4", src: festival, title: "Festival Celebration", category: "Festivals" },
];

interface GalleryImage { id: string; src: string; title: string; category: string; }

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>(fallbackImages);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase.from("gallery_photos").select("id, image_url, title, category").eq("is_active", true).order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        setImages(data.map((p) => ({ id: p.id, src: p.image_url, title: p.title, category: p.category })));
      }
      setLoading(false);
    };
    
    fetchPhotos();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("gallery_photos_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_photos" },
        () => {
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const categories = [t("gallery.all"), ...new Set(images.map((img) => img.category))];
  const activeFilter = filter === t("gallery.all") ? "All" : filter;
  const filteredImages = activeFilter === "All" ? images : images.filter((img) => img.category === activeFilter);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const goToPrevious = () => { if (selectedImage !== null) setSelectedImage(selectedImage === 0 ? filteredImages.length - 1 : selectedImage - 1); };
  const goToNext = () => { if (selectedImage !== null) setSelectedImage(selectedImage === filteredImages.length - 1 ? 0 : selectedImage + 1); };

  return (
    <section id="gallery" className="py-10 md:py-24 bg-muted temple-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
            <Camera className="h-3 w-3 mr-1" />
            {t("gallery.badge")}
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            {t("gallery.title")} <span className="text-gradient-sacred">{t("gallery.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">{t("gallery.subtitle")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
          {categories.map((category) => (
            <Button key={category} variant={filter === category ? "default" : "outline"} size="sm"
              onClick={() => setFilter(category)}
              className={`text-xs md:text-sm h-8 md:h-9 active:scale-95 ${filter === category ? "bg-gradient-saffron text-primary-foreground" : "hover:bg-primary/10"}`}>
              {category}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {filteredImages.map((image, index) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer active:scale-[0.97] transition-transform" onClick={() => openLightbox(index)}>
                <img src={image.src} alt={image.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 md:transition-opacity md:duration-300 max-md:opacity-100" />
                <div className="absolute inset-0 flex items-end p-2 md:p-4 opacity-0 group-hover:opacity-100 md:transition-opacity md:duration-300 max-md:opacity-100">
                  <div>
                    <Badge className="mb-1 md:mb-2 bg-gold/80 text-accent-foreground text-[10px] md:text-xs">{image.category}</Badge>
                    <h4 className="text-primary-foreground font-heading font-semibold text-xs md:text-base">{image.title}</h4>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={selectedImage !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 bg-transparent border-none">
            {selectedImage !== null && (
              <div className="relative">
                <img src={filteredImages[selectedImage].src} alt={filteredImages[selectedImage].title} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-primary-foreground bg-maroon/50 hover:bg-maroon h-10 w-10" onClick={closeLightbox}><X className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-primary-foreground bg-maroon/50 hover:bg-maroon h-12 w-12" onClick={goToPrevious}><ChevronLeft className="h-6 w-6" /></Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-foreground bg-maroon/50 hover:bg-maroon h-12 w-12" onClick={goToNext}><ChevronRight className="h-6 w-6" /></Button>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <Badge className="bg-gold text-accent-foreground">{filteredImages[selectedImage].category}</Badge>
                  <h4 className="text-primary-foreground font-heading font-semibold mt-2 text-sm md:text-lg">{filteredImages[selectedImage].title}</h4>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Gallery;
