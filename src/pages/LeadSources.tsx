import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Facebook, Globe, Linkedin, Webhook, Settings, Trash2, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

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
      navigate(`/lead-sources/meta/config`);
    } else if (name === "Website Webhook") {
      navigate(`/lead-sources/webhook/config`);
    }
  };

  const handleAddLeadSource = (type: string) => {
    if (type === "Meta") {
      navigate(`/lead-sources/meta/config`);
    } else if (type === "Webhook") {
      navigate(`/lead-sources/webhook/config`);
    }
    setIsAddDialogOpen(false);
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Lead Quellen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deine Lead-Kanäle und Integrationen</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className={buttonStyles.create.default}>
              <Plus className={iconSizes.small} />
              <span>Lead Quelle hinzufügen</span>
            </button>
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
                className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#FFE1D7]">
                  <Facebook className={`${iconSizes.large} text-blue-600 group-hover:text-[#FE5B25]`} />
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
                className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:bg-[#FEF5F1] hover:border-gray-300 transition-all group"
              >
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#FFE1D7]">
                  <Webhook className={`${iconSizes.large} text-gray-600 group-hover:text-[#FE5B25]`} />
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
                  <Linkedin className={`${iconSizes.large} text-gray-400`} />
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
                  <Globe className={`${iconSizes.large} text-gray-400`} />
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

      {/* Lead Sources Grid - EINHEITLICH */}
      <div className={layoutStyles.cardGrid}>
        {sources.map((source) => (
          <Card key={source.id} className={source.available ? "" : "opacity-60"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${source.available ? "bg-[#FFE1D7]" : "bg-gray-100"}`}>
                    <source.icon className={`${iconSizes.large} ${source.available ? "text-[#FE5B25]" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <CardTitle className={`${textStyles.cardTitle} ${source.available ? "" : "text-gray-500"}`}>
                      {source.name}
                    </CardTitle>
                    <p className={textStyles.cardSubtitle}>{source.type}</p>
                  </div>
                </div>
                
                {/* Buttons - EINHEITLICH */}
                <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                  {source.available ? (
                    <>
                      <button
                        className={source.status === "Aktiv" ? buttonStyles.cardAction.statusActive : buttonStyles.cardAction.statusPaused}
                        onClick={() => toggleStatus(source.id)}
                      >
                        {source.status === "Aktiv" ? (
                          <>
                            <Pause className={iconSizes.small} />
                            <span>Aktiv</span>
                          </>
                        ) : (
                          <>
                            <Play className={iconSizes.small} />
                            <span>Pausiert</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        className={buttonStyles.cardAction.icon}
                        onClick={() => handleConfigure(source.id, source.name)}
                      >
                        <Settings className={iconSizes.small} />
                      </button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className={buttonStyles.cardAction.iconDelete}>
                            <Trash2 className={iconSizes.small} />
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
                            <AlertDialogCancel className={buttonStyles.dialog.cancel}>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteSource(source.id)}
                              className={buttonStyles.dialog.destructive}
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
            
            <CardContent className={layoutStyles.cardContent}>
              {/* 4 Metriken in einer Zeile - EINHEITLICH */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className={textStyles.metricLabel}>Gesamte Leads</p>
                  <p className={`${textStyles.metric} ${source.available ? "" : "text-gray-400"}`}>
                    {source.gesamteLeads}
                  </p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Erreichte Leads</p>
                  <p className={`${textStyles.metric} ${source.available ? "" : "text-gray-400"}`}>
                    {source.erreichteLeads}
                  </p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Gebuchte Termine</p>
                  <p className={`${textStyles.metric} ${source.available ? "" : "text-gray-400"}`}>
                    {source.gebuchteTermine}
                  </p>
                </div>
                <div>
                  <p className={textStyles.metricLabel}>Conversion Rate</p>
                  <p className={`${textStyles.metric} ${source.available ? "" : "text-gray-400"}`}>
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