import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import SecuritySettingsCard from "@/components/SecuritySettingsCard";
import AartiNotificationPrefsCard from "@/components/AartiNotificationPrefsCard";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PushNotificationPrefsCard } from "@/components/PushNotificationPrefsCard";
import { EmailNotificationPrefsCard } from "@/components/EmailNotificationPrefsCard";

interface Profile {
  id: string; full_name: string | null; phone: string | null; avatar_url: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id, full_name, phone, avatar_url").eq("user_id", user.id).maybeSingle();
    setProfile(data); setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">Profile</h2>
      <Card>
        <CardHeader><CardTitle className="font-heading">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-saffron flex items-center justify-center text-primary-foreground text-3xl font-heading overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : (profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "D")}
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold">{profile?.full_name || "Not set"}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-muted-foreground">Full Name</label><p className="text-foreground">{profile?.full_name || "Not set"}</p></div>
            <div><label className="text-sm font-medium text-muted-foreground">Email</label><p className="text-foreground">{user?.email}</p></div>
            <div><label className="text-sm font-medium text-muted-foreground">Phone</label><p className="text-foreground">{profile?.phone || "Not set"}</p></div>
            <div><label className="text-sm font-medium text-muted-foreground">Member Since</label><p className="text-foreground">{user?.created_at ? formatDate(user.created_at) : "N/A"}</p></div>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-2" />Edit Profile</Button>
        </CardContent>
      </Card>

      {/* Aarti Notification Preferences */}
      <AartiNotificationPrefsCard />

      {/* Push Notifications */}
      <PushNotificationToggle />

      {/* Push Notification Preferences */}
      <PushNotificationPrefsCard />

      {/* Email Notification Preferences */}
      <EmailNotificationPrefsCard />

      {/* Security & Quick Login Settings */}
      {user?.email && <SecuritySettingsCard userEmail={user.email} />}

      {user && <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} userId={user.id} onProfileUpdate={fetchProfile} />}
    </div>
  );
};

export default UserProfile;
