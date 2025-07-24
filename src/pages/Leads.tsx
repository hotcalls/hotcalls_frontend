import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Facebook, Globe, Linkedin, Webhook, Filter } from "lucide-react";

const leadSources = [
  {
    id: "1",
    name: "Facebook Lead Ads",
    type: "Facebook",
    icon: Facebook,
    status: "Aktiv",
    leadsToday: 23,
    leadsThisMonth: 687,
    lastSync: "vor 2 Min",
    statusColor: "bg-success",
  },
  {
    id: "2",
    name: "Google Lead Forms", 
    type: "Google",
    icon: Globe,
    status: "Aktiv",
    leadsToday: 18,
    leadsThisMonth: 543,
    lastSync: "vor 5 Min",
    statusColor: "bg-success",
  },
  {
    id: "3",
    name: "LinkedIn Lead Gen",
    type: "LinkedIn", 
    icon: Linkedin,
    status: "Pausiert",
    leadsToday: 0,
    leadsThisMonth: 234,
    lastSync: "vor 3 Std",
    statusColor: "bg-warning",
  },
  {
    id: "4",
    name: "Website Webhook",
    type: "Webhook",
    icon: Webhook,
    status: "Aktiv", 
    leadsToday: 7,
    leadsThisMonth: 156,
    lastSync: "vor 1 Min",
    statusColor: "bg-success",
  },
];

const allLeads = [
  {
    id: "1",
    name: "Max Mustermann",
    email: "max.mustermann@email.com", 
    phone: "+49 151 12345678",
    source: "Facebook Lead Ads",
    status: "Neu",
    time: "vor 2 Min",
    statusColor: "bg-info",
    company: "Tech Solutions GmbH",
    notes: "Interessiert an Premium Paket",
  },
  {
    id: "2",
    name: "Anna Schmidt", 
    email: "anna.schmidt@email.com",
    phone: "+49 171 98765432",
    source: "Google Lead Forms",
    status: "Kontaktiert",
    time: "vor 8 Min", 
    statusColor: "bg-warning",
    company: "Marketing Pro",
    notes: "Callback um 15:00 vereinbart",
  },
  {
    id: "3",
    name: "Thomas Weber",
    email: "thomas.weber@email.com",
    phone: "+49 162 55566677", 
    source: "Website Webhook",
    status: "Qualifiziert",
    time: "vor 15 Min",
    statusColor: "bg-success",
    company: "Digital Agency",
    notes: "Bereit für Demo-Termin",
  },
  {
    id: "4",
    name: "Julia Müller",
    email: "julia.mueller@email.com",
    phone: "+49 175 33344455",
    source: "LinkedIn Lead Gen",
    status: "Neu",
    time: "vor 22 Min",
    statusColor: "bg-info",
    company: "Consulting Firm",
    notes: "B2B Interesse",
  },
  {
    id: "5",
    name: "Robert Klein",
    email: "robert.klein@email.com",
    phone: "+49 152 77788899",
    source: "Facebook Lead Ads",
    status: "Kontaktiert",
    time: "vor 35 Min",
    statusColor: "bg-warning",
    company: "Software Development",
    notes: "Möchte Preise vergleichen",
  },
  {
    id: "6",
    name: "Sarah Wagner",
    email: "sarah.wagner@email.com",
    phone: "+49 160 11223344",
    source: "Google Lead Forms",
    status: "Nicht erreicht",
    time: "vor 1 Std",
    statusColor: "bg-destructive",
    company: "E-Commerce Store",
    notes: "3 Anrufversuche",
  },
  {
    id: "7",
    name: "Michael Brown",
    email: "michael.brown@email.com",
    phone: "+49 170 55566677",
    source: "Website Webhook",
    status: "Qualifiziert",
    time: "vor 1 Std",
    statusColor: "bg-success",
    company: "Financial Services",
    notes: "Hohe Budget-Bereitschaft",
  },
  {
    id: "8",
    name: "Lisa Davis",
    email: "lisa.davis@email.com",
    phone: "+49 180 99887766",
    source: "LinkedIn Lead Gen",
    status: "Neu",
    time: "vor 2 Std",
    statusColor: "bg-info",
    company: "Healthcare Solutions",
    notes: "DSGVO Compliance wichtig",
  },
];

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "alle" || lead.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neue Lead Quelle
        </Button>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sources">Lead Quellen</TabsTrigger>
          <TabsTrigger value="leads">Aktuelle Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          {/* Lead Sources */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {leadSources.map((source) => (
              <Card key={source.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <source.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{source.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${source.statusColor}`}></div>
                      <span className="text-xs font-medium">{source.status}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Heute</p>
                      <p className="font-semibold text-lg">{source.leadsToday}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Diesen Monat</p>
                      <p className="font-semibold text-lg">{source.leadsThisMonth}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Letzte Sync</p>
                    <p className="text-sm">{source.lastSync}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button size="sm" variant="outline">
                      Konfigurieren
                    </Button>
                    <Button size="sm" variant="outline">
                      Formulare anzeigen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
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
              <option value="neu">Neu</option>
              <option value="kontaktiert">Kontaktiert</option>
              <option value="qualifiziert">Qualifiziert</option>
              <option value="nicht erreicht">Nicht erreicht</option>
            </select>
          </div>

          {/* Leads List */}
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${lead.statusColor}`}></div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.notes}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{lead.source}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{lead.status}</p>
                    <p className="text-xs text-muted-foreground">{lead.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Leads gefunden. Probiere andere Suchbegriffe oder Filter.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}