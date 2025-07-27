import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Bot, Play, Pause, BarChart, Settings, Trash2, User, UserCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { agentService, Agent } from "@/lib/authService";

export default function Agents() {
  const navigate = useNavigate();
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        console.log('🤖 Loading agents from API...');
        const agents = await agentService.getAgents();
        console.log('✅ Agents loaded:', agents);
        setAgentList(agents);
      } catch (error) {
        console.error('❌ Failed to load agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

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
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-gray-500">Lade Agenten...</p>
          </div>
        ) : agentList.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-gray-500">Keine Agenten gefunden. Erstelle deinen ersten Agenten!</p>
          </div>
        ) : (
          agentList.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    {agent.voice === "sarah" && (
                      <AvatarImage src="/avatars/sarah.jpg.png" alt="Sarah" />
                    )}
                    {agent.voice === "marcus" && (
                      <AvatarImage src="/avatars/marcus.jpg.png" alt="Marcus" />
                    )}
                    {agent.voice === "lisa" && (
                      <AvatarImage src="/avatars/lisa.png" alt="Lisa" />
                    )}
                    <AvatarFallback className={`
                      ${agent.voice === "sarah" ? "bg-blue-100 text-blue-600" : ""}
                      ${agent.voice === "marcus" ? "bg-green-100 text-green-600" : ""}
                      ${agent.voice === "lisa" ? "bg-purple-100 text-purple-600" : ""}
                    `}>
                      {agent.voice === "sarah" && <User className="h-6 w-6" />}
                      {agent.voice === "marcus" && <UserCircle className="h-6 w-6" />}
                      {agent.voice === "lisa" && <Sparkles className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className={textStyles.cardTitle}>{agent.name}</CardTitle>
                    <p className={textStyles.cardSubtitle}>
                      {agent.language} • {agent.status}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                  <button
                    className={agent.status === "active" ? buttonStyles.cardAction.statusActive : buttonStyles.cardAction.statusPaused}
                  >
                    {agent.status === "active" ? (
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={textStyles.metricLabel}>Charakter</p>
                  <p className={textStyles.metric}>{agent.character}</p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Sprache</p>
                  <p className={textStyles.metric}>{agent.language}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={textStyles.metricLabel}>Arbeitszeiten</p>
                  <Badge variant="outline">{agent.call_from} - {agent.call_to}</Badge>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Status</p>
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
}