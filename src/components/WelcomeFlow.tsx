import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Check, Sparkles, Zap, Clock, Phone, CreditCard, Loader2, Play } from "lucide-react";
import { voiceAPI, Voice } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    voice: "",
    personality: "",
    script: "",
    testPhone: "",
    selectedPlan: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Verhindere Body-Scrolling wenn Modal aktiv ist
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load voices from API
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoadingVoices(true);
        console.log('🔊 WelcomeFlow: Starting voice load...');
        console.log('🔊 WelcomeFlow: API Base URL:', 'http://localhost:8000');
        
        const response = await voiceAPI.getVoices();
        console.log('🔊 WelcomeFlow: Raw API response:', response);
        console.log('🔊 WelcomeFlow: Voices count:', response.results?.length || 0);
        
        if (response.results && response.results.length > 0) {
          console.log('🔊 WelcomeFlow: First voice example:', response.results[0]);
          setVoices(response.results);
          console.log('✅ WelcomeFlow: Voices loaded successfully');
        } else {
          console.warn('⚠️ WelcomeFlow: No voices in response');
          setVoices([]);
        }
      } catch (error) {
        console.error("❌ WelcomeFlow: Failed to load voices:", error);
        console.error("❌ WelcomeFlow: Error details:", error.message);
        
        toast({
          title: "Fehler beim Laden der Stimmen",
          description: `API-Fehler: ${error.message || 'Unbekannter Fehler'}`,
          variant: "destructive",
        });
        setVoices([]);
      } finally {
        setLoadingVoices(false);
        console.log('🔊 WelcomeFlow: Voice loading finished');
      }
    };

    loadVoices();
  }, [toast]);

  // Handle voice preview
  const handleVoicePreview = (voice: Voice) => {
    console.log('🎵 Playing voice sample for:', voice.name);
    
    if (!voice.voice_sample) {
      console.warn('⚠️ No voice sample available for:', voice.name);
      toast({
        title: "Kein Audio verfügbar",
        description: `Für ${voice.name} ist keine Hörprobe verfügbar.`,
      });
      return;
    }

    try {
      // Stop any currently playing audio
      const existingAudio = document.querySelector('audio[data-voice-preview]') as HTMLAudioElement;
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.remove();
      }

      // Create and play new audio
      const audio = new Audio(voice.voice_sample);
      audio.setAttribute('data-voice-preview', 'true');
      
      audio.play().then(() => {
        console.log('✅ Voice sample playing for:', voice.name);
      }).catch((error) => {
        console.error('❌ Audio playback failed:', error);
        toast({
          title: "Audio-Wiedergabe fehlgeschlagen",
          description: "Die Hörprobe konnte nicht abgespielt werden.",
          variant: "destructive",
        });
      });

      // Clean up when finished
      audio.onended = () => {
        console.log('🎵 Voice sample finished for:', voice.name);
        audio.remove();
      };
    } catch (error) {
      console.error('❌ Error creating audio:', error);
      toast({
        title: "Audio-Fehler",
        description: "Fehler beim Erstellen der Audio-Wiedergabe.",
        variant: "destructive",
      });
    }
  };

  const personalities = [
    "Freundlich und hilfsbereit",
    "Professionell und direkt",
    "Enthusiastisch und energisch",
    "Ruhig und vertrauensvoll",
    "Beratend und sachkundig"
  ];

  const navigateToPlans = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    window.location.href = '/dashboard/plans';
  };

  const steps = [
    { title: "Willkommen", icon: Sparkles }, // Schritt 0
    { title: "Name", icon: Zap },            // Schritt 1
    { title: "Stimme", icon: Phone },        // Schritt 2
    { title: "Persönlichkeit", icon: Sparkles }, // Schritt 3
    { title: "Skript", icon: Zap },          // Schritt 4
    { title: "Test", icon: Phone },          // Schritt 5
    { title: "Bereit", icon: Check },        // Schritt 6
    { title: "Plan", icon: CreditCard },     // Schritt 7
    { title: "Fertig", icon: Check }         // Schritt 8
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 4) {
      // Nach dem Script Step: Agent wird erstellt
      setIsCreatingAgent(true);
      setTimeout(() => {
        setIsCreatingAgent(false);
        setCurrentStep(currentStep + 1);
      }, 3000);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestCall = () => {
    setIsLoading(true);
    // Simuliere Test-Anruf
    setTimeout(() => {
      setIsLoading(false);
      nextStep();
    }, 3000);
  };







  // Main Flow
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Minimal Progress Dots - nur ab Schritt 1 */}
        {currentStep > 0 && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex justify-center space-x-2">
              {steps.slice(1).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-[#FE5B25]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-8 flex flex-col items-center overflow-y-auto ${
          showComparison && currentStep === 7 
            ? 'max-h-[calc(90vh-120px)]' 
            : 'min-h-[400px] justify-center'
        }`}>
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="w-full max-w-lg space-y-8 text-center animate-slide-in">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-[#FE5B25]/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-10 w-10 text-[#FE5B25]" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">
                  Erstelle deinen Agenten<br />in unter 5 Minuten
                </h2>
              </div>
              
              <div className="animate-fade-in delay-1000">
                <Button 
                  size="lg" 
                  className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-4 text-lg focus:ring-0 focus:ring-offset-0"
                  onClick={nextStep}
                >
                  Los geht's
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Agent Name */}
          {currentStep === 1 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Wie soll dein Agent heißen?
              </h2>
              <Input
                placeholder="z.B. Sarah, Max, Anna..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-center text-lg h-12 border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Voice Selection */}
          {currentStep === 2 && (
            <div className="w-full max-w-lg space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Welche Stimme soll {formData.name || 'dein Agent'} haben?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {loadingVoices ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Stimmen werden geladen...</span>
                  </div>
                ) : voices.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    Keine Stimmen verfügbar
                  </div>
                ) : (
                  voices.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.voice === voice.id 
                        ? 'border-[#FE5B25] bg-[#FE5B25]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('voice', voice.id)}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden mx-auto bg-gray-100">
                        {voice.voice_picture ? (
                          <img 
                            src={voice.voice_picture} 
                            alt={voice.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('🖼️ Image load failed for:', voice.name, voice.voice_picture);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-[#FE5B25]/10 rounded-full flex items-center justify-center ${voice.voice_picture ? 'hidden' : ''}`}>
                          <span className="text-[#FE5B25] font-bold">{voice.name[0]}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{voice.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{voice.tone || 'ElevenLabs Stimme'}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-[#FE5B25] text-[#FE5B25] hover:bg-[#FE5B25]/5 focus:ring-0 focus:ring-offset-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoicePreview(voice);
                          }}
                          disabled={!voice.voice_sample}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {voice.voice_sample ? 'Anhören' : 'Kein Sample'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Personality */}
          {currentStep === 3 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Wie ist {formData.name || 'dein Agent'} drauf?
              </h2>
              <Select value={formData.personality} onValueChange={(value) => handleInputChange('personality', value)}>
                <SelectTrigger className="h-12 text-lg border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
                  <SelectValue placeholder="Persönlichkeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {personalities.map((personality) => (
                    <SelectItem key={personality} value={personality} className="text-lg">
                      {personality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 4: Script */}
          {currentStep === 4 && !isCreatingAgent && (
            <div className="w-full max-w-2xl space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Was soll {formData.name || 'dein Agent'} deinen Leads erzählen?
              </h2>
              <Textarea
                placeholder={`Hallo! Hier ist ${formData.name || '[Agent Name]'} von [Ihr Unternehmen]. Vielen Dank für Ihr Interesse an unseren Dienstleistungen...`}
                value={formData.script}
                onChange={(e) => handleInputChange('script', e.target.value)}
                rows={8}
                className="text-lg border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none"
              />
            </div>
          )}

          {/* Loading Screen: Agent wird erstellt */}
          {isCreatingAgent && (
            <div className="w-full max-w-md space-y-8 text-center animate-scale-in">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-[#FE5B25]/10 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-10 w-10 text-[#FE5B25] animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {formData.name || 'Dein Agent'} wird gerade erstellt...
                </h2>
                
              </div>
            </div>
          )}

          {/* Step 5: Test Phone */}
          {currentStep === 5 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Lass dich von {formData.name || 'deinem Agenten'} anrufen
              </h2>
              <div className="space-y-6">
                <Input
                  placeholder="+49 123 456 789"
                  value={formData.testPhone}
                  onChange={(e) => handleInputChange('testPhone', e.target.value)}
                  className="text-center text-lg h-12 border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                />
                <Button
                  onClick={() => {
                    if (formData.testPhone) {
                      handleTestCall();
                    }
                  }}
                  disabled={!formData.testPhone || isLoading}
                  className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-3 text-lg h-12 focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Anruf wird gestartet...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Jetzt anrufen lassen
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Agent Ready */}
          {currentStep === 6 && (
            <div className="w-full max-w-lg space-y-8 text-center animate-slide-in">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">🔥</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {formData.name || 'Dein Agent'} ist jetzt einsatzbereit. Bist du es auch?
                </h2>
              </div>
              
              <Button 
                onClick={nextStep}
                className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-4 text-lg focus:ring-0 focus:ring-offset-0"
                size="lg"
              >
                14-tägige Testphase starten*
              </Button>
              
              <p className="text-xs text-gray-500">
                *Die Testphase ist auf 100 Freiminuten limitiert, diese können in der Testphase aufgefüllt werden.
              </p>
            </div>
          )}

          {/* Step 7: Plan Selection */}
          {currentStep === 7 && (
            <div className="w-full space-y-6 animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900 text-center">
                Wähle deinen Plan
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 px-4">
                {/* Start Plan */}
                <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-[#FE5B25] transition-all">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Start</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Ideal für Einzelpersonen und kleine Teams
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">199€</div>
                      <p className="text-sm text-gray-500">/Monat</p>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Inkl. 250 Minuten, dann 0,49€/Min.</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Unbegrenzte Anzahl an Agenten</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Automatisierte KI-Telefonate</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Anbindung von Leadfunnels</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: 'start' }));
                        localStorage.setItem('selectedPlan', 'start');
                        setCurrentStep(8);
                      }}
                    >
                      Auswählen
                    </Button>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-[#FE5B25] bg-[#FEF5F1] rounded-lg p-8 relative transform scale-105 shadow-lg">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                        <span className="border border-[#FE5B25] text-[#FE5B25] bg-white text-xs px-2 py-1 rounded-md">
                          Am beliebtesten
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Ideal für Unternehmen mit höherem Volumen
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">549€</div>
                      <p className="text-sm text-gray-500">/Monat</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Alle Start-Features plus:</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Inkl. 1000 Minuten, dann 0,29€/Min.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Priority Support</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Advanced Analytics</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>CRM Integrationen</span>
                        </li>
                      </ul>
                    </div>
                    <Button 
                      className="w-full bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: 'pro' }));
                        localStorage.setItem('selectedPlan', 'pro');
                        setCurrentStep(8);
                      }}
                    >
                      Auswählen
                    </Button>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-[#FE5B25] transition-all">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Für große Unternehmen mit speziellen Anforderungen
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">ab 1.490€</div>
                      <p className="text-sm text-gray-500">/Monat</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Alle Pro-Features plus:</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Unbegrenzte Minuten</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>White Label Lösung</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>24/7 Premium Support</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Custom Features</span>
                        </li>
                      </ul>
                    </div>
                    <Button 
                      className="w-full bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: 'enterprise' }));
                        localStorage.setItem('selectedPlan', 'enterprise');
                        setCurrentStep(8);
                      }}
                    >
                      Auswählen
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <Button 
                  variant="outline"
                  className="border-[#FE5B25] text-[#FE5B25] hover:bg-[#FE5B25]/5 focus:ring-0 focus:ring-offset-0"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Vergleich ausblenden' : 'Pläne vergleichen'}
                </Button>
                <p className="text-sm text-gray-500">
                  Alle Preise sind zzgl. MwSt.
                </p>
              </div>

              {/* Vergleichstabelle */}
              {showComparison && (
                <div className="mt-8 animate-slide-in">
                  <div className="bg-white border rounded-lg">
                    <div className="p-6 border-b">
                      <h3 className="text-xl font-semibold">Detaillierter Funktionsvergleich</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Feature</th>
                            <th className="text-center p-4 font-medium">Start</th>
                            <th className="text-center p-4 font-medium bg-[#FEF5F1]">Pro</th>
                            <th className="text-center p-4 font-medium">Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Preismodelle */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Preismodelle</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Monatliche Gebühr</td>
                            <td className="text-center p-4">199€</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">549€</td>
                            <td className="text-center p-4">ab 1.490€</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Inkludierte Minuten pro Monat</td>
                            <td className="text-center p-4">250</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">1000</td>
                            <td className="text-center p-4">Individuell</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Extra Minuten</td>
                            <td className="text-center p-4">ab 0,49€/Min.</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">ab 0,29€/Min.</td>
                            <td className="text-center p-4">Individuell</td>
                          </tr>
                          
                          {/* Nutzer & Agenten */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Nutzer & Agenten</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Max User</td>
                            <td className="text-center p-4">1</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">5</td>
                            <td className="text-center p-4">Unlimited</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Max aktive Agenten</td>
                            <td className="text-center p-4">3</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">12</td>
                            <td className="text-center p-4">Unlimited</td>
                          </tr>

                          {/* KI-Agenten & Logik */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>KI-Agenten & Logik</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Sofortanruf bei neuen Leads</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Verhalten des Agenten anpassbar</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Individueller Agent-Prompt</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>

                          {/* Funktionen */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Funktionen</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Leads & CRM</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Analytics & Reporting</td>
                            <td className="text-center p-4">Basic</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">Advanced</td>
                            <td className="text-center p-4">Custom</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">API Zugang</td>
                            <td className="text-center p-4">-</td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>

                          {/* Support */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Support</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Support-Kanal</td>
                            <td className="text-center p-4">Email</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">Priority Email</td>
                            <td className="text-center p-4">24/7 Phone & Email</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Persönliches Onboarding</td>
                            <td className="text-center p-4">-</td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
                      )}

            {/* Step 8: Next Steps */}
            {currentStep === 8 && (
              <div className="w-full space-y-8 animate-fade-in text-center">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Jetzt wirds heiß! 🔥
                  </h2>
                  <p className="text-xl text-gray-600">
                    Dein Agent ist bereit. So geht's weiter:
                  </p>
                </div>

                <div className="space-y-6 max-w-md mx-auto">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Verknüpfe deinen Kalender</p>
                      <p className="text-sm text-gray-600">Damit Termine automatisch gebucht werden</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Verknüpfe deine Lead-Quellen</p>
                      <p className="text-sm text-gray-600">Facebook, Website oder andere Kanäle</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Lege Anrufregeln fest</p>
                      <p className="text-sm text-gray-600">Wann und wie oft soll angerufen werden</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-3 text-lg h-12 focus:ring-0 focus:ring-offset-0"
                    onClick={() => {
                      localStorage.setItem('welcomeCompleted', 'true');
                      onComplete();
                    }}
                  >
                    Los geht's! 🚀
                  </Button>
                </div>
              </div>
            )}

        </div>

        {/* Einheitliche Footer Navigation */}
        {currentStep > 0 && currentStep < 6 && !isCreatingAgent && (
          <div className="px-6 py-4 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="focus:ring-0 focus:ring-offset-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <Button
              onClick={nextStep}
              className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
              disabled={
                (currentStep === 1 && !formData.name) ||
                (currentStep === 2 && !formData.voice) ||
                (currentStep === 3 && !formData.personality) ||
                (currentStep === 4 && !formData.script)
              }
            >
              {currentStep === 4 ? 'Agent fertigstellen' : currentStep === 5 ? 'Überspringen' : 'Weiter'}
              {currentStep !== 4 && currentStep !== 5 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>


    </div>
  );
} 