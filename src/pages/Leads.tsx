import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

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
    </div>
  );
}