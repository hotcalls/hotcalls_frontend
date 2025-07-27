import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { registrationFlow } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Pre-fill email and password from QuickSignUp if available
  useEffect(() => {
    const state = location.state as { email?: string; password?: string } | null;
    if (state?.email && state?.password) {
      setFormData(prev => ({
        ...prev,
        email: state.email,
        password: state.password,
        confirmPassword: state.password,
      }));
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only check password confirmation if not coming from QuickSignUp
    if (!location.state?.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Passwörter stimmen nicht überein!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call registration API with workspace creation
      const result = await registrationFlow.registerWithWorkspace(
        {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          password: formData.password,
          password_confirm: formData.confirmPassword || formData.password,
        },
        formData.company // This becomes the workspace name
      );

      if (result.registration.success) {
        // Show success message
        toast({
          title: "Registrierung erfolgreich!",
          description: result.workspace 
            ? `Account und Workspace "${formData.company}" wurden erstellt. Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.`
            : "Account wurde erstellt. Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.",
        });

        // Store registration info for potential future use
        localStorage.setItem('registrationPending', JSON.stringify({
          email: formData.email,
          workspace: result.workspace?.workspace_name || formData.company,
        }));

        // Redirect to login with success message
        navigate("/login", {
          state: {
            message: "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink, bevor Sie sich anmelden.",
            email: formData.email,
          }
        });
      } else {
        throw new Error(result.registration.message || 'Registrierung fehlgeschlagen');
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      let errorMessage = "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific validation errors
        if (error.message.includes("Bad Request")) {
          errorMessage = "Eingabedaten sind ungültig. Bitte überprüfen Sie alle Felder und Passwort-Anforderungen.";
        } else if (error.message.includes("email")) {
          errorMessage = "E-Mail Adresse ist bereits registriert oder ungültig.";
        } else if (error.message.includes("phone")) {
          errorMessage = "Telefonnummer ist ungültig. Bitte verwenden Sie das Format: +49 123 456789";
        } else if (error.message.includes("password")) {
          errorMessage = "Passwort entspricht nicht den Anforderungen: Mindestens 8 Zeichen, nicht zu einfach, nicht nur Zahlen.";
        }
      }
      
      toast({
        title: "Registrierung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = formData.password.length >= 8 && 
                         !/^\d+$/.test(formData.password) && // not only numbers
                         !['password', 'password123', '12345678', '123456789'].includes(formData.password.toLowerCase());

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.phone && formData.company && formData.password && 
                     (location.state?.password || isPasswordValid) &&
                     (location.state?.password || (formData.confirmPassword && formData.password === formData.confirmPassword));

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
          <CardTitle className="text-2xl font-bold">Account vervollständigen</CardTitle>
          <CardDescription>
            Schritt 2 von 2 - Vervollständigen Sie Ihre Registrierung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Max"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Mustermann"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="max.mustermann@example.com"
                value={formData.email}
                onChange={handleInputChange}
                readOnly={!!location.state?.email}
                className={location.state?.email ? "bg-gray-50 cursor-not-allowed" : ""}
                required
              />
              {location.state?.email && (
                <p className="text-xs text-muted-foreground">E-Mail Adresse bereits bestätigt</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+49 123 456789"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: +49 123 456789 oder 0123 456789
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Unternehmen</Label>
              <Input
                id="company"
                name="company"
                placeholder="Ihr Unternehmen"
                value={formData.company}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Only show password fields if not coming from QuickSignUp */}
            {!location.state?.password && (
              <>
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
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Das Passwort muss folgende Anforderungen erfüllen:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={formData.password.length >= 8 ? "text-green-600" : ""}>
                        Mindestens 8 Zeichen {formData.password.length >= 8 ? "✓" : ""}
                      </li>
                      <li className={!/^\d+$/.test(formData.password) && formData.password ? "text-green-600" : ""}>
                        Nicht nur Zahlen {!/^\d+$/.test(formData.password) && formData.password ? "✓" : ""}
                      </li>
                      <li className={!['password', 'password123', '12345678', '123456789'].includes(formData.password.toLowerCase()) && formData.password ? "text-green-600" : ""}>
                        Nicht zu einfach {!['password', 'password123', '12345678', '123456789'].includes(formData.password.toLowerCase()) && formData.password ? "✓" : ""}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Show confirmation if password was set in QuickSignUp */}
            {location.state?.password && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✓ Passwort bereits festgelegt</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Account wird erstellt...
                </>
              ) : (
                "Account erstellen & loslegen"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link to="/signup" className="text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Zurück
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

export default SignUp; 