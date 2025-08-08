import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Facebook, CheckCircle, Circle, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI } from "@/lib/apiService";

// Interface for Meta Integration
interface MetaIntegration {
  id: string;
  workspace: string;
  workspace_name: string;
  business_account_id: string;
  page_id: string;
  page_name: string;
  page_picture_url: string;
  access_token_expires_at: string;
  scopes: string[];
  status: string;
  lead_forms_count: number;
  created_at: string;
  updated_at: string;
}

// Interface for Meta Lead Form
interface MetaLeadForm {
  id: string;
  meta_form_id: string;
  name: string;
  meta_integration: string;
  is_active: boolean;
  variables_scheme: any;
  meta_lead_id?: string;
  lead?: string;
  created_at: string;
  updated_at: string;
  selected?: boolean;
}

export default function MetaConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { workspaceDetails } = useWorkspace();
  const [forms, setForms] = useState<MetaLeadForm[]>([]);
  const [metaIntegration, setMetaIntegration] = useState<MetaIntegration | null>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get integration ID from URL params
  const integrationId = searchParams.get('integration');

  // Load Meta integration and lead forms from API
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📋 Loading Meta integration data...');
        setIsLoading(true);
        setError(null);
        
        // Load both integration details and lead forms in parallel
        const [integrations, leadForms] = await Promise.all([
          metaAPI.getIntegrations(),
          metaAPI.getLeadForms()
        ]);
        
        console.log('✅ Integrations loaded:', integrations);
        console.log('✅ Lead forms loaded:', leadForms);
        
        // Find the current integration by ID or use the first one
        const currentIntegration = integrationId 
          ? integrations.find(integration => integration.id === integrationId)
          : integrations[0];
          
        if (currentIntegration) {
          setMetaIntegration(currentIntegration);
        }
        
        // Add selected property to each form based on is_active
        const formsWithSelection = leadForms.map(form => ({
          ...form,
          selected: form.is_active || false // Use is_active from backend
        }));
        
        setForms(formsWithSelection);
      } catch (err) {
        console.error('❌ Error loading Meta data:', err);
        setError('Fehler beim Laden der Meta Daten');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [integrationId]);

  const toggleFormSelection = (formId: string) => {
    setForms(forms.map(form => 
      form.id === formId 
        ? { ...form, selected: !form.selected }
        : form
    ));
  };

  const selectedCount = forms.filter(form => form.selected).length;

  // Handler for saving form selections
  const handleSaveSelections = async () => {
    if (isLoading) return; // Prevent double clicks
    
    try {
      console.log('💾 Saving form selections...');
      
      // Convert forms selection to the format expected by the API
      const formSelections: Record<string, boolean> = {};
      forms.forEach(form => {
        formSelections[form.meta_form_id] = form.selected || false;
      });
      
      console.log('📋 Form selections to save:', formSelections);
      console.log('📋 Forms array:', forms);
      
      if (Object.keys(formSelections).length === 0) {
        toast({
          title: "Keine Formulare vorhanden",
          description: "Es wurden keine Formulare zum Speichern gefunden.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      const response = await metaAPI.updateFormSelections(formSelections);
      
      console.log('✅ Form selections saved:', response);
      
      toast({
        title: "Erfolgreich gespeichert",
        description: `${response.total_updated} Formulare wurden aktualisiert.`,
      });
      
      if (response.total_errors > 0) {
        console.warn('⚠️ Some forms had errors:', response.errors);
        toast({
          title: "Teilweise Fehler",
          description: `${response.total_errors} Formulare konnten nicht aktualisiert werden.`,
          variant: "destructive",
        });
      }
      
      // Reload the forms to reflect the saved state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Error saving form selections:', err);
      
      let errorMessage = "Die Formular-Auswahl konnte nicht gespeichert werden.";
      
      // Try to extract more specific error message
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast({
        title: "Fehler beim Speichern",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for "Account trennen" - Delete Integration
  const handleDeleteIntegration = async () => {
    if (!integrationId) {
      toast({
        title: "Fehler",
        description: "Keine Integration ID gefunden.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🗑️ Deleting Meta integration:', integrationId);
      await metaAPI.deleteIntegration(integrationId);
      
      toast({
        title: "Erfolgreich",
        description: "Meta Integration wurde getrennt.",
      });
      
      // Redirect back to Lead Sources
      navigate('/dashboard/lead-sources');
    } catch (error) {
      console.error('❌ Error deleting Meta integration:', error);
      toast({
        title: "Fehler",
        description: "Meta Integration konnte nicht getrennt werden.",
        variant: "destructive",
      });
    }
  };

  // Handler for "Account wechseln" - Start new OAuth flow
  const handleSwitchAccount = async () => {
    if (!workspaceDetails?.id) {
      toast({
        title: "Fehler",
        description: "Keine Workspace ID verfügbar.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔗 Starting Meta OAuth flow for account switch');
      const { oauth_url } = await metaAPI.getOAuthUrl(workspaceDetails.id);
      
      // Open Facebook OAuth in same window
      window.location.href = oauth_url;
    } catch (error) {
      console.error('❌ Error starting Meta OAuth:', error);
      toast({
        title: "Fehler",
        description: "Account wechseln konnte nicht gestartet werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header */}
      <div className={layoutStyles.pageHeader}>
        <div className="space-y-4">
          <button 
            className={buttonStyles.navigation.back}
            onClick={() => navigate("/dashboard/lead-sources")}
          >
            <ArrowLeft className={iconSizes.small} />
            <span>Zurück zu Lead Quellen</span>
          </button>
          <div>
            <h1 className={textStyles.pageTitle}>Meta Lead Ads Konfiguration</h1>
            <p className={textStyles.pageSubtitle}>Verbinde und konfiguriere deine Meta Lead Formulare</p>
          </div>
        </div>
        
        {/* Funktionaler Save Button oben rechts - nur im Formulare Tab */}
        {activeTab === "forms" && forms.length > 0 && (
          <button 
            className={buttonStyles.create.default}
            onClick={handleSaveSelections}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Speichert...' : 'Änderungen speichern'}</span>
          </button>
        )}

      </div>

      {/* Custom Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
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
            Meta Account
          </button>
          
          <button
            onClick={() => setActiveTab("forms")}
            className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === "forms"
                ? "border-[#FE5B25] text-[#FE5B25]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            role="tab"
          >
            Formulare
          </button>
        </nav>
      </div>

      {/* Meta Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Meta Account Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FFE1D7] rounded-lg">
                    <Facebook className={`${iconSizes.medium} text-[#FE5B25]`} />
                  </div>
                  <div>
                    <CardTitle className={textStyles.sectionTitle}>Verbundener Meta Account</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {metaIntegration ? `Account ID: ${metaIntegration.business_account_id}` : 'Lädt...'}
                    </p>
                  </div>
                </div>
                
                <Badge className="bg-green-50 border-green-600 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {metaIntegration?.status === 'active' ? 'Verbunden' : 'Getrennt'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="font-medium">{metaIntegration?.page_name || 'Lädt...'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Page ID</p>
                  <p className="font-medium">{metaIntegration?.page_id || 'Lädt...'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verbunden seit</p>
                  <p className="font-medium">
                    {metaIntegration 
                      ? new Date(metaIntegration.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        })
                      : 'Lädt...'
                    }
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center ${spacingStyles.buttonSpacing} pt-2 border-t`}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className={`${buttonStyles.secondary.default} flex items-center space-x-2`}>
                      <Trash2 className={iconSizes.small} />
                      <span>Account trennen</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Meta Integration löschen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sind Sie sicher, dass Sie diese Meta Integration trennen möchten? 
                        Alle Lead Formulare werden getrennt und Leads können nicht mehr empfangen werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteIntegration}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Integration löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <button 
                  className={`${buttonStyles.secondary.default} flex items-center space-x-2`}
                  onClick={handleSwitchAccount}
                >
                  <ExternalLink className={iconSizes.small} />
                  <span>Account wechseln</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Info Box for Account Tab */}
          <Card className="border-[#FE5B25] bg-[#FEF5F1]">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-[#FFE1D7] rounded-full">
                  <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#FE5B25]">
                    Meta Account erfolgreich verbunden
                  </p>
                  <p className="text-sm text-[#FE5B25]/80">
                    Dein Meta Business Account ist aktiv und kann Lead Formulare übertragen. 
                    Du kannst jetzt im "Formulare" Tab die gewünschten Lead Formulare auswählen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulare Tab */}
      {activeTab === "forms" && (
        <div className="space-y-6">
          {/* Lead Formulare */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={textStyles.sectionTitle}>
                  Verfügbare Lead Formulare
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {selectedCount} von {forms.length} ausgewählt
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FE5B25]" />
                  <span className="ml-2 text-sm text-muted-foreground">Lade Lead Formulare...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-2"
                    variant="outline"
                  >
                    Erneut versuchen
                  </Button>
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Keine Lead Formulare gefunden</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Erstelle Lead Formulare in deinem Meta Business Manager
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {forms.map((form) => (
                    <Card 
                      key={form.id} 
                      className={`cursor-pointer transition-all ${
                        form.selected 
                          ? "border-[#FE5B25] border-2" 
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => toggleFormSelection(form.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {form.selected ? (
                              <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                            ) : (
                              <Circle className={`${iconSizes.small} text-gray-400`} />
                            )}
                            <div>
                              <CardTitle className={textStyles.cardTitle}>
                                {form.name || form.meta_form_id}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Form ID: {form.meta_form_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Integration: {form.meta_integration}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Erstellt: {new Date(form.created_at).toLocaleDateString('de-DE')}
                            </p>
                            {form.updated_at && (
                              <p className="text-xs text-muted-foreground">
                                Aktualisiert: {new Date(form.updated_at).toLocaleDateString('de-DE')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button für Formulare */}
          {forms.length > 0 && (
            <div className="flex justify-end">
              <button 
                className={buttonStyles.create.default}
                onClick={handleSaveSelections}
                disabled={isLoading}
              >
                <span>{isLoading ? 'Speichert...' : 'Änderungen speichern'}</span>
              </button>
            </div>
          )}

          {/* Info Box for Forms Tab */}
          <Card className="border-[#FE5B25] bg-[#FEF5F1]">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-[#FFE1D7] rounded-full">
                  <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#FE5B25]">
                    Lead Formulare in Agent Konfiguration verfügbar
                  </p>
                  <p className="text-sm text-[#FE5B25]/80">
                    Die ausgewählten Formulare werden automatisch in der Agent Konfiguration 
                    als Lead Quellen angezeigt und können dort den Agenten zugewiesen werden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 