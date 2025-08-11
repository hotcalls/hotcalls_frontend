// API Service for Authentication and Workspace Management

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    const response = await fetch(`${API_BASE_URL}/api/voices/voices/`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok || response.status === 401) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        console.log('✅ CSRF token obtained from GET request');
        return csrfToken;
      }
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  
  return null;
};

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
  status?: 'active' | 'paused'; // Backend uses 'paused' not 'inactive'
  greeting_inbound: string;
  greeting_outbound: string;
  voice: string;
  language: string;
  retry_interval?: number;
  max_retries?: number; // Maximum number of retry attempts
  workdays: string[]; // Backend expects English day names like ["Monday", "Tuesday"]
  call_from: string;
  call_to: string;
  character: string;
  prompt: string;
  config_id?: string | null;
  calendar_configuration?: string | null;
}

export interface AgentResponse {
  agent_id: string;
  workspace: string;
  workspace_name?: string;
  name: string;
  status: string;
  greeting_inbound: string;
  greeting_outbound: string;
  voice: string;
  voice_provider?: string;
  voice_external_id?: string;
  language: string;
  retry_interval?: number;
  max_retries?: number; // Maximum number of retry attempts
  workdays: string[]; // Backend returns English day names like ["Monday", "Tuesday"]
  call_from: string;
  call_to: string;
  character: string;
  prompt?: string;
  config_id?: string | null;
  phone_numbers?: any[];
  phone_number_count?: number;
  calendar_configuration?: string | null;
  created_at: string;
  updated_at?: string;
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
  
  const method = options.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Add auth token if available
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
    console.log('🔑 Added auth token to request headers:', authToken.substring(0, 20) + '...');
  } else {
    console.error('❌ NO AUTH TOKEN FOUND! User might not be logged in. Calendar API will fail!');
    console.log('🔍 Debug info:', {
      localStorage_keys: Object.keys(localStorage),
      current_url: window.location.href,
      has_token: !!authToken
    });
  }
  
  // Add CSRF token for non-GET requests
  if (needsCSRF) {
    let csrfToken = getCSRFToken();
    
    // If no CSRF token in cookies, try to fetch it
    if (!csrfToken) {
      csrfToken = await fetchCSRFToken();
    }
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
      console.log('🛡️ Added CSRF token to headers for', method, 'request');
    } else {
      console.warn('⚠️ No CSRF token available for', method, 'request - might fail');
    }
  }
  
  const defaultOptions: RequestInit = {
    headers,
    credentials: 'include', // Include cookies for authentication
  };

  // Add body if provided
  if (options?.body) {
    defaultOptions.body = options.body;
    console.log('📤 Request body:', {
      bodyType: typeof options.body,
      bodyContent: options.body,
      parsedBody: (() => {
        try {
          return typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        } catch {
          return 'Unable to parse body';
        }
      })()
    });
  }

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    // For 404 Not Found on GET requests, return empty array instead of throwing error
    if (response.status === 404 && method === 'GET') {
      console.log(`ℹ️ 404 Not Found on GET ${url} - returning empty array`);
      return [] as T;
    }
    
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`
    }));
    console.error('❌ API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorData
    });
    console.log('🔍 Backend Response Details:', errorData);
    
    // If errorData contains field-specific errors (Django REST format)
    if (errorData && typeof errorData === 'object') {
      const fieldErrors: string[] = [];
      for (const [field, errors] of Object.entries(errorData)) {
        if (Array.isArray(errors)) {
          fieldErrors.push(`${field}: ${errors.join(', ')}`);
        }
      }
      if (fieldErrors.length > 0) {
        throw new Error(`Validation errors: ${fieldErrors.join('; ')}`);
      }
    }
    
    throw new Error(errorData?.error || errorData?.message || `API call failed: ${response.statusText}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as any;
  }

  // Check if response has content
  const text = await response.text();
  if (!text) {
    return null as any;
  }

  // Parse JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response as JSON:', text);
    throw new Error('Invalid JSON response from server');
  }
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

  /**
   * Update user profile
   */
  async updateUser(userId: string, userData: any): Promise<any> {
    return apiCall(`/api/users/users/${userId}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Workspace API calls
export const workspaceAPI = {

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
   * Update workspace details
   */
  async updateWorkspace(workspaceId: string, workspaceData: { workspace_name: string }): Promise<CreateWorkspaceResponse> {
    console.log('🔄 Updating workspace:', workspaceId);
    
    const response = await apiCall<CreateWorkspaceResponse>(`/api/workspaces/workspaces/${workspaceId}/`, {
      method: 'PUT',
      body: JSON.stringify(workspaceData),
    });
    
    console.log('✅ Workspace updated:', response);
    return response;
  },

  /**
   * Get workspace statistics including agent count
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    user_count?: number;
    agent_count?: number;
    [key: string]: any;
  }> {
    console.log('📊 Getting workspace stats:', workspaceId);
    
    const response = await apiCall<any>(`/api/workspaces/workspaces/${workspaceId}/stats/`);
    
    console.log('✅ Workspace stats loaded:', response);
    return response;
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
    
    console.log('🤖 Calling agents API:', url);
    const response = await apiCall<{ results: AgentResponse[]; count: number; next?: string; previous?: string }>(url);
    console.log('📥 Raw agents API response:', response);
    
    // Handle both array and paginated response formats
    if (Array.isArray(response)) {
      console.log('✅ Got direct array response');
      return response;
    } else if (response && Array.isArray(response.results)) {
      console.log('✅ Got paginated response with results array');
      return response.results;
    } else {
      console.warn('⚠️ Unexpected API response format:', response);
      return [];
    }
  },

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<AgentResponse> {
    console.log('🤖 Fetching agent details:', agentId);
    const response = await apiCall<AgentResponse>(`/api/agents/agents/${agentId}/`);
    console.log('✅ Agent details loaded:', response);
    return response;
  },

  /**
   * Update an existing agent using PUT /api/agents/agents/{agent_id}/
   */
  async updateAgent(agentId: string, agentData: Partial<CreateAgentRequest>): Promise<AgentResponse> {
    console.log('🔄 PUT /api/agents/agents/${agentId}/ - Updating agent with data:', {
      agentId,
      dataKeys: Object.keys(agentData),
      agentData,
      workdaysDetail: {
        type: typeof agentData.workdays,
        isArray: Array.isArray(agentData.workdays),
        value: agentData.workdays
      }
    });
    
    const response = await apiCall<AgentResponse>(`/api/agents/agents/${agentId}/`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
    
    console.log('✅ Agent update successful:', response);
    return response;
  },

  /**
   * Partially update an agent using PATCH /api/agents/agents/{agent_id}/
   * Used for status changes and other partial updates
   */
  async patchAgent(agentId: string, agentData: Partial<CreateAgentRequest>): Promise<AgentResponse> {
    console.log('🔄 PATCH /api/agents/agents/${agentId}/ - Patching agent with data:', {
      agentId,
      dataKeys: Object.keys(agentData),
      agentData
    });
    
    const response = await apiCall<AgentResponse>(`/api/agents/agents/${agentId}/`, {
      method: 'PATCH',
      body: JSON.stringify(agentData),
    });
    
    console.log('✅ Agent patch successful:', response);
    return response;
  },

  /**
   * Delete an agent using DELETE /api/agents/agents/{agent_id}/
   */
  async deleteAgent(agentId: string): Promise<void> {
    console.log('🗑️ DELETE /api/agents/agents/${agentId}/ - Deleting agent');
    
    await apiCall<void>(`/api/agents/agents/${agentId}/`, {
      method: 'DELETE',
    });
    
    console.log('✅ Agent deleted successfully');
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

// Simplified registration flow - backend handles workspace creation automatically
export const registrationFlow = {
  /**
   * Register user only - backend handles workspace creation automatically
   */
  async registerUser(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('Registering user:', { ...userData, password: '[HIDDEN]' });
      const registration = await authAPI.register(userData);
      
      return registration;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
}; 

// Call API interface
export interface MakeOutboundCallRequest {
  phone: string;  // Target phone number
  agent_id: string;  // Agent UUID
  lead_id?: string | null;  // Optional lead ID
}

export interface MakeOutboundCallResponse {
  call_id?: string;
  status?: string;
  message?: string;
}

// Test Call API interface
export interface MakeTestCallRequest {
  agent_id: string;  // Agent UUID
}

export interface MakeTestCallResponse {
  call_id?: string;
  status?: string;
  message?: string;
}

// Call API calls
export const callAPI = {
  /**
   * Make an outbound call using LiveKit
   */
  async makeOutboundCall(data: MakeOutboundCallRequest): Promise<MakeOutboundCallResponse> {
    console.log('📞 POST /api/calls/call-logs/make_outbound_call/ - Making outbound call:', data);
    
    try {
      const response = await apiCall<MakeOutboundCallResponse>('/api/calls/call-logs/make_outbound_call/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('✅ Outbound call initiated:', response);
      return response;
    } catch (error) {
      console.error('❌ Outbound call API error:', error);
      console.log('📞 Call data that was sent:', data);
      throw error;
    }
  },

  /**
   * Make a test call using only Agent ID
   */
  async makeTestCall(data: MakeTestCallRequest): Promise<MakeTestCallResponse> {
    console.log('🧪 POST /api/calls/make_test_call/ - Making test call:', data);
    
    try {
      const response = await apiCall<MakeTestCallResponse>('/api/calls/make_test_call/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('✅ Test call initiated:', response);
      return response;
    } catch (error) {
      console.error('❌ Test call API error:', error);
      console.log('🧪 Test call data that was sent:', data);
      throw error;
    }
  },
};

// Stripe/Payment API
export const paymentAPI = {
  /**
   * Check if workspace has Stripe customer
   */
  async getStripeInfo(workspaceId: string): Promise<{
    has_stripe_customer: boolean;
    stripe_customer_id?: string;
    customer_email?: string;
  }> {
    return apiCall(`/api/payments/workspaces/${workspaceId}/stripe-info/`);
  },

  /**
   * Create Stripe customer for workspace
   */
  async createStripeCustomer(workspaceId: string, workspaceName?: string): Promise<{
    customer_id: string;
    customer_email: string;
  }> {
    return apiCall('/api/payments/stripe/create-customer/', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: workspaceName
      })
    });
  },

  /**
   * Get all Stripe products and prices
   */
  async getStripeProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      description?: string;
      active: boolean;
      prices: Array<{
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: {
          interval: string;
          interval_count: number;
          meter?: string | null;
          trial_period_days?: number | null;
          usage_type: string;
        };
        nickname?: string | null;
      }>;
    }>;
  }> {
    // Add timestamp to bypass cache
    const timestamp = new Date().getTime();
    return apiCall(`/api/payments/stripe/products/?_t=${timestamp}`);
  },

  /**
   * Create Stripe Checkout Session for subscription
   */
  async createCheckoutSession(workspaceId: string, priceIdOrPlan: string): Promise<{
    checkout_url: string;
    session_id: string;
  }> {
    const successUrl = `${window.location.origin}/dashboard?payment=success&price=${priceIdOrPlan}`;
    const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;
    
    // Use the correct endpoint as specified by user
    return apiCall('/api/payments/stripe/create-checkout-session/', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        price_id: priceIdOrPlan, // Always send as price_id, even if it's a plan name
        success_url: successUrl,
        cancel_url: cancelUrl
      })
    });
  },

  /**
   * Get current subscription status for workspace
   */
  async getSubscription(workspaceId: string): Promise<{
    has_subscription: boolean;
    subscription?: {
      id: string;
      status: string;
      current_period_end: number | null;
      cancel_at_period_end: boolean;
      plan: {
        id: string;
        product: string;
        amount: number;
        currency: string;
        interval: string;
      };
    };
  }> {
    return apiCall(`/api/payments/workspaces/${workspaceId}/subscription/`);
  },

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiCall('/api/payments/stripe/cancel-subscription/', {
      method: 'POST'
    });
  },

  /**
   * Create Customer Portal session for self-service
   */
  async createPortalSession(workspaceId: string, returnUrl?: string): Promise<{
    url: string;
  }> {
    return apiCall('/api/payments/stripe/portal-session/', {
      method: 'POST',
      body: JSON.stringify({ 
        workspace_id: workspaceId,
        return_url: returnUrl || window.location.href 
      })
    });
  }
};

// Plans API calls
export const plansAPI = {
  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<any> {
    console.log('📋 GET /api/plans/ - Fetching available plans');
    
    try {
      const response = await apiCall<any>('/api/plans/');
      console.log('✅ Plans API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Plans API error:', error);
      throw error;
    }
  },
};

// Export all APIs

// Calendar API Types
export interface BackendCalendar {
  id: string;
  workspace: string;
  workspace_name: string;
  name: string;
  provider: string;
  active: boolean;
  config_count: number;
  provider_details: {
    external_id: string;
    primary: boolean;
    time_zone: string;
    created_at: string;
    updated_at: string;
  };
  connection_status: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleConnection {
  id: string;
  account_email: string;
  active: boolean;
  calendar_count: number;
  status: string;
}

// Calendar API calls
export const calendarAPI = {
  /**
   * Get all calendars for the current user/workspace
   */
  async getCalendars(): Promise<BackendCalendar[]> {
    console.log('📅 GET /api/calendars/ - Fetching all calendars');
    
    try {
      const response = await apiCall<BackendCalendar[]>('/api/calendars/');
      console.log('✅ Calendars loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Calendar API error:', error);
      throw error;
    }
  },

  /**
   * Get Google Calendar connections
   */
  async getGoogleConnections(): Promise<GoogleConnection[]> {
    console.log('🔗 GET /api/calendars/google_connections/ - Fetching Google connections');
    
    try {
      const response = await apiCall<GoogleConnection[]>('/api/calendars/google_connections/');
      console.log('✅ Google connections loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Google connections API error:', error);
      throw error;
    }
  },

  /**
   * Generate Google OAuth URL
   */
  async getGoogleOAuthURL(): Promise<{
    authorization_url: string;
    state: string;
    message: string;
  }> {
    console.log('🔐 POST /api/calendars/google_auth_url/ - Generating OAuth URL');
    
    try {
      const response = await apiCall<{
        authorization_url: string;
        state: string;
        message: string;
      }>('/api/calendars/google_auth_url/', {
        method: 'POST'
      });
      console.log('✅ Google OAuth URL generated:', response.authorization_url);
      return response;
    } catch (error) {
      console.error('❌ Google OAuth URL generation error:', error);
      throw error;
    }
  },

  /**
   * Disconnect Google Calendar connection
   */
  async disconnectGoogleCalendar(connectionId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    console.log('🔌 POST /api/calendars/${connectionId}/google_disconnect/ - Disconnecting Google Calendar');
    
    try {
      const response = await apiCall<{
        success: boolean;
        message?: string;
      }>(`/api/calendars/${connectionId}/google_disconnect/`, {
        method: 'POST'
      });
      console.log('✅ Google Calendar disconnected:', response);
      return response;
    } catch (error) {
      console.error('❌ Google disconnect error:', error);
      throw error;
    }
  },

  /**
   * Create Event Type Configuration
   */
  async createEventType(payload: any): Promise<any> {
    console.log('📅 POST /api/calendars/configurations/ - Creating Event Type');
    
    try {
      const response = await apiCall('/api/calendars/configurations/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('✅ Event Type created:', response);
      return response;
    } catch (error) {
      console.error('❌ Event Type creation API error:', error);
      throw error;
    }
  },

  /**
   * Get Calendar Configurations (Event Types)
   */
  async getCalendarConfigurations(): Promise<any> {
    console.log('📋 GET /api/calendars/configurations/ - Fetching Event Types');
    
    try {
      const response = await apiCall('/api/calendars/configurations/');
      console.log('✅ Event Types loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Event Types loading API error:', error);
      throw error;
    }
  },

  /**
   * Update Event Type Configuration
   */
  async updateEventType(id: string, payload: any): Promise<any> {
    console.log(`🔄 PUT /api/calendars/configurations/${id}/ - Updating Event Type`);
    
    try {
      const response = await apiCall(`/api/calendars/configurations/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      console.log('✅ Event Type updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Event Type update API error:', error);
      throw error;
    }
  },

  /**
   * Delete Event Type Configuration
   */
  async deleteEventType(id: string): Promise<any> {
    console.log(`🗑️ DELETE /api/calendars/configurations/${id}/ - Deleting Event Type`);
    
    try {
      const response = await apiCall(`/api/calendars/configurations/${id}/`, {
        method: 'DELETE'
      });
      console.log('✅ Event Type deleted:', response);
      return response;
    } catch (error) {
      console.error('❌ Event Type delete API error:', error);
      throw error;
    }
  },
};

// Lead Types
export interface Lead {
  id: string;
  name: string;
  surname?: string;
  full_name: string;
  email: string;
  phone: string;
  workspace: string;
  workspace_name: string;
  integration_provider?: 'meta' | 'google' | 'manual';
  integration_provider_display?: string;
  variables: Record<string, any>;
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  name: string;
  surname?: string;
  email: string;
  phone: string;
  meta_data?: Record<string, any>;
}

export interface LeadsListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Lead[];
}

export interface LeadStatsResponse {
  total_leads: number;
  leads_with_calls: number;
  leads_without_calls: number;
  avg_calls_per_lead?: number;
}

// Lead API calls
export const leadAPI = {
  /**
   * Get leads with optional filtering and pagination
   */
  async getLeads(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    workspace?: string;
    integration_provider?: string;
    created_after?: string;
    created_before?: string;
    ordering?: string;
  }): Promise<LeadsListResponse> {
    console.log('📞 GET /api/leads/ - Getting leads');
    
    try {
      let url = '/api/leads/';
      const searchParams = new URLSearchParams();
      
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params?.page_size) {
        searchParams.append('page_size', params.page_size.toString());
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.workspace) {
        searchParams.append('workspace', params.workspace);
      }
      if (params?.integration_provider) {
        searchParams.append('integration_provider', params.integration_provider);
      }
      if (params?.created_after) {
        searchParams.append('created_after', params.created_after);
      }
      if (params?.created_before) {
        searchParams.append('created_before', params.created_before);
      }
      if (params?.ordering) {
        searchParams.append('ordering', params.ordering);
      }
      
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      
      const response = await apiCall<LeadsListResponse>(url);
      console.log('✅ Leads retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Leads API error:', error);
      throw error;
    }
  },

  /**
   * Get single lead by ID
   */
  async getLead(leadId: string): Promise<Lead> {
    console.log(`🔍 GET /api/leads/${leadId}/ - Getting lead details`);
    
    try {
      const response = await apiCall<Lead>(`/api/leads/${leadId}/`);
      console.log('✅ Lead retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead detail API error:', error);
      throw error;
    }
  },

  /**
   * Create new lead
   */
  async createLead(leadData: CreateLeadRequest): Promise<Lead> {
    console.log('➕ POST /api/leads/ - Creating lead:', leadData);
    
    try {
      const response = await apiCall<Lead>('/api/leads/', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
      console.log('✅ Lead created:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead creation API error:', error);
      throw error;
    }
  },

  /**
   * Update lead (staff only)
   */
  async updateLead(leadId: string, leadData: Partial<CreateLeadRequest>): Promise<Lead> {
    console.log(`✏️ PUT /api/leads/${leadId}/ - Updating lead:`, leadData);
    
    try {
      const response = await apiCall<Lead>(`/api/leads/${leadId}/`, {
        method: 'PUT',
        body: JSON.stringify(leadData),
      });
      console.log('✅ Lead updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead update API error:', error);
      throw error;
    }
  },

  /**
   * Delete lead (staff only)
   */
  async deleteLead(leadId: string): Promise<void> {
    console.log(`🗑️ DELETE /api/leads/${leadId}/ - Deleting lead`);
    
    try {
      await apiCall<void>(`/api/leads/${leadId}/`, {
        method: 'DELETE',
      });
      console.log('✅ Lead deleted successfully');
    } catch (error) {
      console.error('❌ Lead delete API error:', error);
      throw error;
    }
  },

  /**
   * Bulk create leads
   */
  async bulkCreateLeads(leads: CreateLeadRequest[]): Promise<{
    total_leads: number;
    successful_creates: number;
    failed_creates: number;
    errors: Array<{ index: number; error: any }>;
    created_lead_ids: string[];
  }> {
    console.log('📦 POST /api/leads/bulk_create/ - Bulk creating leads:', leads.length);
    
    try {
      const response = await apiCall<any>('/api/leads/bulk_create/', {
        method: 'POST',
        body: JSON.stringify({ leads }),
      });
      console.log('✅ Bulk leads created:', response);
      return response;
    } catch (error) {
      console.error('❌ Bulk leads creation API error:', error);
      throw error;
    }
  },

  /**
   * Update lead metadata (staff only)
   */
  async updateLeadMetadata(leadId: string, metaData: Record<string, any>): Promise<Lead> {
    console.log(`🏷️ PATCH /api/leads/${leadId}/update_metadata/ - Updating lead metadata:`, metaData);
    
    try {
      const response = await apiCall<Lead>(`/api/leads/${leadId}/update_metadata/`, {
        method: 'PATCH',
        body: JSON.stringify({ meta_data: metaData }),
      });
      console.log('✅ Lead metadata updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead metadata update API error:', error);
      throw error;
    }
  },

  /**
   * Get lead call history
   */
  async getLeadCallHistory(leadId: string): Promise<{
    lead_id: string;
    lead_name: string;
    total_calls: number;
    call_logs: any[];
  }> {
    console.log(`📞 GET /api/leads/${leadId}/call_history/ - Getting call history`);
    
    try {
      const response = await apiCall<any>(`/api/leads/${leadId}/call_history/`);
      console.log('✅ Lead call history retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead call history API error:', error);
      throw error;
    }
  },

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<LeadStatsResponse> {
    console.log('📈 GET /api/leads/stats/ - Getting lead statistics');
    
    try {
      const response = await apiCall<LeadStatsResponse>('/api/leads/stats/');
      console.log('✅ Lead statistics retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Lead statistics API error:', error);
      throw error;
    }
  },
};

// Meta API calls
export const metaAPI = {
  /**
   * Get OAuth URL for Meta integration
   */
  async getOAuthUrl(workspaceId: string): Promise<{
    oauth_url: string;
    workspace_id: string;
    state: string;
  }> {
    console.log('📱 POST /api/meta/integrations/get-oauth-url/ - Getting Meta OAuth URL for workspace:', workspaceId);
    
    try {
      const response = await apiCall<{
        oauth_url: string;
        workspace_id: string;
        state: string;
      }>('/api/meta/integrations/get-oauth-url/', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      
      console.log('✅ Meta OAuth URL retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Meta OAuth URL API error:', error);
      throw error;
    }
  },

  /**
   * Get Meta integrations for user's workspaces
   */
  async getIntegrations(): Promise<any[]> {
    console.log('📱 GET /api/meta/integrations/ - Getting Meta integrations');
    
    try {
      const response = await apiCall<any>('/api/meta/integrations/');
      console.log('✅ Meta integrations retrieved:', response);
      return response.results || [];
    } catch (error) {
      console.error('❌ Meta integrations API error:', error);
      throw error;
    }
  },

  /**
   * Delete Meta integration by ID
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    console.log('🗑️ DELETE /api/meta/integrations/' + integrationId + '/ - Deleting Meta integration');
    
    try {
      await apiCall<void>(`/api/meta/integrations/${integrationId}/`, {
        method: 'DELETE',
      });
      console.log('✅ Meta integration deleted successfully');
    } catch (error) {
      console.error('❌ Meta integration delete API error:', error);
      throw error;
    }
  },

  /**
   * Get Meta lead forms for user's workspaces
   */
  async getLeadForms(params?: {
    page?: number;
    search?: string;
    ordering?: string;
  }): Promise<any[]> {
    console.log('📋 GET /api/meta/lead-forms/ - Getting Meta lead forms');
    
    try {
      let url = '/api/meta/lead-forms/';
      const searchParams = new URLSearchParams();
      
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.ordering) {
        searchParams.append('ordering', params.ordering);
      }
      
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      
      const response = await apiCall<any>(url);
      console.log('✅ Meta lead forms retrieved:', response);
      return response.results || [];
    } catch (error) {
      console.error('❌ Meta lead forms API error:', error);
      throw error;
    }
  },

  /**
   * Update Meta lead form selections (bulk update active status)
   */
  async updateFormSelections(formSelections: Record<string, boolean>): Promise<{
    message: string;
    updated_forms: Array<{
      form_id: string;
      is_active: boolean;
      updated_count: number;
    }>;
    errors: Array<{
      form_id: string;
      error: string;
    }>;
    total_updated: number;
    total_errors: number;
  }> {
    console.log('💾 POST /api/meta/lead-forms/update_selections/ - Updating form selections:', formSelections);
    
    try {
      // Convert the formSelections object to the expected format
      // Backend expects: { "form_selections": [{"form_id_1": true}, {"form_id_2": false}] }
      const form_selections = Object.entries(formSelections).map(([form_id, is_active]) => ({
        [form_id]: is_active
      }));
      
      const requestBody = { form_selections };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await apiCall<any>('/api/meta/lead-forms/update_selections/', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      console.log('✅ Meta form selections updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Meta form selections API error:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },
}; 

// Funnel API calls
export const funnelAPI = {
  /**
   * Get all lead funnels for user's workspaces
   */
  async getLeadFunnels(params?: {
    page?: number;
    search?: string;
    ordering?: string;
    workspace?: string;
    is_active?: boolean;
    has_agent?: boolean;
  }): Promise<any[]> {
    console.log('📊 GET /api/funnels/lead-funnels/ - Getting lead funnels:', params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.ordering) queryParams.append('ordering', params.ordering);
      if (params?.workspace) queryParams.append('workspace', params.workspace);
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params?.has_agent !== undefined) queryParams.append('has_agent', params.has_agent.toString());
      
      const endpoint = `/api/funnels/lead-funnels/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await apiCall<any>(endpoint, {
        method: 'GET',
      });
      
      console.log('✅ Lead funnels loaded:', response);
      
      // Handle paginated response
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results;
      }
      
      // Handle direct array response
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Lead funnels API error:', error);
      throw error;
    }
  },

  /**
   * Assign an agent to a funnel
   */
  async assignAgent(funnelId: string, agentId: string): Promise<any> {
    console.log(`🔗 POST /api/funnels/lead-funnels/${funnelId}/assign_agent/ - Assigning agent:`, { funnelId, agentId });
    
    try {
      const response = await apiCall<any>(`/api/funnels/lead-funnels/${funnelId}/assign_agent/`, {
        method: 'POST',
        body: JSON.stringify({ 
          agent_id: agentId 
        }),
      });
      
      console.log('✅ Agent assigned to funnel successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Funnel assign agent API error:', error);
      throw error;
    }
  },

  /**
   * Unassign agent from a funnel
   */
  async unassignAgent(funnelId: string): Promise<any> {
    console.log(`🔓 POST /api/funnels/lead-funnels/${funnelId}/unassign_agent/ - Unassigning agent from funnel:`, { funnelId });
    
    try {
      const response = await apiCall<any>(`/api/funnels/lead-funnels/${funnelId}/unassign_agent/`, {
        method: 'POST',
        body: JSON.stringify({}), // Empty body as per backend implementation
      });
      
      console.log('✅ Agent unassigned from funnel successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Funnel unassign agent API error:', error);
      throw error;
    }
  },
}; 