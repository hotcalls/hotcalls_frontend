import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Facebook, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

// Mock Meta Account Data
const metaAccount = {
  id: "fb_acc_123456789",
  name: "HotCalls GmbH",
  email: "admin@hotcalls.de",
  connectedDate: "15.12.2023",
  status: "Verbunden",
};

// Mock Lead Formulare
const leadForms = [
  {
    id: "form_1",
    name: "Premium Beratung Anfrage",
    pageName: "HotCalls - Telemarketing Experten",
    leads: 1247,
    status: "Aktiv",
    lastActivity: "vor 2 Std",
    selected: true,
  },
  {
    id: "form_2", 
    name: "Kostenlose Erstberatung",
    pageName: "HotCalls - Telemarketing Experten",
    leads: 892,
    status: "Aktiv", 
    lastActivity: "vor 4 Std",
    selected: true,
  },
  {
    id: "form_3",
    name: "Newsletter Anmeldung",
    pageName: "HotCalls Blog",
    leads: 543,
    status: "Aktiv",
    lastActivity: "vor 1 Tag",
    selected: false,
  },
  {
    id: "form_4",
    name: "Webinar Registrierung",
    pageName: "HotCalls Events",
    leads: 234,
    status: "Pausiert",
    lastActivity: "vor 3 Tagen", 
    selected: false,
  },
];

export default function MetaConfig() {
  const navigate = useNavigate();
  const [forms, setForms] = useState(leadForms);
  const [activeTab, setActiveTab] = useState("account");

  const toggleFormSelection = (formId: string) => {
    setForms(forms.map(form => 
      form.id === formId 
        ? { ...form, selected: !form.selected }
        : form
    ));
  };

  const selectedCount = forms.filter(form => form.selected).length;

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header */}
      <div className={layoutStyles.pageHeader}>
        <div className="space-y-4">
          <button 
            className={buttonStyles.navigation.back}
            onClick={() => navigate("/dashboard/lead-sources")}
          >
            <ArrowLeft className={iconSizes.small} />
            <span>Zurück zu Lead Quellen</span>
          </button>
          <div>
            <h1 className={textStyles.pageTitle}>Meta Lead Ads Konfiguration</h1>
            <p className={textStyles.pageSubtitle}>Verbinde und konfiguriere deine Meta Lead Formulare</p>
          </div>
        </div>
        
        <button className={buttonStyles.create.default}>
          <span>Änderungen speichern</span>
        </button>
      </div>

      {/* Custom Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" role="tablist">
          <button
            onClick={() => setActiveTab("account")}
            className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === "account"
                ? "border-[#FE5B25] text-[#FE5B25]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            role="tab"
          >
            Meta Account
          </button>
          
          <button
            onClick={() => setActiveTab("forms")}
            className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === "forms"
                ? "border-[#FE5B25] text-[#FE5B25]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            role="tab"
          >
            Formulare
          </button>
        </nav>
      </div>

      {/* Meta Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Meta Account Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FFE1D7] rounded-lg">
                    <Facebook className={`${iconSizes.medium} text-[#FE5B25]`} />
                  </div>
                  <div>
                    <CardTitle className={textStyles.sectionTitle}>Verbundener Meta Account</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Account ID: {metaAccount.id}
                    </p>
                  </div>
                </div>
                
                <Badge className="bg-green-50 border-green-600 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {metaAccount.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="font-medium">{metaAccount.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-Mail</p>
                  <p className="font-medium">{metaAccount.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verbunden seit</p>
                  <p className="font-medium">{metaAccount.connectedDate}</p>
                </div>
              </div>
              
              <div className={`flex items-center ${spacingStyles.buttonSpacing} pt-2 border-t`}>
                <button className={buttonStyles.secondary.default}>
                  <span>Account trennen</span>
                </button>
                <button className={buttonStyles.secondary.default}>
                  <span>Account wechseln</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Info Box for Account Tab */}
          <Card className="border-[#FE5B25] bg-[#FEF5F1]">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-[#FFE1D7] rounded-full">
                  <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#FE5B25]">
                    Meta Account erfolgreich verbunden
                  </p>
                  <p className="text-sm text-[#FE5B25]/80">
                    Dein Meta Business Account ist aktiv und kann Lead Formulare übertragen. 
                    Du kannst jetzt im "Formulare" Tab die gewünschten Lead Formulare auswählen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulare Tab */}
      {activeTab === "forms" && (
        <div className="space-y-6">
          {/* Lead Formulare */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={textStyles.sectionTitle}>
                  Verfügbare Lead Formulare
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {selectedCount} von {forms.length} ausgewählt
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {forms.map((form) => (
                  <Card 
                    key={form.id} 
                    className={`cursor-pointer transition-all ${
                      form.selected 
                        ? "border-[#FE5B25] border-2" 
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => toggleFormSelection(form.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {form.selected ? (
                            <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                          ) : (
                            <Circle className={`${iconSizes.small} text-gray-400`} />
                          )}
                          <div>
                            <CardTitle className={textStyles.cardTitle}>{form.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {form.pageName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Letzte Aktivität {form.lastActivity}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Box for Forms Tab */}
          <Card className="border-[#FE5B25] bg-[#FEF5F1]">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-[#FFE1D7] rounded-full">
                  <CheckCircle className={`${iconSizes.small} text-[#FE5B25]`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#FE5B25]">
                    Lead Formulare in Agent Konfiguration verfügbar
                  </p>
                  <p className="text-sm text-[#FE5B25]/80">
                    Die ausgewählten Formulare werden automatisch in der Agent Konfiguration 
                    als Lead Quellen angezeigt und können dort den Agenten zugewiesen werden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 