import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { leadAPI } from "@/lib/apiService";
import { Plus, Facebook, Globe, Linkedin, Webhook, Trash2, Play, Pause, Loader2, CheckCircle, Copy, RefreshCw, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI, webhookAPI, funnelAPI } from "@/lib/apiService";
import React from "react";
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
  const [csvFunnels, setCsvFunnels] = useState<LeadFunnel[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCsvStep, setIsCsvStep] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvParsedRows, setCsvParsedRows] = useState<Record<string, any>[]>([]);
  const [csvParseInfo, setCsvParseInfo] = useState<{ delimiter: string; header: string[]; filename?: string } | null>(null);
  const [csvImportResult, setCsvImportResult] = useState<null | {
    import_batch_id?: string;
    created_lead_ids: string[];
    total_leads: number;
    successful_creates: number;
    failed_creates: number;
    errors: Array<{ index: number; error: any }>;
    detected_variable_keys?: string[];
  }>(null);
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
      // Load real connections (Meta + Webhook) and CSV funnels for this workspace
      const [metaIntegrationsResult, webhookSourcesResult, funnelsResult] = await Promise.allSettled([
        metaAPI.getIntegrations(),
        webhookAPI.listSources(),
        workspaceDetails?.id ? funnelAPI.getLeadFunnels({ workspace: workspaceDetails.id }) : Promise.resolve([] as any[]),
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

      // Handle CSV funnels (filter out Meta and Webhook based funnels)
      if (funnelsResult.status === 'fulfilled') {
        const allFunnels = (funnelsResult.value as any[]) || [];
        const csvOnly = allFunnels.filter((f: any) => !f.meta_lead_form && !f.webhook_source);
        setCsvFunnels(csvOnly);
      } else {
        setCsvFunnels([]);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading sources:', error);
      setMetaIntegrations([]);
      setWebhookSources([]);
      setLeadFunnels([]);
      setCsvFunnels([]);
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
          title: "Error",
          description: "Meta Integration could not be started.",
          variant: "destructive",
        });
      }
    }
    if (type === "Webhook") {
      // Show lightweight onboarding CTA instead of creating a webhook now
      setIsWebhookNameStep(true);
      return;
    }
    if (type === "CSV") {
      setIsCsvStep(true);
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
      toast({ title: 'Name required', description: 'Please enter a name for the webhook source.' });
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
      toast({ title: 'Error', description: 'Webhook source could not be created.', variant: 'destructive' });
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not copy.' });
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
        title: "Integration deleted",
        description: "Meta Integration was successfully removed.",
      });
    } catch (error) {
      console.error('❌ Failed to delete Meta integration:', error);
      toast({
        title: "Error",
        description: "Integration could not be deleted.",
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
        title: !currentStatus ? "Activated" : "Deactivated",
        description: `Webhook was ${!currentStatus ? "activated" : "deactivated"}.`,
      });
    } catch (error) {
      console.error('❌ Failed to toggle funnel:', error);
      toast({
        title: "Error",
        description: "Status could not be changed.",
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
        title: "Token rotated",
        description: "New token generated. Please copy!",
      });
    } catch (error) {
      console.error('❌ Failed to rotate token:', error);
      toast({
        title: "Error",
        description: "Token could not be rotated.",
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
        title: "Webhook deleted",
        description: "Webhook source was successfully removed.",
      });
    } catch (error) {
      console.error('❌ Failed to delete webhook:', error);
      toast({
        title: "Error",
        description: "Webhook could not be deleted.",
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
        title: "Lead source successfully connected",
        description: "Configure exact lead source in agent settings",
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
            <p className="text-green-800 font-medium">Lead source successfully connected</p>
            <p className="text-green-700 text-sm">Configure exact lead source in agent settings</p>
          </div>
        </div>
      )}

      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Lead sources</h1>
          <p className={textStyles.pageSubtitle}>Manage your lead channels and integrations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className={buttonStyles.create.default}>
              <Plus className={iconSizes.small} />
              <span>Add lead source</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add lead source</DialogTitle>
              <DialogDescription>
                Choose a lead source to connect with your agents.
              </DialogDescription>
            </DialogHeader>
            {!isWebhookNameStep && !isCsvStep ? (
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
                      Connect your Facebook and Instagram lead forms
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
                      Connect your website or systems via webhook
                    </p>
                  </div>
                </button>

                {/* CSV Import */}
                <button
                  onClick={() => handleAddLeadSource("CSV")}
                  className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
                >
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#FFE1D7]">
                    <Globe className={`${iconSizes.large} text-gray-700 group-hover:text-[#FE5B25]`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">CSV Import</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload CSV: first name, last name, email, phone. Extra columns become variables.
                    </p>
                  </div>
                </button>
              </div>
            ) : isWebhookNameStep ? (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Connect webhook via onboarding</h4>
                  <p className="text-sm text-muted-foreground">
                    To connect your website or external systems via webhook, please book a short call. Our expert will help you set it up correctly.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => { setIsWebhookNameStep(false); setWebhookName(""); }}>Back</Button>
                  <a
                    href="https://cal.com/leopoeppelonboarding/austausch-mit-leonhard-poppel"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button>Book a call</Button>
                  </a>
                </div>
              </div>
            ) : (
              // CSV Step
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Upload CSV</h4>
                  <p className="text-sm text-muted-foreground">
                    Required columns: first name, last name, email, phone. Extra columns are captured as variables.
                  </p>
                </div>

                {!csvImportResult && (
                  <>
                    <CsvUploadInline
                      isUploading={isUploadingCsv}
                      onParsed={(rows, info) => {
                        setCsvParsedRows(rows);
                        setCsvParseInfo(info);
                        setCsvImportResult(null);
                      }}
                    />

                    {csvParsedRows.length > 0 && (
                      <div className="space-y-2 text-sm">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="font-medium">File selected</div>
                          <div>{csvParseInfo?.filename || 'CSV'} • {csvParsedRows.length} rows</div>
                          {csvParsedRows.length > 10000 && (
                            <div className="mt-2 text-red-600">Maximum 10,000 rows per CSV.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {csvImportResult && (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="font-medium">Import completed</div>
                      <div>{csvImportResult.successful_creates} / {csvImportResult.total_leads} leads imported</div>
                    </div>
                    {csvImportResult.failed_creates > 0 && (
                      <div className="p-3 bg-amber-50 rounded border border-amber-200">
                        {csvImportResult.failed_creates} rows with errors.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-2">
                  <Button variant="outline" onClick={() => { setIsCsvStep(false); setCsvImportResult(null); setCsvParsedRows([]); }}>Back</Button>
                  {!csvImportResult && (
                    <div className="ml-auto flex gap-2">
                      <Button
                        variant="default"
                        disabled={isUploadingCsv || csvParsedRows.length === 0 || csvParsedRows.length > 10000}
                        onClick={async () => {
                          if (csvParsedRows.length === 0) return;
                          if (csvParsedRows.length > 10000) { toast({ title: 'Limit reached', description: 'Maximum 10,000 rows per CSV allowed.', variant: 'destructive' }); return; }
                          try {
                            setIsUploadingCsv(true);
                            const res = await leadAPI.bulkCreateLeads(csvParsedRows as any);
                            setCsvImportResult({
                              import_batch_id: res.import_batch_id,
                              created_lead_ids: res.created_lead_ids || [],
                              total_leads: res.total_leads,
                              successful_creates: res.successful_creates,
                              failed_creates: res.failed_creates,
                              errors: res.errors || [],
                              detected_variable_keys: res.detected_variable_keys || [],
                            });
                            if (res.import_batch_id) {
                              const key = `csv:${workspaceDetails?.id || 'ws'}:${res.import_batch_id}`;
                              localStorage.setItem(key, JSON.stringify({
                                import_batch_id: res.import_batch_id,
                                created_lead_ids: res.created_lead_ids || [],
                                detected_variable_keys: res.detected_variable_keys || [],
                                lead_funnel_id: res.lead_funnel_id || null,
                                ts: Date.now(),
                              }));
                            }
                            // Refresh lead funnels so the new CSV funnel erscheint sofort
                            try { 
                              const updatedFunnels = await funnelAPI.getLeadFunnels({ workspace: workspaceDetails?.id || '' });
                              if (Array.isArray(updatedFunnels)) setLeadFunnels(updatedFunnels);
                            } catch {}
                            toast({ title: 'CSV imported', description: `${res.successful_creates} of ${res.total_leads} leads imported.` });
                          } catch (e) {
                            console.error(e);
                            toast({ title: 'Error', description: 'CSV import failed.', variant: 'destructive' });
                          } finally {
                            setIsUploadingCsv(false);
                          }
                        }}
                      >
                        {isUploadingCsv ? 'Importing…' : 'Import leads'}
                      </Button>
                    </div>
                  )}
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
          <span className="ml-2">Loading lead sources...</span>
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
                      {integration.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className={buttonStyles.cardAction.iconDelete}>
                          <Trash2 className={iconSizes.small} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete integration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Do you really want to delete this Meta integration? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteIntegration(integration.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
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
                  Lead source connected. Configure exact assignment in agent settings.
                </div>
              </CardContent>
            </Card>
          ))}

          {/* CSV Sources */}
          {Array.isArray(csvFunnels) && csvFunnels.length > 0 && csvFunnels.map((funnel) => (
            <Card key={funnel.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#FFE1D7] overflow-hidden">
                      <Globe className={`${iconSizes.large} text-[#FE5B25]`} />
                    </div>
                    <div>
                      <CardTitle className={textStyles.cardTitle}>
                        {funnel.name || 'CSV Source'}
                      </CardTitle>
                      <p className={textStyles.cardSubtitle}>
                        CSV • {funnel.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                    <Badge variant={funnel.is_active ? 'default' : 'secondary'}>
                      {funnel.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  CSV‑Lead‑Source available. Configure exact assignment in agent‑settings.
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Webhook Sources */}
          {Array.isArray(webhookSources) && webhookSources.map((webhook) => {
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
                      <Badge variant={'default'}>
                        Connected
                      </Badge>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className={buttonStyles.cardAction.iconDelete}>
                            <Trash2 className={iconSizes.small} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The webhook source "{webhook.name}" will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWebhook(webhook.id)}>
                              Delete
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
                    Lead source connected. Configure exact assignment in agent settings.
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty state */}
          {Array.isArray(metaIntegrations) && metaIntegrations.length === 0 && 
           Array.isArray(webhookSources) && webhookSources.length === 0 &&
           Array.isArray(csvFunnels) && csvFunnels.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <Facebook className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No lead sources connected</h3>
                <p className="text-gray-500 mb-4">
                  Connect Meta, Webhook, or upload CSV leads to start receiving leads automatically
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add lead source
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
            <DialogTitle>Webhook created</DialogTitle>
            <DialogDescription>This information is shown only once. Please store it safely.</DialogDescription>
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
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium block">Headers</label>
              <div className="flex items-center gap-3">
                <textarea 
                  readOnly 
                  value={`Authorization: Bearer ${createdWebhookToken}`} 
                  rows={3}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 font-mono text-sm resize-none overflow-hidden" 
                />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(`Authorization: Bearer ${createdWebhookToken}`)} className="shrink-0">
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium block">Sample payload</label>
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
              <p className="text-xs text-gray-500 mt-2">Optional fields: <code className="bg-gray-100 px-1 rounded">variables</code> (object), <code className="bg-gray-100 px-1 rounded">external_id</code> (string)</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Important:</strong> The bearer token is shown only now. Please store it safely!
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsCreatedDialogOpen(false)} className="px-6">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline, minimal CSV upload component (no external deps)
function CsvUploadInline({ isUploading, onParsed }: { isUploading: boolean; onParsed: (rows: Record<string, any>[], info: { delimiter: string; header: string[]; filename?: string }) => void; }) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const dropRef = React.useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const sniffDelimiter = (line: string): string => {
    const candidates = [',', ';', '\t', '|'];
    let best = ','; let bestCount = -1;
    for (const c of candidates) {
      const count = (line.match(new RegExp(`\\${c}`, 'g')) || []).length;
      if (count > bestCount) { best = c; bestCount = count; }
    }
    return best;
  };

  const parseCsv = async (file: File): Promise<{ rows: Record<string, any>[]; info: { delimiter: string; header: string[]; filename?: string } }> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], info: { delimiter: ',', header: [], filename: file.name } };
    const delimiter = sniffDelimiter(lines[0]);
    const header = lines[0].split(delimiter).map(h => h.trim());
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter);
      const obj: Record<string, any> = {};
      header.forEach((h, idx) => {
        obj[h] = (cols[idx] ?? '').trim();
      });
      rows.push(obj);
    }
    return { rows, info: { delimiter, header, filename: file.name } };
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const { rows, info } = await parseCsv(file);
          onParsed(rows, info);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer?.files?.[0];
          if (!file) return;
          const { rows, info } = await parseCsv(file);
          onParsed(rows, info);
        }}
        className={`border-2 border-dashed rounded-md p-6 text-center ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
      >
        <p className="text-sm text-gray-600 mb-3">Drag and drop a file here or click to select a CSV</p>
        <Button variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? 'Uploading…' : 'Select CSV'}
        </Button>
      </div>
    </div>
  );
}