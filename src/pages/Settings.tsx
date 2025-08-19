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
import { paymentAPI, workspaceAPI } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/lib/apiConfig";
import PlanCards from "@/components/billing/PlanCards";

// Minute packages will be loaded dynamically from database via @core module

// Note: Plan and usage data are now loaded via API hooks

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  
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

  // Ensure activeTab is valid for current role (non-admins cannot view billing)
  useEffect(() => {
    if (!isAdmin && activeTab === 'billing') {
      setActiveTab('workspace');
    }
  }, [isAdmin, activeTab]);
  
  // Generate current plan data from API
  const callMinutesFeature = features.find(f => f.name === 'call_minutes');
  const maxUsersFeature = features.find(f => f.name === 'max_users');
  const maxAgentsFeature = features.find(f => f.name === 'max_agents');
  
  // State for plan details from API
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loadingPlanDetails, setLoadingPlanDetails] = useState(false);

  // Load all available plans for PlanCards (Welcome-Flow Stil)
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    // Nur für Admins relevant; lade einmalig oder wenn Billing-Tab aktiv wird
    if (!isAdmin) return;
    if (availablePlans.length > 0) return;
    if (activeTab !== 'billing') return;
    (async () => {
      try {
        setLoadingPlans(true);
        const plans = await subscriptionService.getPlans();
        setAvailablePlans(Array.isArray(plans) ? plans : (plans?.results || []));
      } catch (e) {
        console.error('❌ Failed to load plans:', e);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, [isAdmin, activeTab, availablePlans.length]);

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
    features: usage?.cosmetic_features || {}, // Real cosmetic features from database
    usedMinutes: callMinutesFeature?.used || 0,
    totalMinutes: callMinutesFeature?.limit || 0,
    // FIX: Only Enterprise should be unlimited, Start/Pro should show actual limits
    unlimited: currentPlanDetails.name === 'Enterprise' ? (callMinutesFeature?.unlimited || false) : false,
    currentUsers: maxUsersFeature?.used || 0,
    maxUsers: maxUsersFeature?.limit || 0,
    currentAgents: maxAgentsFeature?.used || 0,
    maxAgents: maxAgentsFeature?.limit || 0,
    isTestPhase: false
  };
  
  // Calculate available minutes from usage data
  const currentBalance = callMinutesFeature ? 
    (currentPlan.unlimited ? 'Unlimited' : (callMinutesFeature.remaining || 0)) : 
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
          <h1 className={textStyles.pageTitle}>Einstellungen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deinen Account und Workspace</p>
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
                  ? "border-[#FE5B25] text-[#FE5B25]"
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
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Building className={iconSizes.small} />
                <span className="ml-2">Workspace</span>
              </div>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => setActiveTab("billing")}
                className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                  activeTab === "billing"
                    ? "border-[#FE5B25] text-[#FE5B25]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
              >
                <div className="flex items-center">
                  <CreditCard className={iconSizes.small} />
                  <span className="ml-2">Pläne & Guthaben</span>
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
                  <Button onClick={() => setShowInviteModal(true)} className="bg-[#FE5B25] hover:bg-[#E5501F] text-white">
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

        {/* Pläne & Guthaben Tab (nur Admin) */}
        {isAdmin && (
        <TabsContent value="billing" className="space-y-6">
          {/* Neue Darstellung: 3 Plan-Karten wie im Welcome Flow */}
          <PlanCards
            plans={availablePlans as any}
            currentPlanName={usage?.workspace?.plan || null}
            onUpgrade={async (plan:any) => {
              if (!primaryWorkspace?.id) return;
              try {
                const isEnterprise = ((plan.plan_name||plan.name||'') === 'Enterprise');
                if (isEnterprise) {
                  const portal = await subscriptionService.createCustomerPortalSession(primaryWorkspace.id);
                  window.open(portal.url, '_blank');
                  return;
                }
                const priceId = plan.stripe_price_id_monthly;
                if (!priceId) {
                  const portal = await subscriptionService.createCustomerPortalSession(primaryWorkspace.id);
                  window.open(portal.url, '_blank');
                  return;
                }
                const sub = await subscriptionService.getSubscriptionStatus(primaryWorkspace.id);
                if (!sub?.has_subscription) {
                  const checkout = await subscriptionService.createCheckoutSession({ workspace_id: primaryWorkspace.id, price_id: priceId });
                  window.location.href = checkout.checkout_url;
                  return;
                }
                await subscriptionService.changePlan(primaryWorkspace.id, priceId);
                toast({ title: 'Planwechsel gestartet', description: 'Abrechnung wird von Stripe automatisch angepasst.' });
              } catch (e:any) {
                toast({ title: 'Planaktion fehlgeschlagen', description: e?.message || 'Bitte später erneut versuchen', variant: 'destructive' });
              }
            }}
          />

          {/* Verfügbare Minuten */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={textStyles.sectionTitle}>Verfügbare Minuten</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                {usageLoading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                  </div>
                ) : usageError ? (
                  <div>
                    <div className="text-2xl text-red-500 mb-2">Error</div>
                    <p className="text-gray-600">Unable to load balance</p>
                  </div>
                ) : callMinutesFeature?.unlimited ? (
                  <div>
                    <div className="text-4xl font-bold text-green-600 flex items-center justify-center gap-2">
                      <Infinity className="h-10 w-10" />
                      Unlimited
                    </div>
                    <p className="text-gray-600">Available Minutes</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold text-gray-900">
                      {Math.max(0, callMinutesFeature?.remaining || 0)}
                    </div>
                    <p className="text-gray-600">Remaining Minutes</p>
                    {callMinutesFeature && callMinutesFeature.remaining !== null && callMinutesFeature.remaining < 50 && (
                      <p className="text-orange-600 text-sm mt-2">⚠️ Low balance</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
              className="bg-[#FE5B25] hover:bg-[#E5501F] text-white"
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