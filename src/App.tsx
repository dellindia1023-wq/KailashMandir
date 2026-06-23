import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, RouteObject } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import RouteCache from "./components/RouteCache";
import ScrollRestoration from "./components/ScrollRestoration";
import MobileBottomNav from "./components/MobileBottomNav";

// Lazy-loaded public pages
const Install = lazy(() => import("./pages/Install"));
const Auth = lazy(() => import("./pages/Auth"));
const Pujas = lazy(() => import("./pages/Pujas"));
const NoticeBoard = lazy(() => import("./pages/NoticeBoard"));
const Events = lazy(() => import("./pages/Events"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const LiveDarshanPage = lazy(() => import("./pages/LiveDarshanPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const DarshanTimingsPage = lazy(() => import("./pages/DarshanTimingsPage"));
const DonatePage = lazy(() => import("./pages/DonatePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const SocialPostsPage = lazy(() => import("./pages/SocialPostsPage"));


// Lazy-loaded layout + overlays
const StickyNoticeBanner = lazy(() => import("./components/StickyNoticeBanner"));
const PWAInstallBanner = lazy(() => import("./components/PWAInstallBanner"));
const FloatingLanguageButton = lazy(() => import("./components/FloatingLanguageButton"));
const AartiReminderBanner = lazy(() => import("./components/AartiReminderBanner"));

// Lazy-loaded user pages
const UserLayout = lazy(() => import("./components/layouts/UserLayout"));
const UserDashboardHome = lazy(() => import("./pages/user/UserDashboardHome"));
const UserBookings = lazy(() => import("./pages/user/UserBookings"));
const UserFavorites = lazy(() => import("./pages/user/UserFavorites"));
const UserDonations = lazy(() => import("./pages/user/UserDonations"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const UserNotifications = lazy(() => import("./pages/user/UserNotifications"));

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import("./components/layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminPujas = lazy(() => import("./pages/admin/AdminPujas"));
const AdminPriests = lazy(() => import("./pages/admin/AdminPriests"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminBlogsPage = lazy(() => import("./pages/admin/AdminBlogsPage"));
const AdminKnowledgeHubPage = lazy(() => import("./pages/admin/AdminKnowledgeHubPage"));
const AdminDarshanSchedule = lazy(() => import("./pages/admin/AdminDarshanSchedule"));

// Lazy-loaded blog and knowledge hub pages
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const KnowledgeHubPage = lazy(() => import("./pages/KnowledgeHubPage"));

// Lazy-loaded priest pages
const PriestLayout = lazy(() => import("./components/layouts/PriestLayout"));
const PriestDashboard = lazy(() => import("./pages/priest/PriestDashboard"));
const PriestNotices = lazy(() => import("./pages/priest/PriestNotices"));
const PriestProfile = lazy(() => import("./pages/priest/PriestProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection (was cacheTime in v4)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const routeDefinitions: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/install", element: <Install /> },
  { path: "/auth", element: <Auth /> },
  { path: "/pujas", element: <Pujas /> },
  { path: "/notice-board", element: <NoticeBoard /> },
  { path: "/events", element: <Events /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/gallery", element: <GalleryPage /> },
  { path: "/live-darshan", element: <LiveDarshanPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/darshan-timings", element: <DarshanTimingsPage /> },
  { path: "/donate", element: <DonatePage /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/terms-and-conditions", element: <TermsAndConditions /> },
  { path: "/refund-policy", element: <RefundPolicy /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/social", element: <SocialPostsPage /> },
  { path: "/blogs", element: <BlogPage /> },
  { path: "/blog/:slug", element: <BlogDetailPage /> },
  { path: "/knowledge-hub", element: <KnowledgeHubPage /> },

  {
    path: "/dashboard",
    element: <UserLayout />,
    children: [
      { index: true, element: <UserDashboardHome /> },
      { path: "bookings", element: <UserBookings /> },
      { path: "favorites", element: <UserFavorites /> },
      { path: "donations", element: <UserDonations /> },
      { path: "notifications", element: <UserNotifications /> },
      { path: "profile", element: <UserProfile /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "content", element: <AdminContent /> },
      { path: "darshan-schedule", element: <AdminDarshanSchedule /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "bookings", element: <AdminBookings /> },
      { path: "pujas", element: <AdminPujas /> },
      { path: "priests", element: <AdminPriests /> },
      { path: "donations", element: <AdminDonations /> },
      { path: "events", element: <AdminEvents /> },
      { path: "notices", element: <AdminNotices /> },
      { path: "gallery", element: <AdminGallery /> },
      { path: "blogs", element: <AdminBlogsPage /> },
      { path: "knowledge-hub", element: <AdminKnowledgeHubPage /> },
      { path: "users", element: <AdminUsers /> },
      { path: "inventory", element: <AdminInventory /> },
      { path: "settings", element: <AdminSettings /> },
      { path: "profile", element: <AdminProfile /> },
    ],
  },
  {
    path: "/priest",
    element: <PriestLayout />,
    children: [
      { index: true, element: <PriestDashboard /> },
      { path: "schedule", element: <PriestDashboard /> },
      { path: "notices", element: <PriestNotices /> },
      { path: "profile", element: <PriestProfile /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <LanguageProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollRestoration />
          <Suspense fallback={<PageLoader />}>
            <RouteCache routes={routeDefinitions} />
          </Suspense>
          <Suspense fallback={null}>
            <StickyNoticeBanner />
            <FloatingLanguageButton />
            <PWAInstallBanner />
            <AartiReminderBanner />
          </Suspense>
          <MobileBottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </LanguageProvider>
  </ThemeProvider>
);

export default App;
