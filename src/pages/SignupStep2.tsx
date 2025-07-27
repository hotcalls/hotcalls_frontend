import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { SignupStep2Data } from "@/lib/authService";

interface SignupStep2Props {
  onBack: () => void;
  onComplete: (data: SignupStep2Data) => void;
  initialData?: SignupStep2Data;
  isLoading?: boolean;
}

const SignupStep2 = ({ onBack, onComplete, initialData, isLoading }: SignupStep2Props) => {
  const [formData, setFormData] = useState<SignupStep2Data>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    company: initialData?.company || "",
    phone: initialData?.phone || "",
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
    if (!formData.firstName || !formData.lastName || !formData.company || !formData.phone) {
      alert("Bitte füllen Sie alle Felder aus.");
      return;
    }

    onComplete(formData);
  };

  const isFormValid = formData.firstName && formData.lastName && formData.company && formData.phone;

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
          <CardTitle className="text-2xl font-bold text-gray-900">Persönliche Daten</CardTitle>
          <CardDescription className="text-gray-600">
            Schritt 2 von 2: Vervollständigen Sie Ihr Profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Max"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Mustermann"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Unternehmen</Label>
              <Input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Ihr Unternehmen"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+49 123 456 789"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              
              <Button 
                type="submit" 
                className="flex-1 bg-[#FE5B25] hover:bg-[#E54E1F] text-white"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    Konto erstellen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Mit der Registrierung stimmen Sie unseren{" "}
              <a href="/agb" className="text-[#FE5B25] hover:underline">
                Nutzungsbedingungen
              </a>{" "}
              und der{" "}
              <a href="/datenschutz" className="text-[#FE5B25] hover:underline">
                Datenschutzerklärung
              </a>{" "}
              zu.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupStep2; 