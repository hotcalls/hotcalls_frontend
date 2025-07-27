import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Clock, User, Mic, Settings, CheckCircle, Play, Pause } from "lucide-react";
import { voiceAPI, agentAPI, CreateAgentRequest, Voice } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

interface CreateAgentWizardProps {
  workspaceId: string;
  onComplete: (agent: any) => void;
  onSkip?: () => void;
}

const STEPS = [
  { id: 1, title: "Agent Name", icon: User, description: "Wie soll Ihr Agent heißen?" },
  { id: 2, title: "Stimme wählen", icon: Mic, description: "Wählen Sie die perfekte Stimme" },
  { id: 3, title: "Begrüßung", icon: Settings, description: "Personalisieren Sie die Begrüßung" },
  { id: 4, title: "Arbeitszeiten", icon: Clock, description: "Wann ist Ihr Agent verfügbar?" },
  { id: 5, title: "Persönlichkeit", icon: CheckCircle, description: "Definieren Sie den Charakter" },
];

const WORKDAYS_OPTIONS = [
  { value: "monday,tuesday,wednesday,thursday,friday", label: "Montag - Freitag" },
  { value: "monday,tuesday,wednesday,thursday,friday,saturday", label: "Montag - Samstag" },
  { value: "monday,tuesday,wednesday,thursday,friday,saturday,sunday", label: "Täglich" },
];

const LANGUAGES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

export default function CreateAgentWizard({ workspaceId, onComplete, onSkip }: CreateAgentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    voice: "",
    greeting_inbound: "Hallo! Schön, dass Sie anrufen. Wie kann ich Ihnen helfen?",
    greeting_outbound: "Hallo! Ich bin [Agent Name] und rufe Sie bezüglich Ihrer Anfrage an.",
    language: "de",
    workdays: "monday,tuesday,wednesday,thursday,friday",
    call_from: "09:00",
    call_to: "17:00",
    character: "Freundlich, professionell und hilfsbereit. Beantwortet Fragen kompetent und führt Termine-Buchungen durch.",
    prompt: "Du bist ein hilfreicher KI-Assistent für Terminbuchungen und Kundenservice. Sei freundlich, professionell und effizient.",
  });

  // Load voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoadingVoices(true);
        const response = await voiceAPI.getVoices({ recommend: true });
        setVoices(response.results);
      } catch (error) {
        console.error("Failed to load voices:", error);
        toast({
          title: "Fehler beim Laden der Stimmen",
          description: "Stimmen konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      } finally {
        setLoadingVoices(false);
      }
    };

    loadVoices();
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlayVoice = (voiceId: string, sampleUrl?: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // Stop audio playback
    } else {
      setPlayingVoice(voiceId);
      // Start audio playback
      if (sampleUrl) {
        const audio = new Audio(sampleUrl);
        audio.play().catch(() => {
          toast({
            title: "Audio nicht verfügbar",
            description: "Für diese Stimme ist keine Hörprobe verfügbar.",
          });
        });
        audio.onended = () => setPlayingVoice(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.voice) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const agentData: CreateAgentRequest = {
        workspace: workspaceId,
        name: formData.name,
        status: 'active',
        greeting_inbound: formData.greeting_inbound,
        greeting_outbound: formData.greeting_outbound,
        voice: formData.voice,
        language: formData.language,
        workdays: formData.workdays,
        call_from: formData.call_from + ":00",
        call_to: formData.call_to + ":00",
        character: formData.character,
        prompt: formData.prompt,
      };

      const agent = await agentAPI.createAgent(agentData);

      toast({
        title: "Agent erfolgreich erstellt! 🎉",
        description: `${formData.name} ist jetzt bereit und kann Anrufe entgegennehmen.`,
      });

      onComplete(agent);
    } catch (error) {
      console.error("Agent creation failed:", error);
      toast({
        title: "Agent-Erstellung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.length > 0;
      case 2: return formData.voice.length > 0;
      case 3: return formData.greeting_inbound.length > 0 && formData.greeting_outbound.length > 0;
      case 4: return formData.call_from && formData.call_to;
      case 5: return formData.character.length > 0;
      default: return false;
    }
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Emma, Max, oder Ihr Firmenname"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Dieser Name wird in Gesprächen verwendet und sollte freundlich und professionell klingen.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Stimme auswählen *</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Hören Sie sich die Stimmen an und wählen Sie die perfekte für Ihren Agent.
              </p>
              {loadingVoices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Stimmen werden geladen...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voices.map((voice) => (
                    <Card 
                      key={voice.id}
                      className={`cursor-pointer transition-all ${formData.voice === voice.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleInputChange('voice', voice.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={voice.voice_picture} alt={voice.name} />
                            <AvatarFallback>{voice.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{voice.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {voice.provider}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {voice.gender}
                              </Badge>
                              {voice.recommend && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Empfohlen
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                                        onClick={(e) => {
              e.stopPropagation();
              handlePlayVoice(voice.id, voice.voice_sample);
            }}
                          >
                            {playingVoice === voice.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="greeting_inbound">Eingehende Anrufe Begrüßung *</Label>
              <Textarea
                id="greeting_inbound"
                placeholder="Was sagt Ihr Agent, wenn jemand anruft?"
                value={formData.greeting_inbound}
                onChange={(e) => handleInputChange('greeting_inbound', e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="greeting_outbound">Ausgehende Anrufe Begrüßung *</Label>
              <Textarea
                id="greeting_outbound"
                placeholder="Was sagt Ihr Agent bei ausgehenden Anrufen?"
                value={formData.greeting_outbound}
                onChange={(e) => handleInputChange('greeting_outbound', e.target.value)}
                className="mt-2"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Tipp: Verwenden Sie [Agent Name] als Platzhalter für den Namen Ihres Agents.
              </p>
            </div>
            <div>
              <Label htmlFor="language">Sprache</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Arbeitstage</Label>
              <Select value={formData.workdays} onValueChange={(value) => handleInputChange('workdays', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKDAYS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="call_from">Arbeitszeit von</Label>
                <Input
                  id="call_from"
                  type="time"
                  value={formData.call_from}
                  onChange={(e) => handleInputChange('call_from', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="call_to">Arbeitszeit bis</Label>
                <Input
                  id="call_to"
                  type="time"
                  value={formData.call_to}
                  onChange={(e) => handleInputChange('call_to', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Ihr Agent nimmt nur während dieser Zeiten Anrufe entgegen.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="character">Persönlichkeit & Verhalten *</Label>
              <Textarea
                id="character"
                placeholder="Beschreiben Sie, wie sich Ihr Agent verhalten soll..."
                value={formData.character}
                onChange={(e) => handleInputChange('character', e.target.value)}
                className="mt-2"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-2">
                z.B. "Freundlich und geduldig, beantwortet Fragen zur Terminbuchung, leitet bei komplexen Anfragen weiter"
              </p>
            </div>
            <div>
              <Label htmlFor="prompt">System Prompt (Erweitert)</Label>
              <Textarea
                id="prompt"
                placeholder="Technische Anweisungen für die KI..."
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                className="mt-2"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Erweiterte Einstellungen für die KI-Konfiguration
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Erstellen Sie Ihren KI-Agent in 5 Minuten! 🚀
        </h1>
        <p className="text-center text-muted-foreground">
          Schritt {currentStep} von {STEPS.length}: {STEPS[currentStep - 1]?.description}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isActive ? 'border-primary bg-primary text-white' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {STEPS[currentStep - 1] && (() => {
              const CurrentIcon = STEPS[currentStep - 1].icon;
              return (
                <>
                  <CurrentIcon className="h-5 w-5" />
                  {STEPS[currentStep - 1].title}
                </>
              );
            })()}
          </CardTitle>
          <CardDescription>
            {STEPS[currentStep - 1]?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getCurrentStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevStep}>
              Zurück
            </Button>
          )}
          {onSkip && currentStep === 1 && (
            <Button variant="ghost" onClick={onSkip} className="ml-2">
              Überspringen
            </Button>
          )}
        </div>

        <div>
          {currentStep < STEPS.length ? (
            <Button 
              onClick={handleNextStep} 
              disabled={!canProceed()}
            >
              Weiter
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!canProceed() || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agent wird erstellt...
                </>
              ) : (
                "Agent erstellen 🎉"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 