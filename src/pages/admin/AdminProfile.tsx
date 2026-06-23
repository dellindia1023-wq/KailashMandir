import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, User, Mail, Phone, Crown, Shield } from "lucide-react";
import SecuritySettingsCard from "@/components/SecuritySettingsCard";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PushNotificationPrefsCard } from "@/components/PushNotificationPrefsCard";
import { EmailNotificationPrefsCard } from "@/components/EmailNotificationPrefsCard";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const AdminProfile = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext<{ isSuperAdmin: boolean } | undefined>();
  const isSuperAdmin = outletContext?.isSuperAdmin ?? false;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>
        <Badge
          className={
            isSuperAdmin
              ? "bg-gold/20 text-gold border-gold/30"
              : "bg-primary/10 text-primary"
          }
        >
          {isSuperAdmin ? (
            <>
              <Crown className="h-3 w-3 mr-1" /> Super Admin
            </>
          ) : (
            <>
              <Shield className="h-3 w-3 mr-1" /> Admin
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading">Profile Information</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-saffron flex items-center justify-center text-primary-foreground text-3xl font-heading overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold">
                {profile?.full_name || "Not set"}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <p className="text-foreground">
                  {profile?.full_name || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="text-foreground">
                  {profile?.phone || "Not set"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="text-foreground">
                {user?.created_at ? formatDate(user.created_at) : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <ChangePasswordCard />

      {/* Push Notifications */}
      <PushNotificationToggle />
      <PushNotificationPrefsCard />

      {/* Email Notification Preferences */}
      <EmailNotificationPrefsCard />

      {/* Security & Quick Login Settings */}
      {user?.email && <SecuritySettingsCard userEmail={user.email} />}

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

export default AdminProfile;
