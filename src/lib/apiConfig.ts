// API Configuration with Cookie-based Authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Configuration logging removed

// Store auth token
let authToken: string | null = localStorage.getItem('authToken');

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get auth token from localStorage
  const token = authToken || localStorage.getItem('authToken');
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include', // Still include for any cookies
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error("[ERROR]:", error);
      throw error;
    }
    
    const data = await response.json();
    return data;
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = getAuthHeaders();
    const body = JSON.stringify(data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error("[ERROR]:", error);
      throw error;
    }
    
    const responseData = await response.json();
    return responseData;
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error("[ERROR]:", error);
      throw error;
    }
    
    const responseData = await response.json();
    return responseData;
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error("[ERROR]:", error);
      throw error;
    }
    
    const responseData = await response.json();
    return responseData;
  },

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      console.error("[ERROR]:", error);
      throw error;
    }
  },

  // Special method for multipart/form-data uploads
  async uploadFiles<T>(endpoint: string, formData: FormData): Promise<T> {
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
      console.error("[ERROR]:", error);
      throw error;
    }
    
    const responseData = await response.json();
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