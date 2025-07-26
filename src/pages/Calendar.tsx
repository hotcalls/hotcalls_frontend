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
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";

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
    totalBookings: 15,
    bookingsThisWeek: 3,
    subCalendars: []
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

  const [formData, setFormData] = useState({
    title: "",
    duration: 30,
    description: "",
    bookingBuffer: 60,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      duration: 30,
      description: "",
      bookingBuffer: 60,
    });
    setEditingEventType(null);
  };

  const handleClose = () => {
    setIsCreateEventDialogOpen(false);
    resetForm();
  };

  const handleSave = () => {
    console.log('Saving event type:', formData);
    handleClose();
  };

  const isEdit = !!editingEventType;

  useEffect(() => {
    if (editingEventType) {
      setFormData({
        title: editingEventType.title,
        duration: editingEventType.duration,
        description: editingEventType.description,
        bookingBuffer: editingEventType.bookingBuffer,
      });
      setIsCreateEventDialogOpen(true);
    }
  }, [editingEventType]);

  const EventTypeCard = ({ eventType }: { eventType: typeof eventTypesByCalendar.main[0] }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FFE1D7] rounded-lg">
              <Clock className={`${iconSizes.large} text-[#FE5B25]`} />
            </div>
            <div>
              <CardTitle className={textStyles.cardTitle}>{eventType.title}</CardTitle>
              <p className={textStyles.cardSubtitle}>
                {eventType.duration} Min • {eventType.bookingBuffer} Min Vorlauf
              </p>
            </div>
          </div>
          <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
            <button 
              className={eventType.isActive ? buttonStyles.cardAction.statusActive : buttonStyles.cardAction.statusPaused}
            >
              {eventType.isActive ? (
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
              onClick={() => setEditingEventType(eventType)}
            >
              <Edit className={iconSizes.small} />
            </button>
            <button 
              className={buttonStyles.cardAction.iconDelete}
              onClick={() => {
                if (confirm(`Event-Type "${eventType.title}" wirklich löschen?`)) {
                  console.log('Delete event type:', eventType.title);
                }
              }}
            >
              <Trash2 className={iconSizes.small} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={layoutStyles.cardContent}>
        <div className="text-sm">
          <p className="text-gray-500">Beschreibung</p>
          <p className="text-sm">{eventType.description}</p>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className={textStyles.metricLabel}>Dauer</p>
            <p className={textStyles.metric}>{eventType.duration} Min</p>
          </div>
          <div>
            <p className={textStyles.metricLabel}>Vorlaufzeit</p>
            <p className={textStyles.metric}>{eventType.bookingBuffer} Min</p>
          </div>
          <div>
            <p className={textStyles.metricLabel}>Diese Woche</p>
            <p className={textStyles.metric}>{eventType.bookingsThisWeek}</p>
          </div>
          <div>
            <p className={textStyles.metricLabel}>Gesamt</p>
            <p className={textStyles.metric}>{eventType.totalBookings}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CalendarOverviewCard = ({ calendar }: { calendar: typeof connectedCalendars[0] }) => (
    <Card className={calendar.isConnected ? "" : "opacity-50"} onClick={() => setSelectedCalendar(calendar.id)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${calendar.isConnected ? "bg-[#FFE1D7]" : "bg-gray-100"}`}>
              <CalendarIcon className={`${iconSizes.large} ${calendar.isConnected ? "text-[#FE5B25]" : "text-gray-400"}`} />
            </div>
            <div>
              <CardTitle className={textStyles.cardTitle}>{calendar.name}</CardTitle>
              <p className={textStyles.cardSubtitle}>{calendar.email}</p>
            </div>
          </div>
          <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
            <button className={buttonStyles.cardAction.icon}>
              <Settings className={iconSizes.small} />
            </button>
            <button className={buttonStyles.cardAction.iconDelete}>
              <Trash2 className={iconSizes.small} />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={layoutStyles.cardContent}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className={textStyles.metricLabel}>Event-Types</p>
            <p className={textStyles.metric}>{calendar.eventTypesCount}</p>
          </div>
          <div>
            <p className={textStyles.metricLabel}>Diese Woche</p>
            <p className={textStyles.metric}>{calendar.bookingsThisWeek}</p>
          </div>
          <div>
            <p className={textStyles.metricLabel}>Gesamt</p>
            <p className={textStyles.metric}>{calendar.totalBookings}</p>
          </div>
        </div>

        {!calendar.isConnected && (
          <div className="pt-3 border-t">
            <button className={buttonStyles.primary.default}>
              <span>Kalender verbinden</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Main render logic
  if (selectedCalendar) {
    const selectedCalendarData = connectedCalendars.find(cal => cal.id === selectedCalendar);
    const eventTypes = eventTypesByCalendar[selectedCalendar as keyof typeof eventTypesByCalendar] || [];

    return (
      <div className={layoutStyles.pageContainer}>
        {/* Back Navigation */}
        <div className="flex items-center space-x-2 mb-6">
          <button 
            className={buttonStyles.navigation.back}
            onClick={() => setSelectedCalendar(null)}
          >
            <ArrowLeft className={iconSizes.small} />
            <span>Zurück zu Kalendern</span>
          </button>
        </div>

        {/* Page Header */}
        <div className={layoutStyles.pageHeader}>
          <div>
            <h1 className={textStyles.pageTitle}>{selectedCalendarData?.name}</h1>
            <p className={textStyles.pageSubtitle}>Event-Types für diesen Kalender verwalten</p>
          </div>
          
          <button className={buttonStyles.create.default} onClick={() => setIsCreateEventDialogOpen(true)}>
            <Plus className={iconSizes.small} />
            <span>Event-Type erstellen</span>
          </button>
        </div>

        {/* Event Types Grid */}
        {eventTypes.length > 0 ? (
          <div className={layoutStyles.cardGrid}>
            {eventTypes.map((eventType) => (
              <EventTypeCard key={eventType.id} eventType={eventType} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Clock className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className={textStyles.sectionTitle}>Noch keine Event-Types</h3>
                <p className={textStyles.cardSubtitle}>
                  Erstellen Sie Ihren ersten Event-Type für {selectedCalendarData?.name}
                </p>
              </div>
              <button className={buttonStyles.create.default} onClick={() => setIsCreateEventDialogOpen(true)}>
                <Plus className={iconSizes.small} />
                <span>Event-Type erstellen</span>
              </button>
            </div>
          </Card>
        )}

        {/* Create/Edit Event Type Dialog */}
        <Dialog open={isCreateEventDialogOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? 'Event-Type bearbeiten' : 'Neuen Event-Type erstellen'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event-Type Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Beratungsgespräch"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Dauer (Minuten)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="buffer">Vorlaufzeit (Minuten)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min="0"
                    max="1440"
                    value={formData.bookingBuffer}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingBuffer: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kurze Beschreibung des Event-Types"
                />
              </div>
              
              <div className="space-y-4">
                <Label>Verfügbarkeiten</Label>
                {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day, index) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id={day} defaultChecked={index < 5} />
                      <Label htmlFor={day}>{day}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input type="time" defaultValue="09:00" className="w-20" />
                      <span>bis</span>
                      <Input type="time" defaultValue="17:00" className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`flex justify-end ${spacingStyles.buttonSpacing}`}>
              <button className={buttonStyles.secondary.default} onClick={handleClose}>
                <span>Abbrechen</span>
              </button>
              <button className={buttonStyles.create.default} onClick={handleSave}>
                <span>{isEdit ? 'Änderungen speichern' : 'Event-Type erstellen'}</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Main Calendar Overview
  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - PIXEL-PERFECT EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Kalender & Event-Types</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deine Kalender-Integrationen und Event-Types</p>
        </div>
        
        <button className={buttonStyles.create.default}>
          <Plus className={iconSizes.small} />
          <span>Kalender verbinden</span>
        </button>
      </div>

      {/* Calendars Grid */}
      <div className={layoutStyles.cardGrid}>
        {connectedCalendars.map((calendar) => (
          <CalendarOverviewCard key={calendar.id} calendar={calendar} />
        ))}
      </div>
    </div>
  );
 }