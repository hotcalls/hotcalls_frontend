import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Phone, ArrowLeft } from "lucide-react";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only check password confirmation if not coming from QuickSignUp
    if (!location.state?.password && formData.password !== formData.confirmPassword) {
      alert("Passwörter stimmen nicht überein!");
      return;
    }
    
    // TODO: Implement actual signup logic
    console.log("Complete signup data:", formData);
    // Set user as logged in and clear welcome completed flag so new user sees welcome overlay
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.removeItem('welcomeCompleted');
    // Navigate to dashboard where welcome overlay will show
    navigate("/");
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.company && formData.password && 
                     (location.state?.password || (formData.confirmPassword && formData.password === formData.confirmPassword));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Phone className="h-8 w-8 text-[#FE5B25]" />
            <span className="text-2xl font-bold text-gray-900">hotcalls.ai</span>
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

            <Button type="submit" className="w-full" disabled={!isFormValid}>
              Account erstellen & loslegen
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
    </div>
  );
};

export default SignUp; 