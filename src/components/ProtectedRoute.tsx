import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/authService';
import { authAPI } from '@/lib/apiService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('🔒 ProtectedRoute: Validating authentication...');
    validateAuthentication();
  }, []);

  const validateAuthentication = async () => {
    try {
      // First check: Do we have basic auth indicators?
      const hasLocalStorageFlag = authService.isLoggedIn();
      const hasAuthToken = !!localStorage.getItem('authToken');
      
      console.log('🔍 Initial auth check:', {
        hasLocalStorageFlag,
        hasAuthToken,
        authMethod: 'token'
      });

      // If no basic auth indicators, redirect immediately
      if (!hasLocalStorageFlag || !hasAuthToken) {
        console.log('❌ No auth token or localStorage flag, redirecting to login');
        authService.clearUser();
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Second check: Validate token with backend
      console.log('🔐 Validating token with backend...');
      
      try {
        // Make a test API call to verify token validity
        await authAPI.getProfile();
        
        console.log('✅ Token validation successful - user is authenticated');
        setIsAuthenticated(true);
      } catch (error: any) {
        console.error('❌ Token validation failed:', error);
        
        // If we get 401 Unauthorized, token is expired/invalid
        if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.log('🔒 Token expired or invalid, clearing auth state and redirecting to login');
        } else {
          console.log('🔒 API call failed, assuming auth issue and redirecting to login');
        }
        
        // Clear all auth state
        authService.clearUser();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userLoggedIn');
        
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Authentication validation error:', error);
      authService.clearUser();
      setIsAuthenticated(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE5B25] mx-auto"></div>
          <p className="mt-4 text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('❌ Authentication failed, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated, allowing access to protected route');
  return <>{children}</>;
} 