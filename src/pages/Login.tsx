import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authService, agentService } from "@/lib/authService";
import { subscriptionService } from "@/lib/subscriptionService";
import { workspaceAPI } from "@/lib/apiService";
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

      // Show welcome only if any workspace has an active/trial subscription
      try {
        const workspaces = await workspaceAPI.getMyWorkspaces();
        let hasActive = false;
        for (const ws of workspaces || []) {
          try {
            const sub = await subscriptionService.getSubscriptionStatus(String(ws.id));
            const status = sub?.subscription?.status;
            if (sub?.has_subscription && (status === 'active' || status === 'trial')) {
              hasActive = true; break;
            }
          } catch {}
        }
        if (hasActive) {
          toast.success(`Willkommen zurück, ${loginResponse.user.first_name}!`);
        }
      } catch {}

      // Brief pause to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Smart routing: respect `next` param if provided
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
        navigate("/dashboard");
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
          <div className="mx-auto mb-6">
            <img src="/hotcalls-logo.png" alt="hotcalls" className="h-12 w-auto" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; const fallback = img.nextElementSibling as HTMLElement; if (fallback) fallback.style.display = 'flex'; }} />
            <div className="items-center gap-2 justify-center hidden">
              <div className="w-8 h-8 bg-[#3d5097] rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">H</span></div>
              <span className="text-2xl font-bold text-gray-900">hotcalls</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
          <CardDescription>Melden Sie sich bei Ihrem HotCalls Konto an</CardDescription>
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