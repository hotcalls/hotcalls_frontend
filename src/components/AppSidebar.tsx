import { 
  BarChart3, 
  Bot, 
  Users, 
  Calendar, 
  Settings,
  Phone,
  User,
  LogOut,
  Webhook,
  Clock,
  CreditCard,
  Eye
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
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Kalender", url: "/calendar", icon: Calendar },
  { title: "Lead Quellen", url: "/lead-sources", icon: Webhook },
];

// Mock data for current user plan - change this to test different scenarios
const currentPlan = {
  type: "Free Trial", // "Free Trial" | "Basic" | "Pro" | "Enterprise"
  usedMinutes: 65,
  totalMinutes: 100,
  daysLeft: 12, // only for Free Trial
  usagePercentage: 65
};

// Alternative scenarios to test:
/*
// Free Trial - almost expired
const currentPlan = {
  type: "Free Trial",
  usedMinutes: 85,
  totalMinutes: 100,
  daysLeft: 3,
  usagePercentage: 85
};

// Basic Plan - needs upgrade
const currentPlan = {
  type: "Basic",
  usedMinutes: 750,
  totalMinutes: 1000,
  daysLeft: null,
  usagePercentage: 75
};

// Pro Plan - good usage
const currentPlan = {
  type: "Pro",
  usedMinutes: 1200,
  totalMinutes: 5000,
  daysLeft: null,
  usagePercentage: 24
};
*/

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

  const PlanSection = () => {
    const { type, usedMinutes, totalMinutes, daysLeft, usagePercentage } = currentPlan;
    const needsUpgrade = usagePercentage >= 60;

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Plan: {type}</span>
            {type === "Free Trial" && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{daysLeft} Tage</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Verbrauchte Minuten</span>
              <span className="font-medium text-gray-900">{usedMinutes} / {totalMinutes}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gray-400 transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            
            <div className="text-xs text-gray-500">
              {usagePercentage}% verbraucht
            </div>
          </div>
          
          {needsUpgrade ? (
            <button 
              className="w-full px-3 py-2 rounded-md border border-orange-500 bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center"
              onClick={() => window.location.href = '/settings?tab=billing'}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Guthaben auffüllen
            </button>
          ) : (
            <button 
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
              onClick={() => window.location.href = '/settings?tab=billing'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Plan ansehen
            </button>
          )}
        </div>
      </div>
    );
  };

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

        {/* Plan Section */}
        <PlanSection />

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