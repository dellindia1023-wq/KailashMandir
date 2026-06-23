import { Link, useLocation } from "react-router-dom";
import { Home, Clock, BookOpen, MessageCircle, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const { role } = useUserRole();

  // Hide on dashboard/admin/priest layouts and auth page
  const hiddenPaths = ["/dashboard", "/admin", "/priest", "/auth", "/reset-password"];
  const shouldHide = hiddenPaths.some((p) => location.pathname.startsWith(p));

  if (!isMobile || shouldHide) return null;

  const accountHref = !user
    ? "/auth"
    : role === "super_admin" || role === "admin"
    ? "/admin"
    : role === "priest"
    ? "/priest"
    : "/dashboard";

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/darshan-timings", icon: Clock, label: "Darshan" },
    { href: "/pujas", icon: BookOpen, label: "Pujas" },
    { href: accountHref, icon: User, label: user ? "Account" : "Sign In" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon
                className={`h-5 w-5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
