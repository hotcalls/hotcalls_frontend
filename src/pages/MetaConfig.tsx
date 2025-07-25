import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Facebook, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const toggleFormSelection = (formId: string) => {
    setForms(forms.map(form => 
      form.id === formId 
        ? { ...form, selected: !form.selected }
        : form
    ));
  };

  const selectedCount = forms.filter(form => form.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/lead-sources")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück zu Lead Quellen</span>
          </Button>
        </div>
        
        <Button className="flex items-center space-x-2">
          <span>Änderungen speichern</span>
        </Button>
      </div>

      <h2 className="text-xl font-semibold">Meta Lead Ads Konfiguration</h2>

      {/* Meta Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                             <div className="p-2 bg-primary/10 rounded-lg">
                 <Facebook className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Verbundener Meta Account</CardTitle>
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
          
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Button size="sm" variant="outline">
              Account trennen
            </Button>
            <Button size="sm" variant="outline">
              Account wechseln
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead Formulare */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Verfügbare Lead Formulare ({forms.length})
          </h3>
          <div className="text-sm text-muted-foreground">
            {selectedCount} von {forms.length} ausgewählt
          </div>
        </div>

        <div className="grid gap-4">
          {forms.map((form) => (
            <Card 
              key={form.id} 
                             className={`cursor-pointer transition-all ${
                 form.selected 
                   ? "border-primary bg-primary/10" 
                   : "hover:border-gray-300"
               }`}
              onClick={() => toggleFormSelection(form.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                                         {form.selected ? (
                       <CheckCircle className="h-5 w-5 text-primary" />
                     ) : (
                       <Circle className="h-5 w-5 text-gray-400" />
                     )}
                    <div>
                      <CardTitle className="text-base">{form.name}</CardTitle>
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
      </div>

             {/* Info Box */}
       <Card className="border-primary bg-primary/10">
         <CardContent className="pt-6">
           <div className="flex items-start space-x-3">
             <div className="p-1 bg-primary/20 rounded-full">
               <CheckCircle className="h-4 w-4 text-primary" />
             </div>
             <div className="space-y-1">
               <p className="text-sm font-medium text-primary">
                 Lead Formulare in Agent Konfiguration verfügbar
               </p>
               <p className="text-sm text-primary/80">
                 Die ausgewählten Formulare werden automatisch in der Agent Konfiguration 
                 als Lead Quellen angezeigt und können dort den Agenten zugewiesen werden.
               </p>
             </div>
           </div>
         </CardContent>
       </Card>
    </div>
  );
} 