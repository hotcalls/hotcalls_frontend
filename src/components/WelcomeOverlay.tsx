import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Bot, Target, Calendar, User, Clock, Phone, Play, Plus, CheckCircle, Sparkles, Info, Check } from "lucide-react";
import { buttonStyles, textStyles, layoutStyles } from "@/lib/buttonStyles";

interface WelcomeOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function WelcomeOverlay({ isOpen, onComplete }: WelcomeOverlayProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    agentName: "",
    personality: "",
    voice: "sarah",
    outgoingGreeting: "",
    script: "",
    leadIntegrationType: "", // "facebook" or "webhook"
    facebookConnected: false,
    selectedLeadForms: [] as string[],
    googleConnected: false,
    selectedCalendar: "",
    selectedEventType: "",
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    console.log("Welcome flow completed:", formData);
    onComplete();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnectFacebook = () => {
    // Simulate Facebook login
    console.log("Redirecting to Facebook login...");
    setTimeout(() => {
      setFormData(prev => ({ ...prev, facebookConnected: true }));
    }, 1000);
  };

  const handleConnectGoogle = () => {
    // Simulate Google login
    console.log("Redirecting to Google login...");
    setTimeout(() => {
      setFormData(prev => ({ ...prev, googleConnected: true }));
    }, 1000);
  };

  const toggleLeadForm = (formId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLeadForms: prev.selectedLeadForms.includes(formId) 
        ? prev.selectedLeadForms.filter(id => id !== formId)
        : [...prev.selectedLeadForms, formId]
    }));
  };

  if (!isOpen) return null;

  const isStep1Valid = formData.agentName && formData.personality && formData.voice && formData.outgoingGreeting;
  const isStep2Valid = formData.script;
  const isStep3Valid = formData.leadIntegrationType && 
    ((formData.leadIntegrationType === "facebook" && formData.facebookConnected && formData.selectedLeadForms.length > 0) ||
     (formData.leadIntegrationType === "webhook"));
  const isStep4Valid = formData.googleConnected && formData.selectedCalendar && formData.selectedEventType;

  const steps = [
    { number: 1, title: "Persönlichkeit", completed: isStep1Valid },
    { number: 2, title: "Skript", completed: isStep2Valid },
    { number: 3, title: "Lead-Quelle", completed: isStep3Valid },
    { number: 4, title: "Kalender", completed: isStep4Valid },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => {}} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 rounded-t-2xl">
          {currentStep === 5 ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Perfekt!</h1>
              <p className="text-lg text-gray-600">Ihr KI-Agent ist einsatzbereit</p>
            </div>
          ) : (
            <div>
              {/* Step Indicators */}
              <div className="flex justify-center items-center space-x-16 mt-6 mb-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex flex-col items-center space-y-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep === step.number 
                        ? 'border-[#3d5097] text-[#3d5097] bg-white' 
                        : step.completed
                        ? 'border-green-600 text-green-600 bg-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}>
                      {step.completed && currentStep !== step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="font-bold text-lg">{step.number}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium text-center ${
                      currentStep === step.number 
                        ? 'text-[#3d5097]' 
                        : step.completed
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="px-6 pb-6 pt-2">
          {/* Step 1: Agent Personality */}
          {currentStep === 1 && <Step1Content formData={formData} onInputChange={handleInputChange} />}
          
          {/* Step 2: Script */}
          {currentStep === 2 && <Step2Content formData={formData} onInputChange={handleInputChange} />}
          
          {/* Step 3: Lead Sources */}
          {currentStep === 3 && <Step3Content formData={formData} onInputChange={handleInputChange} onConnectFacebook={handleConnectFacebook} onToggleLeadForm={toggleLeadForm} />}
          
          {/* Step 4: Calendar */}
          {currentStep === 4 && <Step4Content formData={formData} onInputChange={handleInputChange} onConnectGoogle={handleConnectGoogle} />}
          
          {/* Step 5: Completion */}
          {currentStep === 5 && <Step5Content />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-6 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              {currentStep > 1 && currentStep < 5 && (
                <Button variant="outline" onClick={handlePrev} className="px-6">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              )}
              {currentStep < 5 && (
                <Button variant="ghost" onClick={handleComplete} className="px-6 text-gray-500 hover:text-gray-700">
                  Setup überspringen
                </Button>
              )}
            </div>
            
            {currentStep < 5 && (
              <Button 
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && !isStep3Valid) ||
                  (currentStep === 4 && !isStep4Valid)
                }
                className={`${buttonStyles.create.default} px-8`}
              >
                {currentStep === 4 ? "Agent erstellen" : "Weiter"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {currentStep === 5 && (
              <Button 
                onClick={handleComplete}
                className={`${buttonStyles.create.default} flex-1 py-4 text-lg`}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Zum Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1 Component
function Step1Content({ formData, onInputChange }: any) {
  return (
    <Card className="shadow-none border-0">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className={textStyles.sectionTitle}>Grundkonfiguration</CardTitle>
        <CardDescription>
          Definieren Sie die Persönlichkeit und Stimme Ihres Agenten
        </CardDescription>
      </CardHeader>
      <CardContent className={layoutStyles.cardContent}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="agentName">Agent Name</Label>
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </div>
          <Input
            id="agentName"
            placeholder="z.B. Sarah"
            value={formData.agentName}
            onChange={(e) => onInputChange("agentName", e.target.value)}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="personality">Persönlichkeit</Label>
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </div>
          <Input
            id="personality"
            placeholder="z.B. Freundlich & Professionell"
            value={formData.personality}
            onChange={(e) => onInputChange("personality", e.target.value)}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Stimme auswählen</Label>
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {["sarah", "marcus", "lisa"].map((voice) => {
              const voiceData = {
                sarah: { name: "Sarah", desc: "Weiblich, warm", color: "bg-blue-100 text-blue-600", letter: "S" },
                marcus: { name: "Marcus", desc: "Männlich, ruhig", color: "bg-green-100 text-green-600", letter: "M" },
                lisa: { name: "Lisa", desc: "Weiblich, energisch", color: "bg-purple-100 text-purple-600", letter: "L" }
              }[voice];
              
              return (
                <div key={voice} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${voiceData?.color}`}>
                        <span className="font-medium text-lg">{voiceData?.letter}</span>
                      </div>
                      <div>
                        <p className="font-medium">{voiceData?.name}</p>
                        <p className="text-sm text-gray-500">{voiceData?.desc}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50">
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                      formData.voice === voice 
                        ? "bg-white text-[#3d5097] border-[#3d5097]" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => onInputChange("voice", voice)}
                  >
                    {formData.voice === voice ? "Ausgewählt" : "Auswählen"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <Label htmlFor="outgoingGreeting">Begrüßung (Ausgehende Anrufe) *</Label>
          <Textarea
            id="outgoingGreeting"
            value={formData.outgoingGreeting}
            onChange={(e) => onInputChange("outgoingGreeting", e.target.value)}
            placeholder="Hallo, mein Name ist Sarah und ich rufe Sie wegen Ihrer Anfrage bezüglich unserer Beratungsdienstleistungen an."
            rows={4}
            className="min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Definieren Sie, wie Ihr Agent ausgehende Gespräche beginnt
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2 Component - Script
function Step2Content({ formData, onInputChange }: any) {
  return (
    <Card className="shadow-none border-0">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className={textStyles.sectionTitle}>Gesprächsskript</CardTitle>
        <CardDescription>
          Definieren Sie das vollständige Gesprächsskript für Ihren Agenten
        </CardDescription>
      </CardHeader>
      <CardContent className={layoutStyles.cardContent}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="script">Gesprächsskript</Label>
                         <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </div>
          <Textarea
            id="script"
            rows={12}
            value={formData.script}
            onChange={(e) => onInputChange("script", e.target.value)}
            placeholder="Schreiben Sie hier das vollständige Gesprächsskript für Ihren Agent..."
            className="min-h-[300px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Definieren Sie, wie Ihr Agent das gesamte Gespräch führt, von der Begrüßung bis zum Abschluss
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3 Component - Lead Sources
function Step3Content({ formData, onInputChange, onConnectFacebook, onToggleLeadForm }: any) {
  const integrationTypes = [
    { id: "facebook", name: "Facebook / Meta", description: "Lead Ads aus Facebook und Instagram", icon: Target },
    { id: "webhook", name: "Webhook Integration", description: "Eigene Website oder andere Systeme", icon: Bot },
  ];

  const facebookLeadForms = [
    { id: "form1", name: "Beratung Anfrage", fields: ["Name", "Email", "Telefon"], leads: 127 },
    { id: "form2", name: "Demo Request", fields: ["Name", "Email", "Unternehmen"], leads: 84 },
    { id: "form3", name: "Newsletter", fields: ["Email"], leads: 356 },
  ];

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className={textStyles.sectionTitle}>Lead-Integration</CardTitle>
        <CardDescription>
          Verbinden Sie eine Lead-Quelle für automatischen Import
        </CardDescription>
      </CardHeader>
      <CardContent className={layoutStyles.cardContent}>
        <div className="space-y-6">
          {/* Integration Type Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Integration auswählen</Label>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {integrationTypes.map((type) => {
                const isSelected = formData.leadIntegrationType === type.id;
                
                return (
                  <div 
                    key={type.id} 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      isSelected 
                        ? 'border-[#3d5097]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onInputChange("leadIntegrationType", type.id)}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${
                        isSelected ? 'bg-[#3d5097] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <type.icon className="h-6 w-6" />
                      </div>
                      <h3 className={`font-medium ${isSelected ? 'text-[#3d5097]' : 'text-gray-900'}`}>
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Facebook Connection */}
          {formData.leadIntegrationType === "facebook" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Facebook Account verbinden</Label>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </div>
              {!formData.facebookConnected ? (
                <Card className="border-0 bg-gray-50 mt-3">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium text-gray-700">Mit Facebook verbinden</h3>
                      <p className="text-sm text-gray-500">
                        Zugriff auf Ihre Lead Ads und Formulare
                      </p>
                    </div>
                    <Button onClick={onConnectFacebook} className={buttonStyles.primary.default}>
                      <Target className="mr-2 h-4 w-4" />
                      Verbinden
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="mt-3">
                  <div className="p-4 border-2 border-green-600 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-green-600">Facebook verbunden</h3>
                        <p className="text-sm text-green-600">Mein Business Account</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <Label>Lead-Formulare auswählen</Label>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </div>
                  <div className="space-y-3 mt-3">
                    {facebookLeadForms.map((form) => {
                      const isSelected = formData.selectedLeadForms.includes(form.id);
                      
                      return (
                        <div 
                          key={form.id} 
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                            isSelected 
                              ? 'border-[#3d5097]' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => onToggleLeadForm(form.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium ${isSelected ? 'text-[#3d5097]' : 'text-gray-900'}`}>
                                {form.name}
                              </h3>
                              <p className="text-sm text-gray-500">{form.leads} Leads verfügbar</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {form.fields.map((field) => (
                                  <span key={field} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-[#3d5097]' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-3 h-3 bg-[#3d5097] rounded-full"></div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Webhook Setup */}
          {formData.leadIntegrationType === "webhook" && (
            <div className="p-4 border-2 border-green-600 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-600">Webhook konfiguriert</h3>
                  <p className="text-sm text-green-600">Leads werden automatisch importiert</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4 Component - Calendar
function Step4Content({ formData, onInputChange, onConnectGoogle }: any) {
  const googleCalendars = [
    { id: "primary", name: "Hauptkalender", email: "marcus.weber@example.com", events: 24 },
    { id: "business", name: "Business", email: "marcus.weber@example.com", events: 12 },
    { id: "meetings", name: "Meetings", email: "marcus.weber@example.com", events: 8 },
  ];

  const createEventType = () => {
    const eventType = { id: "beratung", name: "Beratungsgespräch", duration: 30 };
    onInputChange("selectedEventType", eventType.id);
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="pb-4 pt-0">
        <CardTitle className={textStyles.sectionTitle}>Google Kalender</CardTitle>
        <CardDescription>
          Verbinden Sie Ihren Google Kalender für automatische Terminbuchung
        </CardDescription>
      </CardHeader>
      <CardContent className={layoutStyles.cardContent}>
        <div className="space-y-6">
          {/* Google Connection */}
          <div>
                         <div className="flex items-center justify-between mb-2">
               <Label>Google Account verbinden</Label>
               <Info className="h-4 w-4 text-gray-400 cursor-help" />
             </div>
             {!formData.googleConnected ? (
               <Card className="border-0 bg-gray-50 mt-3">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Mit Google verbinden</h3>
                    <p className="text-sm text-gray-500">
                      Zugriff auf Ihren Google Kalender für Terminbuchungen
                    </p>
                  </div>
                  <Button onClick={onConnectGoogle} className={buttonStyles.primary.default}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Google verbinden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="mt-3">
                <div className="p-4 border-2 border-green-600 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-600">Google verbunden</h3>
                      <p className="text-sm text-green-600">marcus.weber@example.com</p>
                    </div>
                  </div>
                </div>
                
                                 <div className="flex items-center justify-between mb-2">
                   <Label>Kalender auswählen</Label>
                   <Info className="h-4 w-4 text-gray-400 cursor-help" />
                 </div>
                <div className="space-y-3 mt-3 mb-6">
                  {googleCalendars.map((calendar) => {
                    const isSelected = formData.selectedCalendar === calendar.id;
                    
                    return (
                      <div 
                        key={calendar.id} 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          isSelected 
                            ? 'border-[#3d5097]' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onInputChange("selectedCalendar", calendar.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-[#3d5097] text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className={`font-medium ${isSelected ? 'text-[#3d5097]' : 'text-gray-900'}`}>
                                {calendar.name}
                              </h3>
                              <p className="text-sm text-gray-500">{calendar.events} Termine</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-[#3d5097]' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-3 h-3 bg-[#3d5097] rounded-full"></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Event Type Creation */}
                {formData.selectedCalendar && (
                  <div>
                                         <div className="flex items-center justify-between mb-2">
                       <Label>Event-Type erstellen</Label>
                       <Info className="h-4 w-4 text-gray-400 cursor-help" />
                     </div>
                    {!formData.selectedEventType ? (
                                             <Card className="border-0 bg-gray-50 transition-colors cursor-pointer mt-3">
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <h3 className="font-medium text-gray-700">Event-Type erstellen</h3>
                            <p className="text-sm text-gray-500">
                              Beratungsgespräch, Demo Call, etc.
                            </p>
                          </div>
                          <Button onClick={createEventType} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Erstellen
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="mt-3 p-4 border-2 border-green-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <h3 className="font-medium text-green-600">Beratungsgespräch</h3>
                            <p className="text-sm text-green-600">30 Min • Automatische Buchung aktiv</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5 Component - Completion
function Step5Content() {
  const completedSteps = [
    { icon: Bot, title: "KI-Agent erstellt", description: "Sarah ist bereit für erste Gespräche", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", bgColor: "bg-blue-100" },
    { icon: Target, title: "Lead-Quellen konfiguriert", description: "Automatischer Import eingerichtet", color: "bg-purple-50 border-purple-200", iconColor: "text-purple-600", bgColor: "bg-purple-100" },
    { icon: Calendar, title: "Event-Types eingerichtet", description: "Terminbuchungen automatisiert", color: "bg-green-50 border-green-200", iconColor: "text-green-600", bgColor: "bg-green-100" }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-green-600">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <p className="text-xl text-gray-600">Setup abgeschlossen in nur 3 einfachen Schritten</p>
      </div>

      <Card className="shadow-none border-0">
        <CardHeader className="pb-4 pt-0">
          <CardTitle className={textStyles.sectionTitle}>Was wurde eingerichtet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className={`flex items-center gap-4 p-4 rounded-lg ${step.color}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${step.bgColor}`}>
                  <Icon className={`h-6 w-6 ${step.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
} 