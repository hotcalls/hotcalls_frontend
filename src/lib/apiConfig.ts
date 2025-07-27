// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    users: '/api/users/users/',
    register: '/api/auth/register/',
    login: '/api/auth/login/',
    verifyEmail: '/api/auth/verify-email/',
    passwordReset: '/api/auth/password-reset/',
    // New endpoints for agent creation
    voices: '/api/voices/voices/',
    agents: '/api/agents/agents/',
    // Add more endpoints as needed
  },
  getFullUrl: (endpoint: string) => {
    return `${API_BASE_URL}${endpoint}`;
  }
};

// Helper function to get CSRF token from cookies
const getCSRFToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      console.log('🛡️ Found CSRF token in cookies');
      return value;
    }
  }
  console.warn('⚠️ No CSRF token found in cookies');
  return null;
};

// Helper function to fetch CSRF token from Django
const fetchCSRFToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Fetching CSRF token from Django...');
    // Try making a safe GET request to get CSRF token in cookies
    // Use the voices endpoint as it's likely a safe GET endpoint
    const response = await fetch(`${API_BASE_URL}/api/voices/voices/`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok || response.status === 401) {
      // Even if the request fails with 401, CSRF token might be set
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        console.log('✅ CSRF token obtained from GET request');
        return csrfToken;
      }
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token via GET request:', error);
  }
  
  // Alternative: Try the root API endpoint
  try {
    console.log('🔄 Trying root API endpoint for CSRF token...');
    const response = await fetch(`${API_BASE_URL}/api/`, {
      method: 'GET',
      credentials: 'include',
    });
    
    // Check for CSRF token regardless of response status
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      console.log('✅ CSRF token obtained from root API');
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token via root API:', error);
  }
  
  return null;
};

// Helper function to get auth headers (with CSRF token for session auth)
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  console.log('🍪 Using cookie-based authentication with CSRF protection');
  
  // TEMPORARY: Skip CSRF for debugging
  const SKIP_CSRF = false; // Set to false once working
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (!SKIP_CSRF) {
    // Get CSRF token from cookies first
    let csrfToken = getCSRFToken();
    
    // If no CSRF token in cookies, try to fetch it
    if (!csrfToken) {
      csrfToken = await fetchCSRFToken();
    }
    
    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
      console.log('🛡️ Added CSRF token to headers');
    } else {
      console.warn('⚠️ No CSRF token available - request might fail');
    }
  } else {
    console.log('⚠️ SKIPPING CSRF for debugging - remove this in production!');
  }
  
  console.log('📋 Request headers (cookies + CSRF):', {
    ...headers,
    'X-CSRFToken': headers['X-CSRFToken'] || 'skipped'
  });
  
  return headers;
};

// API client with cookie-based authentication + CSRF protection
export const apiClient = {
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = apiConfig.getFullUrl(endpoint);
    
    console.log('📤 Making POST request with cookies + CSRF:', {
      url,
      endpoint,
      dataKeys: Object.keys(data || {}),
      usingCookies: true
    });
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // ✅ This sends cookies with the request
      });

      console.log('📥 POST Response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        hasCookies: document.cookie.length > 0
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ POST Error ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          sentData: data,
          errorResponse: errorData,
          cookies: document.cookie || 'none',
          csrfToken: getCSRFToken() ? 'present' : 'missing'
        });
        
        // Log ALL response headers for debugging
        console.error('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        // Log detailed error information
        console.error('📋 Detailed Error Response:', errorData);
        if (errorData && typeof errorData === 'object') {
          Object.entries(errorData).forEach(([key, value]) => {
            console.error(`🔍 ${key}:`, value);
          });
        }
        
        // Special handling for CSRF errors
        if (response.status === 403) {
          console.error('🚨 403 Forbidden - DEBUGGING INFO:');
          console.log('🔍 CSRF Debug:', {
            csrfTokenInCookies: getCSRFToken(),
            allCookies: document.cookie,
            sentHeaders: headers,
            responseHeaders: Object.fromEntries(response.headers.entries())
          });
          
          // Log the exact error message from Django
          console.error('🐍 Django Error Details:', errorData);
        }
        
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = apiConfig.getFullUrl(endpoint);
    
    // Add query parameters if provided
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    console.log('📤 Making GET request with cookies:', {
      url,
      endpoint,
      params,
      usingCookies: true,
      currentCookies: document.cookie ? 'present' : 'none'
    });
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // ✅ This sends cookies with the request
      });

      console.log('📥 GET Response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        hasCookies: document.cookie.length > 0
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        console.error(`❌ GET Error ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          params,
          errorResponse: errorData,
          cookies: document.cookie || 'none'
        });
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}; 