import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bot, Settings, Play, Pause } from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";

const agents = [
  {
    id: "1",
    name: "Sarah",
    gender: "weiblich",
    voice: "Freundlich",
    status: "Aktiv",
    leadsToday: 47,
    callsToday: 156,
    conversionRate: "22.4%",
    leadSource: "Facebook Ads",
    calendar: "Marcus Weber",
    statusColor: "bg-success",
  },
  {
    id: "2", 
    name: "Marcus",
    gender: "männlich", 
    voice: "Professionell",
    status: "Aktiv",
    leadsToday: 32,
    callsToday: 89,
    conversionRate: "18.7%",
    leadSource: "Google Ads",
    calendar: "Lisa Müller",
    statusColor: "bg-success",
  },
  {
    id: "3",
    name: "Lisa",
    gender: "weiblich",
    voice: "Energisch", 
    status: "Pausiert",
    leadsToday: 0,
    callsToday: 0,
    conversionRate: "15.2%",
    leadSource: "LinkedIn",
    calendar: "Thomas Klein",
    statusColor: "bg-warning",
  },
];

export default function Agents() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">KI-Agenten</h2>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuen Agenten erstellen
        </Button>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {agent.gender} • {agent.voice}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${agent.statusColor}`}></div>
                  <span className="text-xs font-medium">{agent.status}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Leads heute</p>
                  <p className="font-semibold text-lg">{agent.leadsToday}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Anrufe heute</p>
                  <p className="font-semibold text-lg">{agent.callsToday}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Conversion Rate</p>
                <p className="font-semibold text-lg text-success">{agent.conversionRate}</p>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Lead Quelle</p>
                  <Badge variant="outline">{agent.leadSource}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kalender</p>
                  <Badge variant="secondary">{agent.calendar}</Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  {agent.status === "Aktiv" ? (
                    <>
                      <Pause className="mr-2 h-3 w-3" />
                      Pausieren
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-3 w-3" />
                      Starten
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="mr-2 h-3 w-3" />
                  Konfiguration
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateAgentDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
}