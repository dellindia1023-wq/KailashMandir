import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { UserSidebar } from "./UserSidebar";
import { UserTopbar } from "./UserTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import PrivateAreaSEO from "@/components/PrivateAreaSEO";

const UserLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role === "super_admin" || role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "priest") {
    return <Navigate to="/priest" replace />;
  }

  return (
    <SidebarProvider>
      <PrivateAreaSEO title="Devotee Dashboard" />
      <div className="min-h-screen flex w-full">
        <UserSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <UserTopbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserLayout;
