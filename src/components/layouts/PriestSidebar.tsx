import { LayoutDashboard, Calendar, BookOpen, Megaphone, User } from "lucide-react";
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

const navItems = [
  { title: "Dashboard", url: "/priest", icon: LayoutDashboard },
  { title: "Assigned Pujas", url: "/priest/schedule", icon: Calendar },
  { title: "Notices", url: "/priest/notices", icon: Megaphone },
  { title: "Profile", url: "/priest/profile", icon: User },
];

export function PriestSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-maroon flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-4 w-4 text-secondary-foreground" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <h2 className="font-heading text-sm font-semibold truncate">Priest Panel</h2>
              <p className="text-xs text-muted-foreground truncate">Kailash Mahadev</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/priest"}
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
