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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, Clock, Search, Filter, Loader2, ArrowRight, Sparkles, Info, CheckCircle2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { PujaBookingDialog } from "@/components/PujaBookingDialog";
import CampaignSlot from "@/components/campaigns/CampaignSlot";
import { useLanguage } from "@/contexts/LanguageContext";
import aartiImg from "@/assets/gallery/shivling-shringar-1.jpg";
import PageHeroBanner from "@/components/PageHeroBanner";
import { getPujaCategoryLabel, getPujaImage, normalizePujaRecord, type NormalizedPuja } from "@/lib/pujaCms";

interface Puja extends NormalizedPuja {}

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
  const [detailsPuja, setDetailsPuja] = useState<Puja | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchPujas = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from("pujas" as any) as any)
        .select("*, puja_details(*), puja_booking_settings(*), puja_seo(*), puja_media(*), puja_benefits(*)")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching pujas:", error);
        toast.error("Failed to load pujas. Please try again.");
        return;
      }

      const rows = (data || []) as Array<Record<string, unknown>>;
      const normalized = rows
        .map((row) => normalizePujaRecord(row as any))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      setPujas(normalized);
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
    const haystack = `${puja.name} ${puja.description} ${puja.subtitle}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || puja.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const label = getPujaCategoryLabel(category);
    return label;
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
        {/* Consistent Sacred Page Header */}
        <PageHeroBanner
          image={aartiImg}
          title={t("pujas.pageTitle") || "Sacred"}
          highlight="Pujas & Rituals"
          subtitle={t("pujas.pageSubtitle") || "Vedic pujas and abhishek performed by learned priests at Kailash Mahadev Temple Agra"}
          mantra="ॐ नमः शिवाय · वैदिक अनुष्ठान"
          badge={
            <Badge className="bg-primary/20 text-gold-light border-gold/30 text-xs px-3 py-1 font-medium">
              वैदिक अनुष्ठान · Vedic Temple Rituals
            </Badge>
          }
        />

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredPujas.map((puja, index) => {
                  const pujaImage = getPujaImage(puja, "");
                  const hasSamagri = Boolean(puja.additionalCharges && puja.additionalCharges.length > 0);
                  
                  return (
                    <div key={puja.id} className="animate-in fade-in slide-in-from-bottom-6 duration-500 flex" style={{ animationDelay: `${index * 40}ms` }}>
                      <Card 
                        className="w-full overflow-hidden rounded-2xl border border-border/60 hover:border-gold/50 bg-card/95 hover:bg-card transition-all duration-300 group hover:shadow-xl hover:shadow-gold/5 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Section - 16:10 aspect ratio */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                            <img 
                              src={pujaImage} 
                              alt={puja.name} 
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                            
                            {/* Favorite Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(puja.id)}
                              aria-label="Add to favorites"
                              className={`absolute top-3 right-3 h-9 w-9 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all duration-200 hover:scale-110 shadow-md border border-white/15 ${
                                favorites.includes(puja.id) 
                                  ? "text-red-500" 
                                  : "text-white/90 hover:text-red-400"
                              }`}
                            >
                              <Heart className={`h-4 w-4 transition-all ${favorites.includes(puja.id) ? "fill-current" : ""}`} />
                            </Button>
                            
                            {/* Category Badge */}
                            <Badge className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md text-gold-light border border-gold/30 text-xs px-3 py-1 rounded-full shadow-md font-medium">
                              {getCategoryLabel(puja.category)}
                            </Badge>
                          </div>
                          
                          {/* Card Body */}
                          <div className="p-5 sm:p-6 space-y-3.5">
                            {/* Title with uniform 2-line height */}
                            <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors min-h-[3rem] line-clamp-2 leading-snug">
                              {puja.name}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                              {puja.description || puja.subtitle || "Sacred Vedic ritual performed at Kailash Mahadev Temple."}
                            </p>
                            
                            {/* Tags Row */}
                            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                {puja.durationMinutes} {t("pujas.mins")}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-lg">
                                {puja.templePuja ? "Temple Sanctum" : "Online"}
                              </span>
                              {hasSamagri && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                                  <Sparkles className="h-3 w-3" />
                                  Samagri Available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer / Price & Actions */}
                        <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Offering</span>
                            <span className="font-heading font-bold text-xl sm:text-2xl text-primary">
                              ₹{puja.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 rounded-xl border-border/70 hover:bg-muted font-medium text-xs sm:text-sm"
                              onClick={() => {
                                setDetailsPuja(puja);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Info className="mr-1 h-3.5 w-3.5 text-primary" />
                              Details
                            </Button>
                            <Button 
                              size="sm"
                              className="h-9 px-3.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
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
                              <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
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

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          {detailsPuja && (
            <div>
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-muted">
                <img
                  src={getPujaImage(detailsPuja, "")}
                  alt={detailsPuja.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                  <div>
                    <Badge className="bg-primary/90 text-primary-foreground text-xs mb-1.5">
                      {getCategoryLabel(detailsPuja.category)}
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-white drop-shadow">
                      {detailsPuja.name}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-white/80">Offering</p>
                    <p className="text-xl sm:text-2xl font-heading font-bold text-gold drop-shadow">
                      ₹{detailsPuja.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {detailsPuja.subtitle && (
                  <p className="text-sm font-medium text-primary italic">
                    {detailsPuja.subtitle}
                  </p>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1.5">
                    About This Puja
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {detailsPuja.longDescription || detailsPuja.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/40 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Estimated Duration</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {detailsPuja.durationMinutes} Minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Sanctum Mode</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {detailsPuja.templePuja ? "Temple Sanctum" : "Online / Remote"}
                    </span>
                  </div>
                </div>

                {detailsPuja.benefits && detailsPuja.benefits.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                      Spiritual Benefits & Blessings
                    </h4>
                    <ul className="space-y-1.5">
                      {detailsPuja.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailsPuja.additionalCharges && detailsPuja.additionalCharges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                      Optional Puja Samagri & Offerings
                    </h4>
                    <div className="space-y-2">
                      {detailsPuja.additionalCharges.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30 text-sm">
                          <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-primary">
                            {item.amount > 0 ? `+₹${item.amount.toLocaleString("en-IN")}` : "Included"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-saffron hover:opacity-90 rounded-xl font-semibold shadow-md"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      if (!user) {
                        toast.error(t("pujas.signInToBook"));
                        navigate("/auth");
                        return;
                      }
                      setSelectedPuja(detailsPuja);
                      setBookingDialogOpen(true);
                    }}
                  >
                    Book This Puja
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pujas;
