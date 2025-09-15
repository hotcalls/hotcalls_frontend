import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// Removed Sheet/Scroll modal in favor of minimal centered Dialog
import { User, Mail, Phone, Calendar as CalendarIcon, Clock, Tag, Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { leadAPI, Lead, LeadsListResponse, funnelAPI, agentAPI, callAPI } from "@/lib/apiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "alle",
    source: "alle", 
    agent: "alle",
    integration_provider: "alle"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterBar, setFilterBar] = useState({
    callType: 'alle',
    phone: '',
    fromDate: '',
    toDate: '',
    durFrom: 'alle',
    durTo: 'alle'
  });
  const [hoverLead, setHoverLead] = useState<null | { lead: string; email: string; phone: string; agent: string; status: string; date: string; summary?: string; transcript?: string }>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  // Demo leads when API returns none
  const demoLeads = useMemo(() => {
    const firstNames = ["Max", "Anna", "Lukas", "Mia", "Jonas", "Lea", "Paul", "Emma", "Felix", "Sofia"];
    const lastNames = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Meyer", "Klein"];
    return Array.from({ length: 20 }, (_, i) => {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      return {
        id: `demo-${i+1}`,
        full_name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
        phone: `+49 151 ${String(100000 + i * 137).slice(0,6)}`,
        integration_provider: 'csv',
        integration_provider_display: 'CSV',
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      } as unknown as Lead;
    });
  }, []);
  
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
  const [funnelIdToName, setFunnelIdToName] = useState<Record<string, string>>({});

  // Removed: scheduling UI and variable preview in Leads page

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
      
      
      const response: LeadsListResponse = await leadAPI.getLeads(params);
      const results = response.results || [];
      if (results.length === 0) {
        setLeads([]);
        setPagination({ count: 0, next: null, previous: null, currentPage: 1 });
      } else {
        setLeads(results);
        setPagination({
          count: response.count || results.length,
          next: response.next,
          previous: response.previous,
          currentPage: page
        });
      }
      
      
    } catch (err) {
      console.error("[ERROR]:", error);
      setError('Failed to load leads');
      toast({
        title: "Error",
        description: "Could not load leads",
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
    } else {
      // No workspace - don't block UI with loading state
      setIsLoading(false);
    }
  }, [loadLeads, workspaceDetails?.id]);

  // Listen for leads updates from CSV imports or other sources
  useEffect(() => {
    const handleLeadsUpdated = (event: CustomEvent) => {
      
      if (event.detail?.workspace === workspaceDetails?.id) {
        
        loadLeads();
      }
    };

    window.addEventListener('leadsUpdated', handleLeadsUpdated as EventListener);
    return () => window.removeEventListener('leadsUpdated', handleLeadsUpdated as EventListener);
  }, [loadLeads, workspaceDetails?.id]);

  // Load CSV funnels (still used to display source names)
  useEffect(() => {
    (async () => {
      try {
        if (!workspaceDetails?.id) return;
        const funnels = await funnelAPI.getLeadFunnels({ workspace: workspaceDetails.id });
        const csvOnly = (funnels || []).filter((f: any) => !f.meta_lead_form && !f.webhook_source && f.is_active);
        setCsvFunnels(csvOnly);
        const map: Record<string, string> = {};
        csvOnly.forEach((f: any) => { map[f.id] = f.name; });
        setFunnelIdToName(map);
      } catch (e) {
        console.error("[ERROR]:", error);
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
    // Prefer CSV funnel name when available
    const lf: any = (lead as any).lead_funnel;
    if (lf && typeof lf === 'object' && lf.name) return lf.name;
    if (lf && typeof lf === 'string' && funnelIdToName[lf]) return funnelIdToName[lf];
    if (lead.integration_provider === 'meta') return 'Facebook';
    // Try read last CSV filename from localStorage (best effort)
    try {
      const key = Object.keys(localStorage).find(k => k.startsWith(`csv:${workspaceDetails?.id || 'ws'}:`));
      if (key) {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed?.filename) return parsed.filename;
      }
    } catch {}
    return lead.integration_provider_display || lead.integration_provider || 'CSV';
  };

  // Produce a human-friendly source label from filenames like "example_data_v2.csv"
  const humanizeSource = (label: string): string => {
    if (!label) return label;
    const looksLikeFile = /\.csv$/i.test(label) || /[_-]/.test(label) || /\.\w{2,4}$/i.test(label);
    if (!looksLikeFile) return label;
    let base = label.replace(/\.[^./]+$/i, '');
    base = base.replace(/[_-]+/g, ' ').trim();
    // Capitalize words, keep numbers as-is
    base = base.split(/\s+/).map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
    // Clamp length
    if (base.length > 42) base = base.slice(0, 39) + '…';
    return base;
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  // Load full lead details whenever the details modal opens
  useEffect(() => {
    (async () => {
      if (!selectedLead?.id) { setSelectedLeadDetails(null); return; }
      try {
        setDetailsLoading(true);
        const full = await leadAPI.getLead(String(selectedLead.id));
        setSelectedLeadDetails(full as any);
      } catch {
        // keep fallback
        setSelectedLeadDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    })();
  }, [selectedLead?.id]);

  const pageContent = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Verwalte und verfolge deine Interessenten</p>
      </div>

      {/* Search + Filter Toggle (like Dashboard) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearchTerm(searchInput.trim()); }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Leads durchsuchen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button type="submit" variant="default" className="h-9">Suchen</Button>
        </form>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 text-sm text-[#FE5B25] hover:underline"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showFilters ? 'Filter ausblenden' : 'Filter einblenden'}
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Scheduling UI removed as requested */}

      {/* Filterleiste – einklappbar */}
      {showFilters && (
      <Card>
        <CardContent className="p-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Filter</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Filter anwenden, um die Anrufdaten einzugrenzen</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            {/* Anrufart */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-900 font-semibold text-sm">
                <Tag className="h-4 w-4 text-gray-500" />
                <span>Anrufart</span>
              </div>
              <Select value={filterBar.callType} onValueChange={(v)=>setFilterBar(s=>({...s, callType:v}))}>
                <SelectTrigger className="h-9 rounded-md border-gray-300 focus:ring-2 focus:ring-[#FE5B25] px-2 text-sm">
                  <SelectValue placeholder="Alle Anrufarten" />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-lg border border-gray-200 p-0 text-sm">
                  <SelectItem value="alle" className="px-3 py-2">Alle Anrufarten</SelectItem>
                  <SelectItem value="inbound" className="px-3 py-2">Eingehend</SelectItem>
                  <SelectItem value="outbound" className="px-3 py-2">Ausgehend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Telefonnummer */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-900 font-semibold text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Telefonnummer</span>
              </div>
              <Input className="h-9 text-sm px-2" placeholder="Telefonnummer"
                     value={filterBar.phone}
                     onChange={(e)=>setFilterBar(s=>({...s, phone:e.target.value}))} />
            </div>

            {/* Von Datum */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-900 font-semibold text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>Von Datum</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full h-9 px-2 text-left rounded-md border border-gray-300 bg-white text-sm flex items-center gap-2",
                      !filterBar.fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    {filterBar.fromDate ? format(new Date(filterBar.fromDate), 'dd.MM.yyyy', { locale: de }) : "Datum wählen"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" sideOffset={6} className="p-0 w-[296px]">
                  <Calendar
                    mode="single"
                    selected={filterBar.fromDate ? new Date(filterBar.fromDate) : undefined}
                    onSelect={(d)=> setFilterBar(s=>({...s, fromDate: d ? format(d, 'yyyy-MM-dd') : ''}))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Bis Datum */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-gray-900 font-semibold text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>Bis Datum</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full h-9 px-2 text-left rounded-md border border-gray-300 bg-white text-sm flex items-center gap-2",
                      !filterBar.toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    {filterBar.toDate ? format(new Date(filterBar.toDate), 'dd.MM.yyyy', { locale: de }) : "Datum wählen"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" sideOffset={6} className="p-0 w-[296px]">
                  <Calendar
                    mode="single"
                    selected={filterBar.toDate ? new Date(filterBar.toDate) : undefined}
                    onSelect={(d)=> setFilterBar(s=>({...s, toDate: d ? format(d, 'yyyy-MM-dd') : ''}))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Anrufdauer */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
              <div className="sm:col-span-1">
                <div className="flex items-center gap-2 mb-1 text-gray-900 font-semibold text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Anrufdauer (min)</span>
                </div>
                <Select value={filterBar.durFrom} onValueChange={(v)=>setFilterBar(s=>({...s, durFrom:v}))}>
                  <SelectTrigger className="h-9 rounded-md border-gray-300 focus:ring-2 focus:ring-[#FE5B25] px-2 text-sm">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md shadow-lg border border-gray-200 p-0 text-sm min-w-[8rem]">
                    <SelectItem value="alle" className="px-3 py-2">Alle</SelectItem>
                    <SelectItem value="1" className="px-3 py-2">1 min</SelectItem>
                    <SelectItem value="3" className="px-3 py-2">3 min</SelectItem>
                    <SelectItem value="5" className="px-3 py-2">5 min</SelectItem>
                    <SelectItem value="10" className="px-3 py-2">10 min</SelectItem>
                    <SelectItem value="15" className="px-3 py-2">15 min</SelectItem>
                    <SelectItem value="30" className="px-3 py-2">30 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:flex items-center justify-center text-gray-500 mb-1 px-1 text-sm">bis</div>
              <div className="sm:col-span-1">
                <div className="mb-1 sm:invisible">.</div>
                <Select value={filterBar.durTo} onValueChange={(v)=>setFilterBar(s=>({...s, durTo:v}))}>
                  <SelectTrigger className="h-9 rounded-md border-gray-300 focus:ring-2 focus:ring-[#FE5B25] px-2 text-sm">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md shadow-lg border border-gray-200 p-0 text-sm min-w-[8rem]">
                    <SelectItem value="alle" className="px-3 py-2">Alle</SelectItem>
                    <SelectItem value="1" className="px-3 py-2">1 min</SelectItem>
                    <SelectItem value="3" className="px-3 py-2">3 min</SelectItem>
                    <SelectItem value="5" className="px-3 py-2">5 min</SelectItem>
                    <SelectItem value="10" className="px-3 py-2">10 min</SelectItem>
                    <SelectItem value="15" className="px-3 py-2">15 min</SelectItem>
                    <SelectItem value="30" className="px-3 py-2">30 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1 flex sm:justify-end mt-4 sm:mt-0">
                <Button variant="outline" className="h-9 px-3 text-sm" onClick={()=>setFilterBar({callType:'alle', phone:'', fromDate:'', toDate:'', durFrom:'alle', durTo:'alle'})}>
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pagination.count} Leads gefunden</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Leads werden geladen...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : leads.length === 0 ? (
            <>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-x-6 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b">
                  <div className="col-span-3">Lead‑Name</div>
                  <div className="col-span-2">E‑Mail</div>
                  <div className="col-span-2">Telefon</div>
                  <div className="col-span-2">Quelle</div>
                  <div className="col-span-3">Erstellt</div>
                </div>
                {demoLeads.map((lead) => {
                  const statusCycle = ['Nicht erreicht','Erreicht','Termin vereinbart','Kein Interesse'];
                  const status = statusCycle[Number(String(lead.id).replace('demo-','')) % statusCycle.length];
                  const notReached = status === 'Nicht erreicht';
                  const summary = notReached
                    ? 'Lead wurde noch nicht erreicht. Es liegt noch keine Gesprächszusammenfassung vor.'
                    : `Kurze Zusammenfassung: Gespräch mit ${lead.full_name} über Produktinteresse. Status: ${status}.`;
                  const transcript = notReached
                    ? '— Lead wurde noch nicht erreicht. Kein Transkript vorhanden —'
                    : `Agent: Hallo ${lead.full_name}, vielen Dank für Ihre Zeit.\n\nLead: Gerne.\n\nAgent: Ich würde Ihnen kurz erklären, wie wir weiter vorgehen können...`;
                  return (
                  <div key={lead.id}
                       role="button"
                       tabIndex={0}
                       onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setHoverLead({ lead: lead.full_name, email: lead.email, phone: lead.phone, agent: 'Demo Agent', status, date: lead.created_at, summary, transcript }); } }}
                       onClick={()=> setHoverLead({ lead: lead.full_name, email: lead.email, phone: lead.phone, agent: 'Demo Agent', status, date: lead.created_at, summary, transcript })}
                       className="grid grid-cols-12 gap-x-6 px-6 py-3 text-sm items-center border-b last:border-b-0 hover:bg-muted/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FE5B25]/40">
                    <div className="col-span-3 flex items-center space-x-2 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{lead.full_name}</span>
                    </div>
                    <div className="col-span-2 flex items-center space-x-2 min-w-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate" title={lead.email}>{lead.email}</span>
                    </div>
                    <div className="col-span-2 flex items-center space-x-2 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.phone}</span>
                    </div>
                    <div className="col-span-2 text-muted-foreground text-sm flex items-center gap-1 min-w-0">
                      <img src="/csv icon.png" alt="CSV" className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate" title="CSV">CSV</span>
                    </div>
                    <div className="col-span-3 flex items-center space-x-2">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium">{format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}</div>
                        <div className="text-[10px] opacity-75">{format(new Date(lead.created_at), 'HH:mm', { locale: de })}</div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </>
          ) : (
            <>
            <div className="space-y-1">
                             {/* Table Header */}
              <div className="grid grid-cols-12 gap-x-6 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b">
                <div className="col-span-3">Lead‑Name</div>
                <div className="col-span-2">E‑Mail</div>
                <div className="col-span-2">Telefon</div>
                <div className="col-span-2">Quelle</div>
                <div className="col-span-3">Erstellt</div>
              </div>
 
                             {/* Table Rows */}
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLead(lead)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLead(lead);} }}
                  className="grid grid-cols-12 gap-x-6 px-6 py-3 text-sm items-center hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3d5097]/40 border-b last:border-b-0"
                >
                  <div className="col-span-3 flex items-center space-x-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium truncate">{lead.full_name}</span>
                  </div>
 
                  <div className="col-span-2 flex items-center space-x-2 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate" title={lead.email}>
                      {lead.email}
                    </span>
                  </div>
 
                  <div className="col-span-2 flex items-center space-x-2 min-w-0">
                    {lead.phone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{lead.phone}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
 
                  <div className="col-span-2 text-muted-foreground text-sm flex items-center gap-1 min-w-0">
                    <img src="/csv icon.png" alt="CSV" className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate" title={formatIntegrationProvider(lead)}>
                      {humanizeSource(formatIntegrationProvider(lead))}
                    </span>
                  </div>
 
                  <div className="col-span-3 flex items-center space-x-2">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium">
                        {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-[10px] opacity-75">
                        {format(new Date(lead.created_at), 'HH:mm', { locale: de })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              {(() => {
                const pageSize = 20;
                const start = (pagination.currentPage - 1) * pageSize + 1;
                const end = Math.min(pagination.currentPage * pageSize, pagination.count);
                const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / pageSize));
                return (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Showing {start}-{end} of {pagination.count}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.previous}
                        onClick={() => loadLeads(Math.max(1, pagination.currentPage - 1))}
                      >
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.next}
                        onClick={() => loadLeads(pagination.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Modal - minimal & centered */}
      <Dialog open={!!hoverLead} onOpenChange={(o)=>{ if(!o) setHoverLead(null); }}>
        <DialogContent className="sm:max-w-2xl p-6">
          {hoverLead && (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold tracking-tight">Lead‑Details</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{format(new Date(hoverLead.date), 'dd.MM.yyyy', { locale: de })}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 bg-white">
                  <h3 className="font-semibold mb-3">Kontakt</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{hoverLead.lead}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Telefon:</span><span>{hoverLead.phone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">E‑Mail:</span><span className="truncate max-w-[60%] text-right">{hoverLead.email}</span></div>
                  </div>
                </div>
                <div className="rounded-xl border p-4 bg-white">
                  <h3 className="font-semibold mb-3">Analyse</h3>
                  {String(hoverLead.status).toLowerCase().includes('nicht erreicht') && (
                    <div className="mb-2 text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-block">Lead wurde noch nicht erreicht</div>
                  )}
                  <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{hoverLead.summary}</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border bg-white max-h-72 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Transkript</h3>
                  <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">{hoverLead.transcript}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return pageContent;
}