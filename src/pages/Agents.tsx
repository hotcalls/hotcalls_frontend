import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Bot, Play, Pause, BarChart, Settings, Trash2, User, UserCircle, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { agentAPI, AgentResponse } from "@/lib/apiService";
import { useWorkspace } from "@/hooks/use-workspace";
import { useVoices } from "@/hooks/use-voices";

export default function Agents() {
  const navigate = useNavigate();
  const [agentList, setAgentList] = useState<AgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current workspace for filtering agents
  const { primaryWorkspace, loading: workspaceLoading } = useWorkspace();
  
  // Get voices for lookup (names and pictures)
  const { getVoiceName, getVoicePicture, loading: voicesLoading } = useVoices();

  useEffect(() => {
    const loadAgents = async () => {
      if (workspaceLoading) return; // Wait for workspace to load
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('🤖 Loading agents from API...', { workspaceId: primaryWorkspace?.id });
        
        // Load agents filtered by current workspace
        const agents = await agentAPI.getAgents(primaryWorkspace?.id);
        console.log('✅ Agents loaded:', agents);
        
        // Ensure agents is always an array
        const agentsArray = Array.isArray(agents) ? agents : [];
        console.log('📦 Setting agent list:', agentsArray);
        setAgentList(agentsArray);
      } catch (error) {
        console.error('❌ Failed to load agents:', error);
        setError(error instanceof Error ? error.message : 'Failed to load agents');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [primaryWorkspace?.id, workspaceLoading]);

  const deleteAgent = (id: string, name: string) => {
    // TODO: Implement actual delete API call
    setAgentList(agentList.filter(agent => agent.id !== id));
    console.log(`Agent "${name}" wurde gelöscht`);
  };

  // Show loading state while workspace or voices are loading
  if (workspaceLoading || voicesLoading) {
    return (
      <div className={layoutStyles.pageContainer}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500">Lade Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>KI-Agenten</h1>
          <p className={textStyles.pageSubtitle}>
            Verwalte und konfiguriere deine KI-Agenten
            {primaryWorkspace && ` • ${primaryWorkspace.workspace_name}`}
          </p>
        </div>
        
        <button className={buttonStyles.create.default} onClick={() => navigate("/dashboard/agents/create")}>
          <Plus className={iconSizes.small} />
          <span>Neuen Agenten erstellen</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Fehler beim Laden der Agenten: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Neu laden
          </Button>
        </div>
      )}

      {/* Agents Grid - EINHEITLICH */}
      <div className={layoutStyles.cardGrid}>
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500">Lade Agenten...</p>
            </div>
          </div>
        ) : agentList.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Keine Agenten gefunden</p>
              <p className="text-sm text-gray-400 mb-4">
                Erstelle deinen ersten Agenten um loszulegen!
              </p>
              <Button onClick={() => navigate("/dashboard/agents/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Agenten erstellen
              </Button>
            </div>
          </div>
        ) : (
          agentList.map((agent) => {
            const voicePicture = getVoicePicture(agent.voice);
            const voiceName = getVoiceName(agent.voice);
            
            return (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        {voicePicture && (
                          <AvatarImage 
                            src={voicePicture} 
                            alt={voiceName}
                            onError={(e) => {
                              // Fallback to Bot icon if image fails to load
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className={textStyles.cardTitle}>{agent.name}</CardTitle>
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
                      <p className={textStyles.metricLabel}>Stimme</p>
                      <p className={textStyles.metric}>{voiceName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}