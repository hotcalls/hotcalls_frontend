import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Calendar, User, Clock, Phone } from "lucide-react";
import { buttonStyles, textStyles, layoutStyles } from "@/lib/buttonStyles";

const WelcomeStep3 = () => {
  const navigate = useNavigate();
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  const handleFinish = () => {
    // TODO: Save data to context or state management and create agent
    console.log("Step 3 data:", { selectedEventTypes });
    navigate("/welcome/complete");
  };

  const handlePrev = () => {
    navigate("/welcome/step2");
  };

  const toggleEventType = (eventTypeId: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventTypeId) 
        ? prev.filter(id => id !== eventTypeId)
        : [...prev, eventTypeId]
    );
  };

  const availableEventTypes = [
    { 
      id: "1", 
      name: "Beratungsgespräch", 
      duration: 30, 
      calendar: "Marcus Weber (Haupt)",
      description: "Persönliche Beratung für Interessenten"
    },
    { 
      id: "2", 
      name: "Demo Call", 
      duration: 45, 
      calendar: "Marcus Weber (Haupt)",
      description: "Produktdemonstration und Fragen"
    },
    { 
      id: "3", 
      name: "Follow-up Gespräch", 
      duration: 20, 
      calendar: "Marcus Weber (Haupt)",
      description: "Nachfassgespräch mit bestehenden Kunden"
    },
    { 
      id: "4", 
      name: "Team Meeting", 
      duration: 60, 
      calendar: "Team Calendar",
      description: "Besprechung mit mehreren Teilnehmern"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Phone className="h-8 w-8 text-[#FE5B25]" />
            <span className="text-2xl font-bold text-gray-900">hotcalls.ai</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kalender & Termine</h1>
          <p className="text-lg text-gray-600 mb-6">Konfigurieren Sie Event-Types für automatische Terminbuchungen</p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Schritt 3 von 3 - Kalender Integration</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="w-full h-2" />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={textStyles.sectionTitle}>Event-Types auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie die Terminarten aus, die Ihr Agent automatisch buchen soll
                </CardDescription>
              </div>
              <Button className={buttonStyles.primary.default}>
                <Plus className="h-4 w-4 mr-2" />
                Event-Type hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent className={layoutStyles.cardContent}>
            <div>
              <Label>Verfügbare Event-Types</Label>
              <div className="space-y-3 mt-3">
                {availableEventTypes.map((eventType) => {
                  const isSelected = selectedEventTypes.includes(eventType.id);
                  
                  return (
                    <div 
                      key={eventType.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        isSelected 
                          ? 'border-[#FE5B25] bg-[#FEF5F1]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleEventType(eventType.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#FE5B25] text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{eventType.name}</h3>
                            <p className="text-sm text-gray-500">{eventType.duration} Min - {eventType.calendar}</p>
                            <p className="text-xs text-gray-400 mt-1">{eventType.description}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-[#FE5B25] bg-[#FE5B25]' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {selectedEventTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Noch keine Event-Types ausgewählt</p>
                  <p className="text-sm">Wählen Sie mindestens einen Event-Type aus, um fortzufahren</p>
                </div>
              )}
            </div>

            {/* Add new event type option */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-gray-700">Neuen Event-Type erstellen</h3>
                  <p className="text-sm text-gray-500">
                    Google oder Outlook Kalender verbinden und Event-Types konfigurieren
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Erstellen
                </Button>
              </CardContent>
            </Card>

            {/* Info box */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-[#FE5B25] mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Automatische Terminbuchung</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Ihr Agent wird automatisch verfügbare Termine aus den gewählten Event-Types prüfen 
                    und Buchungen für interessierte Leads vornehmen. Die Integration erfolgt über Ihren 
                    verbundenen Kalender.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={handlePrev} className="px-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button 
                onClick={handleFinish} 
                disabled={selectedEventTypes.length === 0}
                className={`${buttonStyles.create.default} px-8`}
              >
                Agent erstellen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeStep3; 