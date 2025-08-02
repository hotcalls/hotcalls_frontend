// Google OAuth Service for Calendar Integration

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Backend Redirect URI - Google redirects hier nach OAuth
const REDIRECT_URI = `${API_BASE_URL}/api/calendars/google_callback/`;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Add auth token if available
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(errorData?.error || errorData?.message || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

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
 * Backend OAuth Response Format
 */
export interface GoogleOAuthResponse {
  authorization_url: string;
  state: string;
  message: string;
}

/**
 * Generate Google OAuth URL using backend API (via calendarAPI)
 */
export async function getGoogleOAuthURL(state?: string): Promise<string> {
  // Import calendarAPI dynamically to avoid circular dependency
  const { calendarAPI } = await import('./apiService');
  
  try {
    const stateParam = state || generateState();
    storeState(stateParam);
    
    console.log('🔐 Getting Google OAuth URL from backend...');
    const response = await calendarAPI.getGoogleOAuthURL();
    
    console.log('✅ Google OAuth URL erhalten:', response.authorization_url);
    return response.authorization_url;
    
  } catch (error) {
    console.error('❌ Backend OAuth URL generation failed:', error);
    throw error; // Kein Fallback mehr - Backend muss funktionieren
  }
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
 * Backend Calendar API Types (imported for consistency)
 */
export interface GoogleConnection {
  id: string;
  account_email: string;
  active: boolean;
  calendar_count: number;
  status: string;
}

/**
 * Get all Google Calendar connections (via calendarAPI)
 */
export async function getGoogleConnections(): Promise<GoogleConnection[]> {
  // Import calendarAPI dynamically to avoid circular dependency
  const { calendarAPI } = await import('./apiService');
  
  try {
    console.log('🔗 Loading Google connections via calendarAPI...');
    const connections = await calendarAPI.getGoogleConnections();
    console.log('✅ Google Connections geladen:', connections);
    return connections;
  } catch (error) {
    console.error('❌ Error loading Google connections:', error);
    throw error;
  }
}

/**
 * Disconnect Google Calendar connection (via calendarAPI)
 */
export async function disconnectGoogleCalendar(connectionId: string): Promise<{ success: boolean; message?: string }> {
  // Import calendarAPI dynamically to avoid circular dependency
  const { calendarAPI } = await import('./apiService');
  
  try {
    console.log('🔌 Disconnecting Google Calendar via calendarAPI:', connectionId);
    const response = await calendarAPI.disconnectGoogleCalendar(connectionId);
    console.log('✅ Google Calendar disconnected:', response);
    return response;
  } catch (error) {
    console.error('❌ Error disconnecting Google Calendar:', error);
    throw error;
  }
}

/**
 * VEREINFACHTER OAuth Callback Handler
 * Backend macht alles automatisch - Frontend lädt nur Kalender neu
 */
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  calendars?: any[];
  error?: string;
}> {
  try {
    console.log('🔄 OAuth completed - loading calendars from backend...');
    
    // Einfach die Google Connections vom Backend laden - kein Code-Handling nötig
    const connections = await getGoogleConnections();
    
    // Clear stored state after successful OAuth
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_user_email');
    
    return { 
      success: true, 
      calendars: connections 
    };
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 