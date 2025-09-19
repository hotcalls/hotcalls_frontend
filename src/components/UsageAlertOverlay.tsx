import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { workspaceAPI } from '@/lib/apiService';
import { useWorkspace } from '@/hooks/use-workspace';
import { usageService } from '@/lib/usageService';

export function UsageAlertOverlay() {
  const { isAdmin } = useWorkspace();
  const [visible, setVisible] = useState(false);
  const [threshold, setThreshold] = useState<75 | 90 | null>(null);
  const [dismissKey, setDismissKey] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'usage' | 'subscription'>('usage');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{text: string; color: string; showAlert: boolean} | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);

  useEffect(() => {
    // Only admins should see usage/billing nudges
    if (!isAdmin) return;
    const run = async () => {
      try {
        const workspaces = await workspaceAPI.getMyWorkspaces();
        if (!workspaces || workspaces.length === 0) return;
        const primary = workspaces[0];

        const usage = await usageService.getUsageStatus(primary.id);
        const call = usage.features?.['call_minutes'];
        const periodEnd = usage.billing_period?.end || 'unknown';

        // Check subscription status first (higher priority)
        const subStatus = usageService.getSubscriptionStatusDisplay(usage);
        if (subStatus.showAlert) {
          const subKey = `subscriptionAlertDismissed:${primary.id}:${usage.subscription?.id || 'none'}:cancelled`;
          if (localStorage.getItem(subKey) !== '1') {
            setSubscriptionStatus(subStatus);
            setTrialEndDate(usageService.getTrialEndDate(usage));
            setAlertType('subscription');
            setDismissKey(subKey);
            setVisible(true);
            return;
          }
        }

        // Check usage threshold if no subscription alerts
        if (!call || call.unlimited || !call.limit || call.limit <= 0) return;

        const ratio = call.limit > 0 ? call.used / call.limit : 0;
        const reached: 75 | 90 | null = ratio >= 0.9 ? 90 : ratio >= 0.75 ? 75 : null;
        if (!reached) return;

        const key = `usageAlertDismissed:${primary.id}:${periodEnd}:${reached}`;
        if (localStorage.getItem(key) === '1') return;

        setThreshold(reached);
        setAlertType('usage');
        setDismissKey(key);
        setVisible(true);
      } catch (_) {
        // Silent fail - do not block UI
      }
    };
    run();
  }, [isAdmin]);

  if (!isAdmin || !visible) return null;

  const onDismiss = () => {
    if (dismissKey) localStorage.setItem(dismissKey, '1');
    setVisible(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getBorderColor = () => {
    if (alertType === 'subscription' && subscriptionStatus?.color === 'orange') {
      return 'border-orange-500';
    }
    return 'border-[#3d5097]';
  };

  const getHeaderColor = () => {
    if (alertType === 'subscription' && subscriptionStatus?.color === 'orange') {
      return 'from-orange-500 to-orange-500';
    }
    return 'from-[#3d5097] to-[#3d5097]';
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className={`absolute bottom-6 right-6 pointer-events-auto max-w-sm w-[360px] rounded-xl shadow-2xl border ${getBorderColor()} bg-white`}>
        <div className={`px-4 py-3 rounded-t-xl bg-gradient-to-r ${getHeaderColor()} text-white`}>
          <div className="text-sm font-semibold">
            {alertType === 'subscription' ? 'Abonnement-Hinweis' : 'Nutzungs-Hinweis'}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {alertType === 'subscription' ? (
            <div className="text-sm text-gray-800">
              <div className="font-medium mb-2">Dein Trial wurde gekündigt</div>
              {trialEndDate && (
                <div className="text-xs text-gray-600 mb-2">
                  Trial endet am: {formatDate(trialEndDate)}
                </div>
              )}
              <div>
                Möchtest du weitermachen? Wähle einen Plan aus oder dein Zugang läuft ab.
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-800">
              Du hast {threshold}% deines Minutenkontingents verbraucht. Sichere dir zusätzliche Minuten – jetzt Plan upgraden.
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button
              className="bg-[#3d5097] hover:bg-[#3d5097] text-white"
              onClick={() => (window.location.href = '/plans')}
            >
              {alertType === 'subscription' ? 'Plan wählen' : 'Jetzt upgraden'}
            </Button>
            <Button variant="outline" onClick={onDismiss}>Schließen</Button>
          </div>
        </div>
      </div>
    </div>
  );
}


