import { useState, useEffect } from 'react';
import { workspaceAPI } from '@/lib/apiService';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  avatar: string;
}

export function useTeamMembers(workspaceId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      
      // Try to fetch real team members
      try {
        const membersData = await workspaceAPI.getWorkspaceMembers(workspaceId);
        
        
        // Transform API data to our interface
        const transformedMembers: TeamMember[] = membersData.map((member: any) => ({
          id: member.id || member.user_id,
          name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
          email: member.email,
          role: member.role || 'User',
          status: member.is_active ? 'Aktiv' : 'Offline',
          lastActive: member.last_login ? `vor ${getTimeAgo(member.last_login)}` : 'Unbekannt',
          avatar: `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
        }));
        
        setMembers(transformedMembers);
      } catch (apiError) {
        console.warn('⚠️ Team members API not available, using mock data:', apiError);
        
        // Fallback to mock data if API is not available
        const mockMembers: TeamMember[] = [
          {
            id: "current_user",
            name: "Aktueller User", 
            email: "current@example.com",
            role: "Admin",
            status: "Aktiv",
            lastActive: "jetzt",
            avatar: "AU",
          }
        ];
        
        setMembers(mockMembers);
      }
    } catch (err) {
      console.error("[ERROR]:", error);
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

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

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  };
} 