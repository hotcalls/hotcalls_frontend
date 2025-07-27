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

// Auth service
export const authService = {
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
    localStorage.removeItem('user');
    localStorage.removeItem('userLoggedIn');
  },

  // Get stored user
  getStoredUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    return localStorage.getItem('userLoggedIn') === 'true';
  }
}; 