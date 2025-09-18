import { Check, CreditCard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

type WelcomePlan = {
  id: string;
  name: string;
  price_monthly: number | null; // euros or null for Enterprise
  price_prefix?: string; // e.g. "ab "
  price_suffix?: string; // e.g. "im Monat"
  description?: string;
  features?: string[];
  is_popular?: boolean;
  is_contact?: boolean;
};

type Props = {
  plans: WelcomePlan[];
  currentPlanName: string | null;
  onSelect: (plan: WelcomePlan) => void;
};

export default function WelcomePlanCards({ plans, currentPlanName, onSelect }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 px-2">
      {plans.map((plan, index) => {
        const isPopular = !!plan.is_popular;
        const isContact = !!plan.is_contact;
        const isActive = currentPlanName && plan.name === currentPlanName;

        return (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 hover:border-[#FE5B25] transition-all ${
              isPopular ? 'border-[#FE5B25] bg-white relative shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  {isPopular && (
                    <span className="border border-[#FE5B25] text-[#FE5B25] bg-white text-[10px] px-2 py-0.5 rounded-md">
                      Am beliebtesten
                    </span>
                  )}
                  {isActive && (
                    <span className="ml-2 border border-green-600 text-green-700 bg-white text-[10px] px-2 py-0.5 rounded-md">
                      Aktiver Plan
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {plan.price_monthly !== null
                    ? `${plan.price_prefix || ''}${(plan.price_monthly as number).toLocaleString('de-DE')}€`
                    : 'Individuell'}
                </div>
                <p className="text-xs text-gray-500">
                  {plan.price_monthly !== null ? (plan.price_suffix || '/Monat') : 'Preis auf Anfrage'}
                </p>
              </div>
              {plan.features && plan.features.length > 0 && (
                <div>
                  {index > 0 && plan.features[0]?.includes('Features plus:') && (
                    <p className="text-xs font-medium text-gray-700 mb-2">{plan.features[0]}</p>
                  )}
                  <ul className="space-y-2 text-xs">
                    {plan.features
                      .slice(index > 0 && plan.features[0]?.includes('Features plus:') ? 1 : 0)
                      .map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-4 w-4 text-[#FE5B25] flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <Button
                className={`w-full focus:ring-0 focus:ring-offset-0 text-sm ${
                  isContact ? 'bg-[#FE5B25] hover:bg-[#fe5b25]/90 text-white' : 'bg-[#FE5B25] hover:bg-[#fe5b25]/90 text-white'
                }`}
                onClick={() => onSelect(plan)}
                disabled={isActive && !isContact}
              >
                {isContact ? (
                  <>
                    <Phone className="mr-2 h-4 w-4" /> Mit uns sprechen
                  </>
                ) : isActive ? (
                  <>Aktiver Plan</>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" /> Auswählen
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}