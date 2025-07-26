import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bot, Play, Phone } from "lucide-react";
import { buttonStyles, textStyles, iconSizes, layoutStyles } from "@/lib/buttonStyles";

const WelcomeStep1 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    agentName: "",
    personality: "",
    voice: "sarah",
    outgoingGreeting: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // TODO: Save data to context or state management
    console.log("Step 1 data:", formData);
    navigate("/welcome/step2");
  };

  const isFormValid = formData.agentName && formData.personality && formData.voice && formData.outgoingGreeting;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Phone className="h-8 w-8 text-[#FE5B25]" />
            <span className="text-2xl font-bold text-gray-900">hotcalls.ai</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Willkommen bei HotCalls!</h1>
          <p className="text-lg text-gray-600 mb-6">Lassen Sie uns Ihren ersten KI-Agenten erstellen</p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Schritt 1 von 3 - Persönlichkeit & Stimme</span>
            <span>33%</span>
          </div>
          <Progress value={33} className="w-full h-2" />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className={textStyles.sectionTitle}>Grundkonfiguration</CardTitle>
            <CardDescription>
              Definieren Sie die Persönlichkeit und Stimme Ihres Agenten
            </CardDescription>
          </CardHeader>
          <CardContent className={layoutStyles.cardContent}>
            <div>
              <Label htmlFor="agentName">Agent Name *</Label>
              <Input
                id="agentName"
                placeholder="z.B. Sarah"
                value={formData.agentName}
                onChange={(e) => handleInputChange("agentName", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="personality">Persönlichkeit *</Label>
              <Input
                id="personality"
                placeholder="z.B. Freundlich & Professionell"
                value={formData.personality}
                onChange={(e) => handleInputChange("personality", e.target.value)}
              />
            </div>
            
            <div>
              <Label>Stimme auswählen *</Label>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-lg">S</span>
                      </div>
                      <div>
                        <p className="font-medium">Sarah</p>
                        <p className="text-sm text-gray-500">Weiblich, warm</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50">
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                      formData.voice === "sarah" 
                        ? "bg-[#FEF5F1] text-[#FE5B25] border-[#FE5B25]" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handleInputChange("voice", "sarah")}
                  >
                    {formData.voice === "sarah" ? "Ausgewählt" : "Auswählen"}
                  </button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium text-lg">M</span>
                      </div>
                      <div>
                        <p className="font-medium">Marcus</p>
                        <p className="text-sm text-gray-500">Männlich, ruhig</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50">
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                      formData.voice === "marcus" 
                        ? "bg-[#FEF5F1] text-[#FE5B25] border-[#FE5B25]" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handleInputChange("voice", "marcus")}
                  >
                    {formData.voice === "marcus" ? "Ausgewählt" : "Auswählen"}
                  </button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-lg">L</span>
                      </div>
                      <div>
                        <p className="font-medium">Lisa</p>
                        <p className="text-sm text-gray-500">Weiblich, energisch</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50">
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                      formData.voice === "lisa" 
                        ? "bg-[#FEF5F1] text-[#FE5B25] border-[#FE5B25]" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => handleInputChange("voice", "lisa")}
                  >
                    {formData.voice === "lisa" ? "Ausgewählt" : "Auswählen"}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="outgoingGreeting">Begrüßung (Ausgehende Anrufe) *</Label>
              <Textarea
                id="outgoingGreeting"
                value={formData.outgoingGreeting}
                onChange={(e) => handleInputChange("outgoingGreeting", e.target.value)}
                placeholder="Hallo, mein Name ist Sarah und ich rufe Sie wegen Ihrer Anfrage bezüglich unserer Beratungsdienstleistungen an."
                rows={4}
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Definieren Sie, wie Ihr Agent ausgehende Gespräche beginnt
              </p>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="px-6">
                Später einrichten
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!isFormValid}
                className={`${buttonStyles.create.default} px-8`}
              >
                Weiter zu Lead-Quellen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeStep1; 