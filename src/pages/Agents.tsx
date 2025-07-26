import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Bot, Play, Pause, BarChart, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

const agents = [
  {
    id: "1",
    name: "Sarah",
    personality: "Freundlich & Professionell",
    gender: "Weiblich",
    voice: "sarah",
    status: "Aktiv",
    kontaktierteLeads: 142,
    gesetzteTermine: 28,
    conversionRate: "19.7%",
    telefonierteminuten: 340,
    leadSource: "Meta Lead Ads",
    calendar: "Google Calendar"
  },
  {
    id: "2", 
    name: "Marcus",
    personality: "Direkt & Zielstrebig",
    gender: "Männlich", 
    voice: "marcus",
    status: "Pausiert",
    kontaktierteLeads: 89,
    gesetzteTermine: 12,
    conversionRate: "13.5%",
    telefonierteminuten: 210,
    leadSource: "Website",
    calendar: "Outlook"
  },
  {
    id: "3",
    name: "Lisa", 
    personality: "Empathisch & Hilfsbereit",
    gender: "Weiblich",
    voice: "lisa",
    status: "Aktiv",
    kontaktierteLeads: 95,
    gesetzteTermine: 22,
    conversionRate: "23.2%",
    telefonierteminuten: 285,
    leadSource: "LinkedIn",
    calendar: "Google Calendar"
  }
];

export default function Agents() {
  const navigate = useNavigate();
  const [agentList, setAgentList] = useState(agents);

  const deleteAgent = (id: string, name: string) => {
    setAgentList(agentList.filter(agent => agent.id !== id));
    console.log(`Agent "${name}" wurde gelöscht`);
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>KI-Agenten</h1>
          <p className={textStyles.pageSubtitle}>Verwalte und konfiguriere deine KI-Agenten</p>
        </div>
        
        <button className={buttonStyles.create.default} onClick={() => navigate("/dashboard/agents/create")}>
          <Plus className={iconSizes.small} />
          <span>Neuen Agenten erstellen</span>
        </button>
      </div>

      {/* Agents Grid - EINHEITLICH */}
      <div className={layoutStyles.cardGrid}>
        {agentList.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FFE1D7] rounded-lg">
                    <Bot className={`${iconSizes.large} text-[#FE5B25]`} />
                  </div>
                  <div>
                    <CardTitle className={textStyles.cardTitle}>{agent.name}</CardTitle>
                    <p className={textStyles.cardSubtitle}>
                      {agent.gender} • {agent.voice}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                  <button
                    className={agent.status === "Aktiv" ? buttonStyles.cardAction.statusActive : buttonStyles.cardAction.statusPaused}
                  >
                    {agent.status === "Aktiv" ? (
                      <>
                        <Pause className={iconSizes.small} />
                        <span>Aktiv</span>
                      </>
                    ) : (
                      <>
                        <Play className={iconSizes.small} />
                        <span>Pausiert</span>
                      </>
                    )}
                  </button>
                  <button 
                    className="px-3 py-2 border-2 border-blue-200 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
                    onClick={() => navigate(`/dashboard/agents/analytics/${agent.id}`)}
                  >
                    <BarChart className={iconSizes.small} />
                    <span>Analyse</span>
                  </button>
                  <button 
                    className={buttonStyles.cardAction.icon}
                    onClick={() => navigate(`/dashboard/agents/edit/${agent.id}`)}
                  >
                    <Settings className={iconSizes.small} />
                  </button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className={buttonStyles.cardAction.iconDelete}>
                        <Trash2 className={iconSizes.small} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Agent löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bist du sicher, dass du den Agent "{agent.name}" löschen möchtest? 
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className={buttonStyles.dialog.cancel}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteAgent(agent.id, agent.name)}
                          className={buttonStyles.dialog.destructive}
                        >
                          Agent löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className={textStyles.metricLabel}>Kontaktierte Leads</p>
                  <p className={textStyles.metric}>{agent.kontaktierteLeads}</p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Gesetzte Termine</p>
                  <p className={textStyles.metric}>{agent.gesetzteTermine}</p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Conversionrate</p>
                  <p className={textStyles.metric}>{agent.conversionRate}</p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Telefoniert</p>
                  <p className={textStyles.metric}>{Math.floor(agent.telefonierteminuten / 60).toString().padStart(2, '0')}:{(agent.telefonierteminuten % 60).toString().padStart(2, '0')} Std</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={textStyles.metricLabel}>Verknüpfte Lead Quellen</p>
                  <Badge variant="outline">{agent.leadSource}</Badge>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Verknüpfte Kalender</p>
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