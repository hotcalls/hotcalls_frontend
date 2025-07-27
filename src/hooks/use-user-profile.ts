import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/apiService';

export interface UserProfile {
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

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching user profile...');
      
      const profileData = await authAPI.getProfile();
      console.log('✅ User profile loaded:', profileData);
      
      setProfile(profileData);
    } catch (err) {
      console.error('❌ Failed to fetch user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getDisplayName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name}`.trim();
  };

  const getInitials = () => {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    getDisplayName,
    getInitials
  };
} 