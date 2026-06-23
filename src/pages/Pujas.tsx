import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeroBanner from "@/components/PageHeroBanner";
import TempleDivider from "@/components/TempleDivider";
import useScrollReveal from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Heart, Clock, Search, Filter, Loader2, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { PujaBookingDialog } from "@/components/PujaBookingDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import templeHero from "@/assets/gallery/devotees-prayer.jpg";
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

  useEffect(() => {
    fetchPujas();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchPujas = async () => {
    const { data, error } = await supabase
      .from("pujas")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (error) {
      console.error("Error fetching pujas:", error);
    } else {
      setPujas(data || []);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("favorite_pujas")
      .select("puja_id")
      .eq("user_id", user.id);

    setFavorites(data?.map(f => f.puja_id) || []);
  };

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
        <PageHeroBanner
          image={templeHero}
          title={t("pujas.pageTitle")}
          highlight={t("pujas.pageTitleHighlight")}
          subtitle={t("pujas.pageSubtitle")}
          mantra="ॐ नमः शिवाय"
          badge={<Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">{t("pujas.pageBadge")}</Badge>}
        />

        <TempleDivider />

        {/* Search and Filter */}
        <section className="py-8 md:py-12 bg-muted temple-pattern">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("pujas.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-gradient-saffron text-primary-foreground" 
                    : ""
                  }
                >
                  {category === "all" ? t("pujas.all") : getCategoryLabel(category)}
                </Button>
              ))}
            </div>
          </div>
        </div>
        </section>

        <TempleDivider />

        {/* Pujas Grid */}
        <section className="py-8 md:py-14 bg-background">
        <div className="container mx-auto px-4">
          {filteredPujas.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">{t("pujas.noPujasFound")}</h3>
                <p className="text-muted-foreground">{t("pujas.noPujasDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPujas.map((puja) => {
                const pujaImage = pujaImages[puja.name] || puja.image_url || categoryImages[puja.category] || rudrabhishekImg;
                
                return (
                  <Card key={puja.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <img src={pujaImage} alt={puja.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(puja.id)}
                        className={`absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm ${
                          favorites.includes(puja.id) 
                            ? "text-destructive" 
                            : "text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${favorites.includes(puja.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Badge className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs">
                        {getCategoryLabel(puja.category)}
                      </Badge>
                    </div>
                    
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="font-heading text-lg">{puja.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{puja.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {puja.duration_minutes} {t("pujas.mins")}
                        </div>
                        <p className="font-heading font-bold text-xl text-primary">
                          ₹{puja.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <Button 
                        className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground"
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
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        </section>

        <TempleDivider />

        {/* CTA */}
        <section className="relative py-14 md:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <img src={aartiImg} alt="Aarti Ceremony" className="w-full h-full object-cover" style={{ transform: "scale(1.1)" }} />
            <div className="absolute inset-0 bg-gradient-divine" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <p className="text-gold font-heading text-sm md:text-lg mb-2 tracking-wider">हर हर महादेव</p>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground mb-3">
              {t("pujas.needHelp")} <span className="text-gold-light">{t("pujas.choosing")}</span>
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-6 text-sm md:text-base">{t("pujas.helpDesc")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/contact">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
                  {t("pujas.contactTemple")}
                </Button>
              </Link>
              <Link to="/darshan-timings">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  {t("pujas.darshanTimings")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
