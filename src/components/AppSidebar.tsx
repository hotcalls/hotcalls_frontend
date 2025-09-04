import { Calendar, Home, BarChart3, Users, Settings, CreditCard, Eye, FileText, Webhook, LogOut, AlertTriangle, Share2 } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useLocation } from "react-router-dom";
import { buttonStyles, iconSizes } from "@/lib/buttonStyles";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useWorkspace } from "@/hooks/use-workspace";
import { useCallMinutesUsage } from "@/hooks/use-usage-status";
import { authService } from "@/lib/authService";
import { apiConfig } from "@/lib/apiConfig";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agents", url: "/dashboard/agents", icon: Users },
  { title: "Leads", url: "/dashboard/leads", icon: FileText },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Meta Integration", url: "/dashboard/meta-integration", icon: Share2 },
  { title: "CSV Upload", url: "/dashboard/lead-sources", icon: Webhook },
];

const PlanSection = () => {
  const { primaryWorkspace } = useWorkspace();
  // Always call hooks in the same order
  const {
    callMinutes, 
    loading, 
    error, 
    isNearingLimit, 
    isOverLimit, 
    usageColor, 
    displayText, 
    percentage 
  } = useCallMinutesUsage(primaryWorkspace?.id || null);

  // Loading state
  if (loading) {
    return (
      <div className="px-2 py-3">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-2 py-3">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Usage data unavailable</span>
          </div>
          <button 
            className={buttonStyles.secondary.fullWidth}
            onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
          >
            <Eye className={iconSizes.small} />
            <span>View plan</span>
          </button>
        </div>
      </div>
    );
  }

  // No workspace selected
  if (!primaryWorkspace) {
    return (
      <div className="px-2 py-3">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="text-sm text-gray-500">No workspace selected</div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage for progress bar
  const progressPercentage = callMinutes && !callMinutes.unlimited && callMinutes.limit 
    ? Math.min((callMinutes.used / callMinutes.limit) * 100, 100)
    : 0;

  // Determine progress bar color based on usage
  const getProgressBarColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (isNearingLimit) return 'bg-[#3d5097]';
    if (usageColor === 'yellow') return 'bg-yellow-500';
    return 'bg-[#3d5097]'; // Default orange
  };

  // Show upgrade button if nearing or over limit
  const needsUpgrade = isNearingLimit || isOverLimit;

  const HelpBanner = () => (
    <div className="px-2 py-3">
      <div className="bg-white rounded-lg border p-4 space-y-3 text-center">
        <div className="text-sm text-gray-700">You have questions or need help?</div>
        <a
          href="https://cal.com/leopoeppelonboarding/austausch-mit-leonhard-poppel"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonStyles.create.default} w-full justify-center`}
        >
          <Calendar className={iconSizes.small} />
          <span>Talk to Expert</span>
        </a>
      </div>
    </div>
  );

  return (
    <>
      <HelpBanner />
      <div className="px-2 py-3">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate" title={primaryWorkspace.workspace_name}>
              {primaryWorkspace.workspace_name}
            </div>
            <div className="text-xs text-gray-500">
              {displayText}
            </div>
          </div>
          
          {/* Progress bar - only show if not unlimited */}
          {callMinutes && !callMinutes.unlimited && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`${getProgressBarColor()} h-1.5 rounded-full transition-all`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {/* Show percentage if over 0% */}
              {progressPercentage > 0 && (
                <div className="text-xs text-gray-500 text-right">
                  {percentage}
                </div>
              )}
            </div>
          )}
          
          {/* Show warning for over limit */}
          {isOverLimit && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Quota exceeded</span>
            </div>
          )}
          
          {needsUpgrade ? (
            <button 
              className={buttonStyles.highlight.button}
              onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
            >
              <CreditCard className={iconSizes.small} />
              <span>Upgrade plan</span>
            </button>
          ) : (
            <button 
              className={buttonStyles.secondary.fullWidth}
              onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
            >
              <Eye className={iconSizes.small} />
              <span>View usage</span>
            </button>
          )}
        </div>
      </div>
    </>
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
        {/* Logo */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-start w-full">
            <img 
              src="/Messecaller.png" 
              alt="Messecaller" 
              className="h-[72px] w-auto max-w-full object-contain -ml-2"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = '/Messecaller.jpeg';
                  return;
                }
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="items-center gap-3 hidden">
              <div className="w-8 h-8 bg-[#3d5097] rounded-full flex items-center justify-center">
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
                            ? "bg-white text-[#3d5097]" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }
                        `}
                      >
                        <item.icon className={`${iconSizes.small} ${active ? "text-[#3d5097]" : "text-gray-500"}`} />
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
        
        {/* Settings link */}
        <div className="px-2 pb-3">
          <a
            href="/dashboard/settings"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full
              ${isActive("/dashboard/settings")
                ? "bg-white text-[#3d5097]" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >
            <Settings className={`${iconSizes.small} ${isActive("/dashboard/settings") ? "text-[#3d5097]" : "text-gray-500"}`} />
            <span>Settings</span>
          </a>
        </div>
        
        {/* Account Section */}
        <div className="p-2">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 w-8 h-8 bg-[#3d5097] rounded-full flex items-center justify-center">
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