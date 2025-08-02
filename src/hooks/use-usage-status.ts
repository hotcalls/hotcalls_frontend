import { useState, useEffect, useCallback } from 'react';
import { usageService, UsageStatus } from '@/lib/usageService';
import { useToast } from '@/hooks/use-toast';

interface UseUsageStatusOptions {
  /**
   * Auto-refresh interval in minutes (default: 5)
   */
  refreshInterval?: number;
  /**
   * Enable auto-refresh (default: true)
   */
  autoRefresh?: boolean;
  /**
   * Show toast notifications on error (default: false)
   */
  showErrorToasts?: boolean;
}

interface UseUsageStatusReturn {
  usage: UsageStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useUsageStatus(
  workspaceId: string | null,
  options: UseUsageStatusOptions = {}
): UseUsageStatusReturn {
  const {
    refreshInterval = 5,
    autoRefresh = true,
    showErrorToasts = false,
  } = options;

  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchUsage = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      setError('No workspace selected');
      return;
    }

    try {
      setError(null);
      console.log(`🔍 Fetching usage for workspace: ${workspaceId}`);
      
      const usageData = await usageService.getUsageStatus(workspaceId);
      setUsage(usageData);
      setLastUpdated(new Date());
      
      console.log('✅ Usage data loaded:', {
        plan: usageData.workspace.plan,
        callMinutes: usageData.features.call_minutes,
        billingPeriod: usageData.billing_period,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load usage data';
      console.error('❌ Usage fetch error:', err);
      
      setError(errorMessage);
      
      if (showErrorToasts) {
        toast({
          title: 'Usage Data Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, showErrorToasts, toast]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchUsage();
  }, [fetchUsage]);

  // Initial fetch
  useEffect(() => {
    if (workspaceId) {
      fetchUsage();
    } else {
      setLoading(false);
      setUsage(null);
      setError(null);
    }
  }, [fetchUsage, workspaceId]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh || !workspaceId) return;

    const interval = setInterval(() => {
      console.log(`🔄 Auto-refreshing usage data for workspace: ${workspaceId}`);
      fetchUsage();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, workspaceId, fetchUsage]);

  return {
    usage,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}

/**
 * Hook specifically for call minutes usage (most common use case)
 */
export function useCallMinutesUsage(workspaceId: string | null) {
  const { usage, loading, error, refresh } = useUsageStatus(workspaceId, {
    autoRefresh: true,
    refreshInterval: 5,
    showErrorToasts: false,
  });

  const callMinutes = usage ? usageService.getCallMinutesUsage(usage) : null;
  
  return {
    callMinutes,
    loading,
    error,
    refresh,
    // Convenience methods
    isNearingLimit: callMinutes ? usageService.isNearingLimit(callMinutes) : false,
    isOverLimit: callMinutes ? usageService.isOverLimit(callMinutes) : false,
    usageColor: callMinutes ? usageService.getUsageStatusColor(callMinutes) : 'gray',
    displayText: callMinutes ? usageService.formatUsageDisplay(callMinutes) : 'Loading...',
    percentage: callMinutes ? usageService.formatPercentage(callMinutes) : '0%',
  };
}

/**
 * Hook for all feature usage (for settings page)
 */
export function useAllFeaturesUsage(workspaceId: string | null) {
  const { usage, loading, error, refresh, lastUpdated } = useUsageStatus(workspaceId, {
    autoRefresh: true,
    refreshInterval: 5,
    showErrorToasts: true, // Show errors in settings
  });

  // Transform features for easier consumption
  const features = usage ? Object.entries(usage.features).map(([name, feature]) => ({
    name,
    ...feature,
    isNearingLimit: usageService.isNearingLimit(feature),
    isOverLimit: usageService.isOverLimit(feature),
    statusColor: usageService.getUsageStatusColor(feature),
    displayText: usageService.formatUsageDisplay(feature),
    percentageText: usageService.formatPercentage(feature),
  })) : [];

  return {
    usage,
    features,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}