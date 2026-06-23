import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, Clock, ArrowRight, Loader2, Trash2 } from "lucide-react";

interface FavoritePuja {
  id: string;
  puja_id: string;
  created_at: string;
  pujas: { id: string; name: string; description: string; price: number; duration_minutes: number; category: string };
}

const UserFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePuja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("favorite_pujas").select("id, puja_id, created_at, pujas (id, name, description, price, duration_minutes, category)").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setFavorites((data as unknown as FavoritePuja[]) || []); setLoading(false); });
  }, [user]);

  const removeFavorite = async (id: string) => {
    const { error } = await supabase.from("favorite_pujas").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); } else { toast.success("Removed from favorites"); setFavorites(f => f.filter(x => x.id !== id)); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (favorites.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Favorite Pujas Yet</h3>
          <p className="text-muted-foreground mb-4">Explore our pujas and add your favorites</p>
          <Link to="/pujas"><Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">Browse Pujas <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">Favorite Pujas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => (
          <Card key={fav.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <Badge className="bg-primary/10 text-primary text-xs">{fav.pujas.category}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeFavorite(fav.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <CardTitle className="font-heading text-lg">{fav.pujas.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fav.pujas.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{fav.pujas.duration_minutes} mins</div>
                <p className="font-semibold text-primary">₹{fav.pujas.price.toLocaleString("en-IN")}</p>
              </div>
              <Button className="w-full mt-4 bg-gradient-saffron hover:opacity-90 text-primary-foreground">Book Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
