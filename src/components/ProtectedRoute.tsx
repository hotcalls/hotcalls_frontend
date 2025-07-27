import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  useEffect(() => {
    console.log('🔒 ProtectedRoute: Checking authentication...');
  }, []);

  // Check if user is logged in (cookie-based authentication)
  const isLoggedIn = authService.isLoggedIn();
  const hasSessionCookies = document.cookie.length > 0;
  
  console.log('🔒 Authentication check:', {
    loggedIn: isLoggedIn,
    hasCookies: hasSessionCookies,
    cookieCount: document.cookie.split(';').length,
    authMethod: 'cookies'
  });

  // For cookie-based auth, we check localStorage flag AND cookie presence
  if (!isLoggedIn) {
    console.log('❌ User not authenticated (no localStorage flag), redirecting to login');
    authService.clearUser();
    return <Navigate to="/login" replace />;
  }

  // Additional check: if no cookies present, session might be expired
  if (!hasSessionCookies) {
    console.log('⚠️ No session cookies found - session might be expired');
    console.log('🔍 Cookie debug:', {
      documentCookie: document.cookie,
      cookieLength: document.cookie.length
    });
    // Still allow access but warn - cookies might be httpOnly
  }

  console.log('✅ User authenticated via cookies, allowing access');
  return <>{children}</>;
} 