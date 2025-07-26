import { Calendar, Home, BarChart3, Users, Settings, CreditCard, Eye, Phone, FileText, Webhook } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useLocation } from "react-router-dom";
import { buttonStyles, iconSizes } from "@/lib/buttonStyles";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Agenten", url: "/agents", icon: Users },
  { title: "Leads", url: "/leads", icon: FileText },
  { title: "Kalender", url: "/calendar", icon: Calendar },
  { title: "Lead Quellen", url: "/lead-sources", icon: Webhook },
  { title: "Einstellungen", url: "/settings", icon: Settings },
];

const currentPlan = {
  name: "Pro",
  usedMinutes: 247,
  totalMinutes: 1000,
  needsUpgrade: false
};

const PlanSection = () => {
  const progressPercentage = (currentPlan.usedMinutes / currentPlan.totalMinutes) * 100;
  const needsUpgrade = progressPercentage > 80; // Show upgrade button if > 80% used

  return (
    <div className="px-2 py-3">
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{currentPlan.name} Plan</div>
          <div className="text-xs text-gray-500">
            {currentPlan.usedMinutes} / {currentPlan.totalMinutes} Minuten
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-[#FE5B25] h-1.5 rounded-full transition-all" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {needsUpgrade ? (
          <button 
            className={buttonStyles.highlight.button}
            onClick={() => window.location.href = '/settings?tab=billing'}
          >
            <CreditCard className={iconSizes.small} />
            <span>Guthaben auffüllen</span>
          </button>
        ) : (
          <button 
            className={buttonStyles.secondary.fullWidth}
            onClick={() => window.location.href = '/settings?tab=billing'}
          >
            <Eye className={iconSizes.small} />
            <span>Plan ansehen</span>
          </button>
        )}
      </div>
    </div>
  );
};

export function AppSidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        {/* hotcalls.ai Logo */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2">
            <Phone className={`${iconSizes.large} text-[#FE5B25]`} />
            <span className="text-xl font-bold text-gray-900">hotcalls.ai</span>
          </div>
        </div>
        
        <WorkspaceSelector />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${active 
                            ? "bg-[#FFE1D7] text-[#FE5B25]" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }
                        `}
                      >
                        <item.icon className={`${iconSizes.small} ${active ? "text-[#FE5B25]" : "text-gray-500"}`} />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Plan Section - über dem Account */}
        <PlanSection />
        
        {/* Account Section */}
        <div className="p-2">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FE5B25] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">MW</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">Marcus Weber</div>
              <div className="text-xs text-gray-500 truncate">marcus@company.com</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}