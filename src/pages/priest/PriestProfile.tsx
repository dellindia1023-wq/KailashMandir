import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, User, Mail, Phone } from "lucide-react";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PushNotificationPrefsCard } from "@/components/PushNotificationPrefsCard";
import { EmailNotificationPrefsCard } from "@/components/EmailNotificationPrefsCard";

const PriestProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; phone: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id, full_name, phone, avatar_url").eq("user_id", user.id).maybeSingle();
    setProfile(data);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>
      </div>
      <Card className="max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading">Profile Details</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-saffron flex items-center justify-center text-primary-foreground text-xl font-heading overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-heading font-semibold text-lg">{profile?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile?.phone || "Not provided"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <div className="mt-6 max-w-lg space-y-4">
        <PushNotificationToggle />
        <PushNotificationPrefsCard />
        <EmailNotificationPrefsCard />
      </div>

      {profile && user && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          userId={user.id}
          onProfileUpdate={fetchProfile}
        />
      )}
    </div>
  );
};

export default PriestProfile;
