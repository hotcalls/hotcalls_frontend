import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Facebook, Globe, Linkedin, Webhook } from "lucide-react";

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

const recentLeads = [
  {
    id: "1",
    name: "Max Mustermann",
    email: "max.mustermann@email.com", 
    phone: "+49 151 12345678",
    source: "Facebook Lead Ads",
    status: "Neu",
    time: "vor 2 Min",
    statusColor: "bg-info",
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
  },
];

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Quellen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Lead Quellen und Formulare
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neue Lead Quelle
        </Button>
      </div>

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

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aktuelle Leads</CardTitle>
              <p className="text-sm text-muted-foreground">
                Die neuesten eingegangenen Leads
              </p>
            </div>
            
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Leads durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeads.map((lead) => (
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
        </CardContent>
      </Card>
    </div>
  );
}