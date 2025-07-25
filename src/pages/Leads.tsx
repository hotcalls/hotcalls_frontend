import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, User, Building, Phone, Mail, MessageSquare, Check, X, Clock } from "lucide-react";
import { format, isToday, isThisWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";

// Follow-up Datum intelligent formatieren (wie im Dashboard)
const formatFollowUpDate = (dateString: string) => {
  const followUpDate = new Date(dateString);
  
  if (isToday(followUpDate)) {
    // Heute: nur Uhrzeit
    return format(followUpDate, 'HH:mm');
  } else if (isThisWeek(followUpDate)) {
    // Diese Woche: Wochentag + Uhrzeit
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return `${weekdays[getDay(followUpDate)]} ${format(followUpDate, 'HH:mm')}`;
  } else {
    // Weiter weg: Datum ohne Jahr + Uhrzeit
    return format(followUpDate, 'dd.MM HH:mm');
  }
};

const allLeads = [
  {
    id: "1",
    name: "Max Mustermann",
    email: "max.mustermann@email.com", 
    phone: "+49 151 12345678",
    source: "Facebook Lead Ads",
    status: "Termin gebucht",
    time: "vor 2 Min",
    company: "Tech Solutions GmbH",
    notes: "Interessiert an Premium Paket",
    followUpDate: "2024-01-16T14:00:00",
    calls: [
      { id: "1", date: "2024-01-15T14:30:00", duration: "8 Min", status: "Termin gebucht", agent: "Sarah" },
      { id: "2", date: "2024-01-14T10:15:00", duration: "12 Min", status: "Erreicht", agent: "Sarah" }
    ],
    totalCalls: 2,
    totalMinutes: 20,
    lastCall: "15.01.2024 14:30"
  },
  {
    id: "2",
    name: "Anna Schmidt", 
    email: "anna.schmidt@email.com",
    phone: "+49 171 98765432",
    source: "Google Lead Forms",
    status: "Nicht erreicht",
    time: "vor 8 Min", 
    company: "Marketing Pro",
    notes: "Callback um 15:00 vereinbart",
    followUpDate: "2024-01-15T15:00:00",
    calls: [
      { id: "1", date: "2024-01-15T11:20:00", duration: "0 Min", status: "Nicht erreicht", agent: "Marcus" }
    ],
    totalCalls: 1,
    totalMinutes: 0,
    lastCall: "15.01.2024 11:20"
  },
  {
    id: "3",
    name: "Thomas Weber",
    email: "thomas.weber@email.com",
    phone: "+49 162 55566677", 
    source: "Website Webhook",
    status: "Termin gebucht",
    time: "vor 15 Min",
    company: "Digital Agency",
    notes: "Bereit für Demo-Termin",
    followUpDate: "2024-01-17T10:00:00",
    calls: [
      { id: "1", date: "2024-01-15T09:45:00", duration: "15 Min", status: "Termin gebucht", agent: "Lisa" }
    ],
    totalCalls: 1,
    totalMinutes: 15,
    lastCall: "15.01.2024 09:45"
  },
  {
    id: "4",
    name: "Julia Müller",
    email: "julia.mueller@email.com",
    phone: "+49 175 33344455",
    source: "LinkedIn Lead Gen",
    status: "Kein Interesse",
    time: "vor 22 Min",
    company: "Consulting Firm",
    notes: "B2B Interesse",
    calls: [
      { id: "1", date: "2024-01-15T08:30:00", duration: "3 Min", status: "Kein Interesse", agent: "Sarah" }
    ],
    totalCalls: 1,
    totalMinutes: 3,
    lastCall: "15.01.2024 08:30"
  },
  {
    id: "5",
    name: "Robert Klein",
    email: "robert.klein@email.com",
    phone: "+49 152 77788899",
    source: "Facebook Lead Ads",
    status: "Nicht erreicht",
    time: "vor 35 Min",
    company: "Software Development",
    notes: "Möchte Preise vergleichen",
    calls: [
      { id: "1", date: "2024-01-15T07:15:00", duration: "0 Min", status: "Nicht erreicht", agent: "Marcus" },
      { id: "2", date: "2024-01-14T16:45:00", duration: "0 Min", status: "Nicht erreicht", agent: "Marcus" }
    ],
    totalCalls: 2,
    totalMinutes: 0,
    lastCall: "15.01.2024 07:15"
  },
  {
    id: "6",
    name: "Sarah Wagner",
    email: "sarah.wagner@email.com",
    phone: "+49 160 11223344",
    source: "Google Lead Forms",
    status: "Nicht erreicht",
    time: "vor 1 Std",
    company: "E-Commerce Store",
    notes: "3 Anrufversuche",
    calls: [
      { id: "1", date: "2024-01-15T06:00:00", duration: "0 Min", status: "Nicht erreicht", agent: "Lisa" }
    ],
    totalCalls: 1,
    totalMinutes: 0,
    lastCall: "15.01.2024 06:00"
    // Kein followUpDate = "Follow-Up nicht geplant"
  }
];

// Funktion für Status Badge Styling (von AgentAnalytics übernommen)
const getStatusBadge = (status: string) => {
  if (status === "Termin gebucht") {
    return (
      <Badge variant="outline" className="bg-green-50 border-green-600 text-green-700 hover:bg-green-100">
        <Check className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  } else if (status === "Kein Interesse") {
    return (
      <Badge variant="outline" className="bg-red-50 border-red-600 text-red-700 hover:bg-red-100">
        <X className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  } else if (status === "Nicht erreicht") {
    return (
      <Badge variant="outline" className="bg-yellow-50 border-yellow-600 text-yellow-700 hover:bg-yellow-100">
        <Phone className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-blue-50 border-blue-600 text-blue-700 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
};

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "alle" || lead.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const selectedLeadData = selectedLead ? allLeads.find(lead => lead.name === selectedLead) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Lead importieren
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Leads durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="alle">Alle Status</option>
          <option value="termin gebucht">Termin gebucht</option>
          <option value="nicht erreicht">Nicht erreicht</option>
          <option value="kein interesse">Kein Interesse</option>
        </select>
      </div>

      {/* Leads als Cards (Design von AgentAnalytics übernommen) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Alle Leads</h2>
          <p className="text-sm text-muted-foreground">{filteredLeads.length} Leads gefunden</p>
        </div>
        
        {filteredLeads.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                className="hover:shadow-md transition-shadow min-h-[80px] cursor-pointer"
                onClick={() => setSelectedLead(lead.name)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.source} • {lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        {lead.time}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lead.totalCalls > 1 ? `${lead.totalCalls} Anrufe` : `${lead.totalCalls} Anruf`}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(lead.status)}
                        
                        {/* Follow-up Badge wie im Dashboard */}
                        {((lead as any).followUpDate || lead.status === 'Nicht erreicht') && (
                          <Badge className={`text-xs flex items-center space-x-1 ${
                            (lead as any).followUpDate 
                              ? 'bg-orange-50 border-orange-500 text-orange-700 hover:bg-orange-100'
                              : 'bg-gray-50 border-gray-400 text-gray-600 hover:bg-gray-100'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>
                              {(lead as any).followUpDate 
                                ? `Follow-Up: ${formatFollowUpDate((lead as any).followUpDate)}`
                                : 'Follow-Up nicht geplant'
                              }
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Leads gefunden. Probiere andere Suchbegriffe oder Filter.
          </div>
        )}
      </div>

      {/* Lead Details Sheet (von AgentAnalytics übernommen) */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="w-[35vw] min-w-[500px] max-w-[40vw] focus:outline-none">
          <SheetHeader>
            <SheetTitle className="text-left text-lg font-semibold">Lead Details: {selectedLead}</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-100px)] mt-6">
            {selectedLeadData && (
              <div className="space-y-6">
                {/* Kontaktinformationen */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Kontaktinformationen</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLeadData.company}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLeadData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLeadData.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLeadData.source}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Gesprächsstatistik */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Gesprächsstatistik</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-3">
                        <div className="text-lg font-bold">{selectedLeadData.totalCalls}</div>
                        <p className="text-xs text-muted-foreground">Anrufe gesamt</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="text-lg font-bold">{selectedLeadData.totalMinutes}</div>
                        <p className="text-xs text-muted-foreground">Minuten gesamt</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="text-lg font-bold">{selectedLeadData.lastCall}</div>
                        <p className="text-xs text-muted-foreground">Letzter Anruf</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="text-lg font-bold">{selectedLeadData.status}</div>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Gesprächshistorie */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Gesprächshistorie</h3>
                  <div className="space-y-3">
                    {selectedLeadData.calls.map((call) => (
                      <Card key={call.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <MessageSquare className="h-4 w-4" />
                              <div>
                                <p className="text-sm font-medium">Anruf von Agent {call.agent}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(call.date).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-muted-foreground">{call.duration}</span>
                              {getStatusBadge(call.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}