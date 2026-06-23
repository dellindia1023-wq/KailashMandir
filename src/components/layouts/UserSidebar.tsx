import {
  LayoutDashboard, Calendar, Heart, CreditCard, User,
  BookOpen, Megaphone, CalendarDays, Home, Bell, Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Bookings", url: "/dashboard/bookings", icon: Calendar },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Favorite Pujas", url: "/dashboard/favorites", icon: Heart },
  { title: "Donations", url: "/dashboard/donations", icon: CreditCard },
  { title: "My Kundlis", url: "/dashboard/kundlis", icon: Sparkles },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

const exploreNav = [
  { title: "Browse Pujas", url: "/pujas", icon: BookOpen },
  { title: "Events", url: "/events", icon: CalendarDays },
  { title: "Notice Board", url: "/notice-board", icon: Megaphone },
  { title: "Temple Home", url: "/", icon: Home },
];

export function UserSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-saffron flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-heading text-sm">ॐ</span>
          </div>
          {open && (
            <div className="overflow-hidden">
              <h2 className="font-heading text-sm font-semibold truncate">My Account</h2>
              <p className="text-xs text-muted-foreground truncate">Kailash Mahadev</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Temple</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-2 hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
