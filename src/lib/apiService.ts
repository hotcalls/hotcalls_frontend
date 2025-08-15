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
  lead_funnel?: string | null; // Lead funnel assignment
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
  lead_funnel?: string | null; // The funnel ID assigned to this agent
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
    return apiCall('/api/workspaces/workspaces/my_workspaces/');
  },

  /**
   * Get detailed workspace information including members
   */
  async getWorkspaceDetails(workspaceId: string): Promise<any> {
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/`);
  },

  /**
   * Update workspace details
   */
  async updateWorkspace(workspaceId: string, updates: { workspace_name: string }): Promise<any> {
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
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
   * Invite a user to workspace via email
   */
  async inviteUserToWorkspace(workspaceId: string, email: string): Promise<any> {
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/invite/`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Get team members for a workspace (deprecated - use getWorkspaceDetails instead)
   */
  async getWorkspaceMembers(workspaceId: string): Promise<any[]> {
    // Backend action is named `users` (see WorkspaceViewSet.users)
    return apiCall<any[]>(`/api/workspaces/workspaces/${workspaceId}/users/`);
  },

  /**
   * Get current user's role in a workspace
   */
  async getMyWorkspaceRole(workspaceId: string): Promise<{ is_admin: boolean }> {
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/my_role/`);
  },

  /**
   * Transfer admin rights to a new user
   */
  async transferAdmin(workspaceId: string, newAdminUserId: string): Promise<{ message: string; new_admin_user_id: string }> {
    // DRF action name uses underscore -> /transfer_admin/
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/transfer_admin/`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: [newAdminUserId] }),
    });
  },

  /**
   * Remove one or more users from a workspace
   */
  async removeUsers(workspaceId: string, userIds: string[]): Promise<{ message: string; removed_users: string[]; total_removed: number }> {
    return apiCall(`/api/workspaces/workspaces/${workspaceId}/remove_users/`, {
      method: 'DELETE',
      body: JSON.stringify({ user_ids: userIds }),
    });
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

// Call Log Interfaces
export interface CallLog {
  id: string;
  lead: string;
  lead_name: string;
  lead_surname: string;
  lead_email: string;
  agent: string;
  agent_workspace_name: string;
  timestamp: string;
  from_number: string;
  to_number: string;
  duration: number;
  duration_formatted: string;
  disconnection_reason: string | null;
  direction: 'inbound' | 'outbound';
  status: 'appointment_scheduled' | 'not_reached' | 'no_interest' | 'reached' | null;
  appointment_datetime: string | null;
  updated_at: string;
}

export interface CallLogsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CallLog[];
}

export interface AppointmentStats {
  total_appointments: number;
  appointments_today: number;
  appointments_this_week: number;
  appointments_this_month: number;
  upcoming_appointments: number;
  past_appointments: number;
}

export interface DailyStats {
  period_days: number;
  start_date: string;
  end_date: string;
  daily_stats: Array<{
    date: string;
    calls: number;
    avg_duration: number;
    total_duration: number;
  }>;
  totals: {
    calls: number;
    avg_duration: number;
    total_duration: number;
  };
}

export interface ChartDataPoint {
  date: string;
  leads: number;
  calls: number;
  appointments: number;
  conversion: number;
}

// Appointment-specific interfaces for Dashboard
export interface AppointmentCallLog {
  id: string;
  lead: string;           // Name of the lead (from lead_name)
  appointmentDate: string; // Formatted "dd.MM.yyyy HH:mm"
  date: string;           // Formatted "yyyy-MM-dd" (call creation date)
}

// Utility functions for date formatting
const formatAppointmentDate = (isoDateTime: string): string => {
  try {
    const date = new Date(isoDateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('❌ Error formatting appointment date:', error);
    return isoDateTime; // Fallback to original
  }
};

const formatCallDate = (isoDateTime: string): string => {
  try {
    const date = new Date(isoDateTime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('❌ Error formatting call date:', error);
    return isoDateTime; // Fallback to original
  }
};

// Call API calls
export const callAPI = {
  /**
   * Create a CallTask for an Agent and a specific Lead target_ref
   */
  async createTask(data: { workspace: string; agent: string; target_ref: string; next_call?: string }): Promise<any> {
    console.log('📞 POST /api/call_tasks/ - Creating call task:', data);
    try {
      const response = await apiCall<any>('/api/call_tasks/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('✅ Call task created:', response);
      return response;
    } catch (error) {
      console.error('❌ Call task creation API error:', error);
      throw error;
    }
  },
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

  /**
   * Get call logs with optional filtering and pagination
   */
  async getCallLogs(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    agent?: string;
    agent__workspace?: string;
    status?: string;
    direction?: string;
    ordering?: string;
    timestamp_after?: string;
    timestamp_before?: string;
  }): Promise<CallLogsListResponse> {
    console.log('📞 GET /api/calls/call-logs/ - Getting call logs');
    
    try {
      let url = '/api/calls/call-logs/';
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
      if (params?.agent) {
        searchParams.append('agent', params.agent);
      }
      if (params?.agent__workspace) {
        searchParams.append('agent__workspace', params.agent__workspace);
      }
      if (params?.status) {
        searchParams.append('status', params.status);
      }
      if (params?.direction) {
        searchParams.append('direction', params.direction);
      }
      if (params?.ordering) {
        searchParams.append('ordering', params.ordering);
      }
      if (params?.timestamp_after) {
        searchParams.append('timestamp_after', params.timestamp_after);
      }
      if (params?.timestamp_before) {
        searchParams.append('timestamp_before', params.timestamp_before);
      }
      
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      
      const response = await apiCall<CallLogsListResponse>(url);
      console.log('✅ Call logs retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Call logs API error:', error);
      throw error;
    }
  },

  /**
   * Calculate reached leads from call logs
   * Filters out 'not_reached' status and counts unique leads
   */
  calculateReachedLeads(callLogs: CallLog[]): number {
    try {
      // Filter successful calls (not 'not_reached' and not null)
      const successfulCalls = callLogs.filter(log => 
        log.status && log.status !== 'not_reached'
      );
      
      // Count unique leads (Set eliminates duplicates)
      const uniqueReachedLeads = new Set(
        successfulCalls.map(log => log.lead)
      ).size;
      
      console.log(`📊 Calculated reached leads: ${uniqueReachedLeads} from ${callLogs.length} total calls`);
      return uniqueReachedLeads;
    } catch (error) {
      console.error('❌ Error calculating reached leads:', error);
      return 0; // Fallback to 0 on error
    }
  },

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(params?: { agent__workspace?: string }): Promise<AppointmentStats> {
    console.log('📅 GET /api/calls/call-logs/appointment_stats/ - Getting appointment statistics');
    
    try {
      let url = '/api/calls/call-logs/appointment_stats/';
      if (params?.agent__workspace) {
        url += `?agent__workspace=${encodeURIComponent(params.agent__workspace)}`;
      }
      const response = await apiCall<AppointmentStats>(url);
      console.log('✅ Appointment statistics retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Appointment stats API error:', error);
      // Return default values on error
      return {
        total_appointments: 0,
        appointments_today: 0,
        appointments_this_week: 0,
        appointments_this_month: 0,
        upcoming_appointments: 0,
        past_appointments: 0
      };
    }
  },

  /**
   * Get daily call statistics for chart data
   */
  async getDailyStats(days: number = 30, params?: { agent__workspace?: string }): Promise<DailyStats> {
    console.log(`📊 GET /api/calls/call-logs/daily_stats/?days=${days} - Getting daily call statistics`);
    
    try {
      let url = `/api/calls/call-logs/daily_stats/?days=${days}`;
      if (params?.agent__workspace) {
        url += `&agent__workspace=${encodeURIComponent(params.agent__workspace)}`;
      }
      const response = await apiCall<DailyStats>(url);
      console.log('✅ Daily stats retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Daily stats API error:', error);
      // Return empty data on error
      return {
        period_days: days,
        start_date: '',
        end_date: '',
        daily_stats: [],
        totals: {
          calls: 0,
          avg_duration: 0,
          total_duration: 0
        }
      };
    }
  },

  /**
   * Get date-filtered call logs for appointments
   */
  async getCallLogsInDateRange(startDate: string, endDate: string, status?: string): Promise<CallLogsListResponse> {
    console.log(`📅 GET /api/calls/call-logs/ (date range: ${startDate} to ${endDate}) - Getting calls in date range`);
    
    try {
      const params: any = {
        timestamp_after: startDate,
        timestamp_before: endDate,
        page_size: 1000 // Get enough data for aggregation
      };
      
      if (status) {
        params.status = status;
      }
      
      return await this.getCallLogs(params);
    } catch (error) {
      console.error('❌ Date range call logs API error:', error);
      throw error;
    }
  },

  /**
   * Get appointment call logs formatted for Dashboard display
   */
  async getAppointmentCallLogs(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    appointment_datetime_after?: string;
    appointment_datetime_before?: string;
    agent__workspace?: string;
  }): Promise<AppointmentCallLog[]> {
    console.log('📅 GET /api/calls/call-logs/ (appointments) - Getting appointment call logs');
    
    try {
      // Prepare parameters for call logs API
      const callParams: any = {
        status: 'appointment_scheduled', // Only get appointments
        ordering: params?.ordering || '-appointment_datetime', // Default: newest appointments first
        page_size: params?.page_size || 10, // Default: 10 appointments for dashboard
        page: params?.page || 1
      };

      // Add date filtering if provided
      if (params?.appointment_datetime_after) {
        callParams.appointment_datetime_after = params.appointment_datetime_after;
      }
      if (params?.appointment_datetime_before) {
        callParams.appointment_datetime_before = params.appointment_datetime_before;
      }
      if (params?.agent__workspace) {
        callParams.agent__workspace = params.agent__workspace;
      }

      // Call the existing getCallLogs function with appointment filters
      const response = await this.getCallLogs(callParams);
      
      // Transform CallLog[] to AppointmentCallLog[]
      const appointments: AppointmentCallLog[] = response.results
        .filter(callLog => callLog.appointment_datetime) // Ensure appointment_datetime exists
        .map(callLog => ({
          id: callLog.id,
          lead: callLog.lead_name || 'Unknown Lead',
          appointmentDate: formatAppointmentDate(callLog.appointment_datetime!),
          date: formatCallDate(callLog.timestamp)
        }));

      console.log(`✅ Appointment call logs retrieved: ${appointments.length} appointments`);
      return appointments;
    } catch (error) {
      console.error('❌ Appointment call logs API error:', error);
      // Return empty array on error for graceful fallback
      return [];
    }
  },

  /**
   * Get recent call logs for "Letzte Anrufe" section
   */
  async getRecentCallLogs(params?: {
    page_size?: number;
    ordering?: string;
    timestamp_after?: string;
    timestamp_before?: string;
    search?: string;
    agent__workspace?: string;
  }): Promise<CallLog[]> {
    console.log('📞 GET /api/calls/call-logs/ (recent) - Getting recent call logs');
    
    try {
      // Prepare parameters for call logs API
      const callParams: any = {
        ordering: params?.ordering || '-timestamp', // Default: newest calls first
        page_size: params?.page_size || 10, // Default: 10 calls
        page: 1 // Always get first page for recent calls
      };

      // Add date filtering if provided
      if (params?.timestamp_after) {
        callParams.timestamp_after = params.timestamp_after;
      }
      if (params?.timestamp_before) {
        callParams.timestamp_before = params.timestamp_before;
      }

      // Add search if provided
      if (params?.search && params.search.trim()) {
        callParams.search = params.search.trim();
      }
      if (params?.agent__workspace) {
        callParams.agent__workspace = params.agent__workspace;
      }

      // Call the existing getCallLogs function
      const response = await this.getCallLogs(callParams);
      
      console.log(`✅ Recent call logs retrieved: ${response.results.length} calls`);
      return response.results;
    } catch (error) {
      console.error('❌ Recent call logs API error:', error);
      // Return empty array on error for graceful fallback
      return [];
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

export interface MicrosoftConnection {
  id: string;
  workspace: string;
  primary_email: string;
  display_name?: string;
  timezone_windows?: string;
  active: boolean;
  last_sync?: string | null;
  created_at?: string;
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
   * Get Microsoft 365 Calendar connections
   */
  async getMicrosoftConnections(): Promise<MicrosoftConnection[]> {
    console.log('🔗 GET /api/calendars/microsoft_connections/ - Fetching Microsoft connections');
    try {
      const response = await apiCall<MicrosoftConnection[]>('/api/calendars/microsoft_connections/');
      console.log('✅ Microsoft connections loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Microsoft connections API error:', error);
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
   * Generate Microsoft OAuth URL
   */
  async getMicrosoftOAuthURL(): Promise<{
    authorization_url: string;
    state: string;
  }> {
    console.log('🔐 POST /api/calendars/microsoft_auth_url/ - Generating OAuth URL');
    try {
      const response = await apiCall<{ authorization_url: string; state: string }>('/api/calendars/microsoft_auth_url/', {
        method: 'POST',
        body: JSON.stringify({})
      });
      console.log('✅ Microsoft OAuth URL generated:', response.authorization_url);
      return response;
    } catch (error) {
      console.error('❌ Microsoft OAuth URL generation error:', error);
      throw error;
    }
  },

  /**
   * List Microsoft calendars for a connection
   */
  async getMicrosoftCalendars(connectionId: string): Promise<Array<{ id: string; name: string; is_primary: boolean; owner_email: string; can_edit: boolean }>> {
    const url = `/api/calendars/microsoft_calendars/?connection_id=${encodeURIComponent(connectionId)}`;
    return apiCall(url);
  },

  /**
   * Refresh Microsoft connection
   */
  async refreshMicrosoftConnection(connectionId: string): Promise<any> {
    return apiCall(`/api/calendars/${connectionId}/microsoft_refresh/`, { method: 'POST' });
  },

  /**
   * Disconnect Microsoft connection
   */
  async disconnectMicrosoftCalendar(connectionId: string): Promise<{ success: boolean; message?: string; }>{
    return apiCall(`/api/calendars/${connectionId}/microsoft_disconnect/`, { method: 'POST', body: JSON.stringify({ confirm: true }) });
  },

  /**
   * Save Microsoft-specific settings for a connection
   */
  async saveMicrosoftSettings(connectionId: string, settings: Record<string, any>): Promise<{ saved: boolean; settings: Record<string, any> }>{
    return apiCall(`/api/calendars/${connectionId}/settings/`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  /**
   * Create Microsoft subscription (webhook)
   */
  async subscribeMicrosoft(connectionId: string, body: { notificationUrl?: string; clientState?: string }): Promise<any> {
    return apiCall(`/api/calendars/${connectionId}/microsoft_subscribe/`, {
      method: 'POST',
      body: JSON.stringify(body || {})
    });
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
        method: 'POST',
        body: JSON.stringify({ confirm: true })
      });
      console.log('✅ Google Calendar disconnected:', response);
      return response;
    } catch (error) {
      console.error('❌ Google disconnect error:', error);
      throw error;
    }
  },

  /**
   * Preview which Event Types will be deleted when disconnecting a Google connection
   */
  async previewGoogleDisconnect(connectionId: string): Promise<{ count: number; items: Array<{ id: string; name: string; calendar: string }> }>{
    return apiCall(`/api/calendars/${connectionId}/google_disconnect_preview/`, { method: 'GET' });
  },

  /**
   * Preview which Event Types will be deleted when disconnecting a Microsoft connection
   */
  async previewMicrosoftDisconnect(connectionId: string): Promise<{ count: number; items: Array<{ id: string; name: string; calendar: string }> }>{
    return apiCall(`/api/calendars/${connectionId}/microsoft_disconnect_preview/`, { method: 'GET' });
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
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    ordering?: string;
    workspace?: string;
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
      if (params?.name) {
        searchParams.append('name', params.name);
      }
      if (params?.surname) {
        searchParams.append('surname', params.surname);
      }
      if (params?.email) {
        searchParams.append('email', params.email);
      }
      if (params?.phone) {
        searchParams.append('phone', params.phone);
      }
      if (params?.ordering) {
        searchParams.append('ordering', params.ordering);
      }
      if (params?.workspace) {
        searchParams.append('workspace', params.workspace);
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
    import_batch_id?: string;
    detected_variable_keys?: string[];
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

  /**
   * Get leads within a date range for chart data
   */
  async getLeadsInDateRange(startDate: string, endDate: string): Promise<LeadsListResponse> {
    console.log(`📊 GET /api/leads/ (date range: ${startDate} to ${endDate}) - Getting leads in date range`);
    
    try {
      let url = '/api/leads/';
      const searchParams = new URLSearchParams();
      
      searchParams.append('created_after', startDate);
      searchParams.append('created_before', endDate);
      searchParams.append('page_size', '1000'); // Get enough data for aggregation
      
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      
      const response = await apiCall<LeadsListResponse>(url);
      console.log(`✅ Leads in date range retrieved: ${response.count} leads`);
      return response;
    } catch (error) {
      console.error('❌ Date range leads API error:', error);
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
   * Update funnel properties (e.g., is_active)
   */
  async updateFunnel(funnelId: string, data: Partial<{ name: string; is_active: boolean }>): Promise<any> {
    console.log(`✏️ PATCH /api/funnels/lead-funnels/${funnelId}/ - Updating funnel:`, { funnelId, data });
    try {
      const response = await apiCall<any>(`/api/funnels/lead-funnels/${funnelId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      console.log('✅ Funnel updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Funnel update API error:', error);
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
   * Delete a lead funnel
   */
  async deleteFunnel(funnelId: string): Promise<void> {
    console.log(`🗑️ DELETE /api/funnels/lead-funnels/${funnelId}/ - Deleting funnel`);
    try {
      await apiCall<void>(`/api/funnels/lead-funnels/${funnelId}/`, {
        method: 'DELETE',
      });
      console.log('✅ Funnel deleted');
    } catch (error) {
      console.error('❌ Funnel delete API error:', error);
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
        body: JSON.stringify({ 
          confirm: true  // Backend requires confirmation
        }),
      });
      
      console.log('✅ Agent unassigned from funnel successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Funnel unassign agent API error:', error);
      throw error;
    }
  },

  /**
   * Get variables for a specific funnel (core + recent custom)
   */
  async getFunnelVariables(
    funnelId: string
  ): Promise<Array<{ key: string; label: string; category: 'contact'|'custom'; type: 'string'|'email'|'phone' }>> {
    console.log(`📋 GET /api/funnels/lead-funnels/${funnelId}/variables/`);
    try {
      const res = await apiCall<any>(`/api/funnels/lead-funnels/${funnelId}/variables/`, {
        method: 'GET',
      });
      return Array.isArray(res) ? res : [];
    } catch (error) {
      console.error('❌ Funnel variables API error:', error);
      throw error;
    }
  },
}; 

// Webhook Source API calls
export const webhookAPI = {
  /**
   * Create a webhook source (auto-creates a LeadFunnel)
   */
  async createSource(workspace: string, name: string): Promise<{
    id: string;
    name: string;
    lead_funnel: string;
    url: string;
    token: string; // one-time reveal
  }> {
    console.log('➕ POST /api/webhook-sources/ - Creating webhook source:', { workspace, name });
    try {
      const response = await apiCall<any>('/api/webhook-sources/', {
        method: 'POST',
        body: JSON.stringify({ workspace, name }),
      });
      console.log('✅ Webhook source created:', response);
      return response;
    } catch (error) {
      console.error('❌ Webhook source create API error:', error);
      throw error;
    }
  },

  /**
   * List webhook sources
   */
  async listSources(): Promise<Array<{ id: string; name: string; lead_funnel: string }>> {
    console.log('📋 GET /api/webhook-sources/ - Listing webhook sources');
    try {
      const response = await apiCall<any>('/api/webhook-sources/');
      const results = Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []);
      console.log('✅ Webhook sources loaded:', results);
      return results;
    } catch (error) {
      console.error('❌ Webhook source list API error:', error);
      throw error;
    }
  },

  /**
   * Rotate token and return new token (one-time reveal)
   */
  async rotateToken(sourceId: string): Promise<{ token: string; url: string }> {
    console.log(`🔐 POST /api/webhook-sources/${sourceId}/rotate_token/ - Rotating token`);
    try {
      const response = await apiCall<any>(`/api/webhook-sources/${sourceId}/rotate_token/`, {
        method: 'POST',
      });
      console.log('✅ Token rotated');
      return response;
    } catch (error) {
      console.error('❌ Webhook source rotate token API error:', error);
      throw error;
    }
  },

  /**
   * Delete a webhook source
   */
  async deleteSource(sourceId: string): Promise<void> {
    console.log(`🗑️ DELETE /api/webhook-sources/${sourceId}/ - Deleting webhook source`);
    try {
      await apiCall<void>(`/api/webhook-sources/${sourceId}/`, {
        method: 'DELETE',
      });
      console.log('✅ Webhook source deleted');
    } catch (error) {
      console.error('❌ Delete webhook source API error:', error);
      throw error;
    }
  },

  
};

// Chart Data Generation using Real APIs
export const chartAPI = {
  /**
   * Generate real chart data by combining multiple API sources
   */
  async generateRealChartData(dateRange: {from: Date, to: Date}): Promise<ChartDataPoint[]> {
    console.log('📊 Generating real chart data for date range:', dateRange);
    
    try {
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();
      
      // Check if this is a single day
      const isSingleDay = dateRange.from.toDateString() === dateRange.to.toDateString();
      
      if (isSingleDay) {
        console.log('📊 Single day detected - generating hourly real data');
        return await this.generateSingleDayHourlyData(dateRange.from);
      } else {
        console.log('📊 Multi day detected - generating daily real data');
        return await this.generateMultiDayData(dateRange);
      }
    } catch (error) {
      console.error('❌ Error generating real chart data:', error);
      
      // Fallback to empty data on error
      return [];
    }
  },

  /**
   * Generate hourly data for a single day using real call logs
   */
  async generateSingleDayHourlyData(date: Date): Promise<ChartDataPoint[]> {
    try {
      // Set start and end of the selected day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all call logs for this specific day
      const callLogs = await callAPI.getCallLogsInDateRange(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      // Get leads created on this day
      const leadsInDay = await leadAPI.getLeadsInDateRange(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      // Group calls by hour
      const hourlyData: ChartDataPoint[] = [];
      
      for (let hour = 0; hour < 24; hour++) {
        // Create hour timestamp in local timezone, not UTC
        const hourStart = new Date(date);
        hourStart.setHours(hour, 0, 0, 0);

        // Count calls in this hour (using local time comparison)
        const callsInHour = callLogs.results.filter(call => {
          const callTime = new Date(call.timestamp);
          const callHour = callTime.getHours();
          const callDate = callTime.toDateString();
          const targetDate = date.toDateString();
          return callDate === targetDate && callHour === hour;
        }).length;

        // Count appointments in this hour (using local time comparison)
        const appointmentsInHour = callLogs.results.filter(call => {
          const callTime = new Date(call.timestamp);
          const callHour = callTime.getHours();
          const callDate = callTime.toDateString();
          const targetDate = date.toDateString();
          return callDate === targetDate && callHour === hour && call.status === 'appointment_scheduled';
        }).length;

        // Count leads created in this hour (using local time comparison)
        const leadsInHour = leadsInDay.results.filter(lead => {
          const leadTime = new Date(lead.created_at);
          const leadHour = leadTime.getHours();
          const leadDate = leadTime.toDateString();
          const targetDate = date.toDateString();
          return leadDate === targetDate && leadHour === hour;
        }).length;

        // Calculate conversion rate
        const conversion = leadsInHour > 0 ? ((appointmentsInHour / leadsInHour) * 100) : 0;

        hourlyData.push({
          date: hourStart.toISOString(),
          leads: leadsInHour,
          calls: callsInHour,
          appointments: appointmentsInHour,
          conversion: Math.round(conversion * 10) / 10
        });
      }

      // Debug: Log lead distribution
      const totalLeadsInChart = hourlyData.reduce((sum, hour) => sum + hour.leads, 0);
      const hoursWithLeads = hourlyData.filter(hour => hour.leads > 0);
      console.log('✅ Generated hourly real data for single day:', hourlyData.length, 'hours');
      console.log('📊 Lead distribution debug:', {
        totalLeadsFromAPI: leadsInDay.results.length,
        totalLeadsInChart,
        hoursWithLeads: hoursWithLeads.map(h => ({
          hour: new Date(h.date).getHours(),
          leads: h.leads,
          calls: h.calls,
          appointments: h.appointments
        }))
      });
      return hourlyData;

    } catch (error) {
      console.error('❌ Error generating single day hourly data:', error);
      return [];
    }
  },

  /**
   * Generate daily data for multi-day ranges (existing logic)
   */
  async generateMultiDayData(dateRange: {from: Date, to: Date}): Promise<ChartDataPoint[]> {
    // Set proper start and end times for the date range
    const startOfRange = new Date(dateRange.from);
    startOfRange.setHours(0, 0, 0, 0);
    const endOfRange = new Date(dateRange.to);
    endOfRange.setHours(23, 59, 59, 999);
    
    // Calculate number of days for the chart
    const totalDays = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get daily call statistics
    const dailyStats = await callAPI.getDailyStats(totalDays);
    
    // Get appointment calls in date range
    const appointmentCalls = await callAPI.getCallLogsInDateRange(
      startOfRange.toISOString(), 
      endOfRange.toISOString(), 
      'appointment_scheduled'
    );
    
    // Get all leads in date range (to calculate daily lead creation)  
    console.log('📊 Multi-day calling getLeadsInDateRange with:', startOfRange.toISOString(), 'to', endOfRange.toISOString());
    const leadsInRange = await leadAPI.getLeadsInDateRange(startOfRange.toISOString(), endOfRange.toISOString());
    
    // Process daily stats into chart format
    const chartData: ChartDataPoint[] = dailyStats.daily_stats.map(dayStat => {
      // Count appointments for this specific day
      const dayAppointments = appointmentCalls.results.filter(call => {
        const callDate = new Date(call.timestamp).toISOString().split('T')[0];
        const statDate = dayStat.date.split('T')[0];
        return callDate === statDate;
      }).length;
      
      // Count leads created on this specific day
      const dayLeads = leadsInRange.results.filter(lead => {
        const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
        const statDate = dayStat.date.split('T')[0];
        return leadDate === statDate;
      }).length;
      
      // Calculate conversion rate for the day
      const conversion = dayLeads > 0 ? ((dayAppointments / dayLeads) * 100) : 0;
      
      return {
        date: dayStat.date,
        leads: dayLeads,
        calls: dayStat.calls,
        appointments: dayAppointments,
        conversion: Math.round(conversion * 10) / 10 // Round to 1 decimal
      };
    });
    
    console.log('✅ Generated multi-day real data:', chartData.length, 'data points');
    return chartData;
  }
}; 