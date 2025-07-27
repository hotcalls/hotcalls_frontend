// API Service for Authentication and Workspace Management

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Types for API requests and responses
export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password_confirm: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: string;
  workspace_id?: string;
}

export interface CreateWorkspaceRequest {
  workspace_name: string;
}

export interface CreateWorkspaceResponse {
  id: string;
  workspace_name: string;
  user_count: number;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`
    }));
    console.error('❌ API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorData
    });
    console.error('🔍 Backend Response Details:', errorData);
    if (errorData.password) {
      console.error('🔐 Password validation errors:', errorData.password);
    }
    throw new Error(errorData.error || errorData.message || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Auth API calls
export const authAPI = {
  /**
   * Register a new user account with email verification
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    console.log('🔍 Sending registration data to:', '/api/auth/register/');
    console.log('📝 Full request body:', JSON.stringify({ ...userData, password: '[HIDDEN]', password_confirm: '[HIDDEN]' }, null, 2));
    return apiCall<RegisterResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Verify email address using verification token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return apiCall('/api/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    return apiCall('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// Workspace API calls
export const workspaceAPI = {
  /**
   * Create a new workspace
   */
  async createWorkspace(workspaceData: CreateWorkspaceRequest): Promise<CreateWorkspaceResponse> {
    return apiCall<CreateWorkspaceResponse>('/api/workspaces/workspaces/', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    });
  },

  /**
   * Get user's workspaces
   */
  async getWorkspaces(): Promise<CreateWorkspaceResponse[]> {
    return apiCall<CreateWorkspaceResponse[]>('/api/workspaces/workspaces/');
  },
};

// Combined registration flow that creates user and workspace
export const registrationFlow = {
  /**
   * Complete registration process: create user account and workspace
   */
  async registerWithWorkspace(
    userData: RegisterRequest,
    workspaceName: string
  ): Promise<{
    registration: RegisterResponse;
    workspace?: CreateWorkspaceResponse;
    error?: string;
  }> {
    try {
      // Step 1: Register the user
      console.log('Registering user:', { ...userData, password: '[HIDDEN]' });
      const registration = await authAPI.register(userData);
      
      if (!registration.success) {
        return {
          registration,
          error: registration.message,
        };
      }

      // Step 2: Create workspace using company name
      // Note: The API requires staff/superuser permissions for workspace creation
      // This might need to be handled differently depending on the backend implementation
      try {
        console.log('Creating workspace:', workspaceName);
        const workspace = await workspaceAPI.createWorkspace({
          workspace_name: workspaceName,
        });

        return {
          registration,
          workspace,
        };
      } catch (workspaceError) {
        console.warn('Workspace creation failed:', workspaceError);
        // User registration succeeded, but workspace creation failed
        // This is acceptable - user can create workspace later
        return {
          registration,
          error: `User registered successfully, but workspace creation failed: ${workspaceError}`,
        };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        registration: {
          success: false,
          message: error instanceof Error ? error.message : 'Registration failed',
        },
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },
}; 