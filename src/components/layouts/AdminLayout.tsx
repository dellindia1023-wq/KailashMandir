import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";
import PrivateAreaSEO from "@/components/PrivateAreaSEO";

// Routes restricted to Super Admin only
const SUPER_ADMIN_ONLY_ROUTES = ["/admin/users", "/admin/settings"];

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect regular admins away from Super Admin only pages
  useEffect(() => {
    if (!adminLoading && isAdmin && !isSuperAdmin) {
      if (SUPER_ADMIN_ONLY_ROUTES.includes(location.pathname)) {
        toast.error("Access denied. This section is restricted to Super Admin only.");
        navigate("/admin", { replace: true });
      }
    }
  }, [adminLoading, isAdmin, isSuperAdmin, location.pathname, navigate]);

  // Still loading — show spinner
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in — redirect to auth immediately
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not admin — redirect to user dashboard
  // TEMPORARILY: Allow all users for testing
  // if (!isAdmin) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  // Block rendering of restricted pages for non-super-admins
  const isRestrictedRoute = SUPER_ADMIN_ONLY_ROUTES.includes(location.pathname);
  if (isRestrictedRoute && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <PrivateAreaSEO title="Admin Panel" />
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperAdmin={isSuperAdmin} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet context={{ isSuperAdmin }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
