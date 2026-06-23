import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { RescheduleBookingDialog } from "@/components/RescheduleBookingDialog";
import { CancelBookingDialog } from "@/components/CancelBookingDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useBookingEmail } from "@/hooks/useBookingEmail";
import { 
  User, Heart, CreditCard, LogOut, Calendar, Clock, 
  IndianRupee, ArrowRight, Trash2, Loader2, Pencil, Mail, CalendarClock, X, Download
} from "lucide-react";
import { generateReceipt } from "@/lib/generateReceipt";

interface Puja {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

interface FavoritePuja {
  id: string;
  puja_id: string;
  created_at: string;
  pujas: Puja;
}

interface Donation {
  id: string;
  amount: number;
  tier: string;
  status: string;
  created_at: string;
  transaction_id: string | null;
  payment_method: string | null;
}

interface PujaBooking {
  id: string;
  puja_id: string;
  devotee_name: string;
  devotee_gotra: string | null;
  booking_date: string;
  booking_time: string;
  amount: number;
  payment_status: string;
  special_instructions: string | null;
  created_at: string;
  pujas: {
    id: string;
    name: string;
    category: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favoritePujas, setFavoritePujas] = useState<FavoritePuja[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [bookings, setBookings] = useState<PujaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<PujaBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<PujaBooking | null>(null);
  const { sendReminderEmail } = useBookingEmail();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch favorite pujas with puja details
      const { data: favoritesData } = await supabase
        .from("favorite_pujas")
        .select(`
          id,
          puja_id,
          created_at,
          pujas (id, name, description, price, duration_minutes, category)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setFavoritePujas((favoritesData as unknown as FavoritePuja[]) || []);

      // Fetch donations
      const { data: donationsData } = await supabase
        .from("donations")
        .select("id, user_id, amount, tier, status, transaction_id, payment_method, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setDonations(donationsData || []);

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("puja_bookings")
        .select(`
          id,
          puja_id,
          devotee_name,
          devotee_gotra,
          booking_date,
          booking_time,
          amount,
          payment_status,
          special_instructions,
          created_at,
          pujas (id, name, category)
        `)
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });
      
      setBookings((bookingsData as unknown as PujaBooking[]) || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorite_pujas")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      toast.error("Failed to remove favorite");
    } else {
      toast.success("Removed from favorites");
      setFavoritePujas(favoritePujas.filter(f => f.id !== favoriteId));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "seva": return "bg-green-100 text-green-700";
      case "archana": return "bg-blue-100 text-blue-700";
      case "abhishekam": return "bg-purple-100 text-purple-700";
      case "mahadan": return "bg-gold/20 text-gold";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return { color: "bg-green-100 text-green-700", label: "Paid" };
      case "pending":
        return { color: "bg-yellow-100 text-yellow-700", label: "Pending" };
      case "failed":
        return { color: "bg-red-100 text-red-700", label: "Failed" };
      case "cancelled":
        return { color: "bg-gray-100 text-gray-700", label: "Cancelled" };
      default:
        return { color: "bg-muted text-muted-foreground", label: status };
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getBookingStatus = (booking: PujaBooking) => {
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (booking.payment_status === "cancelled") {
      return { label: "Cancelled", color: "bg-gray-100 text-gray-700", isUpcoming: false, canModify: false };
    }
    if (booking.payment_status !== "completed" && booking.payment_status !== "paid") {
      return { label: "Payment Pending", color: "bg-yellow-100 text-yellow-700", isUpcoming: false, canModify: false };
    }
    if (bookingDate < today) {
      return { label: "Completed", color: "bg-green-100 text-green-700", isUpcoming: false, canModify: false };
    }
    if (bookingDate.getTime() === today.getTime()) {
      return { label: "Today", color: "bg-blue-100 text-blue-700", isUpcoming: true, canModify: false };
    }
    return { label: "Upcoming", color: "bg-purple-100 text-purple-700", isUpcoming: true, canModify: true };
  };

  const handleSendReminder = async (bookingId: string) => {
    setSendingReminder(bookingId);
    await sendReminderEmail(bookingId);
    setSendingReminder(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
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
            <Button variant="outline" onClick={handleSignOut} className="text-destructive border-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-saffron/5 border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{bookings.length}</p>
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
                  <p className="text-2xl font-heading font-bold text-foreground">{favoritePujas.length}</p>
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
                  <p className="text-2xl font-heading font-bold text-foreground">{donations.length}</p>
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
                    ₹{donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Contributed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="mb-6">
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="h-4 w-4" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorite Pujas
            </TabsTrigger>
            <TabsTrigger value="donations" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Donation History
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

            <TabsContent value="bookings">
              {bookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-heading text-xl font-semibold mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Book a puja to receive divine blessings
                    </p>
                    <Link to="/pujas">
                      <Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                        Browse Pujas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const status = getBookingStatus(booking);
                    const paymentStatus = getPaymentStatusConfig(booking.payment_status);
                    return (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 text-saffron" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-heading font-semibold text-lg">{booking.pujas.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  For: <span className="text-foreground">{booking.devotee_name}</span>
                                  {booking.devotee_gotra && (
                                    <span className="ml-2">• Gotra: {booking.devotee_gotra}</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(booking.booking_date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatTime(booking.booking_time)}
                                  </span>
                                </div>
                                {booking.special_instructions && (
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    "{booking.special_instructions}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-semibold text-lg text-primary">
                                ₹{booking.amount.toLocaleString("en-IN")}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={status.color}>{status.label}</Badge>
                                <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
                              </div>
                              {(booking.payment_status === "completed" || booking.payment_status === "paid") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => generateReceipt({
                                    type: "booking",
                                    id: booking.id,
                                    name: booking.pujas.name,
                                    date: formatDate(booking.booking_date),
                                    amount: booking.amount,
                                    details: {
                                      "Devotee": booking.devotee_name,
                                      "Gotra": booking.devotee_gotra || "—",
                                      "Date": formatDate(booking.booking_date),
                                      "Time": formatTime(booking.booking_time),
                                      "Category": booking.pujas.category,
                                    },
                                  })}
                                >
                                  <Download className="h-3 w-3 mr-1" /> Receipt
                                </Button>
                              )}
                              {/* Action buttons for upcoming bookings */}
                              {status.isUpcoming && (booking.payment_status === "completed" || booking.payment_status === "paid") && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendReminder(booking.id)}
                                    disabled={sendingReminder === booking.id}
                                    className="text-xs"
                                  >
                                    {sendingReminder === booking.id ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Mail className="h-3 w-3 mr-1" />
                                    )}
                                    Reminder
                                  </Button>
                                  {status.canModify && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRescheduleBooking(booking)}
                                        className="text-xs"
                                      >
                                        <CalendarClock className="h-3 w-3 mr-1" />
                                        Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCancelBooking(booking)}
                                        className="text-xs text-destructive hover:text-destructive"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              {favoritePujas.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-heading text-xl font-semibold mb-2">No Favorite Pujas Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Explore our pujas and add your favorites for quick access
                    </p>
                    <Link to="/pujas">
                      <Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                        Browse Pujas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoritePujas.map((favorite) => (
                    <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Badge className="bg-primary/10 text-primary text-xs">
                            {favorite.pujas.category}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFavorite(favorite.id)}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="font-heading text-lg">{favorite.pujas.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {favorite.pujas.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {favorite.pujas.duration_minutes} mins
                          </div>
                          <p className="font-semibold text-primary">
                            ₹{favorite.pujas.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <Button className="w-full mt-4 bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                          Book Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="donations">
              {donations.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-heading text-xl font-semibold mb-2">No Donations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Support the temple and receive divine blessings
                    </p>
                    <Link to="/#donate">
                      <Button className="bg-gradient-saffron hover:opacity-90 text-primary-foreground">
                        Make a Donation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Donation Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Completed</p>
                        <p className="text-xl font-heading font-bold text-green-700">
                          ₹{donations.filter(d => d.status === "completed").reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === "completed").length} donations</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Pending</p>
                        <p className="text-xl font-heading font-bold text-yellow-700">
                          ₹{donations.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === "pending").length} donations</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gold/10 to-accent/5 border-gold/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
                        <p className="text-xl font-heading font-bold text-gold">
                          ₹{donations.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">{donations.length} total</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Donation Receipts */}
                  <div className="space-y-3">
                    {donations.map((donation) => (
                      <Card key={donation.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                                <IndianRupee className="h-5 w-5 text-gold" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-heading font-semibold text-lg">
                                  ₹{donation.amount.toLocaleString("en-IN")}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(donation.created_at)}
                                  </span>
                                  {donation.transaction_id && (
                                    <span className="font-mono">
                                      TXN: {donation.transaction_id.slice(0, 16)}…
                                    </span>
                                  )}
                                  {donation.payment_method && (
                                    <span className="capitalize">{donation.payment_method}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Receipt #{donation.id.slice(0, 8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                              <Badge className={getTierColor(donation.tier)}>
                                {donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1)}
                              </Badge>
                              <Badge className={getStatusColor(donation.status)}>
                                {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                              </Badge>
                              {donation.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => generateReceipt({
                                    type: "donation",
                                    id: donation.id,
                                    name: `${donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1)} Donation`,
                                    date: formatDate(donation.created_at),
                                    amount: donation.amount,
                                    details: {
                                      "Tier": donation.tier.charAt(0).toUpperCase() + donation.tier.slice(1),
                                      "Transaction ID": donation.transaction_id || "—",
                                      "Payment Method": donation.payment_method || "—",
                                      "Date": formatDate(donation.created_at),
                                    },
                                  })}
                                >
                                  <Download className="h-3 w-3 mr-1" /> Receipt
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Make Another Donation */}
                  <div className="text-center pt-2">
                    <Link to="/#donate">
                      <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                        <Heart className="h-4 w-4 mr-2" />
                        Make Another Donation
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-foreground">{profile?.full_name || "Not set"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-foreground">{profile?.phone || "Not set"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-foreground">{user?.created_at ? formatDate(user.created_at) : "N/A"}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {user && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          userId={user.id}
          onProfileUpdate={fetchUserData}
        />
      )}

      <RescheduleBookingDialog
        booking={rescheduleBooking}
        open={!!rescheduleBooking}
        onOpenChange={(open) => !open && setRescheduleBooking(null)}
        onSuccess={fetchUserData}
      />

      <CancelBookingDialog
        booking={cancelBooking}
        open={!!cancelBooking}
        onOpenChange={(open) => !open && setCancelBooking(null)}
        onSuccess={fetchUserData}
      />
    </div>
  );
};

export default Dashboard;
