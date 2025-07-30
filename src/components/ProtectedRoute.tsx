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
      // STRICT AUTHENTICATION CHECK
      const authToken = localStorage.getItem('authToken');
      const userLoggedIn = localStorage.getItem('userLoggedIn');
      
      console.log('🔍 Auth state check:', {
        hasAuthToken: !!authToken,
        hasUserLoggedInFlag: userLoggedIn === 'true',
        authTokenLength: authToken?.length || 0
      });

      // FAIL FAST: If no token or flag, immediate redirect
      if (!authToken || userLoggedIn !== 'true') {
        console.log('❌ Missing auth token or logged in flag - redirecting to login');
        authService.clearUser(); // Clear any stale data
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Validate token with backend API call
      console.log('🔐 Validating token with backend API...');
      
      try {
        const profileResponse = await authAPI.getProfile();
        console.log('✅ Token validation successful:', { userEmail: profileResponse?.email });
        setIsAuthenticated(true);
        
      } catch (error: any) {
        console.error('❌ Token validation failed:', error);
        
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
      console.error('❌ Authentication validation error:', error);
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE5B25] mx-auto"></div>
          <p className="mt-4 text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    );
  }

  // STRICT: Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('❌ User not authenticated - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated - allowing access to protected content');
  return <>{children}</>;
} 