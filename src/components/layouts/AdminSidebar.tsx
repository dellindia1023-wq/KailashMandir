import {
  LayoutDashboard, Calendar, BookOpen, Users, Heart,
  Image, Megaphone, CalendarDays, ShieldCheck, Settings, Package, Crown, Shield, UserCircle, BarChart3, Edit3, BookMarked, HelpCircle, Clock
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
import { Badge } from "@/components/ui/badge";

const mainNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Pujas", url: "/admin/pujas", icon: BookOpen },
  { title: "Priests", url: "/admin/priests", icon: Users },
  { title: "Donations", url: "/admin/donations", icon: Heart },
  { title: "Temple Timings", url: "/admin/darshan-schedule", icon: Clock },
];

const contentNav = [
  { title: "Content Management", url: "/admin/content", icon: Edit3 },
  { title: "Blogs", url: "/admin/blogs", icon: BookMarked },
  { title: "Knowledge Hub", url: "/admin/knowledge-hub", icon: HelpCircle },
  { title: "Events", url: "/admin/events", icon: CalendarDays },
  { title: "Notices", url: "/admin/notices", icon: Megaphone },
  { title: "Gallery", url: "/admin/gallery", icon: Image },
];

// Super Admin only system nav items
const superAdminSystemNav = [
  { title: "Inventory", url: "/admin/inventory", icon: Package },
  { title: "User Management", url: "/admin/users", icon: ShieldCheck },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "My Profile", url: "/admin/profile", icon: UserCircle },
];

// Regular Admin system nav items (no User Management, no Settings)
const adminSystemNav = [
  { title: "Inventory", url: "/admin/inventory", icon: Package },
  { title: "My Profile", url: "/admin/profile", icon: UserCircle },
];

export function AdminSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { open } = useSidebar();
  const systemNav = isSuperAdmin ? superAdminSystemNav : adminSystemNav;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSuperAdmin ? 'bg-gradient-to-br from-gold to-saffron' : 'bg-gradient-saffron'}`}>
            {isSuperAdmin ? (
              <Crown className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Shield className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
          {open && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h2 className="font-heading text-sm font-semibold truncate">
                  {isSuperAdmin ? "Super Admin" : "Temple Admin"}
                </h2>
                {isSuperAdmin && (
                  <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] px-1 py-0 h-4">SA</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">Kailash Mahadev</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
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
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentNav.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{isSuperAdmin ? "System" : "Tools"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => (
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
