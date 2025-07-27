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
import { ArrowLeft, Save, TestTube, User, FileText, Phone, Settings as SettingsIcon, Play, Plus, Info, UserCircle, UserCircle2, Sparkles, Pause, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { agentAPI, AgentResponse } from "@/lib/apiService";
import { useVoices } from "@/hooks/use-voices";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

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
  
  // Debug logging
  console.log('🔧 AgentConfig Debug:', { id, isEdit, urlParams: useParams() });
  
  // Loading and error states
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get workspace and voices
  const { primaryWorkspace } = useWorkspace();
  const { voices, loading: voicesLoading, getVoiceName, getVoicePicture } = useVoices();

  const [config, setConfig] = useState({
    name: "",
    personality: "",
    voice: "",
    script: "",
    callLogic: "standard", 
    selectedEventTypes: [] as string[],
    selectedLeadForms: [] as string[],
    outgoingGreeting: "",
    incomingGreeting: "",
    maxAttempts: "3",
    callInterval: "30",
    workingDays: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false },
    workingTimeStart: "09:00",
    workingTimeEnd: "17:00",
    character: "",
    language: "de"
  });

  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load agent data when editing
  useEffect(() => {
    const loadAgentData = async () => {
      if (!isEdit) {
        console.log('🔧 Not editing mode, skipping data load');
        return;
      }
      
      if (!id || id === 'undefined') {
        console.error('❌ No valid agent ID provided:', { id, isEdit });
        setError('Keine gültige Agent-ID gefunden');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔧 Loading agent data for editing...', id);
        
        const agentData = await agentAPI.getAgent(id);
        console.log('✅ Agent data loaded:', agentData);
        
        // Map character to personality options
        const mapCharacterToPersonality = (character: string) => {
          const lowerChar = character.toLowerCase();
          if (lowerChar.includes('freundlich') && lowerChar.includes('empathisch')) return 'friendly';
          if (lowerChar.includes('professionell') && lowerChar.includes('direkt')) return 'professional';
          if (lowerChar.includes('warm') && lowerChar.includes('herzlich')) return 'warm';
          if (lowerChar.includes('energisch') && lowerChar.includes('dynamisch')) return 'energetic';
          if (lowerChar.includes('direkt') && lowerChar.includes('zielstrebig')) return 'direct';
          return 'friendly'; // default
        };

        // Parse workdays from API response (can be string or array)
        const parseWorkdays = (workdays: string | number[] | undefined) => {
          const defaultWorkdays = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
          
          if (!workdays) return defaultWorkdays;
          
          // Handle string format (e.g., "1,2,3,4,5")
          if (typeof workdays === 'string') {
            const days = workdays.split(',').map(d => parseInt(d.trim()));
            days.forEach(day => {
              if (day >= 0 && day <= 6) {
                defaultWorkdays[day as keyof typeof defaultWorkdays] = true;
              }
            });
          }
          // Handle array format
          else if (Array.isArray(workdays)) {
            workdays.forEach(day => {
              if (day >= 0 && day <= 6) {
                defaultWorkdays[day as keyof typeof defaultWorkdays] = true;
              }
            });
          }
          
          return defaultWorkdays;
        };

        // Parse time fields (remove seconds and timezone if present)
        const parseTime = (timeStr: string | undefined) => {
          if (!timeStr) return "09:00";
          // If time is in format "HH:MM:SS" or "HH:MM:SS.msZ", extract just "HH:MM"
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            return `${timeParts[0]}:${timeParts[1]}`;
          }
          return timeStr;
        };

        // Map API response to form config
        setConfig({
          name: agentData.name || "",
          personality: mapCharacterToPersonality(agentData.character || ""),
          voice: agentData.voice || "",
          script: (agentData as any).prompt || "", // Get prompt from API
          callLogic: "standard",
          selectedEventTypes: [],
          selectedLeadForms: [],
          outgoingGreeting: agentData.greeting_outbound || "",
          incomingGreeting: agentData.greeting_inbound || "",
          maxAttempts: "3",
          callInterval: (agentData.retry_interval || 30).toString(),
          workingDays: parseWorkdays(agentData.workdays),
          workingTimeStart: parseTime(agentData.call_from),
          workingTimeEnd: parseTime(agentData.call_to),
          character: agentData.character || "",
          language: agentData.language || "de"
        });
        
      } catch (err) {
        console.error('❌ Failed to load agent data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agent data');
        toast.error('Fehler beim Laden der Agent-Daten');
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, [isEdit, id]);

  const playVoiceSample = (voice: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (playingVoice === voice) {
      setPlayingVoice(null);
      return;
    }

    // For now, we'll use placeholder voice samples
    // In production, these should come from the Voice API
    const voiceFiles: Record<string, string> = {
      'sarah': '/voice-samples/lisa-sample.mp3',
      'marcus': '/voice-samples/marcus-sample.mp3', 
      'lisa': '/voice-samples/lisa-sample.mp3'
    };

    const audioFile = voiceFiles[voice];
    if (audioFile) {
      const audio = new Audio(audioFile);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setPlayingVoice(null);
      });
      
      audio.addEventListener('error', () => {
        setPlayingVoice(null);
        console.warn(`Voice sample not found: ${audioFile}`);
      });

      setPlayingVoice(voice);
      audio.play().catch(() => {
        setPlayingVoice(null);
      });
    }
  };

  const handleSave = async () => {
    console.log('🚀 handleSave STARTED', { config, primaryWorkspace });
    
    try {
      setSaving(true);
      setError(null);
      console.log('🔄 Save state set, validating...');
      
      if (!primaryWorkspace) {
        console.error('❌ No workspace available');
        throw new Error('Kein Workspace verfügbar');
      }
      console.log('✅ Workspace available:', primaryWorkspace.id);

      // Validate required fields before sending to API
      if (!config.name || !config.voice) {
        console.error('❌ Validation failed:', { name: config.name, voice: config.voice });
        throw new Error('Name und Voice sind erforderlich');
      }
      console.log('✅ Validation passed');
      
      // Map personality to character for the API
      const mapPersonalityToCharacter = (personality: string): string => {
        switch (personality) {
          case 'friendly':
            return 'Freundlich und empathisch';
          case 'professional':
            return 'Professionell und direkt';
          case 'warm':
            return 'Warm und herzlich';
          case 'energetic':
            return 'Energisch und dynamisch';
          case 'direct':
            return 'Direkt und zielstrebig';
          default:
            return 'Freundlich und empathisch';
        }
      };
      
      // Prepare data for API according to PUT /api/agents/agents/{agent_id}/ schema
      console.log('🔧 Preparing agentData...');
      
      // Convert workdays from object to array of numbers
      const workdaysArray = Object.entries(config.workingDays)
        .filter(([_, active]) => active)
        .map(([day]) => parseInt(day));
      
      const agentData = {
        workspace: primaryWorkspace.id,
        name: config.name,
        status: 'active' as const,
        greeting_inbound: config.incomingGreeting,
        greeting_outbound: config.outgoingGreeting,
        voice: config.voice,
        language: config.language,
        retry_interval: parseInt(config.callInterval) || 30,
        workdays: workdaysArray, // Send as array, not string
        call_from: config.workingTimeStart + ":00", // Convert "09:00" to "09:00:00"
        call_to: config.workingTimeEnd + ":00", // Convert "17:00" to "17:00:00"
        character: mapPersonalityToCharacter(config.personality), // Map personality to character
        prompt: config.script || "Du bist ein freundlicher KI-Agent.",
        config_id: null, // Optional: Set if you have a config_id
        calendar_configuration: null // Optional: Set if you have calendar config
      };
      
      console.log('💾 Saving agent...', { 
        isEdit, 
        agentId: id, 
        agentData,
        workdaysDebug: {
          originalWorkingDays: config.workingDays,
          filteredEntries: Object.entries(config.workingDays).filter(([_, active]) => active),
          workdaysArray: workdaysArray
        },
        personalityToCharacterMapping: {
          personality: config.personality,
          character: agentData.character
        }
      });
      
      if (isEdit && id) {
        console.log('🔄 Using PUT /api/agents/agents/{agent_id}/ for update');
        await agentAPI.updateAgent(id, agentData);
        toast.success('Agent erfolgreich aktualisiert!');
      } else {
        console.log('🆕 Using POST /api/agents/agents/ for creation');
        await agentAPI.createAgent(agentData);
        toast.success('Agent erfolgreich erstellt!');
      }
      
      // Navigate back to agents list
      navigate('/dashboard/agents');
      
    } catch (err) {
      console.error('❌ Failed to save agent:', err);
      
      // Enhanced error handling for different HTTP status codes
      let errorMessage = 'Fehler beim Speichern des Agents';
      
      if (err instanceof Error) {
        if (err.message.includes('500')) {
          errorMessage = 'Server-Fehler: Bitte Backend-Logs prüfen';
        } else if (err.message.includes('400')) {
          errorMessage = 'Ungültige Daten: Bitte Eingaben überprüfen';
        } else if (err.message.includes('403')) {
          errorMessage = 'Keine Berechtigung: Nur Staff/Admin können Agents bearbeiten';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    toast.info('Test-Funktionalität wird bald verfügbar sein');
  };

  // Show loading state
  if (loading || voicesLoading) {
    return (
      <div className={layoutStyles.pageContainer}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500">Lade Agent-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={layoutStyles.pageContainer}>
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Fehler: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => navigate('/dashboard/agents')}
          >
            Zurück zu Agenten
          </Button>
        </div>
      </div>
    );
  }

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
                    <SelectItem value="professional">Professionell und Direkt</SelectItem>
                    <SelectItem value="warm">Warm und Herzlich</SelectItem>
                    <SelectItem value="energetic">Energisch und Dynamisch</SelectItem>
                    <SelectItem value="direct">Direkt und Zielstrebig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Stimme</Label>
                {voices.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Lade Stimmen...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 max-h-96 overflow-y-auto">
                    {voices.slice(0, 12).map((voice) => {
                      const isSelected = config.voice === voice.id;
                      const voicePicture = getVoicePicture(voice.id);
                      
                      return (
                        <div key={voice.id} className="p-4 border rounded-lg space-y-2 relative h-48 flex flex-col">
                          {voice.recommend && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute top-2 right-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
                                  Empfohlen
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">Von KI-Experten empfohlen</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <div className="flex items-center justify-between flex-grow">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-14 w-14">
                                {voicePicture && (
                                  <AvatarImage 
                                    src={voicePicture} 
                                    alt={voice.name}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = 'none';
                                    }}
                                  />
                                )}
                                <AvatarFallback className={`
                                  ${voice.gender === 'female' ? 'bg-pink-100 text-pink-600' : ''}
                                  ${voice.gender === 'male' ? 'bg-blue-100 text-blue-600' : ''}
                                  ${voice.gender === 'neutral' ? 'bg-gray-100 text-gray-600' : ''}
                                `}>
                                  {voice.gender === 'female' ? (
                                    <User className="h-7 w-7" />
                                  ) : voice.gender === 'male' ? (
                                    <UserCircle className="h-7 w-7" />
                                  ) : (
                                    <Sparkles className="h-7 w-7" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{voice.name}</p>
                                <p className="text-sm text-gray-500">
                                  {voice.gender === 'female' ? 'Weiblich' : voice.gender === 'male' ? 'Männlich' : 'Neutral'}
                                  {voice.tone && `, ${voice.tone}`}
                                </p>
                                {/* Entferne Provider-Anzeige außer wenn es nicht elevenlabs ist */}
                                {voice.provider && voice.provider.toLowerCase() !== 'elevenlabs' && (
                                  <p className="text-xs text-gray-400">{voice.provider}</p>
                                )}
                              </div>
                            </div>
                            <button 
                              className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50 shrink-0"
                              onClick={() => playVoiceSample(voice.id)}
                              title={playingVoice === voice.id ? 'Stoppen' : 'Probe hören'}
                            >
                              {playingVoice === voice.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          
                          <button
                            className={`w-full py-2 px-3 rounded border text-sm font-medium mt-auto ${
                              isSelected
                                ? "bg-[#FEF5F1] text-[#FE5B25] border-[#FE5B25]" 
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setConfig(prev => ({ ...prev, voice: voice.id }))}
                          >
                            {isSelected ? "Ausgewählt" : "Auswählen"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {voices.length > 12 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {voices.length - 12} weitere Stimmen verfügbar...
                  </p>
                )}
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