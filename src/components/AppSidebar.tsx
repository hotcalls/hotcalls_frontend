import { 
  BarChart3, 
  Bot, 
  Users, 
  Calendar, 
  Settings,
  Phone
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Agenten", url: "/agents", icon: Bot },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Kalender", url: "/calendar", icon: Calendar },
  { title: "Einstellungen", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "text-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar className="w-64 border-r border-border bg-card">
      <SidebarContent>
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Phone className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">hotcalls</span>
          </div>
        </div>

        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
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