import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Facebook, Globe, Linkedin, Webhook, Settings, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI } from "@/lib/apiService";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

interface MetaIntegration {
  id: string;
  workspace: string;
  page_id: string;
  business_account_id: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  access_token_expires_at?: string;
}

export default function LeadSources() {
  const [metaIntegrations, setMetaIntegrations] = useState<MetaIntegration[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { workspaceDetails } = useWorkspace();
  const { toast } = useToast();

  // Load Meta integrations from backend
  const loadMetaIntegrations = useCallback(async () => {
    console.log('🔍 Starting to load Meta integrations...');
    setIsLoading(true);
    try {
      console.log('📡 Calling metaAPI.getIntegrations()...');
      const integrations = await metaAPI.getIntegrations();
      console.log('✅ Meta integrations response:', integrations);
      setMetaIntegrations(integrations);
      console.log(`✅ Loaded ${integrations.length} Meta integrations`);
    } catch (error) {
      console.error('❌ Error loading Meta integrations:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      // Set empty array to prevent further errors
      setMetaIntegrations([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 Meta integrations loading completed');
    }
  }, []);

  const handleConfigure = (integrationId: string) => {
    navigate(`/dashboard/lead-sources/meta/config?integration=${integrationId}`);
  };

  const handleAddLeadSource = async (type: string) => {
    if (type === "Meta") {
      if (!workspaceDetails?.id) {
        console.error('❌ No workspace ID available');
        return;
      }
      
      try {
        console.log('🔗 Starting Meta OAuth flow for workspace:', workspaceDetails.id);
        const { oauth_url } = await metaAPI.getOAuthUrl(workspaceDetails.id);
        
        // Redirect to Meta OAuth
        window.location.href = oauth_url;
      } catch (error) {
        console.error('❌ Failed to get Meta OAuth URL:', error);
        toast({
          title: "Fehler",
          description: "Meta Integration konnte nicht gestartet werden.",
          variant: "destructive",
        });
      }
    }
    setIsAddDialogOpen(false);
  };

  // Load integrations on mount
  useEffect(() => {
    console.log('🚀 LeadSources component mounted, about to load integrations...');
    console.log('📋 Workspace details:', workspaceDetails);
    try {
      loadMetaIntegrations();
    } catch (error) {
      console.error('💥 Error in useEffect:', error);
      setIsLoading(false);
    }
  }, [loadMetaIntegrations]);

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Lead Quellen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deine Lead-Kanäle und Integrationen</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className={buttonStyles.create.default}>
              <Plus className={iconSizes.small} />
              <span>Lead Quelle hinzufügen</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lead Quelle hinzufügen</DialogTitle>
              <DialogDescription>
                Wähle eine Lead Quelle aus, die du mit deinen Agenten verbinden möchtest.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Meta */}
              <button
                onClick={() => handleAddLeadSource("Meta")}
                className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#FFE1D7]">
                  <Facebook className={`${iconSizes.large} text-blue-600 group-hover:text-[#FE5B25]`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Meta Lead Ads</h3>
                  <p className="text-sm text-muted-foreground">
                    Verbinde deine Facebook und Instagram Lead Formulare
                  </p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Lade Lead Quellen...</span>
        </div>
      )}

      {/* Meta Integrations */}
      {!isLoading && (
        <div className={layoutStyles.cardGrid}>
          {metaIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#FFE1D7]">
                      <Facebook className={`${iconSizes.large} text-[#FE5B25]`} />
                    </div>
                    <div>
                      <CardTitle className={textStyles.cardTitle}>
                        Meta Lead Ads
                      </CardTitle>
                      <p className={textStyles.cardSubtitle}>Page ID: {integration.page_id}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                    <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                      {integration.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    
                    <button 
                      className={buttonStyles.cardAction.icon}
                      onClick={() => handleConfigure(integration.id)}
                    >
                      <Settings className={iconSizes.small} />
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {/* Empty state */}
          {metaIntegrations.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <Facebook className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Keine Lead Quellen verbunden</h3>
                <p className="text-gray-500 mb-4">
                  Verbinde deine Meta Lead Ads um automatisch Leads zu empfangen
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Lead Quelle hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}