import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ArrowLeft, Save, TestTube, Plus, X, Play, Upload, FileText, User, ScrollText, Phone, Settings } from "lucide-react";

export default function AgentConfig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState("personality");

  const [config, setConfig] = useState({
    // Grundeinstellungen
    name: "",
    gender: "weiblich",
    voice: "sarah",
    language: "deutsch",
    
    // Verhalten & Persönlichkeit
    personality: "",
    greeting: "",
    outgoingGreeting: "",
    incomingGreeting: "",
    
    // Skript
    scriptType: "text", // "upload" or "text"
    scriptText: "",
    scriptFile: null,
    
    objections: [{ objection: "", handling: "" }],
    closingStrategy: "",
    
    // Anruf-Einstellungen
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    workingTimeStart: "09:00",
    workingTimeEnd: "17:00",
    callInterval: "30", // Minuten zwischen Anrufen
    maxAttempts: "3", // Maximale Anrufversuche
    
    // Lead-Management
    leadSources: [""],
    calendars: [""],
  });

  const weekdays = [
    { key: "monday", label: "Montag" },
    { key: "tuesday", label: "Dienstag" },
    { key: "wednesday", label: "Mittwoch" },
    { key: "thursday", label: "Donnerstag" },
    { key: "friday", label: "Freitag" },
    { key: "saturday", label: "Samstag" },
    { key: "sunday", label: "Sonntag" },
  ];

  const addObjection = () => {
    setConfig(prev => ({
      ...prev,
      objections: [...prev.objections, { objection: "", handling: "" }]
    }));
  };

  const removeObjection = (index: number) => {
    setConfig(prev => ({
      ...prev,
      objections: prev.objections.filter((_, i) => i !== index)
    }));
  };

  const updateObjection = (index: number, field: 'objection' | 'handling', value: string) => {
    setConfig(prev => ({
      ...prev,
      objections: prev.objections.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addListItem = (field: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], ""]
    }));
  };

  const removeListItem = (field: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateListItem = (field: string, index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const handleSave = () => {
    // Hier würde die Speicher-Logik stehen
    console.log("Speichere Agent Konfiguration:", config);
    navigate("/agents");
  };

  const handleTest = () => {
    // Hier würde die Test-Logik stehen
    console.log("Teste Agent:", config);
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Agenten
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleTest}>
            <TestTube className="mr-2 h-4 w-4" />
            Testen
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Agent bearbeiten" : "Neuen Agent erstellen"}
        </h1>
        <p className="text-muted-foreground">
          Konfiguriere deinen KI-Agenten für optimale Performance
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personality" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Persönlichkeit</span>
          </TabsTrigger>
          <TabsTrigger value="script" className="flex items-center space-x-2">
            <ScrollText className="h-4 w-4" />
            <span>Skript</span>
          </TabsTrigger>
          <TabsTrigger value="calling" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Anruflogik</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Integrationen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Persönlichkeit */}
        <TabsContent value="personality" className="space-y-8 mt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Sarah, Marcus, Lisa"
                />
              </div>
              
              <div>
                <Label htmlFor="personality">Persönlichkeit</Label>
                <Select value={config.personality} onValueChange={(value) => setConfig(prev => ({ ...prev, personality: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Persönlichkeit wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freundlich">Freundlich</SelectItem>
                    <SelectItem value="professionell">Professionell</SelectItem>
                    <SelectItem value="energisch">Energisch</SelectItem>
                    <SelectItem value="entspannt">Entspannt</SelectItem>
                    <SelectItem value="selbstbewusst">Selbstbewusst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Stimme</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>S</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sarah</p>
                        <p className="text-sm text-muted-foreground">Weiblich, warm</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {/* Play voice sample */}}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${config.voice === "sarah" ? "border-orange-500 text-orange-500 hover:bg-orange-50" : ""}`}
                    onClick={() => setConfig(prev => ({ ...prev, voice: "sarah" }))}
                  >
                    {config.voice === "sarah" ? "Ausgewählt" : "Auswählen"}
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>M</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Marcus</p>
                        <p className="text-sm text-muted-foreground">Männlich, ruhig</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {/* Play voice sample */}}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${config.voice === "marcus" ? "border-orange-500 text-orange-500 hover:bg-orange-50" : ""}`}
                    onClick={() => setConfig(prev => ({ ...prev, voice: "marcus" }))}
                  >
                    {config.voice === "marcus" ? "Ausgewählt" : "Auswählen"}
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>L</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Lisa</p>
                        <p className="text-sm text-muted-foreground">Weiblich, energisch</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {/* Play voice sample */}}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${config.voice === "lisa" ? "border-orange-500 text-orange-500 hover:bg-orange-50" : ""}`}
                    onClick={() => setConfig(prev => ({ ...prev, voice: "lisa" }))}
                  >
                    {config.voice === "lisa" ? "Ausgewählt" : "Auswählen"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outgoingGreeting">Begrüßung (Ausgehende Anrufe)</Label>
                <Textarea
                  id="outgoingGreeting"
                  value={config.outgoingGreeting || config.greeting}
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
          </div>
        </TabsContent>

        {/* Tab Content: Skript */}
        <TabsContent value="script" className="space-y-8 mt-6">
          <div className="space-y-4">
            <div>
              <Label>Skript erstellen</Label>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant={config.scriptType === "text" ? "default" : "outline"}
                  size="lg"
                  className="flex items-center space-x-2 px-8"
                  onClick={() => setConfig(prev => ({ ...prev, scriptType: "text" }))}
                >
                  <FileText className="h-5 w-5" />
                  <span>Text einfügen</span>
                </Button>
                <Button
                  variant={config.scriptType === "upload" ? "default" : "outline"}
                  size="lg"
                  className="flex items-center space-x-2 px-8"
                  onClick={() => setConfig(prev => ({ ...prev, scriptType: "upload" }))}
                >
                  <Upload className="h-5 w-5" />
                  <span>Datei hochladen</span>
                </Button>
              </div>
            </div>
            
            {config.scriptType === "text" ? (
              <div>
                <Label htmlFor="scriptText">Skript Text</Label>
                <Textarea
                  id="scriptText"
                  value={config.scriptText}
                  onChange={(e) => setConfig(prev => ({ ...prev, scriptText: e.target.value }))}
                  placeholder="Fügen Sie hier Ihr komplettes Gesprächsskript ein..."
                  rows={12}
                  className="mt-2"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="scriptFile">Skript Datei</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Klicken Sie hier oder ziehen Sie eine Datei hinein
                  </p>
                  <p className="text-xs text-gray-500">
                    Unterstützte Formate: PDF, DOCX, TXT
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="mt-4"
                    onChange={(e) => setConfig(prev => ({ ...prev, scriptFile: e.target.files?.[0] || null }))}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Einwände</Label>
              {config.objections.map((objection, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Einwand {index + 1}</Label>
                    {config.objections.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeObjection(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={objection.objection}
                    onChange={(e) => updateObjection(index, "objection", e.target.value)}
                    placeholder="Beschreiben Sie den Einwand..."
                  />
                  <div>
                    <Label>Einwandbehandlung</Label>
                    <Textarea
                      value={objection.handling}
                      onChange={(e) => updateObjection(index, "handling", e.target.value)}
                      placeholder="Wie soll der Agent auf diesen Einwand reagieren?"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addObjection}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Weitere Einwände hinzufügen
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content: Anruflogik */}
        <TabsContent value="calling" className="space-y-8 mt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-6 items-start">
              {/* Aktive Tage */}
              <div>
                <Label className="text-base font-medium">Aktive Tage</Label>
                <div className="mt-2">
                  <div className="grid grid-cols-7 gap-1">
                    {weekdays.map((day) => (
                      <Button
                        key={day.key}
                        variant="outline"
                        size="sm"
                        className={`h-10 w-10 rounded-full p-0 ${
                          config.workingDays[day.key as keyof typeof config.workingDays]
                            ? "border-orange-500 text-orange-500 hover:bg-orange-50"
                            : ""
                        }`}
                        onClick={() => 
                          setConfig(prev => ({
                            ...prev,
                            workingDays: {
                              ...prev.workingDays,
                              [day.key]: !prev.workingDays[day.key as keyof typeof prev.workingDays]
                            }
                          }))
                        }
                      >
                        {day.label.slice(0, 2)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Uhrzeit */}
              <div>
                <Label className="text-base font-medium">Uhrzeit</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-muted-foreground">von</span>
                  <Input
                    type="time"
                    value={config.workingTimeStart}
                    onChange={(e) => setConfig(prev => ({ ...prev, workingTimeStart: e.target.value }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">bis</span>
                  <Input
                    type="time"
                    value={config.workingTimeEnd}
                    onChange={(e) => setConfig(prev => ({ ...prev, workingTimeEnd: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Maximale Anzahl */}
              <div>
                <Label htmlFor="maxAttempts" className="text-base font-medium">Maximale Anzahl an Anrufen</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxAttempts}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  className="mt-2"
                />
              </div>

              {/* Anrufintervall */}
              <div>
                <Label htmlFor="callInterval" className="text-base font-medium">Anrufintervall</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="callInterval"
                    type="number"
                    min="5"
                    max="240"
                    value={config.callInterval}
                    onChange={(e) => setConfig(prev => ({ ...prev, callInterval: e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">Min</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content: Integrationen */}
        <TabsContent value="integrations" className="space-y-8 mt-6">
          <div className="space-y-4">
            <div>
              <Label>Verknüpfte Lead Quellen</Label>
              {config.leadSources.map((source, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Select
                    value={source}
                    onValueChange={(value) => updateListItem("leadSources", index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lead Quelle wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook-ads">Facebook Ads</SelectItem>
                      <SelectItem value="google-ads">Google Ads</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                  {config.leadSources.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeListItem("leadSources", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addListItem("leadSources")}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Lead Quelle hinzufügen
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Verknüpfte Kalender</Label>
              {config.calendars.map((calendar, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Input
                    value={calendar}
                    onChange={(e) => updateListItem("calendars", index, e.target.value)}
                    placeholder="Kalender Name..."
                  />
                  {config.calendars.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeListItem("calendars", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addListItem("calendars")}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Kalender hinzufügen
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 