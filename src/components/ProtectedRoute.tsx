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
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('🔒 ProtectedRoute: Validating authentication...');
    validateAuthentication();
  }, []);

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

        // After auth: verify subscription status EXACTLY like in Login
        let subscriptionActive = false;
        try {
          const workspaces = await workspaceAPI.getMyWorkspaces();
          const primaryWs = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces[0] : null;
          if (primaryWs?.id) {
            // Payments API (source of truth)
            try {
              const sub = await paymentAPI.getSubscription(String(primaryWs.id));
              subscriptionActive = !!(sub?.has_subscription && sub?.subscription?.status === 'active');
            } catch {}

            // Workspace details fallback
            if (!subscriptionActive) {
              try {
                const ws = await workspaceAPI.getWorkspaceDetails(String(primaryWs.id));
                subscriptionActive = !!(
                  ws?.is_subscription_active ||
                  ws?.has_active_subscription ||
                  ws?.subscription_active ||
                  ws?.active_subscription ||
                  ws?.subscription_status === 'active' ||
                  ws?.plan_status === 'active'
                );
              } catch {}
            }
          }
        } catch {}

        setHasActiveSubscription(subscriptionActive);

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

  // If authenticated but no active subscription → redirect to welcome (same as Login)
  if (hasActiveSubscription === false) {
    console.log('💳 No active subscription, redirecting to welcome');
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}