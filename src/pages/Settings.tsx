import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Building, CreditCard, Check, Phone, Users, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

// Mock data für Minuten-Pakete basierend auf Plan
const getMinutePackages = (plan: string) => {
  if (plan === "Pro") {
    return [
      { id: "250", minutes: 250, price: "72€", pricePerMinute: "0,29€", popular: false },
      { id: "500", minutes: 500, price: "135€", pricePerMinute: "0,27€", popular: false },
      { id: "1000", minutes: 1000, price: "230€", pricePerMinute: "0,23€", popular: true },
      { id: "2500", minutes: 2500, price: "475€", pricePerMinute: "0,19€", popular: false }
    ];
  } else {
    // Start Plan  
    return [
      { id: "250", minutes: 250, price: "122€", pricePerMinute: "0,49€", popular: false },
      { id: "500", minutes: 500, price: "195€", pricePerMinute: "0,39€", popular: true },
      { id: "1000", minutes: 1000, price: "350€", pricePerMinute: "0,35€", popular: false },
      { id: "2500", minutes: 2500, price: "750€", pricePerMinute: "0,30€", popular: false }
    ];
  }
};

const currentBalance = 127; // Current minute balance
const currentPlan = {
  name: "Pro",
  price: "549€",
  features: ["Bis zu 5 User", "Max 12 aktive Agenten", "1000 Minuten inkludiert"],
  usedMinutes: 247,
  totalMinutes: 1000,
  currentUsers: 3,
  maxUsers: 5,
  currentAgents: 8,
  maxAgents: 12,
  isTestPhase: false // Ändere zu true für "Pläne vergleichen" statt "Plan ändern"
};

// Mock team members
const teamMembers = [
  {
    id: "1",
    name: "Marcus Weber",
    email: "marcus.weber@company.com",
    role: "Admin",
    status: "Aktiv",
    lastActive: "vor 5 Min",
    avatar: "MW",
  },
  {
    id: "2",
    name: "Lisa Müller", 
    email: "lisa.mueller@company.com",
    role: "User",
    status: "Aktiv",
    lastActive: "vor 12 Min",
    avatar: "LM",
  },
  {
    id: "3",
    name: "Thomas Klein",
    email: "thomas.klein@company.com", 
    role: "User",
    status: "Offline",
    lastActive: "vor 2 Std",
    avatar: "TK",
  },
];

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  // Billing functions
  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true);
    console.log('Processing purchase for package:', packageId);
    
    // Simulate Stripe redirect
    setTimeout(() => {
      setIsProcessing(false);
      setShowTopUpDialog(false);
      console.log('Redirecting to Stripe...');
    }, 1000);
  };

  const minutePackages = getMinutePackages(currentPlan.name);

  const MinutePackageCard = ({ pkg }: { pkg: typeof minutePackages[0] }) => (
    <Card className={pkg.popular ? "border-[#FE5B25]" : ""}>
      <CardContent className="p-6">
        {pkg.popular && (
          <Badge className="mb-4 bg-[#FE5B25] text-white">
            Am beliebtesten
          </Badge>
        )}
        <div className="text-center space-y-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{pkg.minutes}</div>
            <div className="text-sm text-gray-500">Minuten</div>
            <div className="text-lg font-semibold text-gray-700 mt-1">{pkg.price}</div>
            <div className="text-xs text-gray-500">{pkg.pricePerMinute}/Min</div>
          </div>
          <button 
            className={buttonStyles.primary.fullWidth}
            onClick={() => handlePurchase(pkg.id)}
            disabled={isProcessing}
          >
            <span>{isProcessing ? "Verarbeitung..." : "Auswählen"}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Einstellungen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deinen Account und Workspace</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
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
              <div className="flex items-center">
                <User className={iconSizes.small} />
                <span className="ml-2">Account</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("workspace")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "workspace"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Building className={iconSizes.small} />
                <span className="ml-2">Workspace</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("billing")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "billing"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <CreditCard className={iconSizes.small} />
                <span className="ml-2">Pläne & Guthaben</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>MW</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Foto ändern</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" defaultValue="Marcus" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" defaultValue="Weber" />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" type="email" defaultValue="marcus.weber@company.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" defaultValue="+49 151 12345678" />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button className={buttonStyles.create.default}>
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Firmen-Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Firmenname</Label>
                  <Input id="companyName" defaultValue="Mein Unternehmen GmbH" />
                </div>
                <div>
                  <Label htmlFor="taxId">Steuernummer</Label>
                  <Input id="taxId" defaultValue="DE123456789" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Firmen-Adresse</Label>
                  <Textarea id="address" defaultValue="Musterstraße 123&#10;12345 Musterstadt&#10;Deutschland" rows={3} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Diese Informationen werden für die Stripe-Rechnungsstellung verwendet.
              </p>
              
              <div className="flex justify-end pt-4">
                <button className={buttonStyles.create.default}>
                  <span>Firmen-Daten speichern</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>E-Mail Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="flex items-center justify-between">
                <div>
                  <Label>E-Mail Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">Erhalte Updates per E-Mail</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Workspace-Einladungen</Label>
                  <p className="text-sm text-gray-500">Benachrichtigung bei neuen Workspace-Einladungen</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Tab - NUR Team Mitglieder */}
        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Workspace Informationen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input id="workspaceName" defaultValue="Mein Unternehmen" />
              </div>
              
              <div className="flex justify-end pt-4">
                <button className={buttonStyles.create.default}>
                  <span>Workspace speichern</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={textStyles.sectionTitle}>Team Mitglieder</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentPlan.currentUsers} / {currentPlan.maxUsers} User verwendet
                  </p>
                </div>
                <button className={buttonStyles.create.default}>
                  <Plus className={iconSizes.small} />
                  <span>Mitglied einladen</span>
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">{member.role}</Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.status}</p>
                        <p className="text-xs text-gray-500">{member.lastActive}</p>
                      </div>
                      <button className={buttonStyles.cardAction.iconDelete}>
                        <Trash2 className={iconSizes.small} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pläne & Guthaben Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Aktueller Plan & Verfügbare Minuten - NEBENEINANDER */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Aktueller Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={textStyles.sectionTitle}>Aktueller Plan</CardTitle>
                  <button 
                    className={buttonStyles.primary.default}
                    onClick={() => window.location.href = '/dashboard/plans'}
                  >
                    <SettingsIcon className={iconSizes.small} />
                    <span>{currentPlan.isTestPhase ? "Pläne vergleichen" : "Plan ändern"}</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={buttonStyles.info.panel}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={textStyles.cardTitle}>{currentPlan.name} Plan</h3>
                      <p className={textStyles.cardSubtitle}>{currentPlan.price} pro Monat</p>
                    </div>
                    <Badge className="bg-[#FE5B25] text-white">Aktiv</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Verbrauchte Minuten</span>
                      <span>{currentPlan.usedMinutes} / {currentPlan.totalMinutes}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#FE5B25] h-2 rounded-full" 
                        style={{ width: `${(currentPlan.usedMinutes / currentPlan.totalMinutes) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verfügbare Minuten */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={textStyles.sectionTitle}>Verfügbare Minuten</CardTitle>
                  <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
                    <DialogTrigger asChild>
                      <button className={buttonStyles.primary.default}>
                        <CreditCard className={iconSizes.small} />
                        <span>Guthaben aufladen</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Minuten aufladen</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {minutePackages.map((pkg) => (
                          <MinutePackageCard key={pkg.id} pkg={pkg} />
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-gray-900">{currentBalance}</div>
                  <p className="text-gray-600">Verfügbare Minuten</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}