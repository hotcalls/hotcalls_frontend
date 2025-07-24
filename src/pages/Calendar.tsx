import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Settings, ExternalLink } from "lucide-react";

const calendars = [
  {
    id: "1",
    name: "Marcus Weber",
    email: "marcus.weber@company.com",
    type: "Google Calendar",
    status: "Verbunden",
    appointmentsToday: 8,
    appointmentsThisWeek: 34,
    availability: "Mo-Fr 9:00-17:00",
    statusColor: "bg-success",
    timezone: "Europe/Berlin",
  },
  {
    id: "2", 
    name: "Lisa Müller",
    email: "lisa.mueller@company.com",
    type: "Outlook Calendar",
    status: "Verbunden",
    appointmentsToday: 6,
    appointmentsThisWeek: 28,
    availability: "Mo-Fr 8:00-16:00",
    statusColor: "bg-success",
    timezone: "Europe/Berlin",
  },
  {
    id: "3",
    name: "Thomas Klein", 
    email: "thomas.klein@company.com",
    type: "Google Calendar",
    status: "Fehler",
    appointmentsToday: 0,
    appointmentsThisWeek: 12,
    availability: "Mo-Do 10:00-18:00",
    statusColor: "bg-destructive",
    timezone: "Europe/Berlin",
  },
];

const upcomingAppointments = [
  {
    id: "1",
    title: "Beratungsgespräch mit Max Mustermann",
    time: "14:00 - 14:30",
    calendar: "Marcus Weber",
    type: "KI-Agent Termin",
    status: "Bestätigt",
    statusColor: "bg-success",
  },
  {
    id: "2",
    title: "Demo Call mit Anna Schmidt", 
    time: "15:30 - 16:00",
    calendar: "Lisa Müller",
    type: "KI-Agent Termin",
    status: "Ausstehend",
    statusColor: "bg-warning",
  },
  {
    id: "3",
    title: "Follow-up Thomas Weber",
    time: "16:30 - 17:00", 
    calendar: "Marcus Weber",
    type: "KI-Agent Termin",
    status: "Bestätigt",
    statusColor: "bg-success",
  },
];

export default function Calendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">
            Verwalte Mitarbeiterkalender und Terminbuchungen
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Kalender hinzufügen
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {calendars.map((calendar) => (
          <Card key={calendar.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{calendar.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{calendar.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${calendar.statusColor}`}></div>
                  <span className="text-xs font-medium">{calendar.status}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Badge variant="outline">{calendar.type}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Heute</p>
                  <p className="font-semibold text-lg">{calendar.appointmentsToday}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diese Woche</p>
                  <p className="font-semibold text-lg">{calendar.appointmentsThisWeek}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Verfügbarkeit</p>
                  <p className="text-sm">{calendar.availability}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Zeitzone</p>
                  <p className="text-sm">{calendar.timezone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  <Settings className="mr-2 h-3 w-3" />
                  Konfiguration
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Öffnen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Heutige Termine</CardTitle>
          <p className="text-sm text-muted-foreground">
            Von KI-Agenten vereinbarte Termine für heute
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${appointment.statusColor}`}></div>
                  <div>
                    <p className="font-medium">{appointment.title}</p>
                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{appointment.calendar}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{appointment.status}</p>
                    <p className="text-xs text-muted-foreground">{appointment.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}