import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { PriestSidebar } from "./PriestSidebar";
import { PriestTopbar } from "./PriestTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import PrivateAreaSEO from "@/components/PrivateAreaSEO";

const PriestLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPriest, isAdmin, loading: roleLoading } = useUserRole();

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

  if (!isPriest && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <PrivateAreaSEO title="Priest Dashboard" />
      <div className="min-h-screen flex w-full">
        <PriestSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <PriestTopbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PriestLayout;
