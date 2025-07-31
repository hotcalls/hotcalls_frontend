import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Filter, Phone, Calendar, MessageSquare, Mail, Info, User, MapPin, Building, FileText, Clock, Check, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { format, isToday, isThisWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";

// Mock Leads Data
const mockLeads = [
  {
    id: "1",
    firstName: "Max",
    lastName: "Mustermann",
    email: "max.mustermann@email.com",
    phone: "+49 151 12345678",
    company: "Mustermann GmbH",
    position: "Geschäftsführer",
    source: "Meta Lead Ads",
    status: "Neu",
    priority: "Hoch",
    lastContact: new Date("2024-01-15"),
    nextFollowUp: new Date("2024-01-17"),
    notes: "Interessiert an Premium-Paket",
    assignedAgent: "Sarah",
    tags: ["Premium", "Entscheider"],
    leadScore: 85,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    firstName: "Anna",
    lastName: "Schmidt",
    email: "anna.schmidt@example.com",
    phone: "+49 170 98765432",
    company: "Schmidt & Partner",
    position: "Marketing Leiterin",
    source: "Website",
    status: "Kontaktiert",
    priority: "Mittel",
    lastContact: new Date("2024-01-14"),
    nextFollowUp: new Date("2024-01-18"),
    notes: "Benötigt weitere Informationen",
    assignedAgent: "Marcus",
    tags: ["Marketing"],
    leadScore: 72,
    createdAt: new Date("2024-01-14"),
  },
  {
    id: "3",
    firstName: "Thomas",
    lastName: "Weber",
    email: "thomas.weber@firma.de",
    phone: "+49 160 55566677",
    company: "Weber Consulting",
    position: "Berater",
    source: "LinkedIn",
    status: "Qualifiziert",
    priority: "Hoch",
    lastContact: new Date("2024-01-16"),
    nextFollowUp: new Date("2024-01-19"),
    notes: "Termin vereinbart",
    assignedAgent: "Lisa",
    tags: ["Consulting", "B2B"],
    leadScore: 91,
    createdAt: new Date("2024-01-13"),
  }
];

export default function Leads() {
  const [leads, setLeads] = useState(mockLeads);
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null);
  const [filters, setFilters] = useState({
    status: "alle",
    source: "alle",
    agent: "alle"
  });
  const [searchTerm, setSearchTerm] = useState("");

  const statusColors = {
    "Neu": "bg-blue-100 text-blue-800",
    "Kontaktiert": "bg-yellow-100 text-yellow-800", 
    "Qualifiziert": "bg-green-100 text-green-800",
    "Termin": "bg-purple-100 text-purple-800",
    "Abgeschlossen": "bg-gray-100 text-gray-800",
    "Verloren": "bg-red-100 text-red-800"
  };



  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" || 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === "alle" || lead.status === filters.status;
    const matchesSource = filters.source === "alle" || lead.source === filters.source;
    const matchesAgent = filters.agent === "alle" || lead.assignedAgent === filters.agent;

    return matchesSearch && matchesStatus && matchesSource && matchesAgent;
  });

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
            {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''} gefunden
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quelle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
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
                    <div className="text-sm text-gray-900">{lead.source}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status as keyof typeof statusColors]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.assignedAgent}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Handle call */}}
                        className="h-8 w-8 p-0"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                        className="h-8 w-8 p-0"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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
                <SheetTitle>{selectedLead.firstName} {selectedLead.lastName}</SheetTitle>
                <p className="text-muted-foreground">{selectedLead.position} bei {selectedLead.company}</p>
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
                        <span className="text-sm">{selectedLead.company}</span>
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
                      Lead-Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Status */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {selectedLead.status}
                          </div>
                          <p className="text-xs text-muted-foreground">Status</p>
                        </CardContent>
                      </Card>
                      
                      {/* Quelle */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {selectedLead.source}
                          </div>
                          <p className="text-xs text-muted-foreground">Quelle</p>
                        </CardContent>
                      </Card>
                      
                      {/* Agent */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {selectedLead.assignedAgent}
                          </div>
                          <p className="text-xs text-muted-foreground">Zugewiesener Agent</p>
                        </CardContent>
                      </Card>
                      
                      {/* Erstellt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {format(selectedLead.createdAt, 'dd.MM.yyyy', { locale: de })}
                          </div>
                          <p className="text-xs text-muted-foreground">Erstellt am</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Notizen */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">
                      Notizen
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {selectedLead.notes}
                      </p>
                    </div>
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