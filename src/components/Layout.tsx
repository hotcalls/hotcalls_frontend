import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { WelcomeFlow } from "@/components/WelcomeFlow";
import { DebugWelcome } from "@/components/DebugWelcome";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user is new and needs welcome flow
    const hasCompletedWelcome = localStorage.getItem('welcomeCompleted');
    if (!hasCompletedWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    setShowWelcome(false);
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-background ${showWelcome ? 'blur-sm pointer-events-none' : ''}`}>
        <AppSidebar />
        
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
      
      {/* Welcome Flow */}
      {showWelcome && (
        <WelcomeFlow 
          onComplete={handleWelcomeComplete} 
        />
      )}
      
      {/* Debug Helper - Remove in production */}
      <DebugWelcome />
    </SidebarProvider>
  );
}