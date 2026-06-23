import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Heart,
  CreditCard,
  IndianRupee,
  ArrowRight,
  Pencil,
  Sparkles,
  Clock3,
  MapPin,
  BookOpen,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateKundliPdf } from "@/lib/generateKundliPdf";

interface SavedKundli {
  id: string;
  title: string;
  birth_name: string | null;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  created_at: string;
  kundli_data: any;
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const UserDashboardHome = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ bookings: 0, favorites: 0, donations: 0, totalDonated: 0 });
  const [savedKundlis, setSavedKundlis] = useState<SavedKundli[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedKundli, setSelectedKundli] = useState<SavedKundli | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, bookingsRes, favoritesRes, donationsRes, kundlisRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("puja_bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("favorite_pujas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("donations").select("amount").eq("user_id", user.id),
        supabase
          .from("saved_kundlis")
          .select("id, title, birth_name, birth_date, birth_time, birth_place, created_at, kundli_data")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      setProfile(profileRes.data);
      setSavedKundlis(kundlisRes.data || []);
      setStats({
        bookings: bookingsRes.count || 0,
        favorites: favoritesRes.count || 0,
        donations: donationsRes.data?.length || 0,
        totalDonated: donationsRes.data?.reduce((s, d) => s + d.amount, 0) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center text-primary-foreground text-2xl font-heading overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "D"
            )}
          </div>
          <div>
            <Badge className="mb-1 bg-primary/10 text-primary">Devotee</Badge>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Namaste, {profile?.full_name || "Devotee"} 🙏
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditProfileOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{stats.bookings}</p>
              <p className="text-sm text-muted-foreground">Puja Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-saffron/10 to-gold/5 border-saffron/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center">
              <Heart className="h-6 w-6 text-saffron" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{stats.favorites}</p>
              <p className="text-sm text-muted-foreground">Favorite Pujas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-maroon/10 to-secondary/5 border-maroon/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-maroon/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-maroon" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{stats.donations}</p>
              <p className="text-sm text-muted-foreground">Total Donations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/10 to-accent/5 border-gold/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">
                ₹{stats.totalDonated.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-muted-foreground">Total Contributed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">Saved Kundlis</h2>
              </div>
              <p className="text-sm text-muted-foreground">Your previously generated birth charts are stored here for quick access.</p>
            </div>
            <Link to="/kundli">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New Kundli
              </Button>
            </Link>
          </div>

          {savedKundlis.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {savedKundlis.map((kundli) => (
                <Card key={kundli.id} className="border-border/60 shadow-none">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{kundli.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Saved on {new Date(kundli.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {kundli.kundli_data?.rashi || "Kundli"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(kundli.birth_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <span>{kundli.birth_time}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{kundli.birth_place}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {kundli.kundli_data?.nakshatra ? <Badge variant="secondary">{kundli.kundli_data.nakshatra}</Badge> : null}
                      {kundli.kundli_data?.lagna ? <Badge variant="secondary">{kundli.kundli_data.lagna}</Badge> : null}
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => setSelectedKundli(kundli)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Kundli
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">No saved Kundlis yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Generate a Kundli and save it to see it here later.</p>
              <Link to="/kundli">
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Your First Kundli
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/pujas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-heading font-semibold mb-1">Book a Puja</h3>
              <p className="text-sm text-muted-foreground">Browse & book rituals</p>
              <ArrowRight className="h-4 w-4 mx-auto mt-3 text-primary" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/events">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-3 text-saffron group-hover:scale-110 transition-transform" />
              <h3 className="font-heading font-semibold mb-1">Upcoming Events</h3>
              <p className="text-sm text-muted-foreground">Temple celebrations</p>
              <ArrowRight className="h-4 w-4 mx-auto mt-3 text-saffron" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/notice-board">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-3 text-maroon group-hover:scale-110 transition-transform" />
              <h3 className="font-heading font-semibold mb-1">Notice Board</h3>
              <p className="text-sm text-muted-foreground">Latest announcements</p>
              <ArrowRight className="h-4 w-4 mx-auto mt-3 text-maroon" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {user && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          userId={user.id}
          onProfileUpdate={fetchData}
        />
      )}

      <Dialog open={!!selectedKundli} onOpenChange={(open) => !open && setSelectedKundli(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedKundli && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">{selectedKundli.title}</DialogTitle>
                <DialogDescription>
                  {selectedKundli.birth_name || "Devotee"} • {new Date(selectedKundli.birth_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {selectedKundli.birth_time}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Rashi</p>
                    <p className="font-heading font-semibold text-foreground">{selectedKundli.kundli_data?.rashi || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Nakshatra</p>
                    <p className="font-heading font-semibold text-foreground">{selectedKundli.kundli_data?.nakshatra || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Lagna</p>
                    <p className="font-heading font-semibold text-foreground">{selectedKundli.kundli_data?.lagna || "—"}</p>
                  </div>
                </div>

                {selectedKundli.kundli_data?.personality ? (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personality</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedKundli.kundli_data.personality}</p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedKundli.kundli_data?.career ? (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-semibold text-foreground mb-2">Career</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedKundli.kundli_data.career}</p>
                    </div>
                  ) : null}
                  {selectedKundli.kundli_data?.marriage ? (
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-semibold text-foreground mb-2">Marriage</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedKundli.kundli_data.marriage}</p>
                    </div>
                  ) : null}
                </div>

                {selectedKundli.kundli_data?.remedies?.length ? (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Recommended Remedies</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {selectedKundli.kundli_data.remedies.map((remedy: string, index: number) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{remedy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {selectedKundli.kundli_data?.luckyGems?.map((gem: string, index: number) => (
                    <Badge key={`gem-${index}`} variant="outline">💎 {gem}</Badge>
                  ))}
                  {selectedKundli.kundli_data?.luckyNumbers?.map((number: string, index: number) => (
                    <Badge key={`number-${index}`} variant="outline">🔢 {number}</Badge>
                  ))}
                  {selectedKundli.kundli_data?.luckyColors?.map((color: string, index: number) => (
                    <Badge key={`color-${index}`} variant="outline">🎨 {color}</Badge>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    generateKundliPdf({
                      title: selectedKundli.title,
                      birthName: selectedKundli.birth_name,
                      birthDate: selectedKundli.birth_date,
                      birthTime: selectedKundli.birth_time,
                      birthPlace: selectedKundli.birth_place,
                      kundliData: selectedKundli.kundli_data,
                    })
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboardHome;
