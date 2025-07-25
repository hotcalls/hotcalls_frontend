import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bot, Settings, Play, Pause, BarChart } from "lucide-react";

const agents = [
  {
    id: "1",
    name: "Sarah",
    gender: "weiblich",
    voice: "Freundlich",
    status: "Aktiv",
    kontaktierteLeads: 47,
    gesetzteTermine: 12,
    conversionRate: "22.4%",
    telefonierteminuten: 342,
    leadSource: "Facebook Ads",
    calendar: "Marcus Weber",
  },
  {
    id: "2", 
    name: "Marcus",
    gender: "männlich", 
    voice: "Professionell",
    status: "Aktiv",
    kontaktierteLeads: 32,
    gesetzteTermine: 8,
    conversionRate: "18.7%",
    telefonierteminuten: 267,
    leadSource: "Google Ads",
    calendar: "Lisa Müller",
  },
  {
    id: "3",
    name: "Lisa",
    gender: "weiblich",
    voice: "Energisch", 
    status: "Pausiert",
    kontaktierteLeads: 0,
    gesetzteTermine: 0,
    conversionRate: "15.2%",
    telefonierteminuten: 0,
    leadSource: "LinkedIn",
    calendar: "Thomas Klein",
  },
];

export default function Agents() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">KI-Agenten</h2>
        
        <Button onClick={() => navigate("/agents/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Neuen Agenten erstellen
        </Button>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2">
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
                  <button 
                    className={`px-3 py-2 rounded-lg border-2 flex items-center space-x-2 ${
                      agent.status === "Aktiv" 
                        ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100" 
                        : "border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    }`}
                  >
                    {agent.status === "Aktiv" ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span className="text-sm font-medium">Aktiv</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span className="text-sm font-medium">Pausiert</span>
                      </>
                    )}
                  </button>
                  <button 
                    className="p-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    onClick={() => navigate(`/agents/analytics/${agent.id}`)}
                  >
                    <BarChart className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    onClick={() => navigate(`/agents/edit/${agent.id}`)}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Kontaktierte Leads</p>
                  <p className="font-semibold text-lg">{agent.kontaktierteLeads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gesetzte Termine</p>
                  <p className="font-semibold text-lg">{agent.gesetzteTermine}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conversionrate</p>
                  <p className="font-semibold text-lg">{agent.conversionRate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefonierte Minuten</p>
                  <p className="font-semibold text-lg">{agent.telefonierteminuten}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Verknüpfte Lead Quellen</p>
                  <Badge variant="outline">{agent.leadSource}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Verknüpfte Kalender</p>
                  <Badge variant="secondary">{agent.calendar}</Badge>
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}