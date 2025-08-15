import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { workspaceAPI } from '@/lib/apiService';
import { usageService } from '@/lib/usageService';

export function UsageAlertOverlay() {
  const [visible, setVisible] = useState(false);
  const [threshold, setThreshold] = useState<75 | 90 | null>(null);
  const [dismissKey, setDismissKey] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const workspaces = await workspaceAPI.getMyWorkspaces();
        if (!workspaces || workspaces.length === 0) return;
        const primary = workspaces[0];

        const usage = await usageService.getUsageStatus(primary.id);
        const call = usage.features?.['call_minutes'];
        const periodEnd = usage.billing_period?.end || 'unknown';
        if (!call || call.unlimited || !call.limit || call.limit <= 0) return;

        const ratio = call.limit > 0 ? call.used / call.limit : 0;
        const reached: 75 | 90 | null = ratio >= 0.9 ? 90 : ratio >= 0.75 ? 75 : null;
        if (!reached) return;

        const key = `usageAlertDismissed:${primary.id}:${periodEnd}:${reached}`;
        if (localStorage.getItem(key) === '1') return;

        setThreshold(reached);
        setDismissKey(key);
        setVisible(true);
      } catch (_) {
        // Silent fail - do not block UI
      }
    };
    run();
  }, []);

  if (!visible || !threshold) return null;

  const onDismiss = () => {
    if (dismissKey) localStorage.setItem(dismissKey, '1');
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute bottom-6 right-6 pointer-events-auto max-w-sm w-[360px] rounded-xl shadow-2xl border border-orange-200 bg-white">
        <div className="px-4 py-3 rounded-t-xl bg-gradient-to-r from-[#FE5B25] to-orange-400 text-white">
          <div className="text-sm font-semibold">Nutzungs-Hinweis</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-800">
            Du hast {threshold}% deines Minutenkontingents verbraucht. Sichere dir zusätzliche Minuten – jetzt Plan upgraden.
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              className="bg-[#FE5B25] hover:bg-[#e65422] text-white"
              onClick={() => (window.location.href = '/plans')}
            >
              Jetzt upgraden
            </Button>
            <Button variant="outline" onClick={onDismiss}>Schließen</Button>
          </div>
        </div>
      </div>
    </div>
  );
}


