import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/authService';
import { authAPI, workspaceAPI, paymentAPI } from '@/lib/apiService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Cache utilities for subscription state
const SUBSCRIPTION_CACHE_KEY = 'subscription_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface SubscriptionCache {
  hasActiveSubscription: boolean;
  timestamp: number;
  workspaceId: string;
}

const getSubscriptionCache = (): SubscriptionCache | null => {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setSubscriptionCache = (hasActiveSubscription: boolean, workspaceId: string) => {
  const cache: SubscriptionCache = {
    hasActiveSubscription,
    timestamp: Date.now(),
    workspaceId
  };
  localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
};

const clearSubscriptionCache = () => {
  localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
};

const isCacheValid = (cache: SubscriptionCache, currentWorkspaceId: string): boolean => {
  return (
    cache.workspaceId === currentWorkspaceId &&
    Date.now() - cache.timestamp < CACHE_DURATION
  );
};

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

        // After auth: verify subscription status with caching
        let subscriptionActive = false;
        let workspaceId = '';

        try {
          const workspaces = await workspaceAPI.getMyWorkspaces();
          const primaryWs = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces[0] : null;

          if (primaryWs?.id) {
            workspaceId = String(primaryWs.id);

            // Check cache first
            const cache = getSubscriptionCache();
            if (cache && isCacheValid(cache, workspaceId)) {
              console.log('📦 Using cached subscription status:', cache.hasActiveSubscription);
              subscriptionActive = cache.hasActiveSubscription;
            } else {
              console.log('🔄 Cache miss or expired, fetching subscription status from backend...');

              // Payments API (source of truth)
              try {
                const sub = await paymentAPI.getSubscription(workspaceId);
                subscriptionActive = !!(sub?.has_subscription && sub?.subscription?.status === 'active');
              } catch {}

              // Workspace details fallback
              if (!subscriptionActive) {
                try {
                  const ws = await workspaceAPI.getWorkspaceDetails(workspaceId);
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

              // Update cache with fresh data
              setSubscriptionCache(subscriptionActive, workspaceId);
              console.log('💾 Updated subscription cache:', subscriptionActive);
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
        clearSubscriptionCache();

        setIsAuthenticated(false);
      }

    } catch (error) {
      console.error("[ERROR]:", error);

      // On any error, clear auth state and redirect
      authService.clearUser();
      clearSubscriptionCache();
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