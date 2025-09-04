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
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const profileData = await authAPI.getProfile();
      
      
      setProfile(profileData);
    } catch (err) {
      console.error("[ERROR]:", err);
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

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    console.log('🔧 Updating profile:', {
      profile, 
      hasProfile: !!profile, 
      profileId: profile?.id,
      profileKeys: profile ? Object.keys(profile) : [],
      fullProfile: profile
    });
    
    // Check if profile exists and has an ID (or alternative ID field)
    const userId = profile?.id || (profile as any)?.user_id || (profile as any)?.pk;
    
    if (!profile || !userId) {
      console.error("[ERROR]: Missing profile or userId for update", {
        profile,
        hasProfile: !!profile,
        profileId: profile?.id,
        userId: userId,
        allProfileFields: profile ? Object.keys(profile) : []
      });
      throw new Error('Kein User-Profil geladen - bitte Seite neu laden');
    }

    try {
      setUpdating(true);
      setError(null);
      console.log('Updating profile context', {
        profileId: profile.id,
        userId: userId,
        updatedData,
        apiEndpoint: `/api/users/users/${userId.toString()}/`,
        dataFields: Object.keys(updatedData),
        firstNameInData: (updatedData as any).first_name,
        currentProfileFirstName: profile.first_name
      });
      const updatedProfile = await authAPI.updateUser(userId.toString(), updatedData);
      // Update local state
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error("[ERROR]:", err);
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    updating,
    error,
    refetch: fetchProfile,
    updateProfile,
    getDisplayName,
    getInitials
  };
} 