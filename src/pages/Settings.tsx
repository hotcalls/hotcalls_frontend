import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, Building, Plus, Settings as SettingsIcon } from "lucide-react";

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

export default function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Einstellungen</h2>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
      </Tabs>
    </div>
  );
}