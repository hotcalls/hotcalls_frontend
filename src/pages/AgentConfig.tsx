import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, TestTube, User, FileText, Phone, Settings as SettingsIcon, Play, Plus, Info, UserCircle, UserCircle2, Sparkles, Pause } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

// Mock data for available event types from Calendar config
const availableEventTypes = [
  { id: "1", name: "Beratungsgespräch", duration: 30, calendar: "Marcus Weber (Haupt)" },
  { id: "2", name: "Demo Call", duration: 45, calendar: "Marcus Weber (Haupt)" },
  { id: "3", name: "Follow-up Gespräch", duration: 20, calendar: "Marcus Weber (Haupt)" },
  { id: "4", name: "Team Meeting", duration: 60, calendar: "Team Calendar" }
];

// Mock data for available lead forms from Meta/Webhook configs
const availableLeadForms = [
  { id: "1", name: "Hauptformular - Beratung", source: "Meta Lead Ads", fields: ["Name", "Email", "Telefon", "Interesse"] },
  { id: "2", name: "Demo Anfrage", source: "Meta Lead Ads", fields: ["Name", "Email", "Unternehmen"] },
  { id: "3", name: "Kontaktformular Website", source: "Website Webhook", fields: ["Name", "Email", "Nachricht"] },
  { id: "4", name: "Newsletter Anmeldung", source: "Website Webhook", fields: ["Email"] }
];

export default function AgentConfig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState("personality");

  const [config, setConfig] = useState({
    name: isEdit ? "Sarah" : "",
    personality: isEdit ? "friendly" : "",
    voice: isEdit ? "sarah" : "sarah",
    script: "",
    callLogic: isEdit ? "intelligent" : "standard", 
    selectedEventTypes: isEdit ? ["1"] : [],
    selectedLeadForms: isEdit ? ["1"] : [],
    outgoingGreeting: isEdit ? "Hallo, mein Name ist Sarah und ich rufe Sie wegen Ihrer Anfrage bezüglich unserer Beratungsdienstleistungen an." : "",
    incomingGreeting: isEdit ? "Hallo, mein Name ist Sarah und ich rufe Sie wegen Ihrer Anfrage bezüglich unserer Beratungsdienstleistungen an." : "",
    maxAttempts: "3",
    callInterval: "30",
    workingDays: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false },
    workingTimeStart: "09:00",
    workingTimeEnd: "17:00",
  });

  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playVoiceSample = (voice: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingVoice === voice) {
      // If clicking the same voice, stop playing
      setPlayingVoice(null);
      return;
    }

    // Create new audio element and play
    const audio = new Audio(`/voice-samples/${voice}-sample.mp3`);
    audioRef.current = audio;
    
    audio.play().catch(error => {
      console.error('Error playing voice sample:', error);
      // Fallback to .wav if .mp3 doesn't exist
      const wavAudio = new Audio(`/voice-samples/${voice}-sample.wav`);
      audioRef.current = wavAudio;
      wavAudio.play().catch(err => {
        console.error('Error playing WAV sample:', err);
        alert('Voice sample nicht gefunden. Bitte fügen Sie die Audiodatei hinzu.');
      });
    });

    setPlayingVoice(voice);

    audio.onended = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSave = () => {
    console.log("Saving agent config:", config);
    navigate("/dashboard/agents");
  };

  const handleTest = () => {
    console.log("Testing agent with config:", config);
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Back Navigation */}
      <div className="flex items-center space-x-2 mb-6">
        <button className={buttonStyles.navigation.back} onClick={() => navigate("/dashboard/agents")}>
          <ArrowLeft className={iconSizes.small} />
          <span>Zurück zu Agenten</span>
        </button>
      </div>

      {/* Page Header - PIXEL-PERFECT EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>
            {isEdit ? `Agent "${config.name}" bearbeiten` : "Neuen Agent erstellen"}
          </h1>
          <p className={textStyles.pageSubtitle}>Konfiguriere Persönlichkeit, Skript und Integrationen</p>
        </div>
        
        <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
          <button className={buttonStyles.primary.default} onClick={handleTest}>
            <TestTube className={iconSizes.small} />
            <span>Testen</span>
          </button>
          <button className={buttonStyles.create.default} onClick={handleSave}>
            <Save className={iconSizes.small} />
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab("personality")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "personality"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <User className={iconSizes.small} />
                <span className="ml-2">Persönlichkeit</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("script")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "script"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <FileText className={iconSizes.small} />
                <span className="ml-2">Skript</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("logic")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "logic"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Phone className={iconSizes.small} />
                <span className="ml-2">Anruflogik</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "integrations"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <SettingsIcon className={iconSizes.small} />
                <span className="ml-2">Integrationen</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Grundkonfiguration</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Sarah"
                />
              </div>
              
              <div>
                <Label htmlFor="personality">Persönlichkeit</Label>
                <Select 
                  value={config.personality} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, personality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Persönlichkeit auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Freundlich und Empathisch</SelectItem>
                    <SelectItem value="direct">Direkt und Zielstrebig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Stimme</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src="/avatars/sarah.jpg.png" alt="Sarah" />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <User className="h-7 w-7" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Sarah</p>
                          <p className="text-sm text-gray-500">Weiblich, warm</p>
                        </div>
                      </div>
                      <button 
                        className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50"
                        onClick={() => playVoiceSample('sarah')}
                        title={playingVoice === 'sarah' ? 'Stoppen' : 'Probe hören'}
                      >
                        {playingVoice === 'sarah' ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <button
                      className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                        config.voice === "sarah" 
                          ? "bg-[#FEF5F1] text-[#FE5B25] border-gray-300" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, voice: "sarah" }))}
                    >
                      {config.voice === "sarah" ? "Ausgewählt" : "Auswählen"}
                    </button>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2 relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          Empfohlen
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Über 1.000 Termine erfolgreich gelegt!</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src="/avatars/marcus.jpg.png" alt="Marcus" />
                          <AvatarFallback className="bg-green-100 text-green-600">
                            <UserCircle className="h-7 w-7" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Marcus</p>
                          <p className="text-sm text-gray-500">Männlich, ruhig</p>
                        </div>
                      </div>
                      <button 
                        className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50"
                        onClick={() => playVoiceSample('marcus')}
                        title={playingVoice === 'marcus' ? 'Stoppen' : 'Probe hören'}
                      >
                        {playingVoice === 'marcus' ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <button
                      className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                        config.voice === "marcus" 
                          ? "bg-[#FEF5F1] text-[#FE5B25] border-gray-300" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, voice: "marcus" }))}
                    >
                      {config.voice === "marcus" ? "Ausgewählt" : "Auswählen"}
                    </button>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src="/avatars/lisa.png" alt="Lisa" />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            <Sparkles className="h-7 w-7" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Lisa</p>
                          <p className="text-sm text-gray-500">Weiblich, energisch</p>
                        </div>
                      </div>
                      <button 
                        className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50"
                        onClick={() => playVoiceSample('lisa')}
                        title={playingVoice === 'lisa' ? 'Stoppen' : 'Probe hören'}
                      >
                        {playingVoice === 'lisa' ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <button
                      className={`w-full py-2 px-3 rounded border text-sm font-medium ${
                        config.voice === "lisa" 
                          ? "bg-[#FEF5F1] text-[#FE5B25] border-gray-300" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, voice: "lisa" }))}
                    >
                      {config.voice === "lisa" ? "Ausgewählt" : "Auswählen"}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outgoingGreeting">Begrüßung (Ausgehende Anrufe)</Label>
                  <Textarea
                    id="outgoingGreeting"
                    value={config.outgoingGreeting || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, outgoingGreeting: e.target.value }))}
                    placeholder="Wie soll der Agent ausgehende Gespräche beginnen?"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="incomingGreeting">Begrüßung (Eingehende Anrufe)</Label>
                  <Textarea
                    id="incomingGreeting"
                    value={config.incomingGreeting || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, incomingGreeting: e.target.value }))}
                    placeholder="Wie soll der Agent eingehende Gespräche beginnen?"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={textStyles.sectionTitle}>Gesprächsskript</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Hier können Sie die Aufgabe des Agenten definieren und das Gesprächsskript erstellen.
                      <br /><br />
                      <strong>Format für optimale Ergebnisse:</strong>
                      <br /><br />
                      KI Assistent: [Ihre Nachricht]<br />
                      Gegenüber:<br />
                      KI Assistent: [Antwort]<br />
                      Gegenüber:
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="script">Skript</Label>
                <Textarea
                  id="script"
                  rows={12}
                  value={config.script}
                  onChange={(e) => setConfig(prev => ({ ...prev, script: e.target.value }))}
                  placeholder="Schreiben Sie hier das Gesprächsskript für Ihren Agent..."
                  className="min-h-[300px]"
                />

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Logic Tab */}
        <TabsContent value="logic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={textStyles.sectionTitle}>Anruflogik</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Konfigurieren Sie hier die Anrufstrategie:
                      <br />
                      • Maximale Versuche: Wie oft soll ein Lead kontaktiert werden?<br />
                      • Intervall: Wartezeit zwischen Anrufversuchen<br />
                      • Aktive Zeiten: Wann darf der Agent anrufen?
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxAttempts">Maximale Anrufversuche</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxAttempts || "3"}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="callInterval">Anrufintervall (Minuten)</Label>
                  <Input
                    id="callInterval"
                    type="number"
                    min="5"
                    max="240"
                    value={config.callInterval || "30"}
                    onChange={(e) => setConfig(prev => ({ ...prev, callInterval: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Aktive Tage</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => (
                      <button
                        key={day}
                        className={`w-10 h-10 rounded-full border text-sm font-medium ${
                          config.workingDays?.[index] 
                            ? "bg-[#FEF5F1] text-[#FE5B25] border-gray-300" 
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => 
                          setConfig(prev => ({
                            ...prev,
                            workingDays: {
                              ...prev.workingDays,
                              [index]: !prev.workingDays?.[index]
                            }
                          }))
                        }
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Uhrzeit</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      type="time"
                      value={config.workingTimeStart || "09:00"}
                      onChange={(e) => setConfig(prev => ({ ...prev, workingTimeStart: e.target.value }))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">bis</span>
                    <Input
                      type="time"
                      value={config.workingTimeEnd || "17:00"}
                      onChange={(e) => setConfig(prev => ({ ...prev, workingTimeEnd: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className={textStyles.sectionTitle}>Kalender & Event-Types</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Verbinden Sie den Agenten mit:
                        <br />
                        • Kalender Event-Types für Terminbuchungen<br />
                        • Lead-Quellen für automatische Kontaktaufnahme
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <button className={buttonStyles.primary.default}>
                  <Plus className={iconSizes.small} />
                  <span>Event-Type hinzufügen</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label>Ausgewählte Event-Types</Label>
                <div className="space-y-3 mt-2">
                  {config.selectedEventTypes.map((eventTypeId) => {
                    const eventType = availableEventTypes.find(et => et.id === eventTypeId);
                    return eventType ? (
                      <div key={eventType.id} className="flex items-center justify-between p-3 border border-[#FE5B25] bg-[#FEF5F1] rounded-lg">
                        <div>
                          <p className="font-medium">{eventType.name}</p>
                          <p className="text-sm text-gray-500">{eventType.duration} Min - {eventType.calendar}</p>
                        </div>
                        <button 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            selectedEventTypes: prev.selectedEventTypes.filter(id => id !== eventType.id)
                          }))}
                        >
                          Entfernen
                        </button>
                      </div>
                    ) : null;
                  })}
                  
                  {config.selectedEventTypes.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Noch keine Event-Types ausgewählt</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="eventType">Weitere Event-Types hinzufügen</Label>
                  <Select onValueChange={(value) => {
                    if (!config.selectedEventTypes.includes(value)) {
                      setConfig(prev => ({ 
                        ...prev, 
                        selectedEventTypes: [...prev.selectedEventTypes, value] 
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Event-Type auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEventTypes
                        .filter(eventType => !config.selectedEventTypes.includes(eventType.id))
                        .map((eventType) => (
                          <SelectItem key={eventType.id} value={eventType.id}>
                            {eventType.name} ({eventType.duration} Min) - {eventType.calendar}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Event-Types können in der Kalender-Sektion verwaltet werden.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className={textStyles.sectionTitle}>Lead-Quellen</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Verbinden Sie den Agenten mit:
                        <br />
                        • Kalender Event-Types für Terminbuchungen<br />
                        • Lead-Quellen für automatische Kontaktaufnahme
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <button className={buttonStyles.primary.default}>
                  <Plus className={iconSizes.small} />
                  <span>Lead-Quelle hinzufügen</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label>Ausgewählte Lead-Quellen</Label>
                <div className="space-y-3 mt-2">
                  {config.selectedLeadForms.map((leadFormId) => {
                    const leadForm = availableLeadForms.find(lf => lf.id === leadFormId);
                    return leadForm ? (
                      <div key={leadForm.id} className="flex items-center justify-between p-3 border border-[#FE5B25] bg-[#FEF5F1] rounded-lg">
                        <div>
                          <p className="font-medium">{leadForm.name}</p>
                          <p className="text-sm text-gray-500">{leadForm.source}</p>
                        </div>
                        <button 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setConfig(prev => ({
                            ...prev,
                            selectedLeadForms: prev.selectedLeadForms.filter(id => id !== leadForm.id)
                          }))}
                        >
                          Entfernen
                        </button>
                      </div>
                    ) : null;
                  })}
                  
                  {config.selectedLeadForms.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Noch keine Lead-Quellen ausgewählt</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="leadForm">Weitere Lead-Quellen hinzufügen</Label>
                  <Select onValueChange={(value) => {
                    if (!config.selectedLeadForms.includes(value)) {
                      setConfig(prev => ({ 
                        ...prev, 
                        selectedLeadForms: [...prev.selectedLeadForms, value] 
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Lead-Quelle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLeadForms
                        .filter(form => !config.selectedLeadForms.includes(form.id))
                        .map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.name} - {form.source}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Lead-Formulare können in der Lead-Quellen Sektion konfiguriert werden.
                </p>
              </div>
            </CardContent>
          </Card>


        </TabsContent>
      </Tabs>
    </div>
  );
} 