import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Filter, Phone, Calendar, MessageSquare, Mail, Info, User, MapPin, Building, FileText, Clock, Check, X, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { format, isToday, isThisWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { leadAPI, Lead, LeadsListResponse } from "@/lib/apiService";
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
        description: "Leads konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceDetails?.id, searchTerm, filters.integration_provider, toast]);

  // Load leads on component mount and when dependencies change
  useEffect(() => {
    if (workspaceDetails?.id) {
      loadLeads(1);
    }
  }, [loadLeads]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (workspaceDetails?.id) {
        loadLeads(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const statusColors = {
    "meta": "bg-blue-100 text-blue-800",
    "google": "bg-green-100 text-green-800", 
    "manual": "bg-gray-100 text-gray-800",
  };



  // Leads are already filtered by API, so we just use them directly
  const filteredLeads = leads;

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - PIXEL-PERFECT EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Leads</h1>
          <p className={textStyles.pageSubtitle}>Verwalte und verfolge deine potenziellen Kunden</p>
        </div>
        
        <button className={buttonStyles.create.default}>
          <Plus className={iconSizes.small} />
          <span>Lead importieren</span>
        </button>
      </div>

      {/* Leads Table - Moderne Tabelle wie Dashboard */}
      <div className="bg-white rounded-lg border">
        {/* Header mit Suche und Aktionen */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Lade Leads...</span>
              </div>
            ) : error ? (
              <span className="text-red-600">Fehler beim Laden</span>
            ) : (
              `${pagination.count} Lead${pagination.count !== 1 ? 's' : ''} gefunden`
            )}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Suchen"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border rounded">F</kbd>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sortieren
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

                {/* Tabelle */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quelle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#FE5B25] mr-2" />
                      <span className="text-gray-500">Lade Leads...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-red-600">
                      <p className="font-medium">Fehler beim Laden der Leads</p>
                      <p className="text-sm mt-1">{error}</p>
                      <Button 
                        onClick={() => loadLeads(1)} 
                        className="mt-3"
                        variant="outline"
                      >
                        Erneut versuchen
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="font-medium">Keine Leads gefunden</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? 'Versuche andere Suchbegriffe' : 'Erstelle Lead-Quellen um Leads zu erhalten'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.workspace_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.integration_provider 
                          ? statusColors[lead.integration_provider as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {lead.integration_provider_display || lead.integration_provider || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs"
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            Anrufen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent side="right" className="w-[35vw] min-w-[500px] max-w-[40vw] focus:outline-none">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.full_name}</SheetTitle>
                <p className="text-muted-foreground">{selectedLead.workspace_name}</p>
              </SheetHeader>

              <ScrollArea className="h-full pr-6">
                <div className="space-y-6 pb-6">
                  {/* Kontaktinformationen */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">
                      Kontaktinformationen
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.workspace_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.email}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Lead-Status */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Lead-Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Quelle */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {selectedLead.integration_provider_display || selectedLead.integration_provider || 'Manual'}
                          </div>
                          <p className="text-xs text-muted-foreground">Quelle</p>
                        </CardContent>
                      </Card>
                      
                      {/* Erstellt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {format(new Date(selectedLead.created_at), 'dd.MM.yyyy', { locale: de })}
                          </div>
                          <p className="text-xs text-muted-foreground">Erstellt am</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Lead Variables */}
                  {Object.keys(selectedLead.variables || {}).length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium mb-3">
                          Lead Variables
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(selectedLead.variables || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-sm font-medium">{key}:</span>
                              <span className="text-sm text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Meta Data */}
                  {Object.keys(selectedLead.meta_data || {}).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium mb-3">
                        Zusätzliche Daten
                      </h3>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {JSON.stringify(selectedLead.meta_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}