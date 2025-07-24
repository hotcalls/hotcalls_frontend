import { 
  BarChart3, 
  Bot, 
  Users, 
  Calendar, 
  Settings,
  Phone,
  User,
  LogOut,
  Webhook
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
  { title: "Lead Quellen", url: "/lead-sources", icon: Webhook },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Kalender", url: "/calendar", icon: Calendar },
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
      <SidebarContent className="flex flex-col h-full">
        {/* Logo & Workspace */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">hotcalls</span>
          </div>
          <WorkspaceSelector />
        </div>

        {/* Navigation */}
        <div className="flex-1">
          <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === "/"} 
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            active 
                              ? "bg-primary/10 text-primary" 
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Account Section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john.doe@company.com</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </Button>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}