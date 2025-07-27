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

// Agent Types
export interface CreateAgentRequest {
  workspace: string;
  name: string;
  status?: 'active' | 'inactive';
  greeting_inbound: string;
  greeting_outbound: string;
  voice: string;
  language: string;
  retry_interval?: number;
  workdays: string;
  call_from: string;
  call_to: string;
  character: string;
  prompt: string;
  config_id?: string;
  calendar_configuration?: string;
}

export interface AgentResponse {
  id: string;
  workspace: string;
  name: string;
  status: string;
  greeting_inbound: string;
  greeting_outbound: string;
  voice: string;
  language: string;
  workdays: string;
  call_from: string;
  call_to: string;
  character: string;
  created_at: string;
}

// Voice Types
export interface Voice {
  id: string;
  name: string;
  provider: 'openai' | 'elevenlabs' | 'google' | 'azure' | 'aws';
  gender: 'male' | 'female' | 'neutral';
  tone?: string;
  voice_external_id: string;
  agent_count: number;
  recommend: boolean;
  voice_picture?: string; // API returns voice_picture instead of image_url
  voice_sample?: string;  // API returns voice_sample instead of sample_url
  created_at: string;
  updated_at: string;
}

export interface VoicesResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Voice[];
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
    credentials: 'include', // Include cookies for authentication
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

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    return apiCall('/api/auth/profile/', {
      method: 'GET',
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

  /**
   * Get current user's workspaces (authenticated user's workspaces only)
   */
  async getMyWorkspaces(): Promise<CreateWorkspaceResponse[]> {
    return apiCall<CreateWorkspaceResponse[]>('/api/workspaces/workspaces/my_workspaces/');
  },

  /**
   * Get detailed workspace information including members
   */
  async getWorkspaceDetails(workspaceId: string): Promise<any> {
    return apiCall<any>(`/api/workspaces/workspaces/${workspaceId}/`);
  },

  /**
   * Get team members for a workspace (deprecated - use getWorkspaceDetails instead)
   */
  async getWorkspaceMembers(workspaceId: string): Promise<any[]> {
    return apiCall<any[]>(`/api/workspaces/workspaces/${workspaceId}/members/`);
  },
};

// Agent API calls
export const agentAPI = {
  /**
   * Create a new AI agent for a workspace
   */
  async createAgent(agentData: CreateAgentRequest): Promise<AgentResponse> {
    console.log('🤖 Creating agent:', { ...agentData, workspace: agentData.workspace });
    return apiCall<AgentResponse>('/api/agents/agents/', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  },

  /**
   * Get agents for a workspace
   */
  async getAgents(workspaceId?: string): Promise<AgentResponse[]> {
    const url = workspaceId 
      ? `/api/agents/agents/?workspace=${workspaceId}`
      : '/api/agents/agents/';
    return apiCall<AgentResponse[]>(url);
  },
};

// Voice API calls
export const voiceAPI = {
  /**
   * Get all available voices with filtering options
   */
  async getVoices(params?: {
    search?: string;
    provider?: string;
    gender?: string;
    recommend?: boolean;
    page?: number;
  }): Promise<VoicesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.provider) searchParams.append('provider', params.provider);
    if (params?.gender) searchParams.append('gender', params.gender);
    if (params?.recommend !== undefined) searchParams.append('recommend', params.recommend.toString());
    if (params?.page) searchParams.append('page', params.page.toString());

    const url = `/api/voices/voices/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    console.log('🔊 Fetching voices from:', `${API_BASE_URL}${url}`);
    const response = await apiCall<VoicesResponse>(url);
    console.log('🔊 Voice API response:', response);
    return response;
  },

  /**
   * Get recommended voices (shortcut)
   */
  async getRecommendedVoices(): Promise<Voice[]> {
    const response = await this.getVoices({ recommend: true });
    return response.results;
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
      // For now, we'll attempt workspace creation, but it's okay if it fails
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
        console.warn('Workspace creation failed (this is expected for regular users):', workspaceError);
        
        // For demo purposes, create a mock workspace ID
        // In production, the backend should handle workspace creation automatically
        // or provide a default workspace for new users
        const mockWorkspace = {
          id: `workspace-${Date.now()}`, // Temporary mock ID
          workspace_name: workspaceName,
          user_count: 1,
          created_at: new Date().toISOString(),
        };

        console.log('Using mock workspace for demo purposes:', mockWorkspace);
        
        return {
          registration,
          workspace: mockWorkspace,
          error: 'Note: Using demo workspace. In production, workspace would be created by backend.',
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