import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const QuickSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwörter stimmen nicht überein!");
      return;
    }
    
    // TODO: Implement basic validation
    console.log("Quick signup data:", formData);
    
    // Navigate to complete signup with email and password pre-filled
    navigate("/signup/complete", { 
      state: { 
        email: formData.email, 
        password: formData.password 
      } 
    });
  };

  const isFormValid = formData.email && formData.password && formData.confirmPassword && 
                     formData.password === formData.confirmPassword;

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
          <CardTitle className="text-2xl font-bold">Account erstellen</CardTitle>
          <CardDescription>
            Erstellen Sie Ihr HotCalls Konto - Schritt 1 von 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail Adresse</Label>
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
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwörter stimmen nicht überein</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid}>
              Weiter
            </Button>

            <div className="text-center text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Anmeldung
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

export default QuickSignUp; 