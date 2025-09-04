import { useState, useEffect } from "react";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI } from "@/lib/apiService";
import { Plus, Share2, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

interface MetaIntegration {
  id: string;
  workspace: string;
  page_id: string;
  page_name: string;
  access_token: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  forms?: any[];
}

export default function MetaIntegration() {
  const [metaIntegrations, setMetaIntegrations] = useState<MetaIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { workspaceDetails } = useWorkspace();
  const { toast } = useToast();

  const loadMetaIntegrations = async () => {
    console.log('🔍 Loading Meta integrations...');
    setIsLoading(true);
    try {
      const integrations = await metaAPI.getIntegrations();
      if (Array.isArray(integrations)) {
        setMetaIntegrations(integrations);
        console.log(`✅ Loaded ${integrations.length} Meta integrations`);
      } else {
        setMetaIntegrations([]);
      }
    } catch (error) {
      console.error('❌ Error loading Meta integrations:', error);
      setMetaIntegrations([]);
      toast({
        title: "Error",
        description: "Failed to load Meta integrations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceDetails?.id) {
      loadMetaIntegrations();
    }
  }, [workspaceDetails]);

  const handleAddMetaIntegration = async () => {
    if (!workspaceDetails?.id) {
      console.error('❌ No workspace ID available');
      toast({
        title: "Error",
        description: "No workspace selected.",
        variant: "destructive",
      });
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
        title: "Error",
        description: "Meta Integration could not be started.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      console.log('🗑️ Deleting Meta integration:', integrationId);
      await metaAPI.deleteIntegration(integrationId);
      
      // Remove from local state
      setMetaIntegrations(prevIntegrations => 
        prevIntegrations.filter(integration => integration.id !== integrationId)
      );
      
      toast({
        title: "Integration deleted",
        description: "Meta Integration was successfully removed.",
      });
    } catch (error) {
      console.error('❌ Failed to delete Meta integration:', error);
      toast({
        title: "Error",
        description: "Integration could not be deleted.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={layoutStyles.page}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-pulse text-gray-500">Loading Meta integrations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.page}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={textStyles.pageTitle}>Meta Integration</h1>
          <p className={textStyles.description}>
            Connect your Meta (Facebook) Lead Ads to automatically receive leads
          </p>
        </div>
        <button
          onClick={handleAddMetaIntegration}
          className={buttonStyles.create.default}
        >
          <Plus className={iconSizes.small} />
          <span>Connect Meta</span>
        </button>
      </div>

      {/* Meta Integrations Section */}
      <div className="space-y-6">
        <div>
          <h2 className={textStyles.sectionTitle}>Active Meta Integrations</h2>
          {metaIntegrations.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Share2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Meta integrations</h3>
              <p className="mt-2 text-gray-500">
                Connect your Meta (Facebook) account to start receiving leads from your Lead Ads campaigns.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddMetaIntegration}
                  className={buttonStyles.create.default}
                >
                  <Plus className={iconSizes.small} />
                  <span>Connect Meta Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {metaIntegrations.map((integration) => (
                <div key={integration.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Share2 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {integration.page_name}
                        </h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          integration.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Page ID:</strong> {integration.page_id}</p>
                        <p><strong>Created:</strong> {formatDate(integration.created_at)}</p>
                        <p><strong>Last Updated:</strong> {formatDate(integration.updated_at)}</p>
                        {integration.forms && integration.forms.length > 0 && (
                          <p><strong>Lead Forms:</strong> {integration.forms.length} form(s)</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://facebook.com/${integration.page_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonStyles.secondary.default}
                        title="View Facebook Page"
                      >
                        <ExternalLink className={iconSizes.small} />
                      </a>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className={buttonStyles.danger.default}
                        title="Delete Integration"
                      >
                        <Trash2 className={iconSizes.small} />
                      </button>
                    </div>
                  </div>
                  
                  {integration.forms && integration.forms.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Lead Forms:</h4>
                      <div className="grid gap-2">
                        {integration.forms.map((form: any, index: number) => (
                          <div key={form.id || index} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                            <div className="font-medium">{form.name || `Form ${index + 1}`}</div>
                            {form.id && <div className="text-xs text-gray-500">ID: {form.id}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">How Meta Integration Works</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>1. Click "Connect Meta" to authorize access to your Facebook pages</p>
                <p>2. Select the Facebook page containing your Lead Ads</p>
                <p>3. Your lead forms will be automatically synchronized</p>
                <p>4. New leads from your Meta Lead Ads will appear in your Leads section</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}