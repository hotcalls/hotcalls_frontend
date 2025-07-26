import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Bot, Target, Calendar, ArrowRight, Play, Phone, Sparkles } from "lucide-react";
import { buttonStyles, textStyles } from "@/lib/buttonStyles";

const WelcomeComplete = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewAgent = () => {
    navigate("/dashboard/agents");
  };

  const completedSteps = [
    {
      icon: Bot,
      title: "KI-Agent erstellt",
      description: "Sarah ist bereit für erste Gespräche mit Ihrer persönlichen Stimme und Begrüßung",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Target,
      title: "Lead-Quellen konfiguriert",
      description: "Automatischer Import aus Facebook Ads, Website-Formularen und anderen Quellen",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Calendar,
      title: "Event-Types eingerichtet",
      description: "Beratungsgespräche und Demo Calls werden automatisch gebucht",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  const nextSteps = [
    {
      step: "1",
      title: "Agent testen",
      description: "Führen Sie einen Testanruf durch, um die Konfiguration zu überprüfen",
      action: "Jetzt testen"
    },
    {
      step: "2", 
      title: "Live gehen",
      description: "Aktivieren Sie Ihren Agent für echte Leads und Anrufe",
      action: "Aktivieren"
    },
    {
      step: "3",
      title: "Performance überwachen",
      description: "Behalten Sie Erfolgsraten und Gesprächsqualität im Dashboard im Blick",
      action: "Dashboard öffnen"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Phone className="h-8 w-8 text-[#FE5B25]" />
            <span className="text-2xl font-bold text-gray-900">hotcalls.ai</span>
          </div>
          
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-green-600">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 Perfekt!</h1>
          <p className="text-xl text-gray-600 mb-2">
            Ihr KI-Agent ist einsatzbereit
          </p>
          <p className="text-lg text-gray-500">
            Setup abgeschlossen in nur 3 einfachen Schritten
          </p>
        </div>

        {/* Completed steps summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className={textStyles.sectionTitle}>Was wurde eingerichtet</CardTitle>
            <CardDescription>
              Ihr Agent ist vollständig konfiguriert und bereit für den Einsatz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className={`flex items-center gap-4 p-4 rounded-lg border ${step.color}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${step.bgColor}`}>
                    <Icon className={`h-6 w-6 ${step.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Next steps */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className={textStyles.sectionTitle}>Nächste Schritte</CardTitle>
            <CardDescription>
              So starten Sie erfolgreich mit Ihrem neuen KI-Agenten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FE5B25] text-white text-sm font-bold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  {step.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleGoToDashboard} 
            className={`${buttonStyles.create.default} flex-1 py-4 text-lg`}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Zum Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={handleViewAgent} 
            className="flex-1 py-4 text-lg border-2"
          >
            <Play className="mr-2 h-5 w-5" />
            Agent testen
          </Button>
        </div>

        {/* Help section */}
        <div className="text-center text-gray-500 py-6 border-t">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Benötigen Sie Hilfe?</span>
          </div>
          <p className="text-sm">
            Besuchen Sie unser{" "}
            <a href="#" className="text-[#FE5B25] hover:underline font-medium">
              Help Center
            </a>{" "}
            oder kontaktieren Sie den{" "}
            <a href="#" className="text-[#FE5B25] hover:underline font-medium">
              Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeComplete; 