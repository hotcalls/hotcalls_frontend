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

export interface SubscriptionInfo {
  has_subscription: boolean;
  workspace_subscription_status: string;
  stripe_customer_id: string | null;
  id: string | null;
  status: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: number | null;
  current_period_end: number | null;
  trial_end: number | null;
  created: number | null;
  days_until_expiry: number | null;
}

export interface AccessStatus {
  features_available: boolean;
  expires_in_days: number | null;
  expiry_message: string | null;
}

export interface UsageStatus {
  workspace: WorkspaceInfo;
  billing_period: BillingPeriod | null;
  features: Record<string, FeatureUsage>;
  cosmetic_features?: Record<string, any>;
  subscription?: SubscriptionInfo;
  access_status?: AccessStatus;
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
  subscription?: {
    has_subscription: boolean;
    workspace_subscription_status: string;
    stripe_customer_id: string | null;
    id: string | null;
    status: string | null;
    cancel_at_period_end: boolean | null;
    canceled_at: number | null;
    current_period_end: number | null;
    trial_end: number | null;
    created: number | null;
    days_until_expiry: number | null;
  };
  access_status?: {
    features_available: boolean;
    expires_in_days: number | null;
    expiry_message: string | null;
  };
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
      
      
      
      
      
      const result = {
        workspace: {
          id: data.workspace.id,
          name: data.workspace.name,
          plan: data.workspace.plan,
        },
        billing_period: data.billing_period,
        features: data.features,
        cosmetic_features: data.cosmetic_features,
        subscription: data.subscription,
        access_status: data.access_status,
      };
      
      
      
      
      return result;

    } catch (error) {
      console.error("[ERROR]:", error);
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
    const unit = this.translateUnit(featureUsage.unit);
    if (featureUsage.unlimited) {
      return `${featureUsage.used} ${unit} (Unlimited)`;
    }
    
    return `${featureUsage.used} / ${featureUsage.limit || 0} ${unit}`;
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

  /**
   * Check if subscription is cancelled
   */
  isSubscriptionCancelled(usageStatus: UsageStatus): boolean {
    return usageStatus.subscription?.cancel_at_period_end === true;
  }

  /**
   * Check if subscription is on trial
   */
  isOnTrial(usageStatus: UsageStatus): boolean {
    return usageStatus.subscription?.workspace_subscription_status === 'trial';
  }

  /**
   * Get subscription status display info
   */
  getSubscriptionStatusDisplay(usageStatus: UsageStatus): { text: string; color: string; showAlert: boolean } {
    const subscription = usageStatus.subscription;

    if (!subscription) {
      return { text: 'Kein Abonnement', color: 'gray', showAlert: false };
    }

    const isTrialing = this.isOnTrial(usageStatus);
    const isCancelled = this.isSubscriptionCancelled(usageStatus);

    if (isTrialing && isCancelled) {
      return { text: 'Testversion Gekündigt', color: 'orange', showAlert: true };
    }

    if (isTrialing) {
      return { text: 'Testversion Aktiv', color: 'blue', showAlert: false };
    }

    if (isCancelled) {
      return { text: 'GEKÜNDIGT', color: 'red', showAlert: true };
    }

    if (subscription.status === 'active') {
      return { text: 'Aktiv', color: 'green', showAlert: false };
    }

    return { text: subscription.status || 'Unbekannt', color: 'gray', showAlert: false };
  }

  /**
   * Get trial end date if applicable
   */
  getTrialEndDate(usageStatus: UsageStatus): Date | null {
    const trialEnd = usageStatus.subscription?.trial_end;
    return trialEnd ? new Date(trialEnd * 1000) : null;
  }
}

// Helper: translate backend unit labels to German display
// Keep it minimal per request: only adjust minute → Minuten
;(UsageService.prototype as any).translateUnit = function(unit: string): string {
  const u = (unit || '').toLowerCase();
  if (u === 'minute' || u === 'minutes' || u === 'min' || u === 'mins' || u === 'call_minutes') {
    return 'Minuten';
  }
  return unit;
};

export const usageService = new UsageService();