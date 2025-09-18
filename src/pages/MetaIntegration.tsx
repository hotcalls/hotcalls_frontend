import { useState, useEffect } from "react";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { metaAPI } from "@/lib/apiService";
import { Plus, Share2, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";

interface MetaIntegration {
  id: string;
  workspace: string;
  workspace_name?: string;
  page_id: string;
  page_name?: string;
  page_picture_url?: string;
  business_account_id: string;
  status: 'active' | 'inactive' | 'error';
  access_token_expires_at?: string;
  scopes?: string[];
  lead_forms_count?: number;
  created_at: string;
  updated_at: string;
  forms?: any[];
}

export default function MetaIntegration() {
  const [metaIntegrations, setMetaIntegrations] = useState<MetaIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { workspaceDetails, loading: workspaceLoading, error: workspaceError } = useWorkspace();
  const { toast } = useToast();

  // Debug workspace loading
  console.log('🔍 MetaIntegration Debug:', {
    workspaceDetails: workspaceDetails?.id ? `${workspaceDetails.id} (${workspaceDetails.workspace_name})` : 'null',
    workspaceLoading,
    workspaceError,
    hasWorkspaceId: !!workspaceDetails?.id
  });

  const loadMetaIntegrations = async () => {
    console.log('📡 Loading Meta integrations...');
    setIsLoading(true);
    try {
      const integrations = await metaAPI.getIntegrations();
      console.log('📊 Meta integrations API response:', integrations);
      if (Array.isArray(integrations)) {
        setMetaIntegrations(integrations);
        console.log(`✅ Loaded ${integrations.length} Meta integrations`);
      } else {
        setMetaIntegrations([]);
        console.warn('⚠️ API returned non-array response:', integrations);
      }
    } catch (error) {
      console.error("❌ Error loading Meta integrations:", error);
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
    console.log('🔄 MetaIntegration useEffect triggered:', {
      hasWorkspaceId: !!workspaceDetails?.id,
      workspaceLoading,
      workspaceError
    });

    if (workspaceDetails?.id) {
      console.log('✅ Workspace loaded, calling loadMetaIntegrations');
      loadMetaIntegrations();
    } else if (!workspaceLoading && !workspaceError) {
      // Workspace finished loading but no workspace found
      console.warn('⚠️ No workspace available after loading completed');
      toast({
        title: "Warning",
        description: "No workspace context available. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [workspaceDetails, workspaceLoading, workspaceError]);

  // Handle URL parameters for successful Meta connection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const metaConnected = urlParams.get('meta_connected');
    
    if (metaConnected === 'true') {
      console.log('🎉 Meta connection successful, showing success message');
      toast({
        title: "Meta Integration Successful",
        description: "Your Facebook page has been connected successfully!",
        duration: 5000,
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Reload integrations after a short delay to ensure backend processing is complete
      setTimeout(() => {
        if (workspaceDetails?.id) {
          loadMetaIntegrations();
        }
      }, 1000);
    }
  }, [workspaceDetails, toast]);

  const handleAddMetaIntegration = async () => {
    if (!workspaceDetails?.id) {
      console.error("No workspace ID available");
      toast({
        title: "Error",
        description: "No workspace selected.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      
      const { oauth_url } = await metaAPI.getOAuthUrl(workspaceDetails.id);
      
      // Redirect to Meta OAuth
      window.location.href = oauth_url;
    } catch (error) {
      console.error("Failed to get Meta OAuth URL:", error);
      toast({
        title: "Error",
        description: "Meta Integration could not be started.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      
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
      console.error("Failed to delete Meta integration:", error);
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

  // Show loading state while workspace or integrations are loading
  if (workspaceLoading || isLoading) {
    return (
      <div className={layoutStyles.page}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-pulse text-gray-500">
            {workspaceLoading ? 'Loading workspace...' : 'Loading Meta integrations...'}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if workspace failed to load
  if (workspaceError) {
    return (
      <div className={layoutStyles.page}>
        <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900">Workspace Error</h2>
            <p className="text-gray-500">Failed to load workspace context.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if no workspace is available
  if (!workspaceDetails?.id) {
    return (
      <div className={layoutStyles.page}>
        <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900">No Workspace</h2>
            <p className="text-gray-500">Please select a workspace to view Meta integrations.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
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
              {metaIntegrations.map((integration) => {
                // Safe guard against malformed integration data
                if (!integration || typeof integration !== 'object') {
                  console.warn('Skipping malformed integration:', integration);
                  return null;
                }
                
                return (
                <div key={integration.id || Math.random()} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Share2 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {integration.page_name || `Page ${integration.page_id}`}
                        </h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (integration.status || 'inactive') === 'active'
                            ? 'bg-green-100 text-green-800' 
                            : (integration.status || 'inactive') === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(integration.status || 'inactive') === 'active' ? 'Active' : 
                           (integration.status || 'inactive') === 'error' ? 'Error' : 'Inactive'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Page ID:</strong> {integration.page_id || 'Unknown'}</p>
                        <p><strong>Created:</strong> {integration.created_at ? formatDate(integration.created_at) : 'Unknown'}</p>
                        <p><strong>Last Updated:</strong> {integration.updated_at ? formatDate(integration.updated_at) : 'Unknown'}</p>
                        {integration.forms && integration.forms.length > 0 && (
                          <p><strong>Lead Forms:</strong> {integration.forms.length} form(s)</p>
                        )}
                        {integration.lead_forms_count !== undefined && (
                          <p><strong>Lead Forms:</strong> {integration.lead_forms_count} form(s)</p>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}