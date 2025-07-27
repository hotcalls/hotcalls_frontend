import { useState, useEffect } from 'react';
import { workspaceAPI, CreateWorkspaceResponse, authAPI } from '@/lib/apiService';

export interface WorkspaceDetails extends CreateWorkspaceResponse {
  members?: any[];
}

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<CreateWorkspaceResponse[]>([]);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏢 Fetching user workspaces and profile...');
      
      // Fetch current user and workspaces in parallel
      const [workspaceData, userProfile] = await Promise.all([
        workspaceAPI.getMyWorkspaces(),
        authAPI.getProfile()
      ]);
      
      console.log('✅ Workspaces loaded:', workspaceData);
      console.log('✅ User profile loaded:', userProfile);
      
      setWorkspaces(workspaceData);
      setCurrentUser(userProfile);

      // Fetch details for the first workspace
      if (workspaceData.length > 0) {
        const primaryWorkspace = workspaceData[0];
        console.log('🔍 Fetching details for primary workspace:', primaryWorkspace.id);
        
        try {
          const details = await workspaceAPI.getWorkspaceDetails(primaryWorkspace.id);
          console.log('✅ Workspace details loaded:', details);
          setWorkspaceDetails(details);
        } catch (detailsError) {
          console.warn('⚠️ Could not fetch workspace details:', detailsError);
          // Set basic workspace info even if details fail
          setWorkspaceDetails(primaryWorkspace);
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Get primary workspace (first one)
  const primaryWorkspace = workspaces.length > 0 ? workspaces[0] : null;

  // Extract team members from workspace details and ensure current user is included
  const getTeamMembers = () => {
    const members = [];
    
    // Add current user first (always show current user)
    if (currentUser) {
      const currentUserMember = {
        id: currentUser.id,
        name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Aktueller User',
        email: currentUser.email || 'Keine E-Mail',
        role: currentUser.is_superuser ? 'Admin' : currentUser.is_staff ? 'Staff' : 'User',
        status: 'Aktiv',
        lastActive: 'jetzt',
        avatar: `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}`.toUpperCase() || '?'
      };
      members.push(currentUserMember);
    }
    
    // Add other workspace members if available
    if (workspaceDetails?.members) {
      workspaceDetails.members.forEach((member: any) => {
        // Skip if this is the current user (already added)
        if (currentUser && (member.id === currentUser.id || member.user_id === currentUser.id)) {
          return;
        }
        
        members.push({
          id: member.id || member.user_id,
          name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unbekannt',
          email: member.email || 'Keine E-Mail',
          role: member.role || (member.is_superuser ? 'Admin' : member.is_staff ? 'Staff' : 'User'),
          status: member.is_active ? 'Aktiv' : 'Offline',
          lastActive: member.last_login ? `vor ${getTimeAgo(member.last_login)}` : 'Unbekannt',
          avatar: `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || '?'
        });
      });
    }
    
    console.log('👥 Team members assembled:', members);
    return members;
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `${diffMins} Min`;
    if (diffHours < 24) return `${diffHours} Std`;
    return `${diffDays} Tagen`;
  };

  const updateWorkspace = async (workspaceId: string, updates: { workspace_name: string }) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('🔄 Updating workspace:', workspaceId, updates);
      
      const updatedWorkspace = await workspaceAPI.updateWorkspace(workspaceId, updates);
      console.log('✅ Workspace updated successfully:', updatedWorkspace);
      
      // Update local state
      setWorkspaces(prev => 
        prev.map(w => w.id === workspaceId ? { ...w, ...updates } : w)
      );
      
      // Update workspace details if it's the current workspace
      if (workspaceDetails?.id === workspaceId) {
        setWorkspaceDetails(prev => prev ? { ...prev, ...updates } : null);
      }
      
      return updatedWorkspace;
    } catch (err) {
      console.error('❌ Failed to update workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    workspaces,
    primaryWorkspace,
    workspaceDetails,
    teamMembers: getTeamMembers(),
    loading,
    updating,
    error,
    refetch: fetchWorkspaces,
    updateWorkspace
  };
} 