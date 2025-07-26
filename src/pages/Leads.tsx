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

      {/* Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Leads durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Status</SelectItem>
                  <SelectItem value="Neu">Neu</SelectItem>
                  <SelectItem value="Kontaktiert">Kontaktiert</SelectItem>
                  <SelectItem value="Qualifiziert">Qualifiziert</SelectItem>
                  <SelectItem value="Termin">Termin</SelectItem>
                  <SelectItem value="Abgeschlossen">Abgeschlossen</SelectItem>
                  <SelectItem value="Verloren">Verloren</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({...prev, source: value}))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Quelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Quellen</SelectItem>
                  <SelectItem value="Meta Lead Ads">Meta Lead Ads</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                </SelectContent>
              </Select>



              <Select value={filters.agent} onValueChange={(value) => setFilters(prev => ({...prev, agent: value}))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Agenten</SelectItem>
                  <SelectItem value="Sarah">Sarah</SelectItem>
                  <SelectItem value="Marcus">Marcus</SelectItem>
                  <SelectItem value="Lisa">Lisa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className={textStyles.sectionTitle}>
            {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''} gefunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-500">Lead</th>
                  <th className="text-left p-3 font-medium text-gray-500">Unternehmen</th>
                  <th className="text-left p-3 font-medium text-gray-500">Quelle</th>
                  <th className="text-left p-3 font-medium text-gray-500">Status</th>
                                     <th className="text-left p-3 font-medium text-gray-500">Agent</th>
                  <th className="text-right p-3 font-medium text-gray-500">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{lead.company}</div>
                      <div className="text-sm text-gray-500">{lead.position}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{lead.source}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status as keyof typeof statusColors]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{lead.assignedAgent}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className={`flex items-center justify-end ${spacingStyles.buttonSpacing}`}>
                        <button
                          className={buttonStyles.cardAction.icon}
                          onClick={() => {/* Handle call */}}
                          title="Anrufen"
                        >
                          <Phone className={iconSizes.small} />
                        </button>
                        <button
                          className={buttonStyles.cardAction.icon}
                          onClick={() => setSelectedLead(lead)}
                          title="Details anzeigen"
                        >
                          <Info className={iconSizes.small} />
                        </button>
                        <button
                          className={buttonStyles.cardAction.iconDelete}
                          onClick={() => {/* Handle delete */}}
                          title="Lead löschen"
                        >
                          <Trash2 className={iconSizes.small} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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