import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { User, Building, CreditCard, Check, Phone, Users, Plus, Trash2, Settings as SettingsIcon, Clock, AlertTriangle, Calendar, Infinity } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAllFeaturesUsage } from "@/hooks/use-usage-status";
import { toast } from "sonner";

// Mock data für Minuten-Pakete basierend auf Plan
const getMinutePackages = (plan: string) => {
  if (plan === "Pro") {
    return [
      { id: "250", minutes: 250, price: "72€", pricePerMinute: "0,29€", popular: false },
      { id: "500", minutes: 500, price: "135€", pricePerMinute: "0,27€", popular: false },
      { id: "1000", minutes: 1000, price: "230€", pricePerMinute: "0,23€", popular: true },
      { id: "2500", minutes: 2500, price: "475€", pricePerMinute: "0,19€", popular: false }
    ];
  } else {
    // Start Plan  
    return [
      { id: "250", minutes: 250, price: "122€", pricePerMinute: "0,49€", popular: false },
      { id: "500", minutes: 500, price: "195€", pricePerMinute: "0,39€", popular: true },
      { id: "1000", minutes: 1000, price: "350€", pricePerMinute: "0,35€", popular: false },
      { id: "2500", minutes: 2500, price: "750€", pricePerMinute: "0,30€", popular: false }
    ];
  }
};

// Note: Plan and usage data are now loaded via API hooks

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  
  // Load workspace and usage data
  const { primaryWorkspace, workspaceDetails, teamMembers, loading: workspaceLoading, updating: isUpdatingWorkspace, updateWorkspace } = useWorkspace();
  const { usage, features, loading: usageLoading, error: usageError, lastUpdated } = useAllFeaturesUsage(primaryWorkspace?.id || null);
  const { profile, loading: profileLoading, updating: isSavingProfile, updateProfile, getDisplayName, getInitials } = useUserProfile();
  
  // Generate current plan data from API
  const callMinutesFeature = features.find(f => f.name === 'call_minutes');
  const maxUsersFeature = features.find(f => f.name === 'max_users');
  const maxAgentsFeature = features.find(f => f.name === 'max_agents');
  
  const currentPlan = {
    name: usage?.workspace?.plan || "Loading...",
    price: usage?.workspace?.plan === "Enterprise" ? "Custom" : "549€", // You might want to get this from API too
    features: [], // Could be populated from cosmetic_features
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
      toast.error('Workspace ID nicht gefunden');
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
      
      toast.success('Workspace erfolgreich aktualisiert!');
    } catch (error: any) {
      console.error('Failed to update workspace:', error);
      toast.error('Fehler beim Speichern des Workspace', {
        description: error.message || 'Bitte versuchen Sie es erneut.'
      });
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
      
      toast.success('Profil erfolgreich aktualisiert!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error('Fehler beim Speichern des Profils', {
        description: error.message || 'Bitte versuchen Sie es erneut.'
      });
    }
  };

  // Billing functions
  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true);
    console.log('Processing purchase for package:', packageId);
    
    // Simulate Stripe redirect
    setTimeout(() => {
      setIsProcessing(false);
      setShowTopUpDialog(false);
      console.log('Redirecting to Stripe...');
    }, 1000);
  };

  const minutePackages = getMinutePackages(currentPlan.name);

  const MinutePackageCard = ({ pkg }: { pkg: typeof minutePackages[0] }) => (
    <Card className={pkg.popular ? "border-[#FE5B25]" : ""}>
      <CardContent className="p-6">
        {pkg.popular && (
          <Badge className="mb-4 bg-[#FE5B25] text-white">
            Am beliebtesten
          </Badge>
        )}
        <div className="text-center space-y-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{pkg.minutes}</div>
            <div className="text-sm text-gray-500">Minuten</div>
            <div className="text-lg font-semibold text-gray-700 mt-1">{pkg.price}</div>
            <div className="text-xs text-gray-500">{pkg.pricePerMinute}/Min</div>
          </div>
          <button 
            className={buttonStyles.primary.fullWidth}
            onClick={() => handlePurchase(pkg.id)}
            disabled={isProcessing}
          >
            <span>{isProcessing ? "Verarbeitung..." : "Auswählen"}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );

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
                    value={profileFormData.phone}
                    onChange={handleProfileInputChange}
                    disabled={profileLoading || isSavingProfile}
                    placeholder={profileLoading ? "Wird geladen..." : "Telefonnummer"}
                  />
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

          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Firmen-Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Firmenname</Label>
                  <Input id="companyName" defaultValue="Mein Unternehmen GmbH" />
                </div>
                <div>
                  <Label htmlFor="taxId">Steuernummer</Label>
                  <Input id="taxId" defaultValue="DE123456789" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Firmen-Adresse</Label>
                  <Textarea id="address" defaultValue="Musterstraße 123&#10;12345 Musterstadt&#10;Deutschland" rows={3} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Diese Informationen werden für die Stripe-Rechnungsstellung verwendet.
              </p>
              
              <div className="flex justify-end pt-4">
                <button className={buttonStyles.create.default}>
                  <span>Firmen-Daten speichern</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>E-Mail Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="flex items-center justify-between">
                <div>
                  <Label>E-Mail Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">Erhalte Updates per E-Mail</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Workspace-Einladungen</Label>
                  <p className="text-sm text-gray-500">Benachrichtigung bei neuen Workspace-Einladungen</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
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
                <button className={buttonStyles.create.default}>
                  <Plus className={iconSizes.small} />
                  <span>Mitglied einladen</span>
                </button>
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
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{member.role}</Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.status}</p>
                          <p className="text-xs text-gray-500">{member.lastActive}</p>
                        </div>
                        <button className={buttonStyles.cardAction.iconDelete}>
                          <Trash2 className={iconSizes.small} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Keine Team-Mitglieder gefunden
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pläne & Guthaben Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Usage Overview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={textStyles.sectionTitle}>Current Usage & Quotas</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {usage?.billing_period ? (
                      <>
                        Billing period: {new Date(usage.billing_period.start!).toLocaleDateString()} - {new Date(usage.billing_period.end!).toLocaleDateString()}
                        {usage.billing_period.days_remaining !== null && (
                          <span className="ml-2">({usage.billing_period.days_remaining} days remaining)</span>
                        )}
                      </>
                    ) : (
                      'Current usage for your workspace'
                    )}
                    {lastUpdated && (
                      <span className="block text-xs mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
                {usageError && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Data Error
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              ) : usageError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load usage data</h3>
                  <p className="text-gray-600 mb-4">{usageError}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : features.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No usage data available</div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature) => (
                    <div key={feature.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {feature.name === 'call_minutes' && <Clock className="h-4 w-4 text-gray-500" />}
                          {feature.name === 'max_users' && <Users className="h-4 w-4 text-gray-500" />}
                          {feature.name === 'max_agents' && <Building className="h-4 w-4 text-gray-500" />}
                          <span className="font-medium text-sm">
                            {feature.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {feature.isOverLimit && (
                          <Badge variant="destructive" className="text-xs">Over Limit</Badge>
                        )}
                        {feature.isNearingLimit && !feature.isOverLimit && (
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">Warning</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Used</span>
                          <span className="font-medium">
                            {feature.unlimited ? (
                              <span className="flex items-center gap-1">
                                {feature.used} {feature.unit} <Infinity className="h-3 w-3" />
                              </span>
                            ) : (
                              `${feature.used} / ${feature.limit || 0} ${feature.unit}`
                            )}
                          </span>
                        </div>
                        
                        {!feature.unlimited && feature.limit && (
                          <>
                            <Progress 
                              value={feature.percentage_used || 0} 
                              className={`h-2 ${
                                feature.isOverLimit ? 'text-red-500' : 
                                feature.isNearingLimit ? 'text-orange-500' : 
                                'text-green-500'
                              }`}
                            />
                            <div className="text-xs text-gray-500 text-right">
                              {feature.percentageText}
                            </div>
                          </>
                        )}
                        
                        {feature.unlimited && (
                          <div className="text-xs text-green-600 font-medium">Unlimited</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Cosmetic Features */}
              {usage?.cosmetic_features && Object.keys(usage.cosmetic_features).length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="font-semibold text-sm mb-4">Plan Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(usage.cosmetic_features).map(([feature, value]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${value && value !== 'standard' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {typeof value === 'string' && value !== 'true' && value !== 'false' && value !== 'standard' && (
                          <Badge variant="secondary" className="text-xs">{value}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Aktueller Plan & Verfügbare Minuten - NEBENEINANDER */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Aktueller Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={textStyles.sectionTitle}>Aktueller Plan</CardTitle>
                  <button 
                    className={buttonStyles.primary.default}
                    onClick={() => window.location.href = '/dashboard/plans'}
                  >
                    <SettingsIcon className={iconSizes.small} />
                    <span>{currentPlan.isTestPhase ? "Pläne vergleichen" : "Plan ändern"}</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={buttonStyles.info.panel}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={textStyles.cardTitle}>{currentPlan.name} Plan</h3>
                      <p className={textStyles.cardSubtitle}>{currentPlan.price} pro Monat</p>
                    </div>
                    <Badge className="bg-[#FE5B25] text-white">Aktiv</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Call Minutes</span>
                      <span>
                        {currentPlan.unlimited ? (
                          <span className="flex items-center gap-1">
                            {currentPlan.usedMinutes} minutes <Infinity className="h-3 w-3" />
                          </span>
                        ) : (
                          `${currentPlan.usedMinutes} / ${currentPlan.totalMinutes}`
                        )}
                      </span>
                    </div>
                    {!currentPlan.unlimited && currentPlan.totalMinutes > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#FE5B25] h-2 rounded-full" 
                          style={{ width: `${Math.min((currentPlan.usedMinutes / currentPlan.totalMinutes) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    {currentPlan.unlimited && (
                      <div className="text-xs text-green-600 font-medium">Unlimited usage</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verfügbare Minuten */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={textStyles.sectionTitle}>Verfügbare Minuten</CardTitle>
                  <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
                    <DialogTrigger asChild>
                      <button className={buttonStyles.primary.default}>
                        <CreditCard className={iconSizes.small} />
                        <span>Guthaben aufladen</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Minuten aufladen</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {minutePackages.map((pkg) => (
                          <MinutePackageCard key={pkg.id} pkg={pkg} />
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}