import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Settings, 
  ExternalLink, 
  Clock, 
  Copy,
  Edit,
  Trash2,
  Check,
  ArrowLeft,
  ChevronRight,
  Play,
  Pause
} from "lucide-react";

// Mock data for connected calendars
const connectedCalendars = [
  {
    id: "main",
    name: "Marcus Weber (Haupt)",
    email: "marcus.weber@company.com",
    provider: "Google Calendar",
    isConnected: true,
    isDefault: true,
    eventTypesCount: 3,
    totalBookings: 47,
    bookingsThisWeek: 12,
    subCalendars: [
      { id: "work", name: "Arbeit", color: "#1a73e8" },
      { id: "personal", name: "Privat", color: "#0d7377" },
      { id: "meetings", name: "Meetings", color: "#8e24aa" }
    ]
  },
  {
    id: "team",
    name: "Team Calendar",
    email: "team@company.com", 
    provider: "Google Calendar",
    isConnected: true,
    isDefault: false,
    eventTypesCount: 1,
    totalBookings: 23,
    bookingsThisWeek: 8,
    subCalendars: [
      { id: "team-general", name: "Team Allgemein", color: "#f4511e" }
    ]
  },
  {
    id: "lisa",
    name: "Lisa Müller",
    email: "lisa.mueller@company.com", 
    provider: "Google Calendar",
    isConnected: false,
    isDefault: false,
    eventTypesCount: 0,
    totalBookings: 0,
    bookingsThisWeek: 0,
    subCalendars: []
  }
];

// Mock data for event types by calendar
const eventTypesByCalendar = {
  main: [
    {
      id: "1",
      title: "Beratungsgespräch",
      slug: "beratungsgespraech",
      duration: 30,
      color: "#1a73e8",
      description: "Erstes Beratungsgespräch für potenzielle Kunden",
      bookingBuffer: 60,
      isActive: true,
      bookingsThisWeek: 12,
      totalBookings: 47
    },
    {
      id: "2",
      title: "Demo Call",
      slug: "demo-call",
      duration: 45,
      color: "#0d7377",
      description: "Produktdemonstration",
      bookingBuffer: 120,
      isActive: true,
      bookingsThisWeek: 8,
      totalBookings: 23
    },
    {
      id: "3",
      title: "Follow-up Gespräch",
      slug: "follow-up",
      duration: 20,
      color: "#8e24aa",
      description: "Nachfassgespräch mit bestehenden Interessenten",
      bookingBuffer: 30,
      isActive: false,
      bookingsThisWeek: 0,
      totalBookings: 12
    }
  ],
  team: [
    {
      id: "4",
      title: "Team Meeting",
      slug: "team-meeting",
      duration: 60,
      color: "#f4511e",
      description: "Wöchentliches Team Meeting",
      bookingBuffer: 0,
      isActive: true,
      bookingsThisWeek: 1,
      totalBookings: 15
    }
  ],
  lisa: []
};

export default function Calendar() {
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<typeof eventTypesByCalendar.main[0] | null>(null);

  const selectedCalendarData = selectedCalendar 
    ? connectedCalendars.find(cal => cal.id === selectedCalendar)
    : null;

  const CalendarOverviewCard = ({ calendar }: { calendar: typeof connectedCalendars[0] }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCalendar(calendar.id)}>
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
            {calendar.isConnected ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); }}>
                Verbinden
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Event-Types</p>
            <p className="font-semibold text-lg">{calendar.eventTypesCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Diese Woche</p>
            <p className="font-semibold text-lg">{calendar.bookingsThisWeek}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gesamt</p>
            <p className="font-semibold text-lg">{calendar.totalBookings}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EventTypeCard = ({ eventType }: { eventType: typeof eventTypesByCalendar.main[0] }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{eventType.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {eventType.duration} Min • {eventType.bookingBuffer} Min Vorlauf
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className={`px-3 py-2 rounded-lg border-2 flex items-center space-x-2 ${
                eventType.isActive 
                  ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100" 
                  : "border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
              }`}
            >
              {eventType.isActive ? (
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
              onClick={() => setEditingEventType(eventType)}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              className="p-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              onClick={() => {
                if (confirm(`Event-Type "${eventType.title}" wirklich löschen?`)) {
                  console.log('Delete event type:', eventType.title);
                  // Delete logic would go here
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Beschreibung</p>
          <p className="text-sm">{eventType.description}</p>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Dauer</p>
            <p className="font-semibold text-lg">{eventType.duration} Min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vorlaufzeit</p>
            <p className="font-semibold text-lg">{eventType.bookingBuffer} Min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Diese Woche</p>
            <p className="font-semibold text-lg">{eventType.bookingsThisWeek}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gesamt</p>
            <p className="font-semibold text-lg">{eventType.totalBookings}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EventTypeDialog = ({ isEdit = false }: { isEdit?: boolean }) => {
    const eventTypeToEdit = isEdit ? editingEventType : null;
    const [formData, setFormData] = useState({
      title: eventTypeToEdit?.title || "",
      duration: eventTypeToEdit?.duration || 30,
      description: eventTypeToEdit?.description || "",
      bookingBuffer: eventTypeToEdit?.bookingBuffer || 60
    });

    // Reset form data when dialog opens/closes or when editing different event type
    useEffect(() => {
      if (isEdit && editingEventType) {
        setFormData({
          title: editingEventType.title,
          duration: editingEventType.duration,
          description: editingEventType.description,
          bookingBuffer: editingEventType.bookingBuffer
        });
      } else if (!isEdit) {
        setFormData({
          title: "",
          duration: 30,
          description: "",
          bookingBuffer: 60
        });
      }
    }, [isEdit, editingEventType]);

    const generateSlug = (title: string) => {
      return title.toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe') 
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    const handleClose = () => {
      if (isEdit) {
        setEditingEventType(null);
      } else {
        setIsCreateEventDialogOpen(false);
      }
    };

    const handleSave = () => {
      console.log(isEdit ? 'Update event type:' : 'Create event type:', formData);
      handleClose();
    };

    return (
      <Dialog 
        open={isEdit ? !!editingEventType : isCreateEventDialogOpen} 
        onOpenChange={handleClose}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Event-Type "${eventTypeToEdit?.title}" bearbeiten` : `Neuen Event-Type für ${selectedCalendarData?.name} erstellen`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event-Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData({ 
                    ...formData, 
                    title
                  });
                }}
                placeholder="z.B. Beratungsgespräch"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kurze Beschreibung des Termins"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Dauer (Minuten)</Label>
                <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Min</SelectItem>
                    <SelectItem value="30">30 Min</SelectItem>
                    <SelectItem value="45">45 Min</SelectItem>
                    <SelectItem value="60">60 Min</SelectItem>
                    <SelectItem value="90">90 Min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buffer">Vorlaufzeit (Minuten)</Label>
                <Select value={formData.bookingBuffer.toString()} onValueChange={(value) => setFormData({ ...formData, bookingBuffer: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Keine</SelectItem>
                    <SelectItem value="30">30 Min</SelectItem>
                    <SelectItem value="60">1 Stunde</SelectItem>
                    <SelectItem value="120">2 Stunden</SelectItem>
                    <SelectItem value="1440">1 Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Verfügbarkeiten</Label>
              <div className="space-y-3">
                {Object.entries({
                  monday: "Montag",
                  tuesday: "Dienstag", 
                  wednesday: "Mittwoch",
                  thursday: "Donnerstag",
                  friday: "Freitag",
                  saturday: "Samstag",
                  sunday: "Sonntag"
                }).map(([day, label]) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Switch defaultChecked={day !== 'saturday' && day !== 'sunday'} />
                      <span className="text-sm font-medium w-20">{label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="time" 
                        defaultValue="09:00"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">bis</span>
                      <Input 
                        type="time" 
                        defaultValue="17:00"
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {isEdit ? 'Änderungen speichern' : 'Event-Type erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Calendar Overview (Default View)
  if (!selectedCalendar) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Kalender-Management</h2>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre verbundenen Kalender und Event-Types
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Google Calendar verbinden
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connectedCalendars.map((calendar) => (
            <CalendarOverviewCard key={calendar.id} calendar={calendar} />
          ))}
        </div>
      </div>
    );
  }

  // Event Types View for Selected Calendar
  const eventTypes = eventTypesByCalendar[selectedCalendar as keyof typeof eventTypesByCalendar] || [];
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSelectedCalendar(null)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zu Kalendern</span>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{selectedCalendarData?.name}</h2>
            <p className="text-muted-foreground">
              Event-Types für diesen Kalender verwalten
            </p>
          </div>
          
          <Button onClick={() => setIsCreateEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Event-Type erstellen
          </Button>
        </div>
      </div>

      {eventTypes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {eventTypes.map((eventType) => (
            <EventTypeCard key={eventType.id} eventType={eventType} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Noch keine Event-Types</h3>
              <p className="text-muted-foreground">
                Erstellen Sie Ihren ersten Event-Type für {selectedCalendarData?.name}
              </p>
            </div>
            <Button onClick={() => setIsCreateEventDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Event-Type erstellen
            </Button>
          </div>
        </Card>
             )}
       
       <EventTypeDialog isEdit={false} />
       <EventTypeDialog isEdit={true} />
     </div>
   );
 }