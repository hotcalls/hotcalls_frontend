import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Facebook, Globe, Linkedin, Webhook, Settings, Trash2, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const leadSources = [
  {
    id: "1",
    name: "Meta Lead Ads",
    type: "Meta/Facebook",
    icon: Facebook,
    status: "Aktiv",
    gesamteLeads: 2847,
    erreichteLeads: 1892,
    gebuchteTermine: 378,
    conversionRate: 13.3,
    available: true,
  },
  {
    id: "2",
    name: "Website Webhook",
    type: "Webhook",
    icon: Webhook,
    status: "Pausiert", 
    gesamteLeads: 1243,
    erreichteLeads: 912,
    gebuchteTermine: 189,
    conversionRate: 15.2,
    available: true,
  },
  {
    id: "3",
    name: "Google Lead Forms", 
    type: "Google",
    icon: Globe,
    status: "Coming Soon",
    gesamteLeads: 0,
    erreichteLeads: 0,
    gebuchteTermine: 0,
    conversionRate: 0,
    available: false,
  },
  {
    id: "4",
    name: "LinkedIn Lead Gen",
    type: "LinkedIn", 
    icon: Linkedin,
    status: "Coming Soon",
    gesamteLeads: 0,
    erreichteLeads: 0,
    gebuchteTermine: 0,
    conversionRate: 0,
    available: false,
  },
];

export default function LeadSources() {
  const [sources, setSources] = useState(leadSources);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  const toggleStatus = (id: string) => {
    setSources(sources.map(source => 
      source.id === id && source.available
        ? { ...source, status: source.status === "Aktiv" ? "Pausiert" : "Aktiv" }
        : source
    ));
  };

  const deleteSource = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const handleConfigure = (id: string, name: string) => {
    if (name === "Meta Lead Ads") {
      // Navigate zu Meta Konfiguration mit Account + Formularen
      navigate(`/lead-sources/meta/config`);
    } else if (name === "Website Webhook") {
      // Navigate zu Webhook Konfiguration 
      navigate(`/lead-sources/webhook/config`);
    }
  };

  const handleAddLeadSource = (type: string) => {
    if (type === "Meta") {
      // Navigate zu Meta Setup
      navigate(`/lead-sources/meta/config`);
    } else if (type === "Webhook") {
      // Navigate zu Webhook Setup
      navigate(`/lead-sources/webhook/config`);
    }
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lead Quellen</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Lead Quelle hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lead Quelle hinzufügen</DialogTitle>
              <DialogDescription>
                Wähle eine Lead Quelle aus, die du mit deinen Agenten verbinden möchtest.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Meta */}
              <button
                onClick={() => handleAddLeadSource("Meta")}
                className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-primary/10">
                  <Facebook className="h-6 w-6 text-blue-600 group-hover:text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Meta Lead Ads</h3>
                  <p className="text-sm text-muted-foreground">
                    Verbinde deine Facebook und Instagram Lead Formulare
                  </p>
                </div>
              </button>

              {/* Webhook */}
              <button
                onClick={() => handleAddLeadSource("Webhook")}
                className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
              >
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary/10">
                  <Webhook className="h-6 w-6 text-gray-600 group-hover:text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Website Webhook</h3>
                  <p className="text-sm text-muted-foreground">
                    Empfange Leads direkt von deiner Website
                  </p>
                </div>
              </button>

              {/* LinkedIn - Coming Soon */}
              <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Linkedin className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-500">LinkedIn Lead Gen</h3>
                  <p className="text-sm text-gray-400">
                    Bald verfügbar
                  </p>
                </div>
              </div>

              {/* Google Ads - Coming Soon */}
              <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Globe className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-500">Google Ads</h3>
                  <p className="text-sm text-gray-400">
                    Bald verfügbar
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lead Sources Grid (wie Agent Cards) */}
      <div className="grid gap-6 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.id} className={source.available ? "" : "opacity-60"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${source.available ? "bg-primary/10" : "bg-gray-100"}`}>
                    <source.icon className={`h-6 w-6 ${source.available ? "text-primary" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-lg ${source.available ? "" : "text-gray-500"}`}>
                      {source.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{source.type}</p>
                  </div>
                </div>
                
                {/* Buttons wie bei Agent Cards */}
                <div className="flex items-center space-x-2">
                  {source.available ? (
                    <>
                      <button
                        className={`px-3 py-2 rounded-lg border-2 flex items-center space-x-2 ${
                          source.status === "Aktiv"
                            ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                            : "border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                        }`}
                        onClick={() => toggleStatus(source.id)}
                      >
                        {source.status === "Aktiv" ? (
                          <>
                            <Pause className="h-4 w-4" />
                            <span className="text-sm font-medium">Aktiv</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span className="text-sm font-medium">Pausiert</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        className="p-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        onClick={() => handleConfigure(source.id, source.name)}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-2 rounded-lg border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Verbindung trennen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bist du sicher, dass du die Verbindung zu "{source.name}" trennen möchtest? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteSource(source.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Verbindung trennen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <div className="px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-500">
                      <span className="text-sm font-medium">Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 4 Metriken in einer Zeile (wie Agent Cards) */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Gesamte Leads</p>
                  <p className={`font-semibold text-lg ${source.available ? "" : "text-gray-400"}`}>
                    {source.gesamteLeads}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Erreichte Leads</p>
                  <p className={`font-semibold text-lg ${source.available ? "" : "text-gray-400"}`}>
                    {source.erreichteLeads}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Gebuchte Termine</p>
                  <p className={`font-semibold text-lg ${source.available ? "" : "text-gray-400"}`}>
                    {source.gebuchteTermine}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Conversion Rate</p>
                  <p className={`font-semibold text-lg ${source.available ? "" : "text-gray-400"}`}>
                    {source.conversionRate}%
                  </p>
                </div>
              </div>
              
              {!source.available && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 italic">
                    Diese Integration ist noch nicht verfügbar. Wir arbeiten daran!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}