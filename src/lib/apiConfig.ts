// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    users: '/api/users/users/',
    register: '/api/auth/register/',
    verifyEmail: '/api/auth/verify-email/',
    passwordReset: '/api/auth/password-reset/',
    // Add more endpoints as needed
  },
  getFullUrl: (endpoint: string) => {
    return `${API_BASE_URL}${endpoint}`;
  }
};

// API client with error handling
export const apiClient = {
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = apiConfig.getFullUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    const url = apiConfig.getFullUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}; 