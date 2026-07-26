import { useCallback, useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Heart, Clock, Search, Filter, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { PujaBookingDialog } from "@/components/PujaBookingDialog";
import CampaignSlot from "@/components/campaigns/CampaignSlot";
import { useLanguage } from "@/contexts/LanguageContext";
import aartiImg from "@/assets/gallery/shivling-shringar-1.jpg";

// Import puja images
import rudrabhishekImg from "@/assets/pujas/rudrabhishek.jpg";
import laghuRudraImg from "@/assets/pujas/laghu-rudra.jpg";
import mrityunjayaJaapImg from "@/assets/pujas/mrityunjaya-jaap.jpg";
import shivChalisaImg from "@/assets/pujas/shiv-chalisa.jpg";
import bilvarchanImg from "@/assets/pujas/bilvarchan.jpg";
import mahaShivaratriImg from "@/assets/pujas/maha-shivaratri.jpg";
import shravanSomvarImg from "@/assets/pujas/shravan-somvar.jpg";
import dailyAartiImg from "@/assets/pujas/daily-aarti.jpg";

// Map puja names to images
const pujaImages: Record<string, string> = {
  "Rudrabhishek": rudrabhishekImg,
  "Laghu Rudra": laghuRudraImg,
  "Maha Mrityunjaya Jaap": mrityunjayaJaapImg,
  "Shiv Chalisa Path": shivChalisaImg,
  "Bilvarchan Puja": bilvarchanImg,
  "Maha Shivaratri Puja": mahaShivaratriImg,
  "Shravan Somvar Puja": shravanSomvarImg,
  "Daily Aarti Sponsorship": dailyAartiImg,
};

// Category default images
const categoryImages: Record<string, string> = {
  abhishekam: rudrabhishekImg,
  jaap: mrityunjayaJaapImg,
  path: shivChalisaImg,
  puja: bilvarchanImg,
  special: mahaShivaratriImg,
  sponsorship: dailyAartiImg,
};

interface Puja {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  image_url?: string | null;
}

const Pujas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const fetchPujas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pujas")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) {
        console.error("Error fetching pujas:", error);
        toast.error("Failed to load pujas. Please try again.");
      } else {
        setPujas(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching pujas:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("favorite_pujas")
        .select("puja_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching favorites:", error);
      } else {
        setFavorites(data?.map(f => f.puja_id) || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching favorites:", err);
    }
  }, [user]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchPujas();
      if (user) {
        await fetchFavorites();
      }
    };
    
    initializeData();
  }, [user, fetchPujas, fetchFavorites]);

  const toggleFavorite = async (pujaId: string) => {
    if (!user) {
      toast.error(t("pujas.signInToFav"));
      navigate("/auth");
      return;
    }

    const isFavorite = favorites.includes(pujaId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorite_pujas")
        .delete()
        .eq("user_id", user.id)
        .eq("puja_id", pujaId);

      if (error) {
        toast.error("Failed to remove favorite");
      } else {
        setFavorites(favorites.filter(id => id !== pujaId));
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase
        .from("favorite_pujas")
        .insert({ user_id: user.id, puja_id: pujaId });

      if (error) {
        toast.error("Failed to add favorite");
      } else {
        setFavorites([...favorites, pujaId]);
        toast.success("Added to favorites! 🙏");
      }
    }
  };

  const categories = ["all", ...new Set(pujas.map(p => p.category))];

  const filteredPujas = pujas.filter(puja => {
    const matchesSearch = puja.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puja.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || puja.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const keyMap: Record<string, string> = {
      abhishekam: "pujas.abhishekam",
      jaap: "pujas.jaap",
      path: "pujas.path",
      puja: "pujas.puja",
      special: "pujas.special",
      sponsorship: "pujas.sponsorship",
    };
    return keyMap[category] ? t(keyMap[category]) : category.charAt(0).toUpperCase() + category.slice(1);
  };

  const revealSearch = useScrollReveal();
  const revealGrid = useScrollReveal();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kailash Mandir Agra Puja Booking | Sacred Rituals"
        description="Book pujas at Kailash mandir agra (Kailash Mahadev Temple) — Rudrabhishek, Maha Mrityunjaya Jaap, Shiv Chalisa and more by Vedic priests in Agra."
        canonical="/pujas"
        breadcrumbLabel="Pujas & Rituals"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Sacred Pujas & Rituals at Kailash Mahadev Temple",
          "description": "Book sacred pujas and rituals performed by experienced Vedic priests at Kailash Mahadev Temple Agra.",
          "url": "https://kailashmahadev.in/pujas",
          "numberOfItems": pujas.length,
          "itemListElement": pujas.slice(0, 10).map((puja, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Service",
              "name": puja.name,
              "description": puja.description || `${puja.name} at Kailash Mahadev Temple`,
              "provider": {
                "@type": "Organization",
                "name": "Kailash Mahadev Temple Trust"
              },
              "areaServed": {
                "@type": "Place",
                "name": "Kailash Mahadev Temple, Agra"
              },
              "offers": {
                "@type": "Offer",
                "price": puja.price,
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock"
              }
            }
          }))
        }}
      />
      <Header />
      
      <main>
        {/* Header Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12 md:py-16">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse delay-700" />
          </div>
          <div className="relative container mx-auto px-4 max-w-6xl">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary animate-bounce" />
                <Badge variant="outline" className="px-3 py-1">{t("pujas.pageBadge")}</Badge>
                <Sparkles className="h-5 w-5 text-primary animate-bounce" />
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {t("pujas.pageTitle")}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("pujas.pageSubtitle")}</p>
              <div className="mt-4 flex justify-center">
                <span className="text-2xl text-gold animate-pulse">ॐ नमः शिवाय</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <CampaignSlot locationKey="pujas.hero" pageType="pujas" />
          </div>
        </section>

        {/* Search and Filter */}
        <section className="py-6 md:py-8 bg-background border-b border-border/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                <Input
                  placeholder={t("pujas.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 h-14 rounded-2xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base"
                />
              </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Filter by Category
              </p>
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                      selectedCategory === category 
                        ? "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground shadow-lg scale-100 hover:scale-105" 
                        : "hover:border-primary/60 hover:bg-primary/5 hover:scale-105 active:scale-95"
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <span className="text-xs md:text-sm font-medium">
                      {category === "all" ? t("pujas.all") : getCategoryLabel(category)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* Pujas Grid */}
        <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          {filteredPujas.length === 0 ? (
            <Card className="text-center py-16 border-2 border-dashed border-primary/20 bg-primary/5 animate-in fade-in zoom-in duration-500">
              <CardContent>
                <Filter className="h-14 w-14 mx-auto mb-4 text-primary/30 animate-pulse" />
                <h3 className="font-heading text-xl font-semibold mb-2 text-foreground">No Pujas Found</h3>
                <p className="text-muted-foreground text-base">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    <span className="text-primary font-bold text-lg">{filteredPujas.length}</span> {filteredPujas.length === 1 ? "puja" : "pujas"} available
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {filteredPujas.map((puja, index) => {
                  const pujaImage = pujaImages[puja.name] || puja.image_url || categoryImages[puja.category] || rudrabhishekImg;
                  
                  return (
                    <div key={puja.id} className="animate-in fade-in slide-in-from-bottom-6 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                      <Card 
                        className="h-full overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500 group hover:shadow-2xl hover:-translate-y-3 bg-card/80 backdrop-blur-sm"
                      >
                        {/* Image Section */}
                        <div className="relative h-40 overflow-hidden bg-muted">
                          <img 
                            src={pujaImage} 
                            alt={puja.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-1" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-60 group-hover:opacity-75 transition-opacity duration-300" />
                          
                          {/* Favorite Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(puja.id)}
                            className={`absolute top-4 right-4 h-10 w-10 bg-white/95 hover:bg-white backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                              favorites.includes(puja.id) 
                                ? "text-red-500" 
                                : "text-muted-foreground hover:text-red-500"
                            }`}
                          >
                            <Heart className={`h-5 w-5 transition-all ${favorites.includes(puja.id) ? "fill-current animate-pulse" : ""}`} />
                          </Button>
                          
                          {/* Category Badge */}
                          <Badge className="absolute bottom-4 left-4 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-xs px-4 py-1.5 rounded-full shadow-lg font-medium">
                            {getCategoryLabel(puja.category)}
                          </Badge>
                        </div>
                        
                        {/* Content Section */}
                        <CardHeader className="pb-3 pt-6 px-5">
                          <CardTitle className="font-heading text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300">
                            {puja.name}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="pb-6 px-5 space-y-5">
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{puja.description}</p>
                          
                          <div className="flex items-center justify-between pb-4 border-b border-border/40">
                            <div className="flex items-center gap-2.5 text-sm bg-primary/10 px-3 py-2 rounded-lg">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">{puja.duration_minutes} {t("pujas.mins")}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Price</p>
                              <p className="font-heading font-bold text-2xl text-primary">
                                ₹{puja.price.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-semibold h-11 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 group/btn"
                            onClick={() => {
                              if (!user) {
                                toast.error(t("pujas.signInToBook"));
                                navigate("/auth");
                                return;
                              }
                              setSelectedPuja(puja);
                              setBookingDialogOpen(true);
                            }}
                          >
                            {t("pujas.bookPuja")}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <img src={aartiImg} alt="Aarti Ceremony" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-divine" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/50" />
          </div>
          
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-block">
                <p className="text-gold-light font-heading text-base md:text-lg mb-4 tracking-widest font-semibold animate-pulse">हर हर महादेव</p>
              </div>
              
              <h2 className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {t("pujas.needHelp")} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light to-orange-300">{t("pujas.choosing")}</span>
              </h2>
              
              <p className="text-primary-foreground/95 max-w-2xl mx-auto mb-12 text-lg md:text-xl leading-relaxed font-light">
                {t("pujas.helpDesc")}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/contact" className="w-full sm:w-auto transform transition-all duration-300 hover:scale-105">
                  <Button size="lg" className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold/90 hover:to-gold-light/90 text-accent-foreground font-bold px-12 py-7 text-lg rounded-2xl glow-gold transition-all hover:shadow-2xl group">
                    {t("pujas.contactTemple")}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/darshan-timings" className="w-full sm:w-auto transform transition-all duration-300 hover:scale-105">
                  <Button size="lg" variant="outline" className="w-full border-2 border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground px-12 py-7 text-lg rounded-2xl font-semibold transition-all backdrop-blur-sm group">
                    {t("pujas.darshanTimings")} 
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <PujaBookingDialog
        puja={selectedPuja}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
      />
    </div>
  );
};

export default Pujas;
