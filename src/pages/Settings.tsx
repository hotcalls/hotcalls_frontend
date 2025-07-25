import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, Building, Plus, Settings as SettingsIcon, CreditCard, Check, Phone } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

const teamMembers = [
  {
    id: "1",
    name: "Marcus Weber",
    email: "marcus.weber@company.com",
    role: "Sales Manager",
    status: "Aktiv",
    lastActive: "vor 5 Min",
    avatar: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Lisa Müller", 
    email: "lisa.mueller@company.com",
    role: "Sales Representative",
    status: "Aktiv",
    lastActive: "vor 12 Min",
    avatar: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Thomas Klein",
    email: "thomas.klein@company.com", 
    role: "Sales Representative",
    status: "Offline",
    lastActive: "vor 2 Std",
    avatar: "/placeholder.svg",
  },
];

// Billing data
const currentBalance = {
  amount: 47.50,
  currency: "EUR"
};

const creditPackages = [
  {
    id: "package_25",
    amount: 25,
    currency: "EUR",
    bonusMinutes: 0,
    popular: false
  },
  {
    id: "package_100", 
    amount: 100,
    currency: "EUR",
    bonusMinutes: 50, // 5% bonus
    popular: true
  },
  {
    id: "package_500",
    amount: 500,
    currency: "EUR", 
    bonusMinutes: 375, // 15% bonus
    popular: false
  },
  {
    id: "package_1000",
    amount: 1000,
    currency: "EUR",
    bonusMinutes: 1000, // 20% bonus  
    popular: false
  }
];

export default function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Get tab from URL parameter, default to "account"
  const initialTab = searchParams.get('tab') || 'account';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsProcessing(true);
    
    try {
      // TODO: Integrate with Stripe
      console.log('Redirecting to Stripe for package:', packageId);
      
      // Simulate successful payment after 2 seconds
      setTimeout(() => {
        setIsProcessing(false);
        alert('Zahlung erfolgreich! Guthaben wurde aufgeladen.');
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
    }
  };

  const PackageCard = ({ pkg }: { pkg: typeof creditPackages[0] }) => {
    const totalMinutes = pkg.amount + pkg.bonusMinutes;
    
    return (
      <Card className={`transition-all hover:shadow-md ${pkg.popular ? 'relative' : ''}`}>
        {pkg.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">Beliebt</Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl font-bold">
            {pkg.amount}€
          </CardTitle>
          {pkg.bonusMinutes > 0 && (
            <p className="text-sm text-muted-foreground">
              + {pkg.bonusMinutes} Bonus-Minuten
            </p>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {totalMinutes} Gesprächsminuten
            </p>
            {pkg.bonusMinutes > 0 && (
              <p className="text-sm text-green-600 font-medium">
                {Math.round((pkg.bonusMinutes / pkg.amount) * 100)}% Bonus!
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {(pkg.amount / totalMinutes).toFixed(2)}€ pro Minute
          </div>
          
          <button 
            className="w-full px-3 py-2 rounded-md border border-orange-500 bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center"
            onClick={() => handlePurchase(pkg.id)}
            disabled={isProcessing}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessing && selectedPackage === pkg.id ? 'Wird verarbeitet...' : 'Auswählen'}
          </button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Einstellungen</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mitglieder
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Guthaben
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Pläne
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Informationen</CardTitle>
              <p className="text-sm text-muted-foreground">
                Verwalte deine persönlichen Account-Einstellungen
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">Avatar ändern</Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG oder PNG. Max 1MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail Adresse</Label>
                <Input id="email" type="email" defaultValue="john.doe@company.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input id="phone" defaultValue="+49 151 12345678" />
              </div>

              <Button>Änderungen speichern</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sicherheit</CardTitle>
              <p className="text-sm text-muted-foreground">
                Passwort und Sicherheitseinstellungen
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Passwort ändern</Button>
              <Button variant="outline">Zwei-Faktor-Authentifizierung</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Mitglieder</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Verwalte die Mitglieder deines Teams
                  </p>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Mitglied einladen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">{member.role}</Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.status}</p>
                        <p className="text-xs text-muted-foreground">{member.lastActive}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Konfiguration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Allgemeine Einstellungen für diesen Workspace
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input id="workspaceName" defaultValue="Acme Corp" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspaceUrl">Workspace URL</Label>
                <Input id="workspaceUrl" defaultValue="acme-corp" />
                <p className="text-sm text-muted-foreground">
                  hotcalls.com/acme-corp
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>

              <Button>Workspace speichern</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing & Abrechnung</CardTitle>
              <p className="text-sm text-muted-foreground">
                Verwalte dein Abonnement und Rechnungen
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">
                    €99/Monat • Nächste Abrechnung: 15. Feb 2024
                  </p>
                </div>
                <Button variant="outline">Plan verwalten</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuelles Guthaben</CardTitle>
              <p className="text-sm text-muted-foreground">
                Verwalten Sie Ihr Gesprächsminuten-Guthaben
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {currentBalance.amount.toFixed(2)}€
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verfügbares Guthaben
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ~{Math.floor(currentBalance.amount)} Minuten
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bei 1€/Minute
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Guthaben-Pakete</CardTitle>
              <p className="text-sm text-muted-foreground">
                Wählen Sie ein Paket aus und laden Sie Ihr Guthaben auf
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {creditPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
                         </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="plans" className="space-y-6">
           {/* Pricing Header */}
           <div className="text-center space-y-4">
             <h3 className="text-2xl font-bold">Wähle deinen Plan, um loszulegen!</h3>
           </div>

           {/* Plan Cards */}
           <div className="flex justify-center">
             <div className="grid gap-6 md:grid-cols-3 max-w-5xl w-full">
               {/* Starter Plan */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-2xl font-bold mb-2">Start</CardTitle>
                   <p className="text-sm text-gray-600 mb-4">Ideal für Einzelpersonen und kleine Teams, die sofort mit KI-Anrufen starten wollen.</p>
                   <div>
                     <span className="text-4xl font-bold">199€</span>
                     <span className="text-gray-600"> /Monat</span>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3 text-sm">
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Inkl. 250 Minuten, dann 0,49€/Min.</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Unlimitierte Anzahl an Agenten</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Automatisierte KI-Telefonate</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Anbindung von Leadfunnels</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Kalenderintegration</span>
                     </div>
                   </div>
                   <div className="pt-6 space-y-3">
                     <p className="text-xs text-gray-500">
                       Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
                     </p>
                     <button className="w-full px-4 py-3 rounded-md border border-orange-500 bg-white text-orange-600 font-medium hover:bg-orange-50 transition-colors">
                       14 Tage kostenlos testen
                     </button>
                   </div>
                 </CardContent>
               </Card>

               {/* Pro Plan */}
               <Card className="border-2 border-orange-500 bg-orange-50">
                 <CardHeader>
                   <div className="flex items-center justify-between mb-2">
                     <CardTitle className="text-2xl font-bold text-orange-600">Pro</CardTitle>
                     <Badge className="bg-orange-500 text-white px-3 py-1">Am beliebtesten</Badge>
                   </div>
                   <p className="text-sm text-gray-600 mb-4">Ideal für Unternehmen, die mehr Minuten, Integrationen und persönliches Onboarding benötigen.</p>
                   <div>
                     <span className="text-4xl font-bold text-orange-600">549€</span>
                     <span className="text-gray-600"> /Monat</span>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <p className="font-medium text-sm">Alle Start-Features plus:</p>
                   <div className="space-y-3 text-sm">
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Inkl. 1000 Minuten, dann 0,29€/Min.</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>CSV-Upload</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>CRM Integration</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Persönliches Onboarding</span>
                     </div>
                   </div>
                   <div className="pt-6 space-y-3">
                     <p className="text-xs text-gray-500">
                       Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
                     </p>
                     <button className="w-full px-4 py-3 rounded-md bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors">
                       14 Tage kostenlos testen
                     </button>
                   </div>
                 </CardContent>
               </Card>

               {/* Scale Plan */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-2xl font-bold mb-2">Scale</CardTitle>
                   <p className="text-sm text-gray-600 mb-4">Ideal für Unternehmen mit spezifischen Anforderungen und hohem Volumen.</p>
                   <div>
                     <span className="text-4xl font-bold">ab 1.490€</span>
                     <span className="text-gray-600"> /Monat</span>
                     <div className="text-sm text-gray-500 mt-1">+ Setupfee</div>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <p className="font-medium text-sm">Alle Pro-Features plus:</p>
                   <div className="space-y-3 text-sm">
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Individuelle Minutenpreise</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Individuelle Integrationen & Funktionen</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                       <span>Priorisierter Support</span>
                     </div>
                   </div>
                   <div className="pt-6 space-y-3">
                     <p className="text-xs text-gray-500">
                       Jederzeit kündbar. Wir erinnern dich rechtzeitig vor Ablauf der Testphase.
                     </p>
                     <button className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                       <Phone className="h-4 w-4 mr-2" />
                       Gespräch vereinbaren
                     </button>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>

           {/* Compare Plans Button */}
           <div className="text-center py-6">
             <Button 
               variant="outline" 
               onClick={() => setShowComparison(!showComparison)}
               className="text-orange-600 border-orange-500 hover:bg-orange-50"
             >
               {showComparison ? 'Vergleich ausblenden' : 'Pläne vergleichen'}
             </Button>
           </div>

                      {/* Detailed Comparison Table */}
           {showComparison && (
             <Card>
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead>
                       <tr className="border-b">
                         <th className="text-left p-4 font-medium">Feature</th>
                         <th className="text-center p-4 font-medium">Starter</th>
                         <th className="text-center p-4 font-medium bg-orange-50">Pro</th>
                         <th className="text-center p-4 font-medium">Scale</th>
                       </tr>
                     </thead>
                                             <tbody>
                          {/* Preismodelle */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Preismodelle</td>
                          </tr>
                       <tr className="border-b">
                         <td className="p-4">Monatliche Gebühr</td>
                         <td className="text-center p-4">199€</td>
                         <td className="text-center p-4 bg-orange-50">549€</td>
                         <td className="text-center p-4">ab 1490€</td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Inkludierte Minuten pro Monat</td>
                         <td className="text-center p-4">250</td>
                         <td className="text-center p-4 bg-orange-50">1000</td>
                         <td className="text-center p-4">Individuell</td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Extra Minuten</td>
                         <td className="text-center p-4">0,49€/Min.</td>
                         <td className="text-center p-4 bg-orange-50">0,29€/Min.</td>
                         <td className="text-center p-4">Individuell</td>
                       </tr>

                                                 {/* KI-Agenten & Logik */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>KI-Agenten & Logik</td>
                          </tr>
                       <tr className="border-b">
                         <td className="p-4">Sofortanruf bei neuen Leads</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Verhalten des Agenten anpassbar</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Terminbuchung mit Lead</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Smarte Anruflogik</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Versand von Unterlagen</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Mehrsprachigkeit (10+ Sprachen)</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>

                                                 {/* Appfunktionen */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Appfunktionen</td>
                          </tr>
                       <tr className="border-b">
                         <td className="p-4">Unbegrenzte Anzahl an Agenten</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Anrufhistorie einsehen</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Analytics & Gesprächsauswertung</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Wissensdatenbank</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Eigene Telefonnummer</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Zusätzliche Telefonnummer</td>
                         <td className="text-center p-4">5€/Monat</td>
                         <td className="text-center p-4 bg-orange-50">5€/Monat</td>
                         <td className="text-center p-4">5€/Monat</td>
                       </tr>

                                                 {/* Integrationen */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Integrationen</td>
                          </tr>
                       <tr className="border-b">
                         <td className="p-4">Kalenderanbindung</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Anbindung von Lead-Funnels</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">CSV Upload</td>
                         <td className="text-center p-4">—</td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Individuelle Systemanbindungen</td>
                         <td className="text-center p-4">—</td>
                         <td className="text-center p-4 bg-orange-50">Auf Anfrage</td>
                         <td className="text-center p-4">Auf Anfrage</td>
                       </tr>

                                                 {/* Service & Support */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Service & Support</td>
                          </tr>
                       <tr className="border-b">
                         <td className="p-4">Chat-Support</td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Onboarding</td>
                         <td className="text-center p-4">Eigenständig</td>
                         <td className="text-center p-4 bg-orange-50">Erste 30 Tage</td>
                         <td className="text-center p-4">Inbegriffen</td>
                       </tr>
                       <tr className="border-b">
                         <td className="p-4">Unterstützung bei Agentenkonfiguration</td>
                         <td className="text-center p-4">—</td>
                         <td className="text-center p-4 bg-orange-50"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                         <td className="text-center p-4"><Check className="h-4 w-4 text-orange-500 mx-auto" /></td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </CardContent>
             </Card>
           )}

           <p className="text-center text-sm text-gray-500">
             Alle Preise zzgl. MwSt.
           </p>
         </TabsContent>
       </Tabs>
     </div>
   );
 }