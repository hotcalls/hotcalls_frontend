import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Clock, 
  Copy,
  Edit,
  Trash2,
  Check,
  ArrowLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  Info
} from "lucide-react";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { getGoogleOAuthURL, storeState } from "@/lib/googleOAuth";
import { useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  type Calendar as CalendarType,
  getStoredCalendars, 
  addCalendarsFromOAuth, 
  disconnectCalendar,
  deleteCalendar,
  setDefaultCalendar,
  getCalendarDisplayName,
  canEditCalendar,
  saveConnection,
  clearTestCalendars,
  saveCalendars
} from "@/lib/calendarService";
import { getAllAvailableCalendarsForDropdown } from "@/lib/dummyCalendarData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Load initial calendars from localStorage or use empty array
const loadInitialCalendars = (): CalendarType[] => {
  const stored = getStoredCalendars();
  // Return stored calendars or empty array - no dummy data
  return stored;
};

// Event Type interface
interface EventType {
  id: string;
  title: string;
  slug: string;
  duration: number;
  color: string;
  bookingBuffer: number;
  isActive: boolean;
  bookingsThisWeek: number;
  totalBookings: number;
  conflictCheckCalendars: string[];
  targetCalendar: string;
  limitBookingsPerDay?: boolean;
  maxBookingsPerDay?: number;
}

// Initial mock data for event types by calendar
const initialEventTypesByCalendar = {};

export default function Calendar() {
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarType[]>(() => loadInitialCalendars());
  const [eventTypesByCalendar, setEventTypesByCalendar] = useState<Record<string, any[]>>(() => {
    const stored = localStorage.getItem('hotcalls_event_types');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored event types:', e);
      }
    }
    return initialEventTypesByCalendar;
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calendarToDelete, setCalendarToDelete] = useState<CalendarType | null>(null);
  const [deleteEventTypeDialogOpen, setDeleteEventTypeDialogOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState<{eventType: any, calendar: CalendarType} | null>(null);
  const [isInstructionOpen, setIsInstructionOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();

  // Save event types to localStorage whenever they change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    localStorage.setItem('hotcalls_event_types', JSON.stringify(eventTypesByCalendar));
  }, [eventTypesByCalendar]);

  // Check if we're returning from successful OAuth
  useEffect(() => {
    if (location.state?.newConnection && location.state?.calendars) {
      toast({
        title: "Kalender verbunden!",
        description: "Ihre Google Kalender wurden erfolgreich importiert.",
      });
      
      // Add new calendars using the service
      setConnectedCalendars(current => {
        // First, clean up any test calendars
        const cleanedCurrent = current.filter(cal => {
          // Remove calendars with test email patterns
          const isTestEmail = /^user\d+@gmail\.com$/.test(cal.email);
          return !isTestEmail;
        });
        
        const updated = addCalendarsFromOAuth(location.state.calendars, cleanedCurrent);
        
        // Save connection info
        const primaryCalendar = location.state.calendars.find((cal: any) => cal.primary);
        if (primaryCalendar) {
          saveConnection(primaryCalendar.email || primaryCalendar.external_id, location.state.calendars);
        }
        
        return updated;
      });
      
      // Add empty event types for new calendars
      setEventTypesByCalendar(prevEventTypes => {
        const newEventTypes = { ...prevEventTypes };
        location.state.calendars.forEach((cal: any) => {
          const calId = cal.id || `${cal.email}-${Date.now()}`;
          if (!newEventTypes[calId]) {
            newEventTypes[calId] = [];
          }
        });
        return newEventTypes;
      });
      
      // Clear location state to prevent re-processing
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.newConnection]);

  const [formData, setFormData] = useState({
    title: "",
    duration: 30,
    bookingBuffer: 60,
    conflictCheckCalendars: [] as string[],
    targetCalendar: "",
    limitBookingsPerDay: false,
    maxBookingsPerDay: 1
  });

  const resetForm = () => {
    setFormData({
      title: "",
      duration: 30,
      bookingBuffer: 60,
      conflictCheckCalendars: [],
      targetCalendar: "",
      limitBookingsPerDay: false,
      maxBookingsPerDay: 1
    });
    setEditingEventType(null);
  };

  // Handle Google Calendar connection
  const handleConnectGoogleCalendar = () => {
    // Generate and store state for CSRF protection
    const authUrl = getGoogleOAuthURL();
    const urlParams = new URL(authUrl).searchParams;
    const state = urlParams.get('state');
    
    if (state) {
      storeState(state);
    }
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  };

  // Handle calendar deletion
  const handleDeleteCalendar = (calendar: CalendarType) => {
    setCalendarToDelete(calendar);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCalendar = () => {
    if (calendarToDelete) {
      const updatedCalendars = deleteCalendar(calendarToDelete.id, connectedCalendars);
      setConnectedCalendars(updatedCalendars);
      
      // Remove event types for deleted calendar
      setEventTypesByCalendar(prev => {
        const updated = { ...prev };
        delete updated[calendarToDelete.id];
        return updated;
      });
      
      toast({
        title: "Kalender gelöscht",
        description: `${getCalendarDisplayName(calendarToDelete)} wurde entfernt.`,
      });
    }
    setDeleteDialogOpen(false);
    setCalendarToDelete(null);
  };

  // Handle event type deletion
  const handleDeleteEventType = (eventType: any, calendar: CalendarType) => {
    setEventTypeToDelete({ eventType, calendar });
    setDeleteEventTypeDialogOpen(true);
  };

  const confirmDeleteEventType = () => {
    if (eventTypeToDelete) {
      const { eventType, calendar } = eventTypeToDelete;
      
      setEventTypesByCalendar(prev => {
        const updated = { ...prev };
        if (updated[calendar.id]) {
          updated[calendar.id] = updated[calendar.id].filter(et => et.id !== eventType.id);
        }
        return updated;
      });
      
      // Update calendar event type count
      setConnectedCalendars(prev => prev.map(cal => 
        cal.id === calendar.id 
          ? { ...cal, eventTypesCount: Math.max(0, (cal.eventTypesCount || 0) - 1) }
          : cal
      ));
      
      toast({
        title: "Event-Type gelöscht",
        description: `${eventType.title} wurde erfolgreich gelöscht.`,
      });
    }
    setDeleteEventTypeDialogOpen(false);
    setEventTypeToDelete(null);
  };

  const handleClose = () => {
    setIsCreateEventDialogOpen(false);
    setEditingEventType(null);
    resetForm();
  };

    const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (isSaving) return; // Prevent double submission
    
    if (!formData.title || !selectedCalendar) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    const newEventType = {
      id: isEdit ? editingEventType.id : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      duration: formData.duration,
      color: "#1a73e8",
      bookingBuffer: formData.bookingBuffer,
      isActive: true,
      bookingsThisWeek: 0,
      totalBookings: 0,
      conflictCheckCalendars: formData.conflictCheckCalendars,
      targetCalendar: formData.targetCalendar,
      limitBookingsPerDay: formData.limitBookingsPerDay,
      maxBookingsPerDay: formData.maxBookingsPerDay
    };

    setEventTypesByCalendar(prev => {
      const updated = { ...prev };
      if (!updated[selectedCalendar]) {
        updated[selectedCalendar] = [];
      }
      
      if (isEdit) {
        // Update existing event type
        const index = updated[selectedCalendar].findIndex(et => et.id === editingEventType.id);
        if (index >= 0) {
          updated[selectedCalendar][index] = newEventType;
        }
      } else {
        // Add new event type - check if it doesn't already exist
        const alreadyExists = updated[selectedCalendar].some(et => et.id === newEventType.id);
        if (!alreadyExists) {
          updated[selectedCalendar].push(newEventType);
        }
      }
      
      return updated;
    });

    // Update calendar event type count
    setConnectedCalendars(prev => prev.map(cal => 
      cal.id === selectedCalendar 
        ? { ...cal, eventTypesCount: (cal.eventTypesCount || 0) + (isEdit ? 0 : 1) }
        : cal
    ));

    toast({
      title: isEdit ? "Event-Type aktualisiert" : "Event-Type erstellt",
      description: `${formData.title} wurde erfolgreich ${isEdit ? 'aktualisiert' : 'erstellt'}.`,
    });

    setTimeout(() => {
      handleClose();
      setIsSaving(false);
    }, 100);
  };

  const isEdit = !!editingEventType;

  // Komponente für Wochentag-Zeile
  const WeekDayRow = ({ day, index }: { day: string; index: number }) => {
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [isActive, setIsActive] = useState(index < 5);

    return (
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id={`day-${day}`} 
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor={`day-${day}`} className="font-medium cursor-pointer">
              {day}
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Input 
                type="time" 
                defaultValue="09:00" 
                className="w-24"
                disabled={!isActive}
              />
              <span className="text-gray-500">-</span>
              <Input 
                type="time" 
                defaultValue="17:00" 
                className="w-24"
                disabled={!isActive}
              />
            </div>
            {isActive && (
              <button 
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowTimeSlots(!showTimeSlots)}
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${showTimeSlots ? 'rotate-90' : ''}`} />
              </button>
            )}
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Time Slots Grid - Ähnlich wie im Screenshot */}
        {showTimeSlots && isActive && (
          <div className="border-t px-4 py-3 bg-gray-50">
            <div className="grid grid-cols-4 gap-2 text-sm">
              {['00:00', '00:15', '00:30', '00:45',
                '01:00', '01:15', '01:30', '01:45',
                '02:00', '02:15', '02:30', '02:45',
                '03:00', '03:15', '03:30', '03:45'].map((time) => (
                <button
                  key={time}
                  className="px-3 py-1.5 text-center border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {time}
                </button>
              ))}
              <button className="col-span-4 text-center text-blue-600 hover:text-blue-700 py-2">
                <ChevronRight className="h-4 w-4 inline-block rotate-90" />
                <span className="ml-1">Mehr anzeigen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // useEffect not needed anymore since we set formData directly in the edit button click handler

  const CalendarOverviewCard = ({ calendar }: { calendar: CalendarType }) => {
    return (
      <Card 
        className={`${calendar.isConnected ? "hover:shadow-md transition-shadow" : "opacity-50"}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className={`p-2 rounded-lg ${calendar.isConnected ? "bg-[#FFE1D7]" : "bg-gray-100"}`}
                style={calendar.isConnected && calendar.color ? { backgroundColor: `${calendar.color}20` } : {}}
              >
                <CalendarIcon 
                  className={`${iconSizes.large} ${calendar.isConnected ? "text-[#FE5B25]" : "text-gray-400"}`}
                  style={calendar.isConnected && calendar.color ? { color: calendar.color } : {}}
                />
              </div>
              <div>
                <CardTitle className={textStyles.cardTitle}>
                  <div className="flex items-center gap-2">
                    {getCalendarDisplayName(calendar)}
                    {calendar.isDefault && (
                      <Badge variant="secondary" className="text-xs">Standard</Badge>
                    )}
                  </div>
                </CardTitle>
                <p className={textStyles.cardSubtitle}>{calendar.email}</p>
              </div>
            </div>
            <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
              <button 
                className={buttonStyles.cardAction.iconDelete}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCalendar(calendar);
                }}
              >
                <Trash2 className={iconSizes.small} />
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={layoutStyles.cardContent}>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className={textStyles.metricLabel}>Event-Types</p>
              <p className={textStyles.metric}>{calendar.eventTypesCount}</p>
            </div>
          </div>

          {!calendar.isConnected && (
            <div className="pt-3 border-t">
              <button 
                className={buttonStyles.primary.default}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectGoogleCalendar();
                }}
              >
                <span>Kalender verbinden</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Main render logic
  if (selectedCalendar) {
    const selectedCalendarData = connectedCalendars.find(cal => cal.id === selectedCalendar);
    const eventTypes = eventTypesByCalendar[selectedCalendar as keyof typeof eventTypesByCalendar] || [];

    // Wenn ein Kalender ausgewählt ist und Dialog offen ist, zeige nur den Dialog
    // Ansonsten gehe zurück zur Hauptansicht
    if (!isCreateEventDialogOpen) {
      setSelectedCalendar(null);
    }
  }

  // Main Calendar Overview
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
          <h1 className={textStyles.pageTitle}>Kalendereinstellungen</h1>
          <p className={textStyles.pageSubtitle}>Verwalte deine Kalender-Integrationen und Event-Types</p>
        </div>
        
        <div className="flex items-center gap-3">
          {connectedCalendars.some(cal => cal.isConnected) && (
            <button 
              className={buttonStyles.create.default}
              onClick={() => {
                // Wähle den ersten verbundenen Kalender aus und öffne den Dialog
                const firstConnectedCalendar = connectedCalendars.find(cal => cal.isConnected);
                if (firstConnectedCalendar) {
                  setSelectedCalendar(firstConnectedCalendar.id);
                  // Reset form and set targetCalendar
                  resetForm();
                  setFormData(prev => ({
                    ...prev,
                    targetCalendar: firstConnectedCalendar.id
                  }));
                  setEditingEventType(null);
                  setIsCreateEventDialogOpen(true);
                }
              }}
            >
              <Plus className={iconSizes.small} />
              <span>Event-Type erstellen</span>
            </button>
          )}
          
          <button 
            className={buttonStyles.create.default}
            onClick={handleConnectGoogleCalendar}
          >
            <Plus className={iconSizes.small} />
            <span>Kalender verbinden</span>
          </button>
        </div>
      </div>

      {/* Anleitung - immer anzeigen */}
      <Card className="mb-6">
        <Collapsible open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
          <CardHeader>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-0 hover:no-underline">
              <CardTitle className="text-lg">So aktivierst du die Kalenderbuchung für deinen KI-Agenten</CardTitle>
              <ChevronRight className={`h-4 w-4 transition-transform ${isInstructionOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Verbinde deinen Google Kalender</h4>
                  <p className="text-sm text-gray-600">Klicke auf "Kalender verbinden" und erlaube dem KI-Agenten Zugriff auf deinen Google Kalender.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Konfiguriere dein Event-Type</h4>
                  <p className="text-sm text-gray-600">Erstelle Event-Types für verschiedene Termine (z.B. Beratungsgespräch, Demo-Call) und lege Dauer, Pufferzeiten und Verfügbarkeiten fest.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Füge das Event-Type zum Agenten hinzu</h4>
                  <p className="text-sm text-gray-600">Gehe zu den Agent-Einstellungen und füge die erstellten Event-Types hinzu, damit der Agent Termine in deinem Kalender buchen kann.</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Tab Navigation */}
      <Tabs defaultValue="calendars" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calendars">Kalender</TabsTrigger>
          <TabsTrigger value="event-types">Event-Types</TabsTrigger>
        </TabsList>

        {/* Kalender Tab */}
        <TabsContent value="calendars">
          {connectedCalendars.length > 0 ? (
            <div className={layoutStyles.cardGrid}>
              {connectedCalendars.map((calendar) => (
                <CalendarOverviewCard key={calendar.id} calendar={calendar} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className={textStyles.sectionTitle}>Noch keine Kalender verbunden</h3>
                  <p className={textStyles.cardSubtitle}>
                    Verbinden Sie Ihren Google Kalender, um mit der Terminverwaltung zu beginnen
                  </p>
                </div>
                <button 
                  className={buttonStyles.create.default}
                  onClick={handleConnectGoogleCalendar}
                >
                  <Plus className={iconSizes.small} />
                  <span>Kalender verbinden</span>
                </button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Event-Types Tab */}
        <TabsContent value="event-types">
          {connectedCalendars.some(cal => cal.isConnected) ? (
            <>
              {/* Alle Event-Types aus allen Kalendern anzeigen */}
              {(() => {
                const allEventTypes: Array<{eventType: any, calendar: CalendarType}> = [];
                connectedCalendars.forEach(calendar => {
                  if (calendar.isConnected) {
                    const eventTypes = eventTypesByCalendar[calendar.id] || [];
                    eventTypes.forEach(eventType => {
                      allEventTypes.push({ eventType, calendar });
                    });
                  }
                });

                if (allEventTypes.length > 0) {
                  return (
                    <div className={layoutStyles.cardGrid}>
                      {allEventTypes.map(({ eventType, calendar }) => (
                        <Card key={eventType.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[#FFE1D7] rounded-lg">
                                  <Clock className={`${iconSizes.large} text-[#FE5B25]`} />
                                </div>
                                <div>
                                  <CardTitle className={textStyles.cardTitle}>{eventType.title}</CardTitle>
                                  <p className={textStyles.cardSubtitle}>
                                    {eventType.duration} Min • {calendar.name}
                                  </p>
                                </div>
                              </div>
                              <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
                                <button 
                                  className={buttonStyles.cardAction.icon}
                                  onClick={() => {
                                    setSelectedCalendar(calendar.id);
                                    setFormData({
                                      title: eventType.title,
                                      duration: eventType.duration,
                                      bookingBuffer: eventType.bookingBuffer,
                                      conflictCheckCalendars: eventType.conflictCheckCalendars || [],
                                      targetCalendar: eventType.targetCalendar || calendar.id,
                                      limitBookingsPerDay: eventType.limitBookingsPerDay || false,
                                      maxBookingsPerDay: eventType.maxBookingsPerDay || 1
                                    });
                                    setEditingEventType(eventType);
                                    setIsCreateEventDialogOpen(true);
                                  }}
                                >
                                  <Edit className={iconSizes.small} />
                                </button>
                                <button 
                                  className={buttonStyles.cardAction.iconDelete}
                                  onClick={() => handleDeleteEventType(eventType, calendar)}
                                >
                                  <Trash2 className={iconSizes.small} />
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className={layoutStyles.cardContent}>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className={textStyles.metricLabel}>Dauer</p>
                                <p className={textStyles.metric}>{eventType.duration} Min</p>
                              </div>
                              <div>
                                <p className={textStyles.metricLabel}>Vorlaufzeit</p>
                                <p className={textStyles.metric}>{eventType.bookingBuffer} Min</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <Card className="p-8 text-center">
                      <div className="space-y-4">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <h3 className={textStyles.sectionTitle}>Noch keine Event-Types erstellt</h3>
                          <p className={textStyles.cardSubtitle}>
                            Erstellen Sie Ihren ersten Event-Type für Terminbuchungen
                          </p>
                        </div>
                        <button 
                          className={buttonStyles.create.default} 
                          onClick={() => {
                            const firstConnectedCalendar = connectedCalendars.find(cal => cal.isConnected);
                            if (firstConnectedCalendar) {
                              setSelectedCalendar(firstConnectedCalendar.id);
                              // Reset form and set targetCalendar
                              resetForm();
                              setFormData(prev => ({
                                ...prev,
                                targetCalendar: firstConnectedCalendar.id
                              }));
                              setEditingEventType(null);
                              setIsCreateEventDialogOpen(true);
                            }
                          }}
                        >
                          <Plus className={iconSizes.small} />
                          <span>Event-Type erstellen</span>
                        </button>
                      </div>
                    </Card>
                  );
                }
              })()}
            </>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className={textStyles.sectionTitle}>Zuerst Kalender verbinden</h3>
                  <p className={textStyles.cardSubtitle}>
                    Sie müssen zuerst einen Kalender verbinden, bevor Sie Event-Types erstellen können
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Event Type Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Event-Type bearbeiten' : 'Neuen Event-Type erstellen'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Grundinformationen</TabsTrigger>
              <TabsTrigger value="planning">Planung</TabsTrigger>
              <TabsTrigger value="availability">Verfügbarkeit</TabsTrigger>
              <TabsTrigger value="calendar">Kalender</TabsTrigger>
            </TabsList>

            {/* Grundinformationen Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Event-Type Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Beratungsgespräch"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="duration">Dauer</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wählen Sie die Dauer für diesen Event-Typ</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minuten</SelectItem>
                    <SelectItem value="30">30 Minuten</SelectItem>
                    <SelectItem value="45">45 Minuten</SelectItem>
                    <SelectItem value="60">60 Minuten</SelectItem>
                    <SelectItem value="90">90 Minuten</SelectItem>
                    <SelectItem value="120">120 Minuten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Planung Tab */}
            <TabsContent value="planning" className="space-y-6 mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Puffer vor dem Termin</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Blockiert Zeit vor dem Termin in deinem Kalender</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={formData.bookingBuffer.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bookingBuffer: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Keine Pufferzeit</SelectItem>
                    <SelectItem value="15">15 Minuten</SelectItem>
                    <SelectItem value="30">30 Minuten</SelectItem>
                    <SelectItem value="60">60 Minuten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label>Mindestvorlaufzeit</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Minimum Zeit zwischen Buchung und Start des Termins</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select defaultValue="180">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">3 Stunden</SelectItem>
                    <SelectItem value="360">6 Stunden</SelectItem>
                    <SelectItem value="1440">1 Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="limitBookings"
                    checked={formData.limitBookingsPerDay}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, limitBookingsPerDay: !!checked }))}
                  />
                  <Label htmlFor="limitBookings" className="cursor-pointer">
                    Maximale Buchungen pro Tag
                  </Label>
                </div>
                {formData.limitBookingsPerDay && (
                  <Select 
                    value={formData.maxBookingsPerDay.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, maxBookingsPerDay: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Buchung</SelectItem>
                      <SelectItem value="2">2 Buchungen</SelectItem>
                      <SelectItem value="3">3 Buchungen</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TabsContent>

            {/* Verfügbarkeit Tab */}
            <TabsContent value="availability" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Arbeitszeiten</Label>
                  <p className="text-sm text-gray-500">
                    Definieren Sie Ihre verfügbaren Arbeitszeiten für Buchungen
                  </p>
                </div>
                
                <div className="space-y-3">
                  {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day, index) => (
                    <WeekDayRow key={day} day={day} index={index} />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Kalender Tab */}
            <TabsContent value="calendar" className="space-y-6 mt-4">
              {/* Zielkalender für Buchungen */}
              <div className="space-y-2">
                <Label htmlFor="targetCalendar">Zielkalender für Buchungen</Label>
                <p className="text-sm text-gray-500">
                  Wählen Sie den Kalender aus, in den die Buchungen dieses Event-Types eingetragen werden sollen. 
                  Dieser Kalender wird als Organisator angezeigt.
                </p>
                <Select
                  value={formData.targetCalendar}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetCalendar: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kalender auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllAvailableCalendarsForDropdown(connectedCalendars).map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kalender für Verfügbarkeitsprüfung */}
              <div className="space-y-2">
                <Label>Kalender für Verfügbarkeitsprüfung</Label>
                <p className="text-sm text-gray-500">
                  Wählen Sie die Kalender aus, die auf Konflikte geprüft werden sollen. 
                  Buchungen sind nur möglich, wenn in keinem dieser Kalender ein Konflikt besteht.
                </p>
                <div className="space-y-3 mt-3 border rounded-lg p-4">
                  {connectedCalendars
                    .filter(cal => cal.isConnected)
                    .map((calendar) => (
                      <div key={calendar.id} className="space-y-2">
                        <div className="font-medium text-sm">{calendar.name}</div>
                        {/* Hauptkalender */}
                        <div className="ml-4 flex items-center space-x-2">
                          <Checkbox
                            id={`conflict-${calendar.id}`}
                            checked={formData.conflictCheckCalendars.includes(calendar.id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                conflictCheckCalendars: checked
                                  ? [...prev.conflictCheckCalendars, calendar.id]
                                  : prev.conflictCheckCalendars.filter(id => id !== calendar.id)
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`conflict-${calendar.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center space-x-2"
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: calendar.color || '#1a73e8' }}
                            />
                            <span>{calendar.name} | {calendar.email}</span>
                            {formData.targetCalendar === calendar.id && (
                              <Badge variant="secondary" className="text-xs">Zielkalender</Badge>
                            )}
                          </Label>
                        </div>
                        {/* Sub-Kalender */}
                        {calendar.subCalendars.map((subCal) => (
                          <div key={subCal.id} className="ml-8 flex items-center space-x-2">
                            <Checkbox
                              id={`conflict-${calendar.id}-${subCal.id}`}
                              checked={formData.conflictCheckCalendars.includes(`${calendar.id}-${subCal.id}`)}
                              onCheckedChange={(checked) => {
                                const subCalId = `${calendar.id}-${subCal.id}`;
                                setFormData(prev => ({
                                  ...prev,
                                  conflictCheckCalendars: checked
                                    ? [...prev.conflictCheckCalendars, subCalId]
                                    : prev.conflictCheckCalendars.filter(id => id !== subCalId)
                                }));
                              }}
                            />
                            <Label
                              htmlFor={`conflict-${calendar.id}-${subCal.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center space-x-2"
                            >
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: subCal.color || '#666' }}
                              />
                              <span>{subCal.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className={`flex justify-between border-t pt-4 mt-6`}>
            <button className={buttonStyles.secondary.default} onClick={handleClose}>
              <span>Abbrechen</span>
            </button>
            <button 
              type="button"
              className={`${buttonStyles.create.default} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={(e) => handleSave(e)}
              disabled={isSaving}
            >
              <span>{isSaving ? 'Wird gespeichert...' : (isEdit ? 'Speichern' : 'Erstellen')}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

            {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalender löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{calendarToDelete && getCalendarDisplayName(calendarToDelete)}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCalendar}
              className={buttonStyles.dialog.destructive}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Event Type Dialog */}
      <AlertDialog open={deleteEventTypeDialogOpen} onOpenChange={setDeleteEventTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event-Type löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{eventTypeToDelete?.eventType.title}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEventType}
              className={buttonStyles.dialog.destructive}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}