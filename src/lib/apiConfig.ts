// API Configuration with Cookie-based Authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.MODE,
  authMethod: 'token'
});

// Store auth token
let authToken: string | null = localStorage.getItem('authToken');

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  console.log('🔐 Using token-based authentication');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get auth token from localStorage
  const token = authToken || localStorage.getItem('authToken');
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
    console.log('🔑 Added auth token to headers');
  } else {
    console.warn('⚠️ No auth token available - request might fail');
  }
  
  console.log('📋 Request headers:', {
    hasAuthToken: !!token,
    contentType: headers['Content-Type']
  });
  
  return headers;
};

// API client with token authentication
export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    
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
    
    console.log(`📡 GET ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Still include for any cookies
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error(`❌ GET ${url} failed:`, error);
      throw error;
    }
    
    const data = await response.json();
    console.log(`✅ GET ${url} successful`);
    return data;
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log(`📡 POST ${endpoint}`, data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error(`❌ POST ${endpoint} failed:`, error);
      throw error;
    }
    
    const responseData = await response.json();
    console.log(`✅ POST ${endpoint} successful`);
    return responseData;
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    console.log(`📡 PUT ${endpoint}`, data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error(`❌ PUT ${endpoint} failed:`, error);
      throw error;
    }
    
    const responseData = await response.json();
    console.log(`✅ PUT ${endpoint} successful`);
    return responseData;
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    console.log(`📡 PATCH ${endpoint}`, data);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error(`❌ PATCH ${endpoint} failed:`, error);
      throw error;
    }
    
    const responseData = await response.json();
    console.log(`✅ PATCH ${endpoint} successful`);
    return responseData;
  },

  async delete(endpoint: string): Promise<void> {
    console.log(`📡 DELETE ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error(`❌ DELETE ${endpoint} failed:`, error);
      throw error;
    }
    
    console.log(`✅ DELETE ${endpoint} successful`);
  },

  // Special method for multipart/form-data uploads
  async uploadFiles<T>(endpoint: string, formData: FormData): Promise<T> {
    console.log(`📡 POST ${endpoint} (multipart upload)`);
    
    // Get token but don't set Content-Type (let browser set it for FormData)
    const token = authToken || localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      console.error(`❌ Upload to ${endpoint} failed:`, error);
      throw error;
    }
    
    const responseData = await response.json();
    console.log(`✅ Upload to ${endpoint} successful`);
    return responseData;
  }
};

// API configuration object
export const apiConfig = {
  baseUrl: API_BASE_URL,
  setAuthToken: (token: string | null) => {
    authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },
  clearAuth: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  },
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