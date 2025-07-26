import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Phone, Facebook, Globe, Linkedin, Webhook } from "lucide-react";
import { buttonStyles, textStyles, layoutStyles } from "@/lib/buttonStyles";

const WelcomeStep2 = () => {
  const navigate = useNavigate();
  const [selectedLeadForms, setSelectedLeadForms] = useState<string[]>([]);

  const handleNext = () => {
    // TODO: Save data to context or state management
    console.log("Step 2 data:", { selectedLeadForms });
    navigate("/welcome/step3");
  };

  const handlePrev = () => {
    navigate("/welcome/step1");
  };

  const toggleLeadForm = (formId: string) => {
    setSelectedLeadForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const availableLeadForms = [
    { 
      id: "1", 
      name: "Hauptformular - Beratung", 
      source: "Meta Lead Ads", 
      fields: ["Name", "Email", "Telefon", "Interesse"],
      icon: Facebook,
      color: "bg-blue-100 text-blue-600"
    },
    { 
      id: "2", 
      name: "Demo Anfrage", 
      source: "Meta Lead Ads", 
      fields: ["Name", "Email", "Unternehmen"],
      icon: Facebook,
      color: "bg-blue-100 text-blue-600"
    },
    { 
      id: "3", 
      name: "Kontaktformular Website", 
      source: "Website Webhook", 
      fields: ["Name", "Email", "Nachricht"],
      icon: Webhook,
      color: "bg-purple-100 text-purple-600"
    },
    { 
      id: "4", 
      name: "LinkedIn Kampagne", 
      source: "LinkedIn Lead Gen", 
      fields: ["Name", "Email", "Position"],
      icon: Linkedin,
      color: "bg-blue-100 text-blue-700"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead-Quellen konfigurieren</h1>
          <p className="text-lg text-gray-600 mb-6">Wählen Sie aus, woher Ihre Leads kommen sollen</p>
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Schritt 2 von 3 - Lead-Quellen</span>
            <span>66%</span>
          </div>
          <Progress value={66} className="w-full h-2" />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={textStyles.sectionTitle}>Lead-Quellen auswählen</CardTitle>
                <CardDescription>
                  Wählen Sie die Formulare aus, aus denen Ihr Agent Leads erhalten soll
                </CardDescription>
              </div>
              <Button className={buttonStyles.primary.default}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Quelle
              </Button>
            </div>
          </CardHeader>
          <CardContent className={layoutStyles.cardContent}>
            <div>
              <Label>Verfügbare Lead-Formulare</Label>
              <div className="space-y-3 mt-3">
                {availableLeadForms.map((form) => {
                  const Icon = form.icon;
                  const isSelected = selectedLeadForms.includes(form.id);
                  
                  return (
                    <div 
                      key={form.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        isSelected 
                          ? 'border-[#FE5B25] bg-[#FEF5F1]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleLeadForm(form.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${form.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{form.name}</h3>
                            <p className="text-sm text-gray-500">{form.source}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {form.fields.map((field) => (
                                <span key={field} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                  {field}
                                </span>
                              ))}
                            </div>
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
              
              {selectedLeadForms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Noch keine Lead-Quelle ausgewählt</p>
                  <p className="text-sm">Wählen Sie mindestens eine Quelle aus, um fortzufahren</p>
                </div>
              )}
            </div>

            {/* Create new lead source option */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-gray-700">Neue Lead-Quelle hinzufügen</h3>
                  <p className="text-sm text-gray-500">
                    Facebook Ads, Google Ads, eigene Webhooks und mehr
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Hinzufügen
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={handlePrev} className="px-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={selectedLeadForms.length === 0}
                className={`${buttonStyles.create.default} px-8`}
              >
                Weiter zu Kalender
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeStep2; 