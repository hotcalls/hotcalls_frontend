import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, TestTube, User, FileText, Phone, Settings as SettingsIcon, Play, Plus } from "lucide-react";
import { useState } from "react";
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

  const [config, setConfig] = useState({
    name: isEdit ? "Sarah" : "",
    personality: isEdit ? "Freundlich & Professionell" : "",
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
      <Tabs defaultValue="personality" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personality">
            <User className={iconSizes.small} />
            <span className="ml-2">Persönlichkeit</span>
          </TabsTrigger>
          <TabsTrigger value="script">
            <FileText className={iconSizes.small} />
            <span className="ml-2">Skript</span>
          </TabsTrigger>
          <TabsTrigger value="logic">
            <Phone className={iconSizes.small} />
            <span className="ml-2">Anruflogik</span>
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <SettingsIcon className={iconSizes.small} />
            <span className="ml-2">Integrationen</span>
          </TabsTrigger>
        </TabsList>

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
                <Input
                  id="personality"
                  value={config.personality}
                  onChange={(e) => setConfig(prev => ({ ...prev, personality: e.target.value }))}
                  placeholder="z.B. Freundlich & Professionell"
                />
              </div>
              
              <div>
                <Label>Stimme</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">S</span>
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
                        config.voice === "sarah" 
                          ? "bg-[#FEF5F1] text-[#FE5B25] border-gray-300" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setConfig(prev => ({ ...prev, voice: "sarah" }))}
                    >
                      {config.voice === "sarah" ? "Ausgewählt" : "Auswählen"}
                    </button>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">M</span>
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
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">L</span>
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
              <CardTitle className={textStyles.sectionTitle}>Gesprächsskript</CardTitle>
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
              <CardTitle className={textStyles.sectionTitle}>Anruflogik</CardTitle>
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
                  <div className="grid grid-cols-4 gap-2 mt-2 max-w-48">
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
                <CardTitle className={textStyles.sectionTitle}>Kalender & Event-Types</CardTitle>
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
                <CardTitle className={textStyles.sectionTitle}>Lead-Quellen</CardTitle>
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