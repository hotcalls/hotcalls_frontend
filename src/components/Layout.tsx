import { WelcomeFlow } from './WelcomeFlow';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { CreateAgentDialog } from './CreateAgentDialog';
import { workspaceAPI, agentAPI, paymentAPI } from '@/lib/apiService';
import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    const checkWelcomeFlow = async () => {
      try {
        console.log('🔍 Checking workspace plan status for welcome flow...');
        
        // First get user's workspaces
        const workspaces = await workspaceAPI.getMyWorkspaces();
        if (!workspaces || workspaces.length === 0) {
          console.log('🆕 No workspace found, showing welcome flow');
          setShowWelcome(true);
          setIsCheckingSubscription(false);
          return;
        }
        
        const primaryWorkspace = workspaces[0];
        console.log('🏢 Checking plan for workspace:', primaryWorkspace.workspace_name);
        
        // Check if WORKSPACE has active subscription using the correct endpoint
        try {
          const subscriptionData = await paymentAPI.getSubscription(primaryWorkspace.id);
          console.log('💳 Workspace subscription check result:', subscriptionData);
          
          // Check if workspace has active subscription
          const hasActiveSubscription = subscriptionData.has_subscription && 
            subscriptionData.subscription?.status === 'active';
          
          console.log('💳 Workspace subscription details:', {
            workspace_id: primaryWorkspace.id,
            workspace_name: primaryWorkspace.workspace_name,
            has_subscription: subscriptionData.has_subscription,
            status: subscriptionData.subscription?.status,
            plan: subscriptionData.subscription?.plan,
            hasActiveSubscription
          });
          
          // MAIN LOGIC: Show welcome flow (plan selection) if workspace has NO active subscription
          if (!hasActiveSubscription) {
            console.log('🆕 Workspace has no active subscription, showing plan selection');
            localStorage.removeItem('welcomeCompleted');
            setShowWelcome(true);
          } else {
            console.log('✅ Workspace has active subscription, proceeding to dashboard');
            localStorage.setItem('welcomeCompleted', 'true');
            setShowWelcome(false);
          }
        } catch (subscriptionError: any) {
          console.error('❌ Failed to check workspace subscription:', subscriptionError);
          
          // If error checking subscription, show welcome flow (plan selection) as fallback
          console.log('⚠️ Could not verify workspace subscription, showing plan selection as fallback');
          setShowWelcome(true);
        }
      } catch (error) {
        console.warn('⚠️ Could not check workspace plan for welcome flow:', error);
        // If can't check, show welcome flow to be safe
        setShowWelcome(true);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    // Check immediately on mount
    checkWelcomeFlow();
  }, [navigate]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    setShowWelcome(false);
  };

  // Show loading while checking subscription
  if (isCheckingSubscription) {
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
          <div>isCheckingSubscription: {isCheckingSubscription ? 'true' : 'false'}</div>
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