import { useState, useEffect } from 'react';
import { workspaceAPI, CreateWorkspaceResponse, authAPI } from '@/lib/apiService';

export interface WorkspaceDetails extends CreateWorkspaceResponse {
  members?: any[];
  users?: any[]; // Backend returns `users` in WorkspaceSerializer
}

function lsKeyForUser(userId?: string | number | null) {
  return userId ? `selected_workspace_id:${userId}` : 'selected_workspace_id';
}

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<CreateWorkspaceResponse[]>([]);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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

      // Choose selected workspace: joined_workspace (URL) → user-scoped localStorage → first
      if (workspaceData.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const joinedWorkspaceParam = params.get('joined_workspace');
        const key = lsKeyForUser(userProfile?.id);
        const storedWorkspaceId = localStorage.getItem(key);

        // validate stored workspace against user's workspaces
        const storedWorkspace = storedWorkspaceId && workspaceData.find(w => String(w.id) === String(storedWorkspaceId));

        const initialWorkspace =
          (joinedWorkspaceParam && (workspaceData.find(w => String(w.id) === String(joinedWorkspaceParam)) || null)) ||
          storedWorkspace ||
          workspaceData[0];

        // Persist selection if it changed
        if (!selectedWorkspaceId || String(selectedWorkspaceId) !== String(initialWorkspace.id)) {
          setSelectedWorkspaceId(String(initialWorkspace.id));
          localStorage.setItem(key, String(initialWorkspace.id));
        }

        // Load details for the selected workspace
        try {
          const details = await workspaceAPI.getWorkspaceDetails(initialWorkspace.id);
          console.log('✅ Workspace details loaded:', details);
          const normalized: WorkspaceDetails = {
            ...details,
            members: (details as any)?.members || (details as any)?.users || []
          };
          setWorkspaceDetails(normalized);
          // fetch my role (is_admin)
          try {
            const roleResp = await workspaceAPI.getMyWorkspaceRole(String(initialWorkspace.id));
            setIsAdmin(!!roleResp?.is_admin);
          } catch (e) { setIsAdmin(false); }
        } catch (detailsError) {
          console.warn('⚠️ Could not fetch workspace details:', detailsError);
          setWorkspaceDetails(initialWorkspace);
          setIsAdmin(false);
        }

        // Clean URL params after processing to avoid side effects
        try {
          if (joinedWorkspaceParam || params.get('skip_welcome')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('joined_workspace');
            url.searchParams.delete('skip_welcome');
            window.history.replaceState({}, '', url.toString());
          }
        } catch (e) {
          // ignore URL cleanup errors
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

  // Derive primary workspace from selectedWorkspaceId (fallback: first)
  const primaryWorkspace =
    (selectedWorkspaceId && workspaces.find(w => String(w.id) === String(selectedWorkspaceId))) ||
    (workspaces.length > 0 ? workspaces[0] : null);

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
    
    // Add other workspace members if available (support both `members` and `users`)
    const rawMembers = (workspaceDetails as any)?.members || (workspaceDetails as any)?.users || [];
    if (rawMembers && Array.isArray(rawMembers)) {
      rawMembers.forEach((member: any) => {
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

  const setSelectedWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    const key = lsKeyForUser(currentUser?.id);
    localStorage.setItem(key, String(workspaceId));
  };

  return {
    workspaces,
    primaryWorkspace,
    workspaceDetails,
    teamMembers: getTeamMembers(),
    isAdmin,
    loading,
    updating,
    error,
    refetch: fetchWorkspaces,
    updateWorkspace,
    selectedWorkspaceId,
    setSelectedWorkspace
  };
} 