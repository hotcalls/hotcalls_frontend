import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// Removed Sheet/Scroll modal in favor of minimal centered Dialog
import { User, Mail, Phone, Calendar } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { leadAPI, Lead, LeadsListResponse, funnelAPI, agentAPI, callAPI } from "@/lib/apiService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Manage and track your prospects</p>
      </div>

      {/* Scheduling UI removed as requested */}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {/* Source filter removed for CSV-only mode */}
          </div>
        </CardContent>
      </Card>

      

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{pagination.count} leads found</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading leads...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No leads found</div>
            </div>
          ) : (
            <>
            <div className="space-y-1">
                             {/* Table Header */}
              <div className="grid grid-cols-12 gap-x-6 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b">
                <div className="col-span-3">Lead name</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">Source</div>
                <div className="col-span-3">Created</div>
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
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-2xl p-6">
          {selectedLead && (
            <>
              {(() => {
                const data = selectedLeadDetails || selectedLead;
                return (
                  <>
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-semibold tracking-tight">{data.full_name}</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">Lead details</DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                      <div className="py-8 text-center text-muted-foreground">Loading details…</div>
                    ) : (
                      <div className="space-y-6">
                        {/* Definition grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-4 rounded-lg border bg-white">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Name</div>
                            <div className="font-medium mt-1">{data.full_name}</div>
                          </div>
                          <div className="p-4 rounded-lg border bg-white">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                            <div className="mt-1 truncate">{data.email || '—'}</div>
                          </div>
                          <div className="p-4 rounded-lg border bg-white">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Phone</div>
                            <div className="mt-1">{data.phone || '—'}</div>
                          </div>
                          <div className="p-4 rounded-lg border bg-white">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Source</div>
                            <div className="mt-1 font-medium flex items-center gap-2">
                              <img src="/csv icon.png" alt="CSV" className="w-4 h-4 opacity-70" />
                              <span>{humanizeSource(formatIntegrationProvider(data as any))}</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border bg-white">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Created at</div>
                            <div className="mt-1 font-medium">{formatDateTime(data.created_at)}</div>
                          </div>
                        </div>

                        {/* Variables */}
                        {Object.keys((data as any).variables || {}).length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Form fields</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries((data as any).variables || {}).map(([key, value]) => (
                                <div key={key} className="p-3 rounded-lg border bg-white">
                                  <div className="font-medium text-sm capitalize leading-tight">{key.replace(/_/g, ' ')}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5 break-words">{String(value)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return pageContent;
}