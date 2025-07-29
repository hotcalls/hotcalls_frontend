import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WelcomeFlow } from "@/components/WelcomeFlow";
import { useState, useEffect, ReactNode } from "react";
import { agentAPI, workspaceAPI } from "@/lib/apiService";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingAgents, setIsCheckingAgents] = useState(true);

  useEffect(() => {
    const checkWelcomeFlow = async () => {
      try {
        console.log('🔍 Checking welcome flow status...');
        
        // ALWAYS check for agents first - this is the most important check!
        // Get user's workspaces
        const workspaces = await workspaceAPI.getMyWorkspaces();
        if (!workspaces || workspaces.length === 0) {
          console.log('🆕 No workspaces found, showing welcome flow');
          setShowWelcome(true);
          setIsCheckingAgents(false);
          return;
        }
        
        // Get agents directly to check if user has any
        const primaryWorkspace = workspaces[0];
        console.log(`🤖 Checking agents for workspace: ${primaryWorkspace.workspace_name}`);
        
        try {
          // Use the direct agent API to get agents for this workspace
          const agents = await agentAPI.getAgents(primaryWorkspace.id);
          const agentCount = agents.length;
          
          console.log(`🤖 Agent check result:`, {
            workspace: primaryWorkspace.workspace_name,
            agent_count: agentCount,
            agents: agents.map(a => ({ id: a.agent_id, name: a.name }))
          });
          
          // MAIN LOGIC: If no agents, ALWAYS show welcome flow!
          if (agentCount === 0) {
            console.log('🆕 No agents found, showing welcome flow (ignoring localStorage)');
            // Remove any incorrect welcomeCompleted flag
            localStorage.removeItem('welcomeCompleted');
            setShowWelcome(true);
          } else {
            console.log('✅ User has existing agents, no need for welcome flow');
            // User has agents, mark welcome as completed and skip
            localStorage.setItem('welcomeCompleted', 'true');
            setShowWelcome(false);
          }
        } catch (agentError) {
          console.error('❌ Failed to get agents:', agentError);
          // If we can't check agents, show welcome flow to be safe
          console.log('⚠️ Could not verify agents, showing welcome flow as fallback');
          setShowWelcome(true);
        }
      } catch (error) {
        console.warn('⚠️ Could not check agents for welcome flow:', error);
        // On error, show welcome flow to ensure new users aren't blocked
        setShowWelcome(true);
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
        <div className="fixed inset-0 z-50">
          <WelcomeFlow 
            onComplete={handleWelcomeComplete} 
          />
        </div>
      )}
      
      {/* Debug Info - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-sm">
          <div className="font-bold mb-1">🐛 Welcome Flow Debug</div>
          <div>welcomeCompleted: {localStorage.getItem('welcomeCompleted') || 'not set'}</div>
          <div>showWelcome: {showWelcome ? 'true' : 'false'}</div>
          <div>isCheckingAgents: {isCheckingAgents ? 'true' : 'false'}</div>
          <button 
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            onClick={() => {
              localStorage.removeItem('welcomeCompleted');
              window.location.reload();
            }}
          >
            Reset Welcome Flow
          </button>
        </div>
      )}
    </SidebarProvider>
  );
}