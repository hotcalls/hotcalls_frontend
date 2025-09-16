import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/authService';
import { authAPI, workspaceAPI, paymentAPI } from '@/lib/apiService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [shouldShowPlanSelection, setShouldShowPlanSelection] = useState(false);

  useEffect(() => {
    console.log('🔒 ProtectedRoute: Validating authentication...');
    validateAuthentication();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      
      
      // Get user's workspaces
      const workspaces = await workspaceAPI.getMyWorkspaces();
      if (!workspaces || workspaces.length === 0) {
        console.log('🆕 No workspace found, need plan selection');
        setShouldShowPlanSelection(true);
        return;
      }
      
      const primaryWorkspace = workspaces[0];
      

      // Detect recent payment success (URL param or local flag)
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment') === 'success' || localStorage.getItem('selectedPlan');

      // Retry window to absorb Stripe webhook latency
      const maxAttempts = paymentSuccess ? 3 : 1;
      const delayMs = 3000;
      let activeBySubscription = false;
      let lastResponse: any = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const sub = await paymentAPI.getSubscription(primaryWorkspace.id);
          lastResponse = sub;
          
          activeBySubscription = !!(sub?.has_subscription && sub?.subscription?.status === 'active');
          if (activeBySubscription) break;
        } catch (e) {
          console.warn(`⚠️ Subscription check failed on attempt ${attempt}/${maxAttempts}:`, e);
        }
        if (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }

      // Fallback: workspace details fields (server may expose different flags)
      let activeByWorkspace = false;
      if (!activeBySubscription) {
        try {
          const ws = await workspaceAPI.getWorkspaceDetails(primaryWorkspace.id);
          activeByWorkspace = !!(
            ws?.is_subscription_active ||
            ws?.has_active_subscription ||
            ws?.subscription_active ||
            ws?.active_subscription ||
            ws?.subscription_status === 'active' ||
            ws?.plan_status === 'active'
          );

          console.log('📊 Workspace subscription status:', {
            is_subscription_active: ws?.is_subscription_active,
            has_active_subscription: ws?.has_active_subscription,
            subscription_active: ws?.subscription_active,
            active_subscription: ws?.active_subscription,
            subscription_status: ws?.subscription_status,
            plan_status: ws?.plan_status,
            activeByWorkspace,
          });
        } catch (e) {
          console.warn('⚠️ Workspace details fallback check failed:', e);
        }
      }

      const finalActive = activeBySubscription || activeByWorkspace;

      console.log('🔄 Final subscription determination:', {
        activeBySubscription,
        activeByWorkspace,
        finalActive,
        lastResponse,
      });

      setHasActiveSubscription(finalActive);
      setShouldShowPlanSelection(!finalActive);
      if (!finalActive) {
        console.log('🆕 No active subscription at login, will show plan selection');
      } else {
        console.log('✅ Active subscription found, user has full access');
      }
      
    } catch (error: any) {
      console.error("[ERROR]:", error);
      // On error, assume no subscription and show plan selection
      setShouldShowPlanSelection(true);
      setHasActiveSubscription(false);
    }
  };

  const validateAuthentication = async () => {
    try {
      // STRICT AUTHENTICATION CHECK
      const authToken = localStorage.getItem('authToken');
      const userLoggedIn = localStorage.getItem('userLoggedIn');

      console.log('🔍 Checking authentication state:', {
        hasAuthToken: !!authToken,
        hasUserLoggedInFlag: userLoggedIn === 'true',
        authTokenLength: authToken?.length || 0
      });

      // FAIL FAST: If no token or flag, immediate redirect
      if (!authToken || userLoggedIn !== 'true') {
        console.log('❌ No valid authentication found, redirecting to login');
        authService.clearUser(); // Clear any stale data
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Validate token with backend API call
      console.log('🔐 Validating token with backend API...');
      
      try {
        const profileResponse = await authAPI.getProfile();
        console.log('✅ Token validation successful:', profileResponse.email);
        setIsAuthenticated(true);
        
        // After successful authentication, check subscription status
        await checkSubscriptionStatus();
        
      } catch (error: any) {
        console.error("[ERROR]:", error);
        
        // Handle all API failures as authentication failures
        console.log('🔒 API validation failed - clearing auth and redirecting to login');
        
        // THOROUGHLY CLEAR ALL AUTH STATE
        authService.clearUser();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('user');
        
        setIsAuthenticated(false);
      }
      
    } catch (error) {
      console.error("[ERROR]:", error);
      
      // On any error, clear auth state and redirect
      authService.clearUser();
      setIsAuthenticated(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Show loading spinner while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3d5097] mx-auto"></div>
          <p className="mt-4 text-gray-600">Überprüfe Anmeldung und Subscription...</p>
        </div>
      </div>
    );
  }

  // STRICT: Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 User not authenticated, redirecting to login page');
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no active subscription, redirect to dashboard with plan selection
  if (shouldShowPlanSelection) {
    console.log('🆕 User authenticated but no active subscription - dashboard will show plan selection');
    // Let the Layout component handle showing the WelcomeFlow for plan selection
  }

  return <>{children}</>;
} 