import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Phone, Calendar, Building, Hash, Eye, Facebook, PhoneCall } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { leadAPI, Lead, LeadsListResponse, funnelAPI, agentAPI } from "@/lib/apiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: "alle",
    source: "alle", 
    agent: "alle",
    integration_provider: "alle"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1
  });
  
  const { workspaceDetails } = useWorkspace();
  const { toast } = useToast();

  // CSV funnel presence and selection
  const [csvFunnels, setCsvFunnels] = useState<any[]>([]);
  const [selectedCsvFunnelId, setSelectedCsvFunnelId] = useState<string>("");
  const [agents, setAgents] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<'now'|'later'>('now');
  const [scheduleAt, setScheduleAt] = useState<string>("");

  // Load leads from API
  const loadLeads = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {
        page,
        page_size: 20,
        ordering: '-created_at', // Newest first
      };
      
      // Add workspace filter - only current workspace leads
      if (workspaceDetails?.id) {
        params.workspace = workspaceDetails.id;
      }
      
      // Add search filter
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      // Add integration provider filter
      if (filters.integration_provider !== "alle") {
        params.integration_provider = filters.integration_provider;
      }
      
      console.log('🔍 Loading leads with params:', params);
      const response: LeadsListResponse = await leadAPI.getLeads(params);
      
      setLeads(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: page
      });
      
      console.log(`✅ Loaded ${response.results?.length || 0} leads`);
    } catch (err) {
      console.error('❌ Error loading leads:', err);
      setError('Fehler beim Laden der Leads');
      toast({
        title: "Fehler",
        description: "Leads konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceDetails?.id, searchTerm, filters, toast]);

  // Load leads when component mounts or dependencies change
  useEffect(() => {
    if (workspaceDetails?.id) {
      loadLeads();
    }
  }, [loadLeads, workspaceDetails?.id]);

  // Load CSV funnels and agents for visibility of "Anrufe planen"
  useEffect(() => {
    (async () => {
      try {
        if (!workspaceDetails?.id) return;
        const funnels = await funnelAPI.getLeadFunnels({ workspace: workspaceDetails.id });
        const csvOnly = (funnels || []).filter((f: any) => !f.meta_lead_form && !f.webhook_source && f.is_active);
        setCsvFunnels(csvOnly);
        if (csvOnly.length > 0 && !selectedCsvFunnelId) {
          // prefer last stored
          const stored = Object.keys(localStorage).find(k => k.startsWith(`csv:${workspaceDetails.id}:`));
          const storedVal = stored ? JSON.parse(localStorage.getItem(stored) || '{}') : null;
          const prefer = storedVal?.lead_funnel_id && csvOnly.some((f: any) => f.id === storedVal.lead_funnel_id)
            ? storedVal.lead_funnel_id
            : csvOnly[0].id;
          setSelectedCsvFunnelId(prefer);
        }
        // load agents
        try { const a = await agentAPI.getAgents?.(); if (Array.isArray(a)) setAgents(a); } catch {}
      } catch (e) {
        console.error('❌ Failed to load CSV funnels/agents:', e);
      }
    })();
  }, [workspaceDetails?.id]);

  // Handle search input changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (workspaceDetails?.id) {
        loadLeads(1); // Reset to first page when searching
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadLeads, workspaceDetails?.id]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Format integration provider display with icon
  const formatIntegrationProvider = (lead: Lead) => {
    if (lead.integration_provider === 'meta') {
      return (
        <div className="flex items-center space-x-2">
          <Facebook className="w-4 h-4 text-[#1877F2]" />
          <span>Facebook</span>
        </div>
      );
    }
    return lead.integration_provider_display || lead.integration_provider || 'Manual';
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Verwalte und verfolge deine potenziellen Kunden
        </p>
      </div>

      {/* Plan Calls - visible only when active CSV funnel exists */}
      {csvFunnels.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-[#FE5B25]" />
                <span className="font-medium">Anrufe planen für CSV-Leads</span>
              </div>
              <Button
                className="bg-[#FE5B25] hover:bg-[#e14a12]"
                disabled={false}
                onClick={() => setPlanOpen(true)}
              >
                {isPlanning ? 'Plane…' : 'Anrufe planen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anrufe planen</DialogTitle>
            <DialogDescription>Quelle, Agent und Zeitpunkt wählen. Planung erfolgt sofort und bestätigt mit einer Meldung.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-28 text-sm text-muted-foreground">CSV-Quelle</span>
              <Select value={selectedCsvFunnelId || csvFunnels[0]?.id || 'none'} onValueChange={(v) => setSelectedCsvFunnelId(v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="CSV-Quelle wählen" /></SelectTrigger>
                <SelectContent>
                  {csvFunnels.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 text-sm text-muted-foreground">Agent</span>
              <Select value={selectedAgentId || agents[0]?.agent_id || 'none'} onValueChange={(v) => setSelectedAgentId(v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Agent wählen" /></SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => (
                    <SelectItem key={a.agent_id || a.id} value={a.agent_id || a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="mode-now" checked={scheduleMode==='now'} onChange={() => setScheduleMode('now')} />
                <label htmlFor="mode-now" className="text-sm">Jetzt</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="mode-later" checked={scheduleMode==='later'} onChange={() => setScheduleMode('later')} />
                <label htmlFor="mode-later" className="text-sm">Zeitpunkt</label>
                <input type="datetime-local" className="border rounded px-2 py-1 text-sm" disabled={scheduleMode!=='later'} value={scheduleAt} onChange={(e)=>setScheduleAt(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-[#FE5B25] hover:bg-[#e14a12]"
                disabled={isPlanning || !selectedCsvFunnelId || !selectedAgentId}
                onClick={async () => {
                  try {
                    setIsPlanning(true);
                    const funnelId = selectedCsvFunnelId || csvFunnels[0]?.id;
                    const agent = agents.find((a:any)=> (a.agent_id||a.id)===selectedAgentId) || agents[0];
                    if (!funnelId || !agent) { setIsPlanning(false); return; }
                    // assign agent to funnel (exclusive)
                    try { await funnelAPI.assignAgent(funnelId, agent.agent_id || agent.id); } catch { try { await funnelAPI.unassignAgent(funnelId); await funnelAPI.assignAgent(funnelId, agent.agent_id || agent.id); } catch {} }
                    // gather leads
                    let page = 1; const ids: string[] = []; const MAX = 5000;
                    while (ids.length < MAX) {
                      const resp: any = await leadAPI.getLeads({ page, page_size: 100, workspace: workspaceDetails?.id, ordering: '-created_at' } as any);
                      const results: Lead[] = resp?.results || [];
                      if (results.length === 0) break;
                      results.filter((l: any) => (l as any).lead_funnel?.id === funnelId || (l as any).lead_funnel === funnelId).forEach((l) => ids.push(l.id));
                      if (!resp.next) break; page += 1;
                    }
                    // if later: naive client-side delay (optional)
                    if (scheduleMode==='later' && scheduleAt) {
                      const waitMs = new Date(scheduleAt).getTime() - Date.now();
                      if (waitMs>0) await new Promise(r=>setTimeout(r, Math.min(waitMs, 60000))); // max 1min block
                    }
                    // send tasks
                    for (let i = 0; i < ids.length; i += 25) {
                      const slice = ids.slice(i, i + 25);
                      await Promise.all(slice.map(async (id) => {
                        try { await (window as any).apiCall?.('/api/call_tasks/', { method: 'POST', body: JSON.stringify({ workspace: agent.workspace, agent: agent.agent_id || agent.id, target_ref: `lead:${id}` }) }); } catch {}
                      }));
                    }
                    setPlanOpen(false);
                    toast({ title: 'Deine Anrufe wurden erfolgreich geplant' });
                  } finally {
                    setIsPlanning(false);
                  }
                }}
              >
                {isPlanning ? 'Plane…' : 'Anrufe planen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Leads durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.integration_provider} onValueChange={(value) => handleFilterChange('integration_provider', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Quelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Quellen</SelectItem>
                  <SelectItem value="meta">Facebook</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pagination.count} Leads gefunden</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Lade Leads...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Keine Leads gefunden</div>
            </div>
          ) : (
            <div className="space-y-1">
                             {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b">
                 <div className="col-span-3">LEAD NAME</div>
                 <div className="col-span-2">EMAIL</div>
                 <div className="col-span-2">TELEFON</div>
                 <div className="col-span-2">QUELLE</div>
                 <div className="col-span-2">ERSTELLT</div>
                 <div className="col-span-1">INFO</div>
               </div>
              
                             {/* Table Rows */}
               {leads.map((lead) => (
                 <div
                   key={lead.id}
                   className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                 >
                   <div className="col-span-3 flex items-center space-x-2">
                     <User className="h-4 w-4 text-muted-foreground" />
                     <span className="font-medium">{lead.full_name}</span>
                   </div>
                   
                   <div className="col-span-2 flex items-center space-x-2">
                     <Mail className="h-4 w-4 text-muted-foreground" />
                     <span className="text-muted-foreground truncate" title={lead.email}>
                       {lead.email}
                     </span>
                   </div>
                   
                   <div className="col-span-2 flex items-center space-x-2">
                     {lead.phone ? (
                       <>
                         <Phone className="h-4 w-4 text-muted-foreground" />
                         <span className="text-muted-foreground">{lead.phone}</span>
                       </>
                     ) : (
                       <span className="text-muted-foreground">—</span>
                     )}
                   </div>
                   
                   <div className="col-span-2">
                     <Badge variant="secondary" className="text-xs">
                       {formatIntegrationProvider(lead)}
                     </Badge>
                   </div>
                   
                   <div className="col-span-2 flex items-center space-x-1">
                     <Calendar className="h-3 w-3 text-muted-foreground" />
                     <div className="text-xs text-muted-foreground">
                       <div className="font-medium">
                         {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                       </div>
                       <div className="text-[10px] opacity-75">
                         {format(new Date(lead.created_at), 'HH:mm', { locale: de })}
                       </div>
                     </div>
                   </div>
                   
                   <div className="col-span-1 flex items-center justify-center">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedLead(lead)}
                       className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                       title="Lead Details anzeigen"
                     >
                       <Eye className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </CardContent>
      </Card>

             {/* Lead Details Modal */}
       <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
         <SheetContent side="bottom" className="h-[80vh] max-w-4xl mx-auto focus:outline-none overflow-hidden">
          {selectedLead && (
            <>
              <SheetHeader className="pb-6">
                <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Lead Details: {selectedLead.full_name}
                </SheetTitle>
              </SheetHeader>
              
                                            <ScrollArea className="h-[calc(80vh-120px)]">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
                   
                   {/* Left Column: Contact Information */}
                   <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Kontaktinformationen</h3>
                     
                     <div className="space-y-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{selectedLead.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {selectedLead.name} {selectedLead.surname}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{selectedLead.email}</div>
                              <div className="text-sm text-muted-foreground">E-Mail Adresse</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {selectedLead.phone && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{selectedLead.phone}</div>
                                <div className="text-sm text-muted-foreground">Telefonnummer</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                                         </div>
                     
                     {/* Lead Details in same column */}
                     <h3 className="font-semibold text-lg mt-6">Lead-Details</h3>
                     <div className="grid grid-cols-1 gap-4">
                      
                      {/* Source */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="text-lg font-bold">
                              {formatIntegrationProvider(selectedLead)}
                            </div>
                            <p className="text-sm text-muted-foreground">Quelle</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Created Date */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="text-lg font-bold">
                              {formatDateTime(selectedLead.created_at)}
                            </div>
                            <p className="text-sm text-muted-foreground">Erstellt am</p>
                          </div>
                        </CardContent>
                                             </Card>
                     </div>
                   </div>

                   {/* Right Column: Form Fields & Meta Data */}
                   <div className="space-y-4">
                     {Object.keys(selectedLead.variables || {}).length > 0 && (
                       <>
                         <h3 className="font-semibold text-lg">Formular-Felder</h3>
                        <div className="space-y-3">
                          {Object.entries(selectedLead.variables || {}).map(([key, value]) => (
                            <Card key={key}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium capitalize">
                                        {key.replace(/_/g, ' ')}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{String(value)}</div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        </>
                      )}

                      {/* Meta Data (Additional Technical Information) */}
                      {Object.keys(selectedLead.meta_data || {}).length > 0 && (
                        <>
                          <h3 className="font-semibold text-lg mt-6">Zusätzliche Daten</h3>
                          <Card>
                            <CardContent className="p-4">
                              <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto">
                                {JSON.stringify(selectedLead.meta_data, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  
                  </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}