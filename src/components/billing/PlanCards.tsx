import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/lib/buttonStyles";
import type { PlanInfo } from "@/lib/subscriptionService";

type Props = {
  plans: PlanInfo[];
  currentPlanName: string | null;
  onUpgrade: (plan: PlanInfo) => void;
};

function formatMonthly(price: number | null) {
  if (price === null) return "Individuell";
  // price in cents from API; display in €/Monat if value looks like cents
  const euro = price >= 1000 ? (price / 100).toFixed(2) : price.toFixed(2);
  return `${euro}€/Monat`;
}

function renderLimits(plan: PlanInfo) {
  const cf = plan.cosmetic_features || {} as any;
  const name = (plan as any).plan_name || (plan as any).name || plan.name;
  // Limits are derived from backend plan features; some UIs may not have them directly in PlanInfo.
  // We display cosmetic flags (for visuals) and rely on page to show minutes elsewhere.
  const rows: string[] = [];
  if (name === 'Start') {
    rows.push('250 Minuten inkl.');
    rows.push('Max 3 Nutzer');
    rows.push('Max 1 Agent');
    rows.push('1 Funnel');
    rows.push('0,49€/Min Überverbrauch');
  } else if (name === 'Pro') {
    rows.push('1000 Minuten inkl.');
    rows.push('Max 5 Nutzer');
    rows.push('Max 3 Agents');
    rows.push('3 Funnels');
    rows.push('0,29€/Min Überverbrauch');
  } else {
    rows.push('Unbegrenzte Minuten');
    rows.push('Unbegrenzte Nutzer & Agents');
    rows.push('Unbegrenzte Funnels');
    rows.push('Priority Support');
  }
  return (
    <ul className="mt-3 text-sm text-gray-600 space-y-1">
      {rows.map((t, i) => (<li key={i}>• {t}</li>))}
      {/* Cosmetic badges (minimal) */}
      <li className="mt-2 flex gap-2 flex-wrap">
        {cf.crm_integrations && <Badge variant="secondary">CRM</Badge>}
        {cf.advanced_analytics && <Badge variant="secondary">Analytics</Badge>}
        {cf.whitelabel_solution && <Badge variant="secondary">Whitelabel</Badge>}
      </li>
    </ul>
  );
}

export default function PlanCards({ plans, currentPlanName, onUpgrade }: Props) {
  const sorted = [...plans].sort((a,b)=>{
    const order: Record<string,number> = { 'Start': 1, 'Pro': 2, 'Enterprise': 3 };
    const an = ((a as any).plan_name || (a as any).name || a.name) as string;
    const bn = ((b as any).plan_name || (b as any).name || b.name) as string;
    return (order[an]||99)-(order[bn]||99);
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {sorted.map((plan) => {
        const name = ((plan as any).plan_name || (plan as any).name || plan.name) as string;
        const isCurrent = currentPlanName && name === currentPlanName;
        const isEnterprise = name === 'Enterprise';
        const price = isEnterprise ? null : (plan.price_monthly ?? null);

        return (
          <Card key={name} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{name}</CardTitle>
                {isCurrent && <Badge>Aktiv</Badge>}
              </div>
              <div className="text-2xl font-semibold mt-2">
                {formatMonthly(price)}
              </div>
            </CardHeader>
            <CardContent>
              {renderLimits(plan)}
              <div className="mt-4">
                {isEnterprise ? (
                  <button className={buttonStyles.secondary.default} disabled={false}
                    onClick={() => onUpgrade(plan)}>
                    Kontakt / Portal
                  </button>
                ) : isCurrent ? (
                  <button className={buttonStyles.secondary.default} disabled>
                    Aktiver Plan
                  </button>
                ) : (
                  <button className={buttonStyles.create.default} onClick={() => onUpgrade(plan)}>
                    Upgrade
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


