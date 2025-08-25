import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UsageAlertOverlay } from './UsageAlertOverlay';
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Welcome flow is fully disabled; render the workspace layout directly

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-background`}>
        <AppSidebar />
        
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
      
      {/* Usage Alert Overlay (non-blocking) */}
      <UsageAlertOverlay />
    </SidebarProvider>
  );
}