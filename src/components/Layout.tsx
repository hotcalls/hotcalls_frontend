import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WelcomeFlow } from "@/components/WelcomeFlow";
import { DebugWelcome } from "@/components/DebugWelcome";
import { agentService } from "@/lib/authService";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingAgents, setIsCheckingAgents] = useState(true);

  useEffect(() => {
    const checkWelcomeFlow = async () => {
      try {
        // Check if user has already completed welcome flow
        const hasCompletedWelcome = localStorage.getItem('welcomeCompleted');
        
        if (hasCompletedWelcome) {
          console.log('🎯 Welcome already completed, skipping flow');
          setShowWelcome(false);
          setIsCheckingAgents(false);
          return;
        }

        console.log('🔍 Checking if user has existing agents...');
        
        // Check if user has existing agents
        const agents = await agentService.getAgents();
        
        if (agents.length > 0) {
          console.log(`✅ User has ${agents.length} agents, marking welcome as completed`);
          // User has agents, mark welcome as completed automatically
          localStorage.setItem('welcomeCompleted', 'true');
          setShowWelcome(false);
        } else {
          console.log('🆕 New user with no agents, showing welcome flow');
          // New user, show welcome flow
          setShowWelcome(true);
        }
      } catch (error) {
        console.warn('⚠️ Could not check agents for welcome flow:', error);
        // If we can't check agents, don't show welcome flow
        setShowWelcome(false);
      } finally {
        setIsCheckingAgents(false);
      }
    };

    checkWelcomeFlow();
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    setShowWelcome(false);
  };

  // Show loading while checking agents
  if (isCheckingAgents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE5B25] mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

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