import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Phone, ArrowLeft, MessageCircle, Loader2, AlertTriangle, Crown, Building, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { subscriptionService, PlanInfo, WorkspaceSubscriptionStatus } from "@/lib/subscriptionService";
import { useAllFeaturesUsage } from "@/hooks/use-usage-status";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

export default function Plans() {
  const navigate = useNavigate();
  const { isAdmin, primaryWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { usage } = useAllFeaturesUsage(primaryWorkspace?.id || null);
  
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<WorkspaceSubscriptionStatus | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const isProcessing = processingPlan !== null;
  
  // Get current plan from usage data
  const currentPlan = usage?.workspace?.plan || null;

  // Redirect non-admins away from this page
  useEffect(() => {
    if (isAdmin === false) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Load plans and subscription status
  useEffect(() => {
    const loadData = async () => {
      if (!primaryWorkspace?.id) return;

      try {
        setIsLoadingPlans(true);
        setIsLoadingSubscription(true);
        
        const [plansData, subStatus] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getSubscriptionStatus(primaryWorkspace.id),
        ]);
        
        setPlans(plansData);
        setSubscriptionStatus(subStatus);
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        toast({
          title: "Error loading plans",
          description: error instanceof Error ? error.message : "Failed to load plan information",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPlans(false);
        setIsLoadingSubscription(false);
      }
    };

    loadData();
  }, [primaryWorkspace?.id, toast]);

  const handlePlanChange = async (plan: PlanInfo) => {
    if (!primaryWorkspace?.id || !plan.stripe_price_id_monthly) {
      toast({
        title: "Unable to process",
        description: "Plan switching is not available for this plan",
        variant: "destructive",
      });
      return;
    }

    setProcessingPlan(plan.id);
    
    try {
      console.log('🔄 Creating checkout session for plan:', plan.name);
      
      const checkoutSession = await subscriptionService.createCheckoutSession({
        workspace_id: primaryWorkspace.id,
        price_id: plan.stripe_price_id_monthly,
      });
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.checkout_url;
      
    } catch (error) {
      console.error('❌ Plan change failed:', error);
      toast({
        title: "Plan change failed",
        description: error instanceof Error ? error.message : "Unable to process plan change",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!primaryWorkspace?.id || !subscriptionStatus?.has_subscription) return;

    try {
      console.log('🚫 Cancelling subscription...');
      
      const result = await subscriptionService.cancelSubscription(primaryWorkspace.id);
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription will be cancelled at the end of the billing period",
      });
      
      // Refresh subscription status
      const newStatus = await subscriptionService.getSubscriptionStatus(primaryWorkspace.id);
      setSubscriptionStatus(newStatus);
      
    } catch (error) {
      console.error('❌ Cancellation failed:', error);
      toast({
        title: "Cancellation failed", 
        description: error instanceof Error ? error.message : "Unable to cancel subscription",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header */}
      <div className="space-y-4 mb-6">
        <button 
          className={buttonStyles.navigation.back}
          onClick={() => navigate('/settings?tab=billing')}
        >
          <ArrowLeft className={iconSizes.small} />
          <span>Zurück</span>
        </button>
        <div>
          <h1 className={textStyles.pageTitle}>Pläne</h1>
          <p className={textStyles.pageSubtitle}>Wähle den passenden Plan für dein Business</p>
        </div>
      </div>

      {/* Plan Cards - OBEN */}
      <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
        {/* Start Plan */}
        <Card className="relative border-2 border-gray-200 hover:border-gray-300 transition-all">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-left">Start</h3>
              <p className="text-sm text-gray-500 mb-6 text-left">
                Ideal für Einzelpersonen und kleine Teams, die sofort mit KI-Anrufen starten wollen.
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-1 text-left">199€</div>
              <p className="text-sm text-gray-500 text-left">/Monat</p>
            </div>
            
            <ul className="space-y-3 text-sm text-left">
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                <span>Inkl. 250 Minuten, dann 0,49€/Min.</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                <span>Unbegrenzte Anzahl an Agenten</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                <span>Automatisierte KI-Telefonate</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                <span>Anbindung von Leadfunnels</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                <span>Kalenderintegration</span>
              </li>
            </ul>

            <div className="pt-4">
              <p className="text-xs text-gray-500 mb-4">
                Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 text-[#FE5B25] border-[#FE5B25] hover:bg-[#FEF5F1]"
                onClick={() => {
                  const startPlan = plans.find(p => p.plan_name === "Start");
                  if (startPlan) handlePlanChange(startPlan);
                }}
                disabled={processingPlan === "start"}
              >
                {isProcessing ? "Wechsle..." : "14 Tage kostenlos testen"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-[#FE5B25] bg-[#FEF5F1] shadow-lg scale-105">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900 text-left">Pro</h3>
                <span className="border border-[#FE5B25] text-[#FE5B25] bg-white text-xs px-2 py-1 rounded-md">
                  Am beliebtesten
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-6 text-left">
                Ideal für Unternehmen, die mehr Minuten, Integrationen und persönliches Onboarding benötigen.
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-1 text-left">549€</div>
              <p className="text-sm text-gray-500 text-left">/Monat</p>
            </div>
            
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 mb-3">Alle Start-Features plus:</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>Inkl. 1000 Minuten, dann 0,29€/Min.</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>CSV-Upload</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>CRM Integration</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>Persönliches Onboarding</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500 mb-4">
                Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
              </p>
              {currentPlan === "Pro" ? (
                <Button className="w-full h-12 bg-[#FE5B25] hover:bg-[#E5501F] text-white" disabled>
                  Aktueller Plan
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 bg-[#FE5B25] hover:bg-[#E5501F] text-white"
                  onClick={() => {
                    const proPlan = plans.find(p => (p as any).plan_name === "Pro");
                    if (proPlan) handlePlanChange(proPlan);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Wechsle..." : "14 Tage kostenlos testen"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scale Plan */}
        <Card className="relative border-2 border-gray-200 hover:border-gray-300 transition-all">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-left">Scale</h3>
              <p className="text-sm text-gray-500 mb-6 text-left">
                Ideal für Unternehmen mit spezifischen Anforderungen und hohem Volumen.
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-1 text-left">ab 1.490€</div>
              <p className="text-sm text-gray-500 text-left">/Monat <span className="text-xs">+ Setupfee</span></p>
            </div>
            
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 mb-3">Alle Pro-Features plus:</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>Individuelle Minutenpreise</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>Individuelle Integrationen & Funktionen</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                  <span>Priorisierter Support</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500 mb-4">
                Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 text-[#FE5B25] border-[#FE5B25] hover:bg-[#FEF5F1]"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Gespräch vereinbaren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Note */}
      <div className="text-center text-sm text-gray-500 mb-8">
        Alle Preise zzgl. MwSt.
      </div>

      {/* Detaillierte Vergleichstabelle - DARUNTER */}
      <Card>
        <CardHeader>
          <CardTitle className={textStyles.sectionTitle}>Detaillierter Funktionsvergleich</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
                             <thead>
                 <tr className="border-b">
                   <th className="text-left p-4 font-medium">Feature</th>
                   <th className="text-center p-4 font-medium">Start</th>
                   <th className="text-center p-4 font-medium bg-[#FEF5F1]">Pro</th>
                   <th className="text-center p-4 font-medium">Scale</th>
                 </tr>
               </thead>
              <tbody>
                {/* Preismodelle */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>Preismodelle</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Monatliche Gebühr</td>
                  <td className="text-center p-4">199€</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">549€</td>
                  <td className="text-center p-4">ab 1490€</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Inkludierte Minuten pro Monat</td>
                  <td className="text-center p-4">250</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">1000</td>
                  <td className="text-center p-4">Individuell</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Extra Minuten</td>
                  <td className="text-center p-4">ab 0,49€/Min.</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">ab 0,29€/Min.</td>
                  <td className="text-center p-4">Individuell</td>
                </tr>
                
                {/* Nutzer & Agenten */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>Nutzer & Agenten</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Max User</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">5</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Max aktive Agenten</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">12</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>

                {/* KI-Agenten & Logik */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>KI-Agenten & Logik</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Sofortanruf bei neuen Leads</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Verhalten des Agenten anpassbar</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Terminbuchung mit Lead</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Smarte Anruflogik</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>

                {/* Appfunktionen */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>Appfunktionen</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Anrufhistorie einsehen</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Analytics & Gesprächsauswertung</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Wissensdatenbank</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>

                {/* Integrationen */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>Integrationen</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Kalenderanbindung</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">CSV Upload</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Individuelle Systemanbindungen</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">Auf Anfrage</td>
                  <td className="text-center p-4">Auf Anfrage</td>
                </tr>

                {/* Service & Support */}
                <tr>
                  <td className="p-4 font-bold text-gray-900" colSpan={4}>Service & Support</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Chat-Support</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Onboarding</td>
                  <td className="text-center p-4">Eigenständig</td>
                  <td className="text-center p-4 bg-[#FEF5F1]">Erste 30 Tage</td>
                  <td className="text-center p-4">Inbegriffen</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Unterstützung bei Agentenkonfiguration</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 