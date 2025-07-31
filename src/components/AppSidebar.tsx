import { Calendar, Home, BarChart3, Users, Settings, CreditCard, Eye, FileText, Webhook, LogOut } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useLocation } from "react-router-dom";
import { buttonStyles, iconSizes } from "@/lib/buttonStyles";
import { useUserProfile } from "@/hooks/use-user-profile";
import { authService } from "@/lib/authService";
import { apiConfig } from "@/lib/apiConfig";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agenten", url: "/dashboard/agents", icon: Users },
  { title: "Leads", url: "/dashboard/leads", icon: FileText },
  { title: "Kalender", url: "/dashboard/calendar", icon: Calendar },
  { title: "Lead Quellen", url: "/dashboard/lead-sources", icon: Webhook },
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
            onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
          >
            <CreditCard className={iconSizes.small} />
            <span>Guthaben auffüllen</span>
          </button>
        ) : (
          <button 
            className={buttonStyles.secondary.fullWidth}
            onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
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
  const { profile, loading, getDisplayName, getInitials } = useUserProfile();

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    }
    return location.pathname.startsWith(url);
  };

  const handleSignOut = async () => {
    console.log("Signing out...");
    
    try {
      // Call logout API endpoint
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log("✅ Logout successful");
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local cleanup even if API call fails
    }
    
    // Clear all auth data
    authService.clearUser();
    apiConfig.clearAuth();
    
    // Redirect to home page (which will redirect to login)
    window.location.href = "/";
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        {/* hotcalls Logo */}
        <div className="px-2 py-3">
          <div className="flex items-center">
            <img 
              src="/hotcalls-logo.png" 
              alt="hotcalls" 
              className="h-10 w-auto max-w-full"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
                         <div className="items-center gap-3 hidden">
               <div className="w-8 h-8 bg-[#FE5B25] rounded-full flex items-center justify-center">
                 <span className="text-white text-sm font-bold">H</span>
               </div>
               <span className="text-xl font-bold text-gray-900">hotcalls</span>
             </div>
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
        
        {/* Einstellungen - zwischen Plan und Account */}
        <div className="px-2 pb-3">
          <a
            href="/dashboard/settings"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full
              ${isActive("/dashboard/settings")
                ? "bg-[#FFE1D7] text-[#FE5B25]" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >
            <Settings className={`${iconSizes.small} ${isActive("/dashboard/settings") ? "text-[#FE5B25]" : "text-gray-500"}`} />
            <span>Einstellungen</span>
          </a>
        </div>
        
        {/* Account Section */}
        <div className="p-2">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 w-8 h-8 bg-[#FE5B25] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {loading ? "?" : getInitials()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {loading ? "Wird geladen..." : getDisplayName() || "Unbekannt"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {loading ? "..." : profile?.email || "Keine E-Mail"}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}