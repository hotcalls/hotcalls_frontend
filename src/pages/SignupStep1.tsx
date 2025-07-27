import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { SignupStep1Data } from "@/lib/authService";

interface SignupStep1Props {
  onNext: (data: SignupStep1Data) => void;
  initialData?: Partial<SignupStep1Data>;
}

const SignupStep1 = ({ onNext, initialData }: SignupStep1Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formData, setFormData] = useState<SignupStep1Data>({
    email: initialData?.email || "",
    password: initialData?.password || "",
    passwordConfirm: initialData?.passwordConfirm || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.passwordConfirm) {
      alert("Bitte füllen Sie alle Felder aus.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      alert("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!formData.email.includes('@')) {
      alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    onNext(formData);
  };

  const isFormValid = formData.email && 
                     formData.password && 
                     formData.passwordConfirm && 
                     formData.password.length >= 8 &&
                     formData.password === formData.passwordConfirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/hotcalls-logo.png" 
              alt="Hotcalls Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Konto erstellen</CardTitle>
          <CardDescription className="text-gray-600">
            Schritt 1 von 2: E-Mail und Passwort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ihre.email@beispiel.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mindestens 8 Zeichen"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mindestens 8 Zeichen für die Sicherheit Ihres Kontos
              </p>
            </div>

            <div>
              <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="Passwort wiederholen"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="text-xs text-red-500 mt-1">
                  Die Passwörter stimmen nicht überein
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#FE5B25] hover:bg-[#E54E1F] text-white"
              disabled={!isFormValid}
            >
              Weiter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Bereits ein Konto?{" "}
              <a href="/login" className="text-[#FE5B25] hover:underline">
                Hier anmelden
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupStep1; 