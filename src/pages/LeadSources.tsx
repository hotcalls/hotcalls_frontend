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
import { metaAPI, webhookAPI, funnelAPI, agentAPI, callAPI } from "@/lib/apiService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
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
  // Optional count provided by backend: /api/funnels/lead-funnels/ -> lead_count
  lead_count?: number;
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
  const [useDemoCsv, setUseDemoCsv] = useState(false); // legacy flag, no longer used for rendering
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
  const [dialogDetectedVars, setDialogDetectedVars] = useState<string[]>([]);
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
  const [deleteConfirmFunnelId, setDeleteConfirmFunnelId] = useState<string | null>(null);
  const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null);
  // Schedule calls dialog state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleFunnelId, setScheduleFunnelId] = useState<string | null>(null);
  const [scheduleAgents, setScheduleAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<'now'|'later'>("now");
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  // Minimal stats per CSV funnel: lead count + variable keys
  const [csvStatsByFunnel, setCsvStatsByFunnel] = useState<Record<string, { count: number; variables: string[] }>>({});
  const navigate = useNavigate();
  const { workspaceDetails } = useWorkspace();
  const { toast } = useToast();

  // Resolve display name for a CSV funnel (prefer stored filename override)
  const resolveFunnelName = useCallback((funnelId: string, fallbackName: string) => {
    try {
      const key = `csv:name:${workspaceDetails?.id || 'ws'}:${funnelId}`;
      const val = localStorage.getItem(key);
      if (val && val.trim().length > 0) return val;
    } catch {}
    return fallbackName;
  }, [workspaceDetails?.id]);

  // Load all lead sources
  const loadAllSources = useCallback(async () => {
    console.log('🔍 Starting to load all lead sources...');
    setIsLoading(true);
    try {
      // Load real connections (Meta + Webhook) and CSV funnels for this workspace
      const [metaIntegrationsResult, webhookSourcesResult, funnelsResult] = await Promise.allSettled([
        metaAPI.getIntegrations(),
        webhookAPI.listSources(),
        workspaceDetails?.id ? funnelAPI.getLeadFunnels({ workspace: workspaceDetails.id, ordering: '-created_at' }) : Promise.resolve([] as any[]),
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

      // Handle Webhook sources - disabled for CSV-only mode
        setWebhookSources([]);

      // Handle CSV funnels (filter out Meta and Webhook based funnels)
      if (funnelsResult.status === 'fulfilled') {
        const allFunnels = (funnelsResult.value as any[]) || [];
        const csvOnly = allFunnels.filter((f: any) => !f.meta_lead_form && !f.webhook_source);
        setCsvFunnels(csvOnly);
        // Seed stats map with server-provided lead_count to avoid flashing 0
        setCsvStatsByFunnel(prev => {
          const next: Record<string, { count: number; variables: string[] }> = { ...prev };
          csvOnly.forEach((f: any) => {
            const existing = next[f.id] || { count: 0, variables: [] as string[] };
            const serverCount = typeof f.lead_count === 'number' ? f.lead_count : existing.count;
            next[f.id] = { count: serverCount, variables: existing.variables };
          });
          return next;
        });
        // do not show demo placeholder anymore
      } else {
        setCsvFunnels([]);
        // keep empty state
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

  // Load minimal stats for a CSV funnel via API
  const loadCsvFunnelStats = useCallback(async (funnelId: string) => {
    if (!workspaceDetails?.id) return;
    try {
      // 1) Variables defined for this funnel via API (authoritative)
      let variableKeys: string[] = [];
      try {
        const vars = await funnelAPI.getFunnelVariables(funnelId);
        variableKeys = Array.isArray(vars) ? vars.map((v: any) => v.key) : [];
      } catch (e) {
        console.error('⚠️ Funnel variables API error', e);
      }

      // 2) Lead count for this funnel
      let page = 1; let total = 0; const PAGE_SIZE = 100; const MAX_PAGES = 50;
      while (page <= MAX_PAGES) {
        const resp: any = await leadAPI.getLeads({ page, page_size: PAGE_SIZE, workspace: workspaceDetails.id, ordering: '-created_at' } as any);
        const results: any[] = resp?.results || [];
        if (results.length === 0) break;
        total += results.filter((l: any) => (l.lead_funnel?.id === funnelId) || (l.lead_funnel === funnelId)).length;
        if (!resp.next) break; page += 1;
      }

      // Fallback: infer from recent leads in this funnel (meta_data/variables)
      if (variableKeys.length === 0) {
        try {
          let p = 1; const keys = new Set<string>();
          const MAX_PAGES = 3; // light sampling
          while (p <= MAX_PAGES) {
            const resp: any = await leadAPI.getLeads({ page: p, page_size: 100, workspace: workspaceDetails.id, ordering: '-created_at' } as any);
            const results: any[] = resp?.results || [];
            if (results.length === 0) break;
            results
              .filter((l: any) => (l.lead_funnel?.id === funnelId) || (l.lead_funnel === funnelId))
              .forEach((l: any) => {
                const meta = l.meta_data || l.variables || {};
                Object.keys(meta || {}).forEach(k => keys.add(k));
              });
            if (!resp.next) break; p += 1;
          }
          variableKeys = Array.from(keys);
        } catch (e) {
          console.error('⚠️ Variable inference fallback failed', e);
        }
      }

      // Remove core contact fields from display variables
      const coreDisplay = new Set(['name','first_name','firstname','surname','last_name','lastname','email','phone','full_name']);
      variableKeys = (variableKeys || []).filter(k => !coreDisplay.has(String(k).toLowerCase()));

      // Preserve existing non-empty cache to avoid flashing 0/empty shortly after import
      setCsvStatsByFunnel(prev => {
        const existing = prev[funnelId] || { count: 0, variables: [] as string[] };
        const nextCount = total > 0 ? total : existing.count || 0;
        const nextVars = (variableKeys && variableKeys.length > 0) ? variableKeys : (existing.variables || []);
        return { ...prev, [funnelId]: { count: nextCount, variables: nextVars } };
      });
    } catch {}
  }, [workspaceDetails?.id]);

  // Refresh stats whenever CSV funnels change
  useEffect(() => {
    if (Array.isArray(csvFunnels) && csvFunnels.length > 0) {
      Promise.all(csvFunnels.map((f: any) => loadCsvFunnelStats(f.id))).catch(() => {});
    }
  }, [csvFunnels, loadCsvFunnelStats]);

  const openScheduleDialog = async (funnelId: string) => {
    setScheduleFunnelId(funnelId);
    setScheduleOpen(true);
    try {
      const agents = await agentAPI.getAgents(workspaceDetails?.id);
      setScheduleAgents(Array.isArray(agents) ? agents : []);
      if (Array.isArray(agents) && agents.length > 0) {
        const first = agents[0];
        setSelectedAgentId(first.agent_id);
      }
    } catch (e) {
      console.error('❌ Failed to load agents:', e);
      setScheduleAgents([]);
    }
  };

  const scheduleCallsForFunnel = async () => {
    if (!scheduleFunnelId || !selectedAgentId || !workspaceDetails?.id) return;
    setIsScheduling(true);
    try {
      // collect all leads for this funnel
      let page = 1; const ids: string[] = []; const MAX = 5000;
      while (ids.length < MAX) {
        const resp: any = await leadAPI.getLeads({ page, page_size: 100, workspace: workspaceDetails.id, ordering: '-created_at' } as any);
        const results: any[] = resp?.results || [];
        if (results.length === 0) break;
        results.filter((l: any) => (l.lead_funnel?.id === scheduleFunnelId) || (l.lead_funnel === scheduleFunnelId))
               .forEach((l: any) => ids.push(l.id));
        if (!resp.next) break; page += 1;
      }
      if (ids.length === 0) {
        toast({ title: 'No leads found', description: 'This CSV source has no leads to call yet.' });
        setIsScheduling(false);
        return;
      }
      // optional next_call time
      const nextCall = scheduleMode === 'later' && scheduleAt ? scheduleAt : undefined;
      for (let i = 0; i < ids.length; i += 25) {
        const slice = ids.slice(i, i + 25);
        await Promise.all(slice.map(async (id) => {
          try { await callAPI.createTask({ workspace: workspaceDetails.id, agent: selectedAgentId, target_ref: `lead:${id}`, ...(nextCall ? { next_call: nextCall } : {}) }); } catch {}
        }));
      }
      setScheduleOpen(false);
      toast({ title: 'Calls scheduled', description: `${ids.length} leads queued for calling.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not schedule calls.', variant: 'destructive' });
    } finally {
      setIsScheduling(false);
    }
  };

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

  // Populate state with a demo CSV of 20 leads
  const populateDemoCsv = () => {
    const demoRows: Record<string, any>[] = Array.from({ length: 20 }).map((_, idx) => {
      const id = idx + 1;
      return {
        name: `Demo${id}`,
        surname: `User${id}`,
        email: `demo${id}@example.com`,
        phone: `+4915123456${String(id).padStart(2,'0')}`,
      };
    });
    setCsvParsedRows(demoRows);
    setCsvParseInfo({ delimiter: ',', header: ['name','surname','email','phone'], filename: 'demo.csv' });
    setCsvImportResult(null);
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

  // Remove any legacy query handling; do not auto-open dialogs

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
          <p className={textStyles.pageSubtitle}>Upload and manage your CSV leads</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Reset CSV step when dialog closes
            setIsCsvStep(false);
            setCsvImportResult(null);
            setCsvParsedRows([]);
            setCsvParseInfo(null);
            setDialogDetectedVars([]);
          }
        }}>
          <DialogTrigger asChild>
            <button 
              className={buttonStyles.create.default}
              onClick={() => {
                setIsAddDialogOpen(true);
                setIsCsvStep(true);  // Direkt zum CSV Upload
              }}
            >
              <Plus className={iconSizes.small} />
              <span>CSV Upload</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>CSV Upload</DialogTitle>
              <DialogDescription>
                Upload your leads via CSV file.
              </DialogDescription>
            </DialogHeader>
            {isCsvStep && (
              // CSV Step
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Upload CSV</h4>
                  <p className="text-sm text-muted-foreground">
                    Required columns: name, surname, email, phone. Extra columns are captured as variables.
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
                        // reset demo indicator if any (no-op now)
                        // Pre-calc preview variables from header (exclude core fields)
                        try {
                          const header = (info?.header || []) as string[];
                          const core = new Set(['name','first name','firstname','surname','last name','lastname','email','e-mail','phone','telefon','mobile','tel','full_name','full name']);
                          const preview = header.filter(h => !core.has(h.toLowerCase().trim()));
                          setDialogDetectedVars(preview);
                        } catch {}
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
                        {/* Variables detected from this import (authoritative) */}
                        <div className="p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="font-medium mb-1">Detected variables</div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              if (isUploadingCsv) {
                                return (
                                  <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Importing and analyzing…
                                  </span>
                                );
                              }
                              const shown = dialogDetectedVars.length > 0
                                ? dialogDetectedVars
                                : (csvImportResult?.detected_variable_keys || []);
                              if (!shown || shown.length === 0) {
                                return <span className="text-xs text-gray-500">Will appear after import</span>;
                              }
                              return shown.map((v: string) => (
                                <span key={v} className="px-2 py-1 text-xs rounded-full bg-white border">
                                  {v}
                                </span>
                              ));
                            })()}
                          </div>
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
                    {Array.isArray(csvImportResult.detected_variable_keys) && csvImportResult.detected_variable_keys.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="font-medium mb-1">Detected variables</div>
                        <div className="flex flex-wrap gap-2">
                          {csvImportResult.detected_variable_keys.map((v) => (
                            <span key={v} className="px-2 py-1 text-xs rounded-full bg-white border">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {csvImportResult.failed_creates > 0 && (
                      <div className="p-3 bg-amber-50 rounded border border-amber-200">
                        {csvImportResult.failed_creates} rows with errors.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-2">
                  <Button variant="outline" onClick={() => { 
                    setIsCsvStep(false); 
                    setCsvImportResult(null); 
                    setCsvParsedRows([]);
                    setCsvParseInfo(null);
                    setIsAddDialogOpen(false);
                    setDialogDetectedVars([]);
                  }}>Close</Button>
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
                            
                            // Map common column names to expected backend fields
                            const mappedRows = csvParsedRows.map(row => {
                              const mappedRow: any = {};
                              Object.keys(row).forEach(key => {
                                const lowerKey = key.toLowerCase().trim();
                                if (lowerKey === 'first name' || lowerKey === 'firstname' || lowerKey === 'vorname') {
                                  mappedRow.name = row[key];
                                } else if (lowerKey === 'last name' || lowerKey === 'lastname' || lowerKey === 'nachname' || lowerKey === 'surname') {
                                  mappedRow.surname = row[key];
                                } else if (lowerKey === 'email' || lowerKey === 'e-mail') {
                                  mappedRow.email = row[key];
                                } else if (lowerKey === 'phone' || lowerKey === 'telefon' || lowerKey === 'mobile' || lowerKey === 'tel') {
                                  mappedRow.phone = row[key];
                                } else if (lowerKey === 'name') {
                                  mappedRow.name = row[key];
                                } else {
                                  // Other columns go to meta_data
                                  if (!mappedRow.meta_data) mappedRow.meta_data = {};
                                  mappedRow.meta_data[key] = row[key];
                                }
                              });
                              return mappedRow;
                            });
                            
                            // Create leads and wait briefly so backend prepares variables
                            const res = await leadAPI.bulkCreateLeads(mappedRows);
                            await new Promise(r => setTimeout(r, 1200));
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
                                filename: csvParseInfo?.filename || null,
                                ts: Date.now(),
                              }));
                            }
                            // Refresh funnels and eagerly load variables for CSV funnels
                            try { 
                              const updated = await funnelAPI.getLeadFunnels({ workspace: workspaceDetails?.id || '', ordering: '-created_at' });
                              if (Array.isArray(updated)) {
                                const csvOnly = updated.filter((f:any)=>!f.meta_lead_form && !f.webhook_source);
                                setLeadFunnels(csvOnly);
                                // Load variables for all CSV funnels
                                await Promise.all(csvOnly.map((f:any)=>loadCsvFunnelStats(f.id)));
                                // Pick most recent (API already ordered)
                                const pick = csvOnly[0] || csvOnly[csvOnly.length-1];
                                if (pick?.id) {
                                  // Store filename as display name override for this funnel
                                  try {
                                    const display = (csvParseInfo?.filename || '').trim();
                                    if (display) {
                                      const key = `csv:name:${workspaceDetails?.id || 'ws'}:${pick.id}`;
                                      localStorage.setItem(key, display);
                                      // Persist to backend so it shows in API as well
                                      try {
                                        await funnelAPI.updateFunnel(pick.id, { name: display });
                                      } catch (e) {
                                        console.warn('Funnel rename failed, using local override only', e);
                                      }
                                    }
                                  } catch {}
                                  try {
                                    const v = await funnelAPI.getFunnelVariables(pick.id);
                                    const keys = Array.isArray(v) ? v.map((x:any)=>x.key) : [];
                                    // fallback: compute keys from uploaded rows meta_data
                                    let fallbackKeys: string[] = [];
                                    try {
                                      const set = new Set<string>();
                                      mappedRows.forEach((m:any)=> Object.keys(m?.meta_data || {}).forEach(k=> set.add(k)));
                                      fallbackKeys = Array.from(set);
                                    } catch {}
                                    const finalKeys = (keys && keys.length > 0) ? keys : fallbackKeys;
                                    if (finalKeys.length > 0) {
                                      setDialogDetectedVars(finalKeys);
                                      setCsvStatsByFunnel(prev => ({ ...prev, [pick.id]: { count: res.total_leads || csvParsedRows.length, variables: finalKeys } }));
                                    }
                                  } catch {}
                                }
                              }
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


          {/* CSV Sources (real only) */}
          {csvFunnels.map((funnel: any) => (
            <Card key={funnel.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white overflow-hidden">
                      <img src="/csv icon.png" alt="CSV" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <CardTitle className={textStyles.cardTitle}>
                        {resolveFunnelName(funnel.id, funnel.name || 'CSV Source')}
                      </CardTitle>
                      <div className="text-xs text-gray-500 mt-1">
                        {(csvStatsByFunnel[funnel.id]?.count ?? 0)} leads
                        {csvStatsByFunnel[funnel.id]?.variables?.length ? ` · vars: ${csvStatsByFunnel[funnel.id].variables.join(', ')}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                    <Badge variant={funnel.is_active ? 'default' : 'secondary'}>
                      {funnel.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => openScheduleDialog(funnel.id)}
                    >
                      Schedule calls
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      title="Delete CSV source"
                      onClick={() => setDeleteConfirmFunnelId(funnel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
            </Card>
          ))}



          {/* Empty state */}
          {Array.isArray(csvFunnels) && csvFunnels.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <img src="/csv icon.png" alt="CSV" className="h-12 w-12 mx-auto mb-4 object-contain opacity-70" />
                <h3 className="text-lg font-medium mb-2">No CSV leads uploaded</h3>
                <p className="text-gray-500 mb-4">
                  Upload your leads through CSV upload
                </p>
                <Button onClick={() => { setIsAddDialogOpen(true); setIsCsvStep(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  CSV Upload
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

      {/* Schedule Calls Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule calls</DialogTitle>
            <DialogDescription>Choose agent and time to call all leads from this source.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Which agent?</div>
              <Select value={selectedAgentId || ""} onValueChange={(v)=>setSelectedAgentId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleAgents.map((a:any)=> (
                    <SelectItem key={a.agent_id} value={a.agent_id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">When?</div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" checked={scheduleMode==='now'} onChange={()=>setScheduleMode('now')} /> Now</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" checked={scheduleMode==='later'} onChange={()=>setScheduleMode('later')} /> Pick time</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={scheduleMode!=='later'} className="justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {scheduleAt ? new Date(scheduleAt).toLocaleString() : 'Select date & time'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="grid gap-3">
                      <CalendarUI
                        mode="single"
                        selected={scheduleAt ? new Date(scheduleAt) : undefined}
                        onSelect={(d:any)=>{
                          if (!d) return;
                          const iso = new Date(d).toISOString().slice(0,16);
                          const existing = scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(11,16) : '09:00';
                          setScheduleAt(`${iso.slice(0,10)}T${existing}`);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(11,13) : '09'}
                          onValueChange={(hh)=>{
                            const base = scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(0,10) : new Date().toISOString().slice(0,10);
                            const mm = scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(14,16) : '00';
                            setScheduleAt(`${base}T${hh}:${mm}`);
                          }}
                        >
                          <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=> (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(14,16) : '00'}
                          onValueChange={(mm)=>{
                            const base = scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(0,10) : new Date().toISOString().slice(0,10);
                            const hh = scheduleAt && scheduleAt.length>=16 ? scheduleAt.slice(11,13) : '09';
                            setScheduleAt(`${base}T${hh}:${mm}`);
                          }}
                        >
                          <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['00','15','30','45'].map(m=> (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={scheduleCallsForFunnel} disabled={!selectedAgentId || isScheduling}>
              {isScheduling ? 'Scheduling…' : 'Schedule calls'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmFunnelId} onOpenChange={(open)=>{ if (!open) setDeleteConfirmFunnelId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete CSV lead source</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setDeleteConfirmFunnelId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!!deletingFunnelId}
              onClick={async ()=>{
                if (!deleteConfirmFunnelId) return;
                try {
                  setDeletingFunnelId(deleteConfirmFunnelId);
                  await funnelAPI.deleteFunnel(deleteConfirmFunnelId);
                  setCsvFunnels(prev => prev.filter((f:any)=> f.id !== deleteConfirmFunnelId));
                  setDeleteConfirmFunnelId(null);
                  toast({ title: 'Deleted', description: 'Lead source removed.' });
                } catch (e) {
                  console.error('❌ Delete funnel failed', e);
                  toast({ title: 'Error', description: 'Could not delete lead source.', variant: 'destructive' });
                } finally {
                  setDeletingFunnelId(null);
                }
              }}
            >
              {deletingFunnelId ? 'Deleting…' : 'Delete'}
            </Button>
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