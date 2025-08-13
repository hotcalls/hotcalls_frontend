import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { authService, agentService } from "@/lib/authService";
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
    
    // Debug: Log input changes, especially for password
    if (name === 'password') {
      console.log('🔑 Password field changed:', { 
        length: value.length, 
        hasValue: !!value,
        firstChar: value ? value[0] + '...' : 'empty'
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log form data to help diagnose the issue
    console.log('🔍 Form submission data:', {
      email: formData.email,
      passwordLength: formData.password?.length || 0,
      passwordPresent: !!formData.password,
      formDataFull: formData
    });
    
    if (!formData.email || !formData.password) {
      console.error('❌ Missing required fields:', { 
        email: !!formData.email, 
        password: !!formData.password,
        passwordValue: formData.password
      });
      toast.error("Bitte füllen Sie alle Felder aus", {
        description: `E-Mail: ${formData.email ? '✅' : '❌'}, Passwort: ${formData.password ? '✅' : '❌'}`
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔑 Attempting login for:', formData.email);
      
      // Login with API (cookie-based authentication)
      const loginResponse = await authService.login(formData.email, formData.password);
      
      console.log('✅ Login successful:', loginResponse);
      toast.success(`Willkommen zurück, ${loginResponse.user.first_name}!`);

      // Wait a moment to ensure cookies are properly set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify authentication state (cookies instead of tokens)
      const cookiesPresent = document.cookie.length > 0;
      const isLoggedIn = authService.isLoggedIn();
      
      console.log('🔍 Authentication state check:', {
        cookiesPresent,
        isLoggedIn,
        cookieCount: document.cookie.split(';').length
      });

      if (!cookiesPresent) {
        console.warn('⚠️ No cookies found after login - this might indicate a CORS issue');
        // Don't fail completely, as the session might still work
      }

      // Smart routing: respect `next` param if provided (used by invitation flow)
      const params = new URLSearchParams(location.search);
      const nextParam = params.get('next');
      const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : null;
      console.log('📊 Post-login navigation:', { nextParam, nextPath });
      if (nextPath) {
        navigate(nextPath);
      } else {
        navigate("/dashboard");
      }

      // Optional: Check if user has agents for logging purposes (with better error handling)
      try {
        console.log('🤖 Attempting to fetch user agents...');
        const agents = await agentService.getAgents();
        console.log('✅ User agents fetched successfully:', agents.length > 0 ? `${agents.length} agents found` : 'No agents - welcome flow will show');
      } catch (agentError: any) {
        console.warn('⚠️ Could not check agents:', agentError);
        
        // If it's a 401, the cookie authentication might not be working
        if (agentError.message?.includes('401')) {
          console.error('🚨 401 error - cookie authentication failed');
          console.log('🔍 Current auth state:', {
            cookies: document.cookie ? 'present' : 'missing',
            userLoggedIn: localStorage.getItem('userLoggedIn'),
            cookiePreview: document.cookie.substring(0, 50) + '...'
          });
          
          // Don't prevent navigation, but log the issue for debugging
          toast.warning("Dashboard loaded - some features may need re-authentication");
        }
      }

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = "Login fehlgeschlagen. Bitte versuchen Sie es erneut.";
      
      // Check for specific validation errors from Django REST Framework
      if (error.email) {
        // Email verification error
        const emailError = Array.isArray(error.email) ? error.email[0] : error.email;
        if (emailError.includes('verify') || emailError.includes('verification')) {
          errorMessage = "🔔 Ihr Konto ist noch nicht verifiziert. Bitte prüfen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink.";
          toast.error(errorMessage, {
            description: "Falls Sie keine E-Mail erhalten haben, prüfen Sie auch Ihren Spam-Ordner.",
            duration: 8000,
            action: {
              label: "E-Mail erneut senden",
              onClick: async () => {
                try {
                  const response = await fetch(`${window.location.origin}/api/auth/resend-verification/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                  });
                  
                  if (response.ok) {
                    toast.success("📧 Bestätigungs-E-Mail wurde erneut gesendet!");
                  } else {
                    const errorData = await response.json();
                    toast.error("Fehler beim Senden der E-Mail: " + (errorData.email?.[0] || "Unbekannter Fehler"));
                  }
                } catch (err) {
                  toast.error("Netzwerkfehler beim Senden der E-Mail");
                }
              }
            }
          });
          return; // Don't show generic error
        }
      }
      
      // Check for non-field errors
      if (error.non_field_errors) {
        const nonFieldError = Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors;
        if (nonFieldError.includes('Invalid email or password')) {
          errorMessage = "❌ Ungültige E-Mail-Adresse oder Passwort.";
        } else if (nonFieldError.includes('suspended') || nonFieldError.includes('disabled')) {
          errorMessage = "🚫 Ihr Konto wurde gesperrt. Kontaktieren Sie den Support.";
        }
      }
      
      // Fallback to checking error message for older error formats
      else if (error.message?.includes('verify') || error.message?.includes('verification')) {
        errorMessage = "🔔 Ihr Konto ist noch nicht verifiziert. Bitte prüfen Sie Ihre E-Mails.";
      } else if (error.message?.includes('credentials') || error.message?.includes('invalid')) {
        errorMessage = "❌ Ungültige E-Mail oder Passwort.";
      } else if (error.message?.includes('suspended') || error.message?.includes('disabled')) {
        errorMessage = "🚫 Ihr Konto wurde gesperrt. Kontaktieren Sie den Support.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-6">
            <img 
              src="/hotcalls-logo.png" 
              alt="hotcalls" 
              className="h-12 w-auto"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="items-center gap-2 justify-center hidden">
              <div className="w-8 h-8 bg-[#FE5B25] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">hotcalls</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
          <CardDescription>
            Melden Sie sich bei Ihrem HotCalls Konto an
          </CardDescription>
          
          {/* Show email verification reminder if user just registered */}
          {formData.email && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">E-Mail Verifizierung erforderlich</p>
                  <p className="text-blue-700">
                    Bitte überprüfen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink, bevor Sie sich anmelden.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="max.mustermann@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    // Debug: Log password on blur to catch autofill issues
                    console.log('🔍 Password field blur:', { 
                      value: e.target.value, 
                      length: e.target.value.length 
                    });
                  }}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {/* Debug indicator to show password state */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500">
                  Debug: Password length: {formData.password?.length || 0}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-muted-foreground">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Passwort vergessen?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Anmeldung läuft..." : "Anmelden"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Noch kein Account? 
              </span>
              {" "}
              <Link to={nextQuery ? `/signup?next=${encodeURIComponent(nextQuery)}` : "/signup"} className="text-primary hover:underline font-medium">
                Jetzt registrieren
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Footer Texte */}
      <div className="mt-12 text-center space-y-3">
        <div className="text-xs text-muted-foreground">
          <Link to="/agb" className="hover:text-primary underline">AGB</Link>
          <span className="mx-2">•</span>
          <Link to="/datenschutz" className="hover:text-primary underline">Datenschutzerklärung</Link>
          <span className="mx-2">•</span>
          <Link to="/datenlöschung" className="hover:text-primary underline">Datenlöschung</Link>
        </div>
        <div className="text-xs text-gray-400">
          © 2024 malmachen GbR. Alle Rechte vorbehalten.
        </div>
      </div>
    </div>
  );
};

export default Login; 