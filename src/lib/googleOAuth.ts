// Google OAuth Service for Calendar Integration

const GOOGLE_CLIENT_ID = '987536634145-lklsm8o5fgg7o8fcin1q2po515ug6f2h.apps.googleusercontent.com';
// Dynamically use the current origin to support different ports
const REDIRECT_URI = `${window.location.origin}/oauth2callback`;

// Scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export interface GoogleOAuthParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  access_type: string;
  prompt?: string;
  include_granted_scopes: string;
  state?: string;
}

/**
 * Generate Google OAuth URL for calendar authorization
 */
export function getGoogleOAuthURL(state?: string): string {
  const params: GoogleOAuthParams = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // Required for refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    include_granted_scopes: 'true',
    state: state || generateState()
  };

  const searchParams = new URLSearchParams(params as any);
  return `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
}

/**
 * Generate random state for CSRF protection
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Store state in sessionStorage for validation
 */
export function storeState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
}

/**
 * Store user email temporarily during OAuth flow
 */
export function storeUserEmail(email: string): void {
  sessionStorage.setItem('oauth_user_email', email);
}

/**
 * Get stored user email
 */
export function getStoredUserEmail(): string | null {
  return sessionStorage.getItem('oauth_user_email');
}

/**
 * Validate state from callback
 */
export function validateState(state: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state'); // Clean up
  return storedState === state;
}

/**
 * Extract authorization code from URL params
 */
export function extractAuthCode(urlParams: URLSearchParams): {
  code: string | null;
  state: string | null;
  error: string | null;
} {
  return {
    code: urlParams.get('code'),
    state: urlParams.get('state'),
    error: urlParams.get('error')
  };
}

/**
 * Handle OAuth callback - exchange code for tokens via backend
 */
export async function handleOAuthCallback(code: string): Promise<{
  success: boolean;
  calendars?: any[];
  error?: string;
}> {
  try {
    // Mock response für Frontend-Testing
    // TODO: Ersetze mit echtem Backend-Call wenn verfügbar
    
    // Simuliere Backend-Call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock erfolgreiche Response mit Google Kalendern
    // TODO: Diese Daten sollten aus dem echten Google OAuth Response kommen
    
    // Get the real email from OAuth flow (passed through URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const authUser = urlParams.get('authuser');
    const storedEmail = getStoredUserEmail();
    
    // Use the real email from the OAuth flow
    const userEmail = storedEmail || 'mmmalmachen@gmail.com';
    
    const mockCalendars = [
      {
        id: "primary",
        connection_id: `google-${Date.now()}`,
        external_id: userEmail,
        name: `${userEmail} (Haupt)`,
        email: userEmail,
        color: "#1a73e8",
        primary: true,
        access_role: "owner",
        time_zone: "Europe/Berlin",
        active: true
      },
      {
        id: `calendar-${Date.now()}`,
        connection_id: `google-${Date.now()}`,
        external_id: `work-${userEmail}`,
        name: "Arbeit",
        email: userEmail,
        color: "#0d7377",
        primary: false,
        access_role: "owner",
        time_zone: "Europe/Berlin",
        active: true
      }
    ];
    
    // Clear stored email after use
    sessionStorage.removeItem('oauth_user_email');
    
    return { success: true, calendars: mockCalendars };
    
    /* Original Code für später:
    const response = await fetch('/api/calendars/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();
    return { success: true, calendars: data.calendars };
    */
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 