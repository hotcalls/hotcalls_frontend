import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { User, Building, CreditCard, Check, Phone, Users, Plus, Trash2, Settings as SettingsIcon, Clock, AlertTriangle, Calendar, Infinity, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAllFeaturesUsage } from "@/hooks/use-usage-status";
import { subscriptionService } from "@/lib/subscriptionService";
import { paymentAPI, workspaceAPI, plansAPI } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/lib/apiConfig";
import WelcomePlanCards from "@/components/billing/WelcomePlanCards";

// Minute packages will be loaded dynamically from database via @core module

// Note: Plan and usage data are now loaded via API hooks

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const SHOW_BILLING = false; // Hide Plans & Balance
  
  const [changingPlan, setChangingPlan] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  // Load workspace and usage data
  const { primaryWorkspace, workspaceDetails, teamMembers, isAdmin, loading: workspaceLoading, updating: isUpdatingWorkspace, updateWorkspace, refetch } = useWorkspace();
  const { usage, features, loading: usageLoading, error: usageError, lastUpdated } = useAllFeaturesUsage(primaryWorkspace?.id || null);
  const { profile, loading: profileLoading, updating: isSavingProfile, updateProfile, getDisplayName, getInitials } = useUserProfile();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<null | { type: 'make_admin' | 'remove_user'; member: any }>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Non-admins can also view the billing tab now
  
  // Generate current plan data from API
  const callMinutesFeature = features.find(f => f.name === 'call_minutes');
  const maxUsersFeature = features.find(f => f.name === 'max_users');
  const maxAgentsFeature = features.find(f => f.name === 'max_agents');
  const usedUsers = maxUsersFeature?.used || 0;
  const limitUsers = maxUsersFeature?.limit || null;
  const isAtUserLimit = !!limitUsers && usedUsers >= (limitUsers as number);
  
  // State for plan details from API
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loadingPlanDetails, setLoadingPlanDetails] = useState(false);

  // Load all available plans for PlanCards (Welcome-Flow Stil)
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    // Prevent navigating to hidden billing tab via URL
    if (!SHOW_BILLING && activeTab === 'billing') {
      setActiveTab('account');
    }
  }, [activeTab]);

  useEffect(() => {
    // Lade einmalig, wenn Billing-Tab aktiv wird
    if (availablePlans.length > 0) return;
    if (activeTab !== 'billing') return;
    (async () => {
      try {
        setLoadingPlans(true);
        console.log('📋 Loading plans for Settings Billing tab...');
        // Nutze denselben Weg wie im Welcome-Flow (plansAPI)
        const response = await plansAPI.getPlans();
        let list = Array.isArray(response) ? response : (response?.results || []);
        // Enterprise Karte hart kodieren (ab 1.290€/Monat) mit gewünschten Features
        const enterpriseCard = {
          plan_name: 'Enterprise',
          name: 'Enterprise',
          id: 'enterprise',
          price_monthly: null,
          description: 'Individuelle Lösungen für große Unternehmen',
          features: [],
          _custom_features: [
            'Individuelle Preiskonditionen',
            'CSV Upload',
            'Voice Cloning',
            'White Labeling',
          ],
          _custom_price_prefix: 'ab ',
          _custom_price_number: 1290,
          _custom_price_suffix: 'im Monat',
          stripe_price_id_monthly: null,
        } as any;
        // Stelle sicher: Enterprise existiert immer als Karte
        const hasEnterprise = list.some((p:any)=> (p.plan_name||p.name)==='Enterprise');
        if (!hasEnterprise) {
          list = [...list, enterpriseCard];
        }
        console.log('✅ Plans loaded:', list);
        setAvailablePlans(list);
      } catch (e) {
        console.error('❌ Failed to load plans:', e);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, [activeTab, availablePlans.length]);

  // Load plan details from database API
  useEffect(() => {
    const loadPlanDetails = async () => {
      const planName = usage?.workspace?.plan;
      console.log('🔄 Loading plan details for:', planName);
      console.log('🔍 Current usage data:', usage);
      
      if (!planName) {
        console.log('⚠️ No plan name available yet');
        return;
      }

      setLoadingPlanDetails(true);
      try {
        console.log('📡 Calling subscriptionService.getPlanDetailsByName...');
        const details = await subscriptionService.getPlanDetailsByName(planName);
        console.log('✅ Got plan details:', details);
        
        if (details) {
          const planDetails = {
            name: details.name,
            price: details.formatted_price,
            description: details.name === 'Start' ? 'Ideal für Einzelpersonen und kleine Teams' :
                        details.name === 'Pro' ? 'Perfekt für wachsende Unternehmen' :
                        details.name === 'Enterprise' ? 'Maßgeschneiderte Lösung für große Unternehmen' :
                        'Custom plan configuration',
            monthly_price: details.monthly_price
          };
          console.log('📋 Setting plan details:', planDetails);
          setPlanDetails(planDetails);
        } else {
          console.log('⚠️ No plan details found, using fallback');
          // Fallback for unknown plans
          setPlanDetails({
            name: planName,
            price: planName === 'Enterprise' ? 'Individuell' : 'Custom',
            description: 'Custom plan configuration',
            monthly_price: null
          });
        }
      } catch (error) {
        console.error('❌ Failed to load plan details:', error);
        console.error('❌ Error details:', error.message, error.stack);
        // FORCE FALLBACK - Don't stay in loading state!
        setPlanDetails({
          name: planName,
          price: planName === 'Enterprise' ? 'Individuell' : 'Unknown',
          description: 'Plan details temporarily unavailable',
          monthly_price: null
        });
      } finally {
        setLoadingPlanDetails(false);
      }
    };

    if (usage?.workspace?.plan) {
      loadPlanDetails();
    }
  }, [usage?.workspace?.plan]);

  // Get real plan data from database instead of hardcoding
  const getCurrentPlanDetails = () => {
    const planName = usage?.workspace?.plan;
    console.log('🎯 getCurrentPlanDetails called with planName:', planName);
    console.log('🎯 Full usage object:', usage);
    console.log('🎯 Workspace object:', usage?.workspace);
    console.log('🎯 planDetails state:', planDetails);
    console.log('🎯 loadingPlanDetails state:', loadingPlanDetails);
    
    // If we have loaded plan details, use them
    if (planDetails) {
      console.log('✅ Using loaded planDetails');
      return planDetails;
    }

    // TEMP WORKAROUND: If usage data exists but plan is null/undefined, assume Enterprise
    if (usage && usage.cosmetic_features && Object.keys(usage.cosmetic_features).length > 0 && !planName) {
      console.log('🔧 WORKAROUND: Detected Enterprise based on cosmetic features');
      return {
        name: 'Enterprise',
        price: 'Individuell',
        description: 'Maßgeschneiderte Lösung für große Unternehmen'
      };
    }

    // If we have a plan name but no details yet, show plan-specific fallback
    if (planName) {
      console.log('🔄 Using planName fallback for:', planName);
      return {
        name: planName,
        price: planName === 'Enterprise' ? 'Individuell' : 
               planName === 'Pro' ? '549.00€/Monat' :
               planName === 'Start' ? '199.00€/Monat' : 'Custom',
        description: planName === 'Start' ? 'Ideal für Einzelpersonen und kleine Teams' :
                    planName === 'Pro' ? 'Perfekt für wachsende Unternehmen' :
                    planName === 'Enterprise' ? 'Maßgeschneiderte Lösung für große Unternehmen' :
                    'Custom plan configuration'
      };
    }

    // Only show loading if we truly have no data
    console.log('⏳ Showing loading state');
    return {
      name: "Loading...",
      price: "Loading...",
      description: "Loading plan information..."
    };
  };

  const currentPlanDetails = getCurrentPlanDetails();
  
  const currentPlan = {
    name: currentPlanDetails.name,
    price: currentPlanDetails.price,
    description: currentPlanDetails.description,
    features: {},
    usedMinutes: callMinutesFeature?.used || 0,
    totalMinutes: callMinutesFeature?.limit || 0,
    unlimited: callMinutesFeature?.unlimited || false,
    currentUsers: maxUsersFeature?.used || 0,
    maxUsers: maxUsersFeature?.limit || 0,
    currentAgents: maxAgentsFeature?.used || 0,
    maxAgents: maxAgentsFeature?.limit || 0,
    isTestPhase: false
  };
  
  // Calculate available minutes from usage data
  const currentBalance = callMinutesFeature ? 
    (callMinutesFeature.unlimited ? 'Unlimited' : (callMinutesFeature.remaining || 0)) : 
    'Loading...';

  // Plan changing function
  const handlePlanChange = async (planName: string) => {
    if (!primaryWorkspace?.id) {
      toast({
        title: "Fehler",
        description: "Kein Workspace ausgewählt",
        variant: "destructive",
      });
      return;
    }

    setChangingPlan(true);
    
    try {
      console.log('🔄 Changing to plan:', planName);
      
      // Get price ID from backend API (NO HARDCODED BULLSHIT!)
      const planDetails = await subscriptionService.getPlanDetailsByName(planName);
      if (!planDetails || !planDetails.stripe_price_id_monthly) {
        toast({
          title: "Fehler",
          description: `Preisdetails für ${planName} Plan konnten nicht geladen werden`,
          variant: "destructive",
        });
        setChangingPlan(false);
        return;
      }
      
      const priceId = planDetails.stripe_price_id_monthly;
      
      const checkoutSession = await subscriptionService.createCheckoutSession({
        workspace_id: primaryWorkspace.id,
        price_id: priceId,
      });
      
      console.log('✅ Checkout session created, redirecting to Stripe...');
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.checkout_url;
      
    } catch (error) {
      console.error('❌ Plan change failed:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Plan-Änderung fehlgeschlagen',
        variant: "destructive",
      });
      setChangingPlan(false);
    }
  };

  // Profile form data
  const [profileFormData, setProfileFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  // Workspace form data
  const [workspaceFormData, setWorkspaceFormData] = useState({
    workspace_name: ''
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  // Update workspace form data when workspace details load
  useEffect(() => {
    if (workspaceDetails) {
      setWorkspaceFormData({
        workspace_name: workspaceDetails.workspace_name || ''
      });
    }
  }, [workspaceDetails]);

  // Load subscription status when workspace is available
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!primaryWorkspace?.id || isLoadingSubscription) return;
      
      setIsLoadingSubscription(true);
      try {
        console.log('📊 Loading subscription status for workspace:', primaryWorkspace.id);
        const subscriptionData = await paymentAPI.getSubscription(primaryWorkspace.id);
        console.log('💳 Subscription status loaded:', subscriptionData);
        setSubscriptionStatus(subscriptionData);
      } catch (error) {
        console.error('❌ Failed to load subscription status:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Laden des Abonnement-Status",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    loadSubscriptionStatus();
  }, [primaryWorkspace?.id]);

  // Cancel subscription function
  const handleCancelSubscription = async () => {
    if (!primaryWorkspace?.id) {
      toast({
        title: "Fehler",
        description: "Workspace nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    const confirmCancel = window.confirm(
      'Möchtest du dein Abonnement wirklich kündigen? Es bleibt bis zum Ende der aktuellen Abrechnungsperiode aktiv.'
    );
    
    if (!confirmCancel) return;

    setIsCancellingSubscription(true);
    try {
      console.log('🚫 Cancelling subscription for workspace:', primaryWorkspace.id);
      const result = await subscriptionService.cancelSubscription(primaryWorkspace.id);
      console.log('✅ Subscription cancelled:', result);
      
      toast({
        title: "Abonnement gekündigt",
        description: "Dein Plan bleibt bis zum Ende der Abrechnungsperiode aktiv.",
      });
      
      // Reload subscription status
      const subscriptionData = await paymentAPI.getSubscription(primaryWorkspace.id);
      setSubscriptionStatus(subscriptionData);
      
    } catch (error: any) {
      console.error('❌ Failed to cancel subscription:', error);
      toast({
        title: "Fehler beim Kündigen",
        description: error.message || 'Bitte versuche es erneut oder kontaktiere den Support.',
        variant: "destructive",
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  // Confirm modal action handler for admin transfer / remove user
  const handleConfirmAction = async () => {
    if (!confirm || !primaryWorkspace?.id) { setConfirm(null); return; }
    try {
      if (confirm.type === 'make_admin') {
        await workspaceAPI.transferAdmin(String(primaryWorkspace.id), String(confirm.member.id));
        toast({ title: 'Admin übertragen' });
      } else if (confirm.type === 'remove_user') {
        await workspaceAPI.removeUsers(String(primaryWorkspace.id), [String(confirm.member.id)]);
        toast({ title: 'Benutzer entfernt' });
      }
      await refetch();
    } catch (err: any) {
      toast({ title: 'Aktion fehlgeschlagen', description: err?.message || 'Bitte erneut versuchen', variant: 'destructive' });
    } finally {
      setConfirm(null);
    }
  };

  // Resume subscription function (undo cancel_at_period_end)
  const handleResumeSubscription = async () => {
    if (!primaryWorkspace?.id) return;
    try {
      console.log('✅ Resuming subscription for workspace:', primaryWorkspace.id);
      const result = await subscriptionService.resumeSubscription(primaryWorkspace.id);
      console.log('✅ Subscription resumed:', result);
      toast({ title: 'Kündigung zurückgenommen' });
      const subscriptionData = await paymentAPI.getSubscription(primaryWorkspace.id);
      setSubscriptionStatus(subscriptionData);
    } catch (error: any) {
      console.error('❌ Failed to resume subscription:', error);
      toast({ title: 'Fehler beim Zurücknehmen', description: error.message || 'Bitte erneut versuchen', variant: 'destructive' });
    }
  };

  // Open Stripe customer portal
  const handleManageSubscription = async () => {
    if (!primaryWorkspace?.id) {
      toast({
        title: "Fehler",
        description: "Workspace nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔗 Opening Stripe customer portal for workspace:', primaryWorkspace.id);
      const portalSession = await paymentAPI.createPortalSession(primaryWorkspace.id);
      console.log('✅ Portal session created:', portalSession);
      
      // Redirect to Stripe customer portal
      window.open(portalSession.url, '_blank');
      
    } catch (error: any) {
      console.error('❌ Failed to create portal session:', error);
      toast({
        title: "Fehler",
        description: error.message || 'Fehler beim Öffnen der Abonnement-Verwaltung. Bitte versuche es erneut.',
        variant: "destructive",
      });
    }
  };

  // Handle profile form changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    console.log('📝 Form field changed:', {
      fieldName,
      fieldValue,
      fieldLength: fieldValue.length,
      isFirstName: fieldName === 'first_name',
      currentFormData: profileFormData
    });
    
    setProfileFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };

  // Handle workspace form changes
  const handleWorkspaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    console.log('🏢 Workspace field changed:', {
      fieldName,
      fieldValue,
      currentWorkspaceData: workspaceFormData
    });
    
    setWorkspaceFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };

  // Save workspace changes
  const handleSaveWorkspace = async () => {
    if (!workspaceDetails?.id) {
      toast({
        title: "Fehler",
        description: "Workspace ID nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🏢 Settings - preparing to save workspace:', {
        workspaceId: workspaceDetails.id,
        originalWorkspace: workspaceDetails,
        formData: workspaceFormData,
        workspaceState: {
          loading: workspaceLoading,
          updating: isUpdatingWorkspace,
          hasWorkspace: !!workspaceDetails
        }
      });
      
      await updateWorkspace(workspaceDetails.id, workspaceFormData);
      
      toast({
        title: "Erfolg",
        description: "Workspace erfolgreich aktualisiert!",
      });
    } catch (error: any) {
      console.error('Failed to update workspace:', error);
      toast({
        title: "Fehler",
        description: error.message || 'Fehler beim Speichern des Workspace. Bitte versuchen Sie es erneut.',
        variant: "destructive",
      });
    }
  };

  // Handle user invitation
  const handleInviteUser = async () => {
    if (!primaryWorkspace?.id) {
      toast({
        title: "Fehler",
        description: "Kein Workspace gefunden",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail.trim()) {
      toast({
        title: "Fehler", 
        description: "Bitte geben Sie eine E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsInviting(true);
      console.log('📧 Inviting user:', { workspaceId: primaryWorkspace.id, email: inviteEmail });
      
      await workspaceAPI.inviteUserToWorkspace(primaryWorkspace.id, inviteEmail.trim());
      
      toast({
        title: "Einladung versendet!",
        description: `Einladung wurde an ${inviteEmail} gesendet`,
      });
      
      // Reset form and close modal
      setInviteEmail('');
      setShowInviteModal(false);
      
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      toast({
        title: "Fehler beim Versenden",
        description: error.message || "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      console.log('📝 Settings - preparing to save profile:', {
        originalProfile: profile,
        formData: profileFormData,
        hasFirstName: !!profileFormData.first_name,
        firstNameValue: profileFormData.first_name,
        firstNameLength: profileFormData.first_name?.length,
        profileState: {
          loading: profileLoading,
          updating: isSavingProfile,
          hasProfile: !!profile,
          profileId: profile?.id
        }
      });
      
      await updateProfile(profileFormData);
      
      toast({
        title: "Erfolg",
        description: "Profil erfolgreich aktualisiert!",
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Fehler",
        description: error.message || 'Fehler beim Speichern des Profils. Bitte versuchen Sie es erneut.',
        variant: "destructive",
      });
    }
  };

  // Top-up workflow entfernt – wird später nachgezogen

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Settings</h1>
          <p className={textStyles.pageSubtitle}>Manage your account and workspace</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab("account")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "account"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <User className={iconSizes.small} />
                <span className="ml-2">Account</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("workspace")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "workspace"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Building className={iconSizes.small} />
                <span className="ml-2">Workspace</span>
              </div>
            </button>
            
            {SHOW_BILLING && (
              <button
                onClick={() => setActiveTab("billing")}
                className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                  activeTab === "billing"
                    ? "border-[#3d5097] text-[#3d5097]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
              >
                <div className="flex items-center">
                  <CreditCard className={iconSizes.small} />
                  <span className="ml-2">Plans & balance</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {profileLoading ? "?" : getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input 
                    id="firstName" 
                    name="first_name"
                    value={profileFormData.first_name}
                    onChange={handleProfileInputChange}
                    disabled={profileLoading || isSavingProfile}
                    placeholder={profileLoading ? "Wird geladen..." : "Vorname"}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input 
                    id="lastName" 
                    name="last_name"
                    value={profileFormData.last_name}
                    onChange={handleProfileInputChange}
                    disabled={profileLoading || isSavingProfile}
                    placeholder={profileLoading ? "Wird geladen..." : "Nachname"}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile?.email || ""} 
                    disabled={true}
                    placeholder="E-Mail kann nicht geändert werden"
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    E-Mail-Adresse kann aus Sicherheitsgründen nicht geändert werden
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    value={profile?.phone || ""}
                    disabled={true}
                    placeholder="Telefonnummer kann nicht geändert werden"
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Telefonnummer kann aus Sicherheitsgründen nicht geändert werden
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  className={buttonStyles.create.default}
                  onClick={handleSaveProfile}
                  disabled={profileLoading || isSavingProfile}
                >
                  <span>
                    {isSavingProfile ? "Wird gespeichert..." : "Änderungen speichern"}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Entfernt: Firmen-Informationen (werden im Stripe-Portal verwaltet) */}

          {/* Entfernt: E-Mail Einstellungen (derzeit ohne Backend-Anbindung) */}
          {/* Konto löschen Button + Dialog */}
          <div className="flex justify-end pt-2">
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Konto endgültig löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle deine Daten werden deaktiviert/entfernt. Du wirst sofort ausgeloggt. Dieser Vorgang kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const base = apiConfig.API_BASE_URL || 'http://localhost:8000';
                        await fetch(`${base}/api/users/users/delete_me/`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Token ${localStorage.getItem('authToken') || ''}`,
                            'Content-Type': 'application/json'
                          },
                          credentials: 'include'
                        });
                        try { localStorage.removeItem('authToken'); } catch {}
                        window.location.href = '/';
                      } catch (e: any) {
                        const message = (e?.detail || e?.message || 'Konto konnte nicht gelöscht werden.');
                        toast({ title: 'Löschen fehlgeschlagen', description: message, variant: 'destructive' });
                      } finally {
                        setShowDeleteConfirm(false);
                      }
                    }}
                  >
                    Endgültig löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* Workspace Tab - NUR Team Mitglieder */}
        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Workspace Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input 
                  id="workspaceName" 
                  name="workspace_name"
                  value={workspaceFormData.workspace_name}
                  onChange={handleWorkspaceInputChange}
                  disabled={workspaceLoading || isUpdatingWorkspace}
                  placeholder={workspaceLoading ? "Wird geladen..." : "Workspace Name"}
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  className={buttonStyles.create.default} 
                  onClick={handleSaveWorkspace}
                  disabled={workspaceLoading || isUpdatingWorkspace}
                >
                  <span>
                    {isUpdatingWorkspace ? "Wird gespeichert..." : "Workspace speichern"}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={textStyles.sectionTitle}>Team Mitglieder</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {workspaceLoading ? "Wird geladen..." : `${teamMembers.length} / ${currentPlan.maxUsers} User verwendet`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (isAtUserLimit) {
                        toast({ title: 'Hinweis', description: 'Dein Nutzer-Limit ist aufgebraucht.' });
                        return;
                      }
                      setShowInviteModal(true);
                    }}
                    disabled={isAtUserLimit}
                    className="bg-[#3d5097] hover:bg-[#3d5097] text-white"
                  >
                    <Plus className={iconSizes.small} />
                    <span>Mitglied einladen</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspaceLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Wird geladen...
                  </div>
                ) : teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                            {(() => {
                              const ws: any = workspaceDetails || {};
                              const isWorkspaceAdmin = Boolean(ws.admin_user_id && member.id === ws.admin_user_id);
                              return isWorkspaceAdmin ? (
                                <Badge variant="outline" className="ml-2 text-xs">Workspace Admin</Badge>
                              ) : null;
                            })()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {isAdmin && member.email !== profile?.email && (
                          <>
                            {(() => {
                              const ws: any = workspaceDetails || {};
                              const isAlreadyAdmin = Boolean(ws.admin_user_id && member.id === ws.admin_user_id);
                              if (isAlreadyAdmin) return null;
                              return (
                                <Button
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setConfirm({ type: 'make_admin', member })}
                                >
                                  Admin machen
                                </Button>
                              );
                            })()}
                            <Button
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => setConfirm({ type: 'remove_user', member })}
                            >
                              Entfernen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Keine Team-Mitglieder gefunden
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                {isAdmin ? (
                  <Button
                    variant="destructive"
                    className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      setDeleteConfirmText("");
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Workspace löschen
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500">Nur der Workspace-Admin kann den Workspace löschen.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workspace-Administration-Bereich entfernt – Aktionen direkt pro Mitglied */}

          {/* Advanced Feld entfernt */}
        </TabsContent>

        {/* Pläne & Guthaben Tab (ausgeblendet) */}
        {SHOW_BILLING && (
        <TabsContent value="billing" className="space-y-6">
          {/* Exakt das Layout aus dem Welcome Flow */}
          <WelcomePlanCards
            plans={(availablePlans && availablePlans.length > 0
              ? availablePlans.map((p:any)=>{
                  const name = p.plan_name || p.name || '';
                  // Extrahiere Limits aus Features (nur Start/Pro); Enterprise bekommt Custom-Liste
                  let features:string[]|undefined = undefined;
                  const apiFeatures = (p.features || []) as any[];
                  if (name === 'Start' || name === 'Pro') {
                    const getLimit = (key:string) => {
                      const f = apiFeatures.find(ff => (ff.feature_name||ff.name)===key);
                      if (!f) return null;
                      const raw = f.limit ?? f.value ?? null;
                      if (raw === null || raw === undefined) return null;
                      const n = Number.parseFloat(String(raw).replace(',', '.'));
                      if (!Number.isFinite(n)) return null;
                      return Math.round(n);
                    };
                    const minutes = getLimit('call_minutes');
                    const agents = getLimit('max_agents');
                    const funnels = getLimit('max_funnels');
                    const users = getLimit('max_users');
                    const fmt = (v:number|null)=> v===null? 'Unbegrenzt' : v.toLocaleString('de-DE');
                    features = [
                      `Inkludierte Minuten: ${fmt(minutes)}`,
                      `Inkludierte Agents: ${fmt(agents)}`,
                      `Inkludierte Funnels: ${fmt(funnels)}`,
                      `Workspace-Mitglieder: ${fmt(users)}`,
                    ];
                  } else if (name === 'Enterprise') {
                    features = p._custom_features || [
                      'Individuelle Preiskonditionen',
                      'CSV Upload',
                      'Voice Cloning',
                      'White Labeling',
                    ];
                  }
                  return {
                    id: (name||'').toString().toLowerCase(),
                    name,
                    price_monthly: name==='Enterprise' ? (p._custom_price_number ?? null) : (p.price_monthly ? (typeof p.price_monthly === 'string' ? parseFloat(p.price_monthly) : p.price_monthly) : null),
                    price_prefix: p._custom_price_prefix,
                    price_suffix: p._custom_price_suffix || '/Monat',
                    description: p.description,
                    features,
                    is_popular: name==='Pro',
                    is_contact: name==='Enterprise',
                  };
                })
              : [
                  { id:'start', name:'Start', price_monthly:199, description:'Ideal für Einzelpersonen und kleine Teams', features:['Inkludierte Minuten: 250','Inkludierte Agents: 1','Inkludierte Funnels: 1','Workspace-Mitglieder: 3'], is_popular:false },
                  { id:'pro', name:'Pro', price_monthly:549, description:'Ideal für Unternehmen mit höherem Volumen', features:['Inkludierte Minuten: 1000','Inkludierte Agents: 3','Inkludierte Funnels: 3','Workspace-Mitglieder: 5'], is_popular:true },
                  { id:'enterprise', name:'Enterprise', price_monthly:1290, price_prefix:'ab ', price_suffix:'im Monat', description:'Individuelle Lösungen für große Unternehmen', features:['Individuelle Preiskonditionen','CSV Upload','Voice Cloning','White Labeling'], is_contact:true },
                ])}
            currentPlanName={usage?.workspace?.plan || null}
            onSelect={async (plan:any) => {
              if (!primaryWorkspace?.id) return;
              try {
                const isEnterprise = ((plan.name||'') === 'Enterprise');
                if (isEnterprise) {
                  window.open('https://cal.com/leopoeppelonboarding/austausch-mit-leonhard-poppel', '_blank');
                  return;
                }
                // Direkt zum Stripe-Kundenportal wie bei "Abonnement verwalten"
                const portal = await paymentAPI.createPortalSession(primaryWorkspace.id);
                window.open(portal.url, '_blank');
              } catch (e:any) {
                toast({ title: 'Planaktion fehlgeschlagen', description: e?.message || 'Bitte später erneut versuchen', variant: 'destructive' });
              }
            }}
          />

          {/* Aktionen unter Karten: Portal und Zusatzminuten */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={async ()=>{
                if (!primaryWorkspace?.id) return;
                try {
                  const portal = await subscriptionService.createCustomerPortalSession(primaryWorkspace.id);
                  window.open(portal.url, '_blank');
                } catch (e:any) {
                  toast({ title:'Portal konnte nicht geöffnet werden', description: e?.message || 'Bitte später erneut versuchen', variant:'destructive' });
                }
              }}
            >
              Abonnement verwalten
            </Button>
            <Button
              className="bg-[#3d5097] hover:bg-[#3d5097]/90 text-white"
              onClick={async ()=>{
                if (!primaryWorkspace?.id) return;
                try {
                  const base = apiConfig.baseUrl || '';
                  const res = await fetch(`${base}/api/payments/stripe/minute-pack-checkout/`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Token ${localStorage.getItem('authToken')||''}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ workspace_id: primaryWorkspace.id })
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Checkout konnte nicht erstellt werden');
                  }
                  const data = await res.json();
                  if (data?.checkout_url) {
                    window.location.href = data.checkout_url;
                  } else {
                    throw new Error('Ungültige Antwort vom Server');
                  }
                } catch (e:any) {
                  toast({ title:'Buchung fehlgeschlagen', description: e?.message || 'Bitte später erneut versuchen', variant:'destructive' });
                }
              }}
            >
              Zusatzminuten buchen
            </Button>
          </div>

          {/* Hinweis: Verfügbare Minuten Card entfernt wie gewünscht */}
        </TabsContent>
        )}
      </Tabs>

      {/* Invite User Modal - Small & Centered */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Mitglied einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-Mail-Adresse</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isInviting) {
                    handleInviteUser();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
              }}
              disabled={isInviting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={isInviting || !inviteEmail.trim()}
              className="bg-[#3d5097] hover:bg-[#3d5097] text-white"
            >
              {isInviting ? "Wird gesendet..." : "Einladen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Admin/Remove actions */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'make_admin' ? 'Workspace-Admin übertragen?' : 'Mitglied entfernen?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'make_admin'
                ? `Soll ${confirm.member?.email} Workspace-Admin werden?`
                : `Soll ${confirm?.member?.email} wirklich aus diesem Workspace entfernt werden?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Workspace Confirm - minimal dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workspace wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle Daten dieses Workspaces werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!primaryWorkspace?.id) return;
                try {
                  await workspaceAPI.deleteWorkspace(String(primaryWorkspace.id));
                  toast({ title: 'Workspace gelöscht' });
                  try {
                    const key = `selected_workspace_id:${profile?.id || ''}`;
                    localStorage.removeItem(key);
                    localStorage.removeItem('welcomeCompleted');
                  } catch {}
                  window.location.href = '/';
                } catch (e: any) {
                  const message = (e?.detail || e?.message || 'Du hast keine Berechtigung, diesen Workspace zu löschen.');
                  toast({ title: 'Löschen fehlgeschlagen', description: message, variant: 'destructive' });
                } finally {
                  setShowDeleteConfirm(false);
                }
              }}
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}