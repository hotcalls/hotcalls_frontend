import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Facebook, Globe, Linkedin, Webhook, Trash2, Play, Pause, Loader2, CheckCircle, Copy, RefreshCw, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI, webhookAPI, funnelAPI } from "@/lib/apiService";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

interface MetaIntegration {
  id: string;
  workspace: string;
  page_id: string;
  page_name?: string;
  page_picture_url?: string;
  business_account_id: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  access_token_expires_at?: string;
}

interface WebhookSource {
  id: string;
  workspace: string;
  lead_funnel: string;
  name: string;
  public_key: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface LeadFunnel {
  id: string;
  workspace: string;
  name: string;
  is_active: boolean;
  agent?: {
    id: string;
    name: string;
    is_active: boolean;
  };
  meta_form?: any;
  webhook_source?: string;
}

export default function LeadSources() {
  const [metaIntegrations, setMetaIntegrations] = useState<MetaIntegration[]>([]);
  const [webhookSources, setWebhookSources] = useState<WebhookSource[]>([]);
  const [leadFunnels, setLeadFunnels] = useState<LeadFunnel[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWebhookNameStep, setIsWebhookNameStep] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isCreatedDialogOpen, setIsCreatedDialogOpen] = useState(false);
  const [createdWebhookUrl, setCreatedWebhookUrl] = useState<string>("");
  const [createdWebhookToken, setCreatedWebhookToken] = useState<string>("");
  const [createdFunnelId, setCreatedFunnelId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [rotatingTokenId, setRotatingTokenId] = useState<string | null>(null);
  const [togglingFunnelId, setTogglingFunnelId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { workspaceDetails } = useWorkspace();
  const { toast } = useToast();

  // Load all lead sources
  const loadAllSources = useCallback(async () => {
    console.log('🔍 Starting to load all lead sources...');
    setIsLoading(true);
    try {
      // Load in parallel for better performance
      const [metaIntegrationsResult, webhookSourcesResult, funnelsResult] = await Promise.allSettled([
        metaAPI.getIntegrations(),
        webhookAPI.listSources(),
        workspaceDetails?.id ? funnelAPI.getLeadFunnels({ workspace: workspaceDetails.id }) : Promise.resolve({ results: [] })
      ]);

      // Handle Meta integrations
      if (metaIntegrationsResult.status === 'fulfilled') {
        const integrations = metaIntegrationsResult.value;
        if (Array.isArray(integrations)) {
          setMetaIntegrations(integrations);
          console.log(`✅ Loaded ${integrations.length} Meta integrations`);
        } else {
          setMetaIntegrations([]);
        }
      } else {
        console.error('❌ Error loading Meta integrations:', metaIntegrationsResult.reason);
        setMetaIntegrations([]);
      }

      // Handle Webhook sources
      if (webhookSourcesResult.status === 'fulfilled') {
        const sources = webhookSourcesResult.value;
        if (Array.isArray(sources)) {
          setWebhookSources(sources);
          console.log(`✅ Loaded ${sources.length} webhook sources`);
        } else if (sources?.results && Array.isArray(sources.results)) {
          setWebhookSources(sources.results);
          console.log(`✅ Loaded ${sources.results.length} webhook sources`);
        } else {
          setWebhookSources([]);
        }
      } else {
        console.error('❌ Error loading webhook sources:', webhookSourcesResult.reason);
        setWebhookSources([]);
      }

      // Handle Lead Funnels
      if (funnelsResult.status === 'fulfilled') {
        const funnels = funnelsResult.value;
        if (Array.isArray(funnels)) {
          setLeadFunnels(funnels);
        } else if (funnels?.results && Array.isArray(funnels.results)) {
          setLeadFunnels(funnels.results);
          console.log(`✅ Loaded ${funnels.results.length} lead funnels`);
        } else {
          setLeadFunnels([]);
        }
      } else {
        console.error('❌ Error loading lead funnels:', funnelsResult.reason);
        setLeadFunnels([]);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading sources:', error);
      setMetaIntegrations([]);
      setWebhookSources([]);
      setLeadFunnels([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 All sources loading completed');
    }
  }, [workspaceDetails?.id]);

  const handleAddLeadSource = async (type: string) => {
    if (type === "Meta") {
      if (!workspaceDetails?.id) {
        console.error('❌ No workspace ID available');
        return;
      }
      
      try {
        console.log('🔗 Starting Meta OAuth flow for workspace:', workspaceDetails.id);
        const { oauth_url } = await metaAPI.getOAuthUrl(workspaceDetails.id);
        
        // Redirect to Meta OAuth
        window.location.href = oauth_url;
      } catch (error) {
        console.error('❌ Failed to get Meta OAuth URL:', error);
        toast({
          title: "Fehler",
          description: "Meta Integration konnte nicht gestartet werden.",
          variant: "destructive",
        });
      }
    }
    if (type === "Webhook") {
      // Show lightweight onboarding CTA instead of creating a webhook now
      setIsWebhookNameStep(true);
      return;
    }
    setIsAddDialogOpen(false);
  };

  const handleCreateWebhook = async () => {
    if (!workspaceDetails?.id) {
      console.error('❌ No workspace ID available');
      return;
    }
    if (!webhookName.trim()) {
      toast({ title: 'Name erforderlich', description: 'Bitte einen Namen für die Webhook-Quelle eingeben.' });
      return;
    }
    try {
      setIsCreatingWebhook(true);
      const res = await webhookAPI.createSource(workspaceDetails.id, webhookName.trim());
      setCreatedWebhookUrl(res.url);
      setCreatedWebhookToken(res.token);
      setCreatedFunnelId(res.lead_funnel);
      setIsWebhookNameStep(false);
      setWebhookName("");
      setIsAddDialogOpen(false);
      setIsCreatedDialogOpen(true);
    } catch (error) {
      console.error('❌ Failed to create webhook source:', error);
      toast({ title: 'Fehler', description: 'Webhook-Quelle konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Kopiert', description: 'In Zwischenablage kopiert.' });
    } catch (e) {
      toast({ title: 'Fehler', description: 'Konnte nicht kopieren.' });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      console.log('🗑️ Deleting Meta integration:', integrationId);
      await metaAPI.deleteIntegration(integrationId);
      
      // Remove from local state
      setMetaIntegrations(prevIntegrations => 
        prevIntegrations.filter(integration => integration.id !== integrationId)
      );
      
      toast({
        title: "Integration gelöscht",
        description: "Meta Integration wurde erfolgreich entfernt.",
      });
    } catch (error) {
      console.error('❌ Failed to delete Meta integration:', error);
      toast({
        title: "Fehler",
        description: "Integration konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFunnel = async (funnelId: string, currentStatus: boolean) => {
    setTogglingFunnelId(funnelId);
    try {
      await funnelAPI.updateFunnel(funnelId, { is_active: !currentStatus });
      
      // Update local state
      setLeadFunnels(prev => prev.map(f => 
        f.id === funnelId ? { ...f, is_active: !currentStatus } : f
      ));
      
      toast({
        title: !currentStatus ? "Aktiviert" : "Deaktiviert",
        description: `Webhook wurde ${!currentStatus ? "aktiviert" : "deaktiviert"}.`,
      });
    } catch (error) {
      console.error('❌ Failed to toggle funnel:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setTogglingFunnelId(null);
    }
  };

  const handleRotateToken = async (webhookId: string) => {
    setRotatingTokenId(webhookId);
    try {
      const response = await webhookAPI.rotateToken(webhookId);
      
      // Show new token in modal
      setCreatedWebhookToken(response.token);
      setCreatedWebhookUrl(response.url);
      setIsCreatedDialogOpen(true);
      
      toast({
        title: "Token rotiert",
        description: "Neuer Token wurde generiert. Bitte kopieren!",
      });
    } catch (error) {
      console.error('❌ Failed to rotate token:', error);
      toast({
        title: "Fehler",
        description: "Token konnte nicht rotiert werden.",
        variant: "destructive",
      });
    } finally {
      setRotatingTokenId(null);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      console.log('🗑️ Deleting webhook source:', webhookId);
      await webhookAPI.deleteSource(webhookId);
      
      // Remove from local state
      setWebhookSources(prev => prev.filter(w => w.id !== webhookId));
      
      toast({
        title: "Webhook gelöscht",
        description: "Webhook-Quelle wurde erfolgreich entfernt.",
      });
    } catch (error) {
      console.error('❌ Failed to delete webhook:', error);
      toast({
        title: "Fehler",
        description: "Webhook konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Check for successful integration after OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      setShowSuccessMessage(true);
      toast({
        title: "Lead-Quelle erfolgreich verbunden",
        description: "Genaue Lead-Quelle in Agent-Einstellungen verbinden",
        duration: 6000,
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide message after 8 seconds
      setTimeout(() => setShowSuccessMessage(false), 8000);
    }
  }, [toast]);

  // Load all sources on mount
  useEffect(() => {
    console.log('🚀 LeadSources component mounted, about to load all sources...');
    console.log('📋 Workspace details:', workspaceDetails);
    try {
      loadAllSources();
    } catch (error) {
      console.error('💥 Error in useEffect:', error);
      setIsLoading(false);
    }
  }, [loadAllSources]);

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Lead-Quelle erfolgreich verbunden</p>
            <p className="text-green-700 text-sm">Genaue Lead-Quelle in Agent-Einstellungen verbinden</p>
          </div>
        </div>
      )}

      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Lead Quellen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deine Lead-Kanäle und Integrationen</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className={buttonStyles.create.default}>
              <Plus className={iconSizes.small} />
              <span>Lead Quelle hinzufügen</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lead Quelle hinzufügen</DialogTitle>
              <DialogDescription>
                Wähle eine Lead Quelle aus, die du mit deinen Agenten verbinden möchtest.
              </DialogDescription>
            </DialogHeader>
            {!isWebhookNameStep ? (
              <div className="grid gap-4 py-4">
                {/* Meta */}
                <button
                  onClick={() => handleAddLeadSource("Meta")}
                  className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
                >
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#FFE1D7]">
                    <Facebook className={`${iconSizes.large} text-blue-600 group-hover:text-[#FE5B25]`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Meta Lead Ads</h3>
                    <p className="text-sm text-muted-foreground">
                      Verbinde deine Facebook und Instagram Lead Formulare
                    </p>
                  </div>
                </button>

                {/* Webhook */}
                <button
                  onClick={() => handleAddLeadSource("Webhook")}
                  className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
                >
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#FFE1D7]">
                    <Webhook className={`${iconSizes.large} text-gray-700 group-hover:text-[#FE5B25]`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Webhook</h3>
                    <p className="text-sm text-muted-foreground">
                      Eigene Website oder Systeme per Webhook verbinden
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Webhook über Onboarding verbinden</h4>
                  <p className="text-sm text-muted-foreground">
                    Um deine eigene Website oder externe Systeme per Webhook anzubinden, buche bitte kurz einen Termin. 
                    Unser Experte hilft dir bei der sauberen Einrichtung.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => { setIsWebhookNameStep(false); setWebhookName(""); }}>Zurück</Button>
                  <a
                    href="https://cal.com/leopoeppelonboarding/austausch-mit-leonhard-poppel"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button>
                      Termin buchen
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Lade Lead Quellen...</span>
        </div>
      )}

      {/* All Lead Sources */}
      {!isLoading && (
        <div className={layoutStyles.cardGrid}>
          {/* Meta Integrations */}
          {Array.isArray(metaIntegrations) && metaIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#FFE1D7] overflow-hidden">
                      {integration.page_picture_url ? (
                        <img 
                          src={integration.page_picture_url} 
                          alt={integration.page_name || 'Meta Page'} 
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <Facebook className={`${iconSizes.large} text-[#FE5B25]`} />
                      )}
                    </div>
                    <div>
                      <CardTitle className={textStyles.cardTitle}>
                        {integration.page_name || 'Meta Lead Ads'}
                      </CardTitle>
                      <p className={textStyles.cardSubtitle}>
                        {integration.page_name ? `Page ID: ${integration.page_id}` : `Page ID: ${integration.page_id}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                    <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                      {integration.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className={buttonStyles.cardAction.iconDelete}>
                          <Trash2 className={iconSizes.small} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Integration löschen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie diese Meta Integration wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteIntegration(integration.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 inline mr-2" />
                  Lead-Quelle verbunden. Genaue Zuordnung in Agent-Einstellungen konfigurieren.
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Webhook Sources */}
          {Array.isArray(webhookSources) && webhookSources.map((webhook) => {
            // Find the associated funnel
            const funnel = leadFunnels.find(f => f.id === webhook.lead_funnel);
            const isActive = funnel?.is_active || false;

            return (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-[#FFE1D7] overflow-hidden">
                        <Webhook className={`${iconSizes.large} text-[#FE5B25]`} />
                      </div>
                      <div>
                        <CardTitle className={textStyles.cardTitle}>
                          {webhook.name}
                        </CardTitle>
                        <p className={textStyles.cardSubtitle}>
                          Webhook • {new Date(webhook.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      
                      <button 
                        onClick={() => handleToggleFunnel(webhook.lead_funnel, isActive)}
                        disabled={togglingFunnelId === webhook.lead_funnel}
                        className={buttonStyles.cardAction.iconDefault}
                      >
                        {togglingFunnelId === webhook.lead_funnel ? (
                          <Loader2 className={`${iconSizes.small} animate-spin`} />
                        ) : isActive ? (
                          <Pause className={iconSizes.small} />
                        ) : (
                          <Play className={iconSizes.small} />
                        )}
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className={buttonStyles.cardAction.iconDelete}>
                            <Trash2 className={iconSizes.small} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Webhook löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Diese Aktion kann nicht rückgängig gemacht werden. Die Webhook-Quelle "{webhook.name}" wird permanent gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWebhook(webhook.id)}>
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 inline mr-2" />
                    Lead-Quelle verbunden. Genaue Zuordnung in Agent-Einstellungen konfigurieren.
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty state */}
          {Array.isArray(metaIntegrations) && metaIntegrations.length === 0 && 
           Array.isArray(webhookSources) && webhookSources.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <Facebook className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Keine Lead Quellen verbunden</h3>
                <p className="text-gray-500 mb-4">
                  Verbinde deine Meta Lead Ads um automatisch Leads zu empfangen
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Lead Quelle hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Created Webhook Modal (one-time token reveal) */}
      <Dialog open={isCreatedDialogOpen} onOpenChange={setIsCreatedDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook erstellt</DialogTitle>
            <DialogDescription>
              Diese Informationen werden nur einmal angezeigt. Bitte sicher speichern.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium block">POST URL</label>
              <div className="flex items-center gap-3">
                <textarea 
                  readOnly 
                  value={createdWebhookUrl} 
                  rows={2}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono resize-none overflow-hidden" 
                />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdWebhookUrl)} className="shrink-0">
                  Kopieren
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium block">Header</label>
              <div className="flex items-center gap-3">
                <textarea 
                  readOnly 
                  value={`Authorization: Bearer ${createdWebhookToken}`} 
                  rows={3}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 font-mono text-sm resize-none overflow-hidden" 
                />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(`Authorization: Bearer ${createdWebhookToken}`)} className="shrink-0">
                  Kopieren
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium block">Beispiel-Payload</label>
              <div className="relative">
                <pre className="p-4 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
{`{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+491234567890",
  "variables": { "utm_source": "landingpage" },
  "external_id": "optional-unique-id"
}`}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Optionale Felder: <code className="bg-gray-100 px-1 rounded">variables</code> (object), <code className="bg-gray-100 px-1 rounded">external_id</code> (string)
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Wichtig:</strong> Der Bearer Token wird nur jetzt angezeigt. Bitte sicher speichern!
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsCreatedDialogOpen(false)} className="px-6">
              Fertig
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}