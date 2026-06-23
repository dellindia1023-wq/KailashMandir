import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Home } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";

export function UserTopbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Badge className="bg-saffron/10 text-saffron text-xs">Devotee</Badge>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Home className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
        <NotificationBell />
        <div className="hidden sm:block text-right mr-2">
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
