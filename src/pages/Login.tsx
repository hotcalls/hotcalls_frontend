import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authService, agentService } from "@/lib/authService";
import { workspaceAPI, paymentAPI } from "@/lib/apiService";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const paramsForLinks = new URLSearchParams(location.search);
  const nextQuery = paramsForLinks.get('next');

  // Handle registration success message and pre-fill email
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;

    if (state?.message) {
      toast.success("Registrierung erfolgreich! " + state.message, {
        duration: 8000
      });
    }

    if (state?.email) {
      setFormData(prev => ({
        ...prev,
        email: state.email,
      }));
    }

    // Clear the state to prevent showing the message again on refresh
    if (state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, toast, navigate, location.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    setIsLoading(true);

    try {
      const loginResponse = await authService.login(formData.email, formData.password);

      // Nach Login: Abo-Status robust prüfen (Payments API → Workspace-Fallback)
      let hasActiveSubscription = false;
      try {
        const workspaces = await workspaceAPI.getMyWorkspaces();
        const primaryWs = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces[0] : null;
        if (primaryWs?.id) {
          try {
            const sub = await paymentAPI.getSubscription(String(primaryWs.id));
            hasActiveSubscription = !!(sub?.has_subscription && sub?.subscription?.status === 'active');
          } catch {}

          if (!hasActiveSubscription) {
            try {
              const ws = await workspaceAPI.getWorkspaceDetails(String(primaryWs.id));
              hasActiveSubscription = !!(
                ws?.is_subscription_active ||
                ws?.has_active_subscription ||
                ws?.subscription_active ||
                ws?.active_subscription ||
                ws?.subscription_status === 'active' ||
                ws?.plan_status === 'active'
              );
            } catch {}
          }
        }
      } catch {}

      // Kurze Pause, damit Cookies/State stabil sind
      await new Promise(resolve => setTimeout(resolve, 100));

      if (hasActiveSubscription) {
        // Aktives Abo → Dashboard (oder next, falls vorhanden und erlaubt)
        const params = new URLSearchParams(location.search);
        const nextParam = params.get('next');
        const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : null;
        if (nextPath) {
          if (nextPath.startsWith('/invitations/')) {
            window.location.assign(nextParam!);
            return;
          }
          navigate(nextPath);
        } else {
          toast.success(`Willkommen zurück, ${loginResponse.user.first_name}!`);
          navigate('/dashboard');
        }
      } else {
        // Kein aktives Abo → immer zum WelcomeFlow (der entscheidet Step 0 vs. Step 7)
        navigate('/welcome', { replace: true });
      }

      // Optional: fetch agents for logging
      try { await agentService.getAgents(); } catch {}

    } catch (error: any) {
      toast.error("Login fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex flex-col items-center">
            <img src="/HC Logo.png" alt="HC Logo" className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
          <CardDescription>Melde dich bei deinem Hotcalls Konto an</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" placeholder="max.mustermann@example.com" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} autoComplete="current-password" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-muted-foreground">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Passwort vergessen?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Anmeldung läuft..." : "Anmelden"}</Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Noch kein Account? </span>
              <Link to={nextQuery ? `/signup?next=${encodeURIComponent(nextQuery)}` : "/signup"} className="text-primary hover:underline font-medium">Jetzt registrieren</Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="mt-12 text-center space-y-3">
        <div className="text-xs text-muted-foreground">
          <Link to="/agb" className="hover:text-primary underline">AGB</Link>
          <span className="mx-2">•</span>
          <Link to="/datenschutz" className="hover:text-primary underline">Datenschutzerklärung</Link>
          <span className="mx-2">•</span>
          <Link to="/datenlöschung" className="hover:text-primary underline">Datenlöschung</Link>
        </div>
        <div className="text-xs text-gray-400">© 2024 malmachen GbR. Alle Rechte vorbehalten.</div>
      </div>
    </div>
  );
};

export default Login; 