import { apiClient, apiConfig } from './apiConfig';

// Types for signup data
export interface SignupStep1Data {
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface SignupStep2Data {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
}

export interface CompleteSignupData extends SignupStep1Data, SignupStep2Data {}

// New registration request type for the updated endpoint
export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password_confirm: string;
}

// Email verification request
export interface EmailVerificationRequest {
  email: string;
  token: string;
}

// Registration response
export interface RegisterResponse {
  message: string;
  email: string;
  verification_required: boolean;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response
export interface LoginResponse {
  message?: string; // Added for cookie-based auth
  user: UserResponse;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}

// Legacy interface for backwards compatibility
export interface CreateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_staff: boolean;
  is_superuser: boolean;
  status: string;
  created_at: string;
}

// New interfaces for Voice API
export interface Voice {
  id: string;
  name: string;
  voice_external_id: string;
  provider: 'openai' | 'elevenlabs' | 'google' | 'azure' | 'aws';
  gender: 'male' | 'female' | 'neutral';
  tone?: string;
  recommend?: boolean;
  agent_count?: number;
  created_date?: string;
  updated_date?: string;
  voice_sample?: string; // URL to voice sample audio file (from API)
  voice_picture?: string; // URL to voice avatar/picture (from API)
}

export interface VoicesResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Voice[];
}

export interface VoiceListParams {
  agent_count_max?: number;
  agent_count_min?: number;
  agent_workspace?: string;
  created_after?: string;
  created_before?: string;
  created_date?: string;
  gender?: 'male' | 'female' | 'neutral';
  has_agents?: boolean;
  name?: string;
  ordering?: string;
  page?: number;
  provider?: string;
  provider_exact?: 'openai' | 'elevenlabs' | 'google' | 'azure' | 'aws';
  recommend?: boolean;
  search?: string;
  tone?: string;
  updated_after?: string;
  updated_before?: string;
  voice_external_id?: string;
}

// New interfaces for Agent API
export interface AgentCreateRequest {
  workspace: string;
  name: string;
  status?: 'active' | 'inactive';
  greeting_inbound: string;
  greeting_outbound?: string;
  voice: string; // Internal voice ID (database UUID)
  language: string;
  retry_interval?: number;
  workdays: string[]; // Array of workdays (e.g., ['Mo', 'Di', 'Mi', 'Do', 'Fr'])
  call_from: string; // Time format "HH:mm:ss"
  call_to: string; // Time format "HH:mm:ss"
  character: string;
  prompt?: string;
  config_id?: string;
  calendar_configuration?: string;
}

export interface Agent {
  id: string;
  workspace: string;
  name: string;
  status: 'active' | 'inactive';
  greeting_inbound: string;
  greeting_outbound?: string;
  voice: string;
  language: string;
  retry_interval: number;
  workdays: string;
  call_from: string;
  call_to: string;
  character: string;
  prompt?: string;
  config_id?: string;
  calendar_configuration?: string;
  created_date?: string;
  updated_date?: string;
}

// Helper function to get voice sample URL
export const getVoiceSampleUrl = (voice: Voice): string => {
  // If backend provides voice_sample, use it directly
  if (voice.voice_sample) {
    console.log(`✅ Using API voice_sample for ${voice.name}: ${voice.voice_sample}`);
    return voice.voice_sample;
  }
  
  // Fallback: construct URL based on voice name/ID
  // This maps to the actual audio files in the backend
  const voiceUrlMap: Record<string, string> = {
    'Marcus': 'marcus-sample.mp3',
    'Markus': 'marcus-sample.mp3', // German name variant
    'Anna': 'ElevenLabs_2025-07-27T08_34_08_Dana__Engaging_Confident_German_Female_pvc__28wjY1z.mp3',
    'Lucy': 'ElevenLabs_2025-07-27T08_31_19_Lucy_Fennek_-_The_Upbeat_Vox_pvc_sp100_s30__miFIEZW.mp3',
    'Lisa': 'ElevenLabs_2025-07-27T08_31_19_Lucy_Fennek_-_The_Upbeat_Vox_pvc_sp100_s30__miFIEZW.mp3' // Lisa might be using Lucy's file
  };
  
  // Try exact name match first
  if (voiceUrlMap[voice.name]) {
    const filename = voiceUrlMap[voice.name];
    const url = `${apiConfig.baseUrl}/media/voice_samples/${filename}`;
    console.log(`🎵 Using mapped filename for ${voice.name}: ${filename}`);
    return url;
  }
  
  // Try case-insensitive match
  const lowerName = voice.name.toLowerCase();
  for (const [key, filename] of Object.entries(voiceUrlMap)) {
    if (key.toLowerCase() === lowerName) {
      const url = `${apiConfig.baseUrl}/media/voice_samples/${filename}`;
      console.log(`🎵 Using case-insensitive match for ${voice.name}: ${filename}`);
      return url;
    }
  }
  
  // Last resort: use voice_external_id
  console.warn(`⚠️ No mapping found for voice "${voice.name}", using voice_external_id: ${voice.voice_external_id}`);
  const filename = `${voice.voice_external_id}-sample.mp3`;
  return `${apiConfig.baseUrl}/media/voice_samples/${filename}`;
};

// Voice service
export const voiceService = {
  async getVoices(params?: VoiceListParams): Promise<VoicesResponse> {
    try {
      console.log('Fetching voices with params:', params);
      const response = await apiClient.get<VoicesResponse>(
        apiConfig.endpoints.voices,
        params
      );
      console.log('Voices fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw error;
    }
  },

  async getRecommendedVoices(): Promise<Voice[]> {
    try {
      const response = await this.getVoices({ recommend: true });
      return response.results;
    } catch (error) {
      console.error('Failed to fetch recommended voices:', error);
      throw error;
    }
  }
};

// Agent service
export const agentService = {
  async createAgent(agentData: AgentCreateRequest): Promise<Agent> {
    try {
      console.log('Creating agent with data:', {
        ...agentData,
        prompt: agentData.prompt ? '[REDACTED]' : undefined
      });
      
      const response = await apiClient.post<Agent>(
        apiConfig.endpoints.agents,
        agentData
      );
      
      console.log('Agent created successfully:', response);
      return response;
    } catch (error) {
      console.error('Agent creation failed:', error);
      throw error;
    }
  },

  async getAgents(): Promise<Agent[]> {
    try {
      console.log('Fetching agents from API...');
      
      const response = await apiClient.get<{results: Agent[]}>(
        apiConfig.endpoints.agents
      );
      
      console.log('Agents fetched successfully:', response);
      return response.results;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      throw error;
    }
  }
};

// Auth service
export const authService = {
  // Login method
  async login(email: string, password: string): Promise<LoginResponse> {
    const loginRequest: LoginRequest = {
      email,
      password
    };

    console.log('🔑 Logging in user (cookie-based auth):', { email, password: '[REDACTED]' });

    try {
      const response = await apiClient.post<LoginResponse>(
        apiConfig.endpoints.login,
        loginRequest
      );
      
      console.log('✅ Login API response received:', {
        hasUser: !!response.user,
        userEmail: response.user?.email,
        hasToken: !!response.token,
        message: response.message
      });

      // Store the auth token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        console.log('🔑 Auth token stored in localStorage');
        
        // Set the token in apiConfig for future requests
        apiConfig.setAuthToken(response.token);
      } else {
        console.error('❌ No token received from login endpoint!');
        throw new Error('Authentication failed - no token received');
      }

      // Store user data and logged in status
      this.storeUser(response.user);
      
      // Set logged in flag
      localStorage.setItem('userLoggedIn', 'true');
      
      console.log('✅ Authentication state saved:', {
        userLoggedIn: localStorage.getItem('userLoggedIn'),
        authMethod: 'token',
        user: this.getStoredUser()?.email,
        hasToken: !!localStorage.getItem('authToken')
      });
      
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      // Clear any partial authentication state
      this.clearUser();
      throw error;
    }
  },

  // New registration method using the updated endpoint with email verification
  async register(signupData: CompleteSignupData): Promise<RegisterResponse> {
    const registerRequest: RegisterRequest = {
      email: signupData.email,
      first_name: signupData.firstName,
      last_name: signupData.lastName,
      phone: signupData.phone,
      password: signupData.password,
      password_confirm: signupData.passwordConfirm,
    };

    console.log('Registering user with email verification:', {
      ...registerRequest,
      password: '[REDACTED]',
      password_confirm: '[REDACTED]'
    });

    // Additional debug logging
    console.log('🔍 Debug - Registration request details:');
    console.log('- Email:', registerRequest.email);
    console.log('- First Name:', registerRequest.first_name);
    console.log('- Last Name:', registerRequest.last_name);
    console.log('- Phone:', registerRequest.phone);
    console.log('- Password length:', signupData.password?.length || 0);
    console.log('- Password Confirm length:', signupData.passwordConfirm?.length || 0);
    console.log('- Passwords match:', signupData.password === signupData.passwordConfirm);

    try {
      const response = await apiClient.post<RegisterResponse>(
        apiConfig.endpoints.register,
        registerRequest
      );
      
      console.log('Registration successful, email verification required:', response);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Email verification
  async verifyEmail(email: string, token: string): Promise<UserResponse> {
    const verificationRequest: EmailVerificationRequest = {
      email,
      token
    };

    console.log('Verifying email:', email);

    try {
      const response = await apiClient.post<UserResponse>(
        apiConfig.endpoints.verifyEmail,
        verificationRequest
      );
      
      console.log('Email verification successful:', response);
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  },

  // Legacy method for backwards compatibility
  async createUser(signupData: CompleteSignupData): Promise<UserResponse> {
    // Generate username from email (remove domain and special chars)
    const username = signupData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    const createUserRequest: CreateUserRequest = {
      username,
      first_name: signupData.firstName,
      last_name: signupData.lastName,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
    };

    console.log('Creating user with data:', {
      ...createUserRequest,
      password: '[REDACTED]'
    });

    try {
      const response = await apiClient.post<UserResponse>(
        apiConfig.endpoints.users,
        createUserRequest
      );
      
      console.log('User created successfully:', response);
      return response;
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  },

  // Store user in localStorage after successful signup
  storeUser(user: UserResponse) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userLoggedIn', 'true');
  },

  // Store registration data temporarily for email verification
  storeRegistrationData(data: CompleteSignupData) {
    localStorage.setItem('pendingRegistration', JSON.stringify(data));
  },

  // Get stored registration data
  getStoredRegistrationData(): CompleteSignupData | null {
    const dataStr = localStorage.getItem('pendingRegistration');
    return dataStr ? JSON.parse(dataStr) : null;
  },

  // Clear registration data
  clearRegistrationData() {
    localStorage.removeItem('pendingRegistration');
  },

  // Clear stored user data
  clearUser() {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
    // Clear welcome flow status
    localStorage.removeItem('welcomeCompleted');
    
    // Clear any session cookies (though they should be httpOnly and not accessible)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  },

  // Get stored user
  getStoredUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    return localStorage.getItem('userLoggedIn') === 'true';
  },

  // Debug helper: Get current auth state
  getAuthDebugInfo() {
    const authToken = localStorage.getItem('authToken');
    const userLoggedIn = localStorage.getItem('userLoggedIn');
    const user = localStorage.getItem('user');
    
    return {
      hasAuthToken: !!authToken,
      authTokenLength: authToken?.length || 0,
      authTokenPreview: authToken ? `${authToken.substring(0, 8)}...` : null,
      userLoggedInFlag: userLoggedIn,
      hasUserData: !!user,
      userData: user ? JSON.parse(user) : null,
      timestamp: new Date().toISOString()
    };
  },

  // Force clear all auth state (for debugging)
  forceLogout() {
    console.log('🔴 FORCE LOGOUT: Clearing all authentication state');
    this.clearUser();
    
    // Ensure complete cleanup
    localStorage.clear(); // Nuclear option for debugging
    
    // Clear auth token from apiConfig if available
    try {
      const { apiConfig } = require('@/lib/apiConfig');
      apiConfig.clearAuthToken();
    } catch (e) {
      console.log('Note: Could not clear apiConfig token');
    }
    
    console.log('🔴 All auth state cleared');
  }
}; 