import { apiConfig } from './apiConfig';

export interface PlanInfo {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  cosmetic_features: Record<string, any>;
  is_active: boolean;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  price: {
    id: string;
    product: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

export interface WorkspaceSubscriptionStatus {
  has_subscription: boolean;
  subscription: SubscriptionInfo | null;
  workspace_subscription_status: string;
  stripe_customer_id: string | null;
}

export interface CheckoutSessionRequest {
  workspace_id: string;
  price_id: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

class SubscriptionService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${apiConfig.baseUrl}${url}`, {
      ...options,
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('Access denied.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all available plans with full details
   */
  async getPlans(): Promise<PlanInfo[]> {
    try {
      const response = await this.fetchWithAuth('/api/plans/');
      return response.results || response || [];
    } catch (error) {
      console.error('❌ Failed to fetch plans:', error);
      throw error;
    }
  }

  /**
   * Get plan pricing information specifically
   */
  async getPlanPricing(): Promise<any[]> {
    try {
      const response = await this.fetchWithAuth('/api/plans/pricing/');
      return response.pricing || [];
    } catch (error) {
      console.error('❌ Failed to fetch plan pricing:', error);
      throw error;
    }
  }

  /**
   * Get plan details by name from database
   */
  async getPlanDetailsByName(planName: string): Promise<any | null> {
    try {
      // Use main plans API which includes stripe_price_id_monthly (pricing API doesn't!)
      const plans = await this.getPlans();
      return plans.find(plan => plan.plan_name === planName) || null;
    } catch (error) {
      console.error('❌ Failed to get plan details:', error);
      return null;
    }
  }

  /**
   * Get current subscription status for workspace
   */
  async getSubscriptionStatus(workspaceId: string): Promise<WorkspaceSubscriptionStatus> {
    try {
      return await this.fetchWithAuth(`/api/payments/workspaces/${workspaceId}/subscription/`);
    } catch (error) {
      console.error('❌ Failed to fetch subscription status:', error);
      throw error;
    }
  }

  /**
   * Create Stripe checkout session for plan change/subscription
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    try {
      const currentUrl = window.location.origin;
      const payload = {
        ...request,
        success_url: request.success_url || `${currentUrl}/dashboard/settings?tab=billing&success=true`,
        cancel_url: request.cancel_url || `${currentUrl}/dashboard/settings?tab=billing&cancelled=true`,
      };

      return await this.fetchWithAuth('/api/payments/stripe/create-checkout-session/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Change plan for an existing subscription (Stripe proration)
   */
  async changePlan(workspaceId: string, priceId: string, options?: {
    proration_behavior?: 'create_prorations' | 'always_invoice' | 'none';
    payment_behavior?: 'allow_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete' | 'default_incomplete';
  }): Promise<{ id: string; status: string; cancel_at_period_end: boolean; current_period_end: number; price_id: string; }> {
    try {
      const payload = {
        workspace_id: workspaceId,
        price_id: priceId,
        proration_behavior: options?.proration_behavior || 'create_prorations',
        payment_behavior: options?.payment_behavior || 'pending_if_incomplete',
      };

      return await this.fetchWithAuth('/api/payments/stripe/change-plan/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('❌ Failed to change plan:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(workspaceId: string): Promise<{ message: string; cancel_at: number }> {
    try {
      return await this.fetchWithAuth(`/api/payments/workspaces/${workspaceId}/subscription/cancel/`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Resume subscription (undo cancel_at_period_end)
   */
  async resumeSubscription(workspaceId: string): Promise<{ message: string; cancel_at_period_end: boolean; current_period_end: number; status: string; }> {
    try {
      return await this.fetchWithAuth(`/api/payments/workspaces/${workspaceId}/subscription/resume/`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ Failed to resume subscription:', error);
      throw error;
    }
  }

  /**
   * Create Stripe customer portal session (for advanced subscription management)
   */
  async createCustomerPortalSession(workspaceId: string): Promise<{ url: string }> {
    try {
      const currentUrl = window.location.origin;
      return await this.fetchWithAuth(`/api/payments/stripe/portal-session/`, {
        method: 'POST',
        body: JSON.stringify({
          return_url: `${currentUrl}/dashboard/settings?tab=billing`,
          workspace_id: workspaceId,
        }),
      });
    } catch (error) {
      console.error('❌ Failed to create customer portal session:', error);
      throw error;
    }
  }

  /**
   * Get current plan for workspace (from usage data)
   */
  getCurrentPlanFromUsage(usageData: any): string | null {
    return usageData?.workspace?.plan || null;
  }

  /**
   * Check if plan change is upgrade or downgrade
   */
  isUpgrade(currentPlan: string, targetPlan: string): boolean {
    const planHierarchy = { 'Start': 1, 'Pro': 2, 'Enterprise': 3 };
    const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
    const targetLevel = planHierarchy[targetPlan as keyof typeof planHierarchy] || 0;
    return targetLevel > currentLevel;
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number | string | null, currency: string = 'EUR'): string {
    if (amount === null || amount === undefined) return 'Custom';
    let n: number;
    if (typeof amount === 'string') {
      // Extract numeric part, accept both "," and "." decimals, strip symbols
      const cleaned = amount.replace(/[^0-9.,-]/g, '').replace(',', '.');
      n = Number.parseFloat(cleaned);
    } else {
      n = amount;
    }
    if (!Number.isFinite(n)) return 'Custom';
    try {
      return `${(n / 100).toFixed(0)}€`;
    } catch {
      return 'Custom';
    }
  }

  /**
   * Format subscription status for display
   */
  formatSubscriptionStatus(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
      active: { text: 'Active', color: 'green' },
      past_due: { text: 'Past Due', color: 'orange' },
      unpaid: { text: 'Unpaid', color: 'red' },
      cancelled: { text: 'Cancelled', color: 'gray' },
      none: { text: 'No Subscription', color: 'gray' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  }
}

export const subscriptionService = new SubscriptionService();