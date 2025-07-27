import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CreateAgentWizard from "@/components/CreateAgentWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CreateAgent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    // Get workspace ID from navigation state or localStorage
    const state = location.state as { workspaceId?: string } | null;
    
    if (state?.workspaceId) {
      setWorkspaceId(state.workspaceId);
    } else {
      // Try to get from localStorage (from registration)
      const registrationData = localStorage.getItem('registrationPending');
      if (registrationData) {
        try {
          const parsed = JSON.parse(registrationData);
          if (parsed.workspaceId) {
            setWorkspaceId(parsed.workspaceId);
          }
        } catch (error) {
          console.error('Failed to parse registration data:', error);
        }
      }
    }

    // If no workspace ID found, redirect to home
    if (!state?.workspaceId && !localStorage.getItem('registrationPending')) {
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleAgentComplete = (agent: any) => {
    // Clear registration pending data
    localStorage.removeItem('registrationPending');
    
    // Set user as logged in and clear welcome flags
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.removeItem('welcomeCompleted');
    
    // Navigate to dashboard
    navigate('/dashboard', { 
      state: { 
        message: `🎉 Glückwunsch! Ihr Agent "${agent.name}" wurde erfolgreich erstellt und ist bereit für Anrufe.`,
        newAgent: agent 
      } 
    });
  };

  const handleSkip = () => {
    // Clear registration pending data
    localStorage.removeItem('registrationPending');
    
    // Set user as logged in
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.removeItem('welcomeCompleted');
    
    // Navigate to dashboard
    navigate('/dashboard', {
      state: {
        message: "Sie können jederzeit später einen Agent erstellen."
      }
    });
  };

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Agent Setup</CardTitle>
            <CardDescription>
              Workspace wird geladen...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Welcome Message */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Willkommen bei HotCalls! 🎉</h1>
                <p className="text-sm text-muted-foreground">
                  Ihr Account wurde erfolgreich erstellt. Jetzt erstellen wir Ihren ersten KI-Agent.
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Später erstellen
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Creation Wizard */}
      <div className="py-8">
        <CreateAgentWizard 
          workspaceId={workspaceId}
          onComplete={handleAgentComplete}
          onSkip={handleSkip}
        />
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      </div>
    </div>
  );
} 