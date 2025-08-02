import { apiConfig } from './apiConfig';

export interface WorkspaceInfo {
  id: string;
  name: string;
  plan: string | null;
}

export interface BillingPeriod {
  start: string | null;
  end: string | null;
  days_remaining: number | null;
}

export interface FeatureUsage {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  percentage_used: number | null;
  unit: string;
}

export interface UsageStatus {
  workspace: WorkspaceInfo;
  billing_period: BillingPeriod | null;
  features: Record<string, FeatureUsage>;
  cosmetic_features?: Record<string, any>;
}

export interface UsageAPIResponse {
  workspace: {
    id: string;
    name: string;
    plan: string | null;
  };
  billing_period: {
    start: string | null;
    end: string | null;
    days_remaining: number | null;
  } | null;
  features: Record<string, {
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    percentage_used: number | null;
    unit: string;
  }>;
  cosmetic_features?: Record<string, any>;
}

class UsageService {
  /**
   * Get comprehensive usage status for a workspace
   */
  async getUsageStatus(workspaceId: string): Promise<UsageStatus> {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    try {
      const response = await fetch(
        `${apiConfig.baseUrl}/api/payments/workspaces/${workspaceId}/usage/`,
        {
          headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You are not a member of this workspace.');
        }
        if (response.status === 404) {
          throw new Error('Workspace not found.');
        }
        throw new Error(`Failed to fetch usage data: ${response.status}`);
      }

      const data: UsageAPIResponse = await response.json();
      
      console.log('🔍 Raw API response data:', data);
      console.log('🔍 Workspace data from API:', data.workspace);
      console.log('🔍 Plan from API:', data.workspace.plan);
      
      const result = {
        workspace: {
          id: data.workspace.id,
          name: data.workspace.name,
          plan: data.workspace.plan,
        },
        billing_period: data.billing_period,
        features: data.features,
        cosmetic_features: data.cosmetic_features,
      };
      
      console.log('🔍 Processed result:', result);
      console.log('🔍 Result workspace plan:', result.workspace.plan);
      
      return result;

    } catch (error) {
      console.error('❌ Usage Service Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch usage data');
    }
  }

  /**
   * Get usage for a specific feature
   */
  getFeatureUsage(usageStatus: UsageStatus, featureName: string): FeatureUsage | null {
    return usageStatus.features[featureName] || null;
  }

  /**
   * Get call minutes usage specifically (most important metric)
   */
  getCallMinutesUsage(usageStatus: UsageStatus) {
    return this.getFeatureUsage(usageStatus, 'call_minutes');
  }

  /**
   * Check if feature is nearing limit (80%+ usage)
   * FIXED: Don't show warnings for capacity limits (max_users, max_agents) at 100%
   */
  isNearingLimit(featureUsage: FeatureUsage): boolean {
    if (featureUsage.unlimited || !featureUsage.percentage_used) {
      return false;
    }
    
    // For capacity limits like max_users/max_agents, 100% is normal and expected
    // Only show warnings for consumable resources like call_minutes
    if (featureUsage.unit === 'general_unit' && featureUsage.percentage_used === 100) {
      return false; // 100% capacity usage is normal, not a warning
    }
    
    return featureUsage.percentage_used >= 80;
  }

  /**
   * Check if feature is over limit
   */
  isOverLimit(featureUsage: FeatureUsage): boolean {
    if (featureUsage.unlimited || !featureUsage.percentage_used) {
      return false;
    }
    return featureUsage.percentage_used > 100;
  }

  /**
   * Get usage status color for UI
   */
  getUsageStatusColor(featureUsage: FeatureUsage): string {
    if (featureUsage.unlimited) return 'green';
    if (!featureUsage.percentage_used) return 'gray';
    
    if (featureUsage.percentage_used > 100) return 'red';
    if (featureUsage.percentage_used >= 85) return 'orange';
    if (featureUsage.percentage_used >= 60) return 'yellow';
    return 'green';
  }

  /**
   * Format usage display string
   */
  formatUsageDisplay(featureUsage: FeatureUsage): string {
    if (featureUsage.unlimited) {
      return `${featureUsage.used} ${featureUsage.unit} (Unlimited)`;
    }
    
    return `${featureUsage.used} / ${featureUsage.limit || 0} ${featureUsage.unit}`;
  }

  /**
   * Format percentage for display
   * FIXED: Remove infinity symbols since backend now correctly returns unlimited: false
   */
  formatPercentage(featureUsage: FeatureUsage): string {
    if (featureUsage.unlimited) {
      return '∞';
    }
    if (!featureUsage.percentage_used) {
      return '0%';
    }
    return `${Math.round(featureUsage.percentage_used)}%`;
  }
}

export const usageService = new UsageService();