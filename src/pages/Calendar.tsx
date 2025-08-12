import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronRight, 
  Clock, 
  ExternalLink, 
  Loader2, 
  Plus, 
  Settings, 
  Trash2, 
  Users,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { calendarAPI, BackendCalendar, GoogleConnection } from "@/lib/apiService";
import { getCalendarDisplayName, getCalendarEmail, saveCalendars } from "@/lib/calendarService";

// Types
interface CalendarType {
  id: string;
  connectionId: string;
  name: string;
  email: string;
  provider: string;
  isConnected: boolean;
  isDefault: boolean;
  isPrimary: boolean;
  eventTypesCount: number;
  totalBookings: number;
  bookingsThisWeek: number;
  subCalendars: any[];
  color?: string;
  accessRole: "owner" | "writer" | "reader";
  timeZone?: string;
  active: boolean;
  createdAt: Date;
  lastSyncedAt?: Date;
}

interface EventType {
  id: string;
  title: string;
  duration: number;
  bookingBuffer: number;
  conflictCheckCalendars: string[];
  targetCalendar: string;
  limitBookingsPerDay: boolean;
  maxBookingsPerDay: number;
}

interface EventTypeFormData {
  name: string;
  duration: number;
  calendar: string;
  conflictCheckCalendars: string[];
  workdays: string[];
  from_time: string;
  to_time: string;
  prep_time: number;
  days_buffer: number;
  meeting_type: 'online' | 'in_person';
  meeting_link: string;
  meeting_address: string;
}

// Event Type Step Components
function EventTypeStep1({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Grundinformationen</h3>
      
      <div>
        <Label htmlFor="event-name">Event Name</Label>
        <Input 
          id="event-name"
          placeholder="z.B. Beratungsgespräch"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="event-duration">Event Dauer</Label>
        <Select 
          value={formData.duration.toString()}
          onValueChange={(value) => setFormData({...formData, duration: parseInt(value)})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 Minuten</SelectItem>
            <SelectItem value="30">30 Minuten</SelectItem>
            <SelectItem value="45">45 Minuten</SelectItem>
            <SelectItem value="60">60 Minuten</SelectItem>
            <SelectItem value="120">120 Minuten</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EventTypeStep2({ formData, setFormData, availableCalendars }: { 
  formData: EventTypeFormData, 
  setFormData: (data: EventTypeFormData) => void,
  availableCalendars: BackendCalendar[]
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Kalendereinstellungen</h3>
      
      <div>
        <Label>Zielkalender für Buchungen</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Wählen Sie den Kalender aus, in den die Buchungen dieses Event-Types eingetragen werden sollen.
        </p>
        <Select 
          value={formData.calendar}
          onValueChange={(value) => setFormData({...formData, calendar: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kalender auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Zielkalender</SelectItem>
            {availableCalendars.map((cal) => (
              <SelectItem key={cal.id} value={cal.id}>
                {cal.name} (Google: {cal.provider_details.external_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Kalender für Verfügbarkeitsprüfung</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Wählen Sie die Kalender aus, die auf Konflikte geprüft werden sollen.
        </p>
        <div className="space-y-2">
          {availableCalendars.map((cal) => (
            <div key={cal.id} className="flex items-center space-x-2">
              <Checkbox 
                id={cal.id}
                checked={formData.conflictCheckCalendars.includes(cal.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData, 
                      conflictCheckCalendars: [...formData.conflictCheckCalendars, cal.id]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      conflictCheckCalendars: formData.conflictCheckCalendars.filter(id => id !== cal.id)
                    });
                  }
                }}
              />
              <Label htmlFor={cal.id} className="flex items-center space-x-2">
                <span>{cal.name}</span>
                {formData.calendar === cal.id && formData.calendar !== 'none' && (
                  <Badge className="bg-[#FE5B25] text-white text-xs">Zielkalender</Badge>
                )}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventTypeStep3({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  const workdayLabels = {
    monday: 'Montag',
    tuesday: 'Dienstag', 
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Arbeitszeiten</h3>
      
      <div>
        <Label className="text-base font-medium">Verfügbare Wochentage</Label>
        <p className="text-sm text-muted-foreground mb-3">Wählen Sie die Tage aus, an denen Termine möglich sind</p>
        <div className="grid grid-cols-7 gap-2">
          {Object.entries(workdayLabels).map(([key, label]) => (
            <div key={key} className="text-center">
              <Checkbox 
                id={key}
                checked={formData.workdays.includes(key)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({...formData, workdays: [...formData.workdays, key]});
                  } else {
                    setFormData({...formData, workdays: formData.workdays.filter(day => day !== key)});
                  }
                }}
                className="peer sr-only"
              />
              <Label 
                htmlFor={key} 
                className={`
                  cursor-pointer block w-full py-2 px-1 text-sm rounded-lg border-2 transition-all
                  ${formData.workdays.includes(key) 
                    ? 'bg-[#FE5B25] border-[#FE5B25] text-white' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#FE5B25]'
                  }
                `}
              >
                {label.slice(0, 2)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from-time">Von Uhrzeit</Label>
          <Input 
            id="from-time"
            type="time" 
            value={formData.from_time.slice(0, 5)}
            onChange={(e) => setFormData({...formData, from_time: e.target.value + ':00'})}
          />
        </div>
        <div>
          <Label htmlFor="to-time">Bis Uhrzeit</Label>
          <Input 
            id="to-time"
            type="time"
            value={formData.to_time.slice(0, 5)}
            onChange={(e) => setFormData({...formData, to_time: e.target.value + ':00'})}
          />
        </div>
      </div>
    </div>
  );
}

function EventTypeStep4({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Planung</h3>
      
      <div>
        <Label>Pufferzeit vor dem Termin</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Blockiert Zeit vor dem Termin in deinem Kalender
        </p>
        <Select 
          value={formData.prep_time.toString()}
          onValueChange={(value) => setFormData({...formData, prep_time: parseInt(value)})}
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
        <Label>Mindestvorlaufzeit</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Mindestens diese Zeit vor Buchung und Gerplan-Termin
        </p>
        <Select 
          value={formData.days_buffer.toString()}
          onValueChange={(value) => setFormData({...formData, days_buffer: parseInt(value)})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Keine Mindestvorlaufzeit</SelectItem>
            <SelectItem value="1">3 Stunden</SelectItem>
            <SelectItem value="2">6 Stunden</SelectItem>
            <SelectItem value="3">1 Tag</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EventTypeStep5({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Meeting Location</h3>
      
      <div>
        <Label className="text-base font-medium">Art des Meetings</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Wählen Sie aus, ob das Meeting online oder vor Ort stattfindet
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="radio"
              id="online"
              name="meeting_type"
              value="online"
              checked={formData.meeting_type === 'online'}
              onChange={(e) => setFormData({...formData, meeting_type: e.target.value as 'online' | 'in_person'})}
              className="peer sr-only"
            />
            <Label 
              htmlFor="online" 
              className={`
                cursor-pointer block w-full py-3 px-4 text-center rounded-lg border-2 transition-all
                ${formData.meeting_type === 'online' 
                  ? 'bg-[#FE5B25] border-[#FE5B25] text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#FE5B25]'
                }
              `}
            >
              📹 Online Meeting
            </Label>
          </div>
          <div>
            <input
              type="radio"
              id="in_person"
              name="meeting_type"
              value="in_person"
              checked={formData.meeting_type === 'in_person'}
              onChange={(e) => setFormData({...formData, meeting_type: e.target.value as 'online' | 'in_person'})}
              className="peer sr-only"
            />
            <Label 
              htmlFor="in_person" 
              className={`
                cursor-pointer block w-full py-3 px-4 text-center rounded-lg border-2 transition-all
                ${formData.meeting_type === 'in_person' 
                  ? 'bg-[#FE5B25] border-[#FE5B25] text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#FE5B25]'
                }
              `}
            >
              📍 Vor Ort
            </Label>
          </div>
        </div>
      </div>

      {formData.meeting_type === 'online' && (
        <div>
          <Label htmlFor="meeting-link">Meeting Link</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Geben Sie Ihren Zoom, Teams oder anderen Meeting-Link ein
          </p>
          <Input 
            id="meeting-link"
            placeholder="z.B. https://zoom.us/j/123456789"
            value={formData.meeting_link}
            onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
          />
        </div>
      )}

      {formData.meeting_type === 'in_person' && (
        <div>
          <Label htmlFor="meeting-address">Adresse</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Geben Sie die Adresse ein, wo das Meeting stattfindet
          </p>
          <Input 
            id="meeting-address"
            placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
            value={formData.meeting_address}
            onChange={(e) => setFormData({...formData, meeting_address: e.target.value})}
          />
        </div>
      )}
    </div>
  );
}

// Event Type Creation Modal Component
function EventTypeModal({ 
  open, 
  onOpenChange, 
  availableCalendars,
  onEventTypeCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCalendars: BackendCalendar[];
  onEventTypeCreated: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventTypeFormData>({
    name: '',
    duration: 60,
    calendar: 'none',
    conflictCheckCalendars: [],
    workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    from_time: '09:00:00',
    to_time: '17:00:00',
    prep_time: 0,
    days_buffer: 0,
    meeting_type: 'online',
    meeting_link: '',
    meeting_address: ''
  });

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        id: crypto.randomUUID(),
        name: formData.name,
        calendar: formData.calendar === 'none' ? null : formData.calendar,
        duration: formData.duration,
        prep_time: formData.prep_time,
        days_buffer: formData.days_buffer,
        from_time: formData.from_time,
        to_time: formData.to_time,
        workdays: formData.workdays,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link,
        meeting_address: formData.meeting_address,
        conflict_calendars: formData.conflictCheckCalendars
      };

      const response = await calendarAPI.createEventType(payload);
      console.log('✅ Event Type created:', response);
      
      // Reload Event Types to show the new one
      onEventTypeCreated();
      
      onOpenChange(false);
      // Reset form
      setCurrentStep(1);
      setFormData({
        name: '',
        duration: 60,
        calendar: 'none',
        conflictCheckCalendars: [],
        workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        from_time: '09:00:00',
        to_time: '17:00:00',
        prep_time: 0,
        days_buffer: 0,
        meeting_type: 'online',
        meeting_link: '',
        meeting_address: ''
      });
    } catch (error) {
      console.error('❌ Error creating Event Type:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Event Type erstellen - Schritt {currentStep} von 5</AlertDialogTitle>
        </AlertDialogHeader>
        
        {/* Multi-Step Content */}
        {currentStep === 1 && (
          <EventTypeStep1 formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 2 && (
          <EventTypeStep2 formData={formData} setFormData={setFormData} availableCalendars={availableCalendars} />
        )}
        {currentStep === 3 && (
          <EventTypeStep3 formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 4 && (
          <EventTypeStep4 formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 5 && (
          <EventTypeStep5 formData={formData} setFormData={setFormData} />
        )}

        <AlertDialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            )}
          </div>
          <div>
            {currentStep < 5 ? (
              <Button onClick={handleNext} className="bg-[#FE5B25] hover:bg-[#E5522A]">
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-[#FE5B25] hover:bg-[#E5522A]">
                Event Type erstellen
              </Button>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Event Type Card Component
function EventTypeCard({ eventType, onEdit, onDelete }: { 
  eventType: any; 
  onEdit: (eventType: any) => void;
  onDelete: (eventType: any) => void;
}) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`.trim();
  };

  const formatBufferTime = (days: number) => {
    if (days === 0) return null;
    if (days === 1) return '3 Stunden';
    if (days === 2) return '6 Stunden'; 
    if (days === 3) return '1 Tag';
    return `${days} Tage`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{eventType.name || 'Unbenannter Event Type'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDuration(eventType.duration)} • {eventType.from_time?.slice(0, 5)} - {eventType.to_time?.slice(0, 5)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#FE5B25] text-white">Aktiv</Badge>
            <Button variant="ghost" size="sm" onClick={() => onEdit(eventType)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(eventType)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Zielkalender</p>
            <p className="text-sm truncate">{eventType.calendar_name || 'Nicht zugewiesen'}</p>
          </div>
          
          {eventType.prep_time > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pufferzeit</p>
              <p className="text-sm">{eventType.prep_time} Min vor Termin</p>
            </div>
          )}

          {eventType.days_buffer > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vorlaufzeit</p>
              <p className="text-sm">{formatBufferTime(eventType.days_buffer)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Event Type Edit Modal with Tabs
function EventTypeEditModal({ 
  open, 
  onOpenChange, 
  eventType,
  availableCalendars,
  onEventTypeUpdated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: any;
  availableCalendars: BackendCalendar[];
  onEventTypeUpdated: () => void;
}) {
  const [activeEditTab, setActiveEditTab] = useState('grundinformationen');
  const [editFormData, setEditFormData] = useState<EventTypeFormData>({
    name: '',
    duration: 60,
    calendar: 'none',
    conflictCheckCalendars: [],
    workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    from_time: '09:00:00',
    to_time: '17:00:00',
    prep_time: 0,
    days_buffer: 0,
    meeting_type: 'online',
    meeting_link: '',
    meeting_address: ''
  });

  // Load eventType data when modal opens
  useEffect(() => {
    if (eventType && open) {
      setEditFormData({
        name: eventType.name || '',
        duration: eventType.duration || 60,
        calendar: eventType.calendar || 'none',
        conflictCheckCalendars: eventType.conflict_calendars || [],
        workdays: eventType.workdays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        from_time: eventType.from_time || '09:00:00',
        to_time: eventType.to_time || '17:00:00',
        prep_time: eventType.prep_time || 0,
        days_buffer: eventType.days_buffer || 0,
        meeting_type: eventType.meeting_type || 'online',
        meeting_link: eventType.meeting_link || '',
        meeting_address: eventType.meeting_address || ''
      });
    }
  }, [eventType, open]);

  const handleUpdate = async () => {
    try {
      const payload = {
        name: editFormData.name,
        calendar: editFormData.calendar === 'none' ? null : editFormData.calendar,
        duration: editFormData.duration,
        prep_time: editFormData.prep_time,
        days_buffer: editFormData.days_buffer,
        from_time: editFormData.from_time,
        to_time: editFormData.to_time,
        workdays: editFormData.workdays,
        meeting_type: editFormData.meeting_type,
        meeting_link: editFormData.meeting_link,
        meeting_address: editFormData.meeting_address,
        conflict_calendars: editFormData.conflictCheckCalendars
      };

      await calendarAPI.updateEventType(eventType.id, payload);
      console.log('✅ Event Type updated');
      
      onEventTypeUpdated();
      onOpenChange(false);
      
    } catch (error) {
      console.error('❌ Error updating Event Type:', error);
    }
  };

  const editTabs = [
    { key: 'grundinformationen', label: 'Grundinformationen' },
    { key: 'planung', label: 'Planung' },
    { key: 'verfuegbarkeit', label: 'Verfügbarkeit' },
    { key: 'kalender', label: 'Kalender' },
    { key: 'erweitert', label: 'Erweitert' }
  ];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <AlertDialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <AlertDialogTitle>Event-Typ bearbeiten</AlertDialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <Plus className="h-4 w-4 rotate-45" />
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {editTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveEditTab(tab.key)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeEditTab === tab.key 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {activeEditTab === 'grundinformationen' && (
            <EventTypeEditStep1 formData={editFormData} setFormData={setEditFormData} />
          )}
          {activeEditTab === 'planung' && (
            <EventTypeEditStep2 formData={editFormData} setFormData={setEditFormData} />
          )}
          {activeEditTab === 'verfuegbarkeit' && (
            <EventTypeEditStep3 formData={editFormData} setFormData={setEditFormData} />
          )}
          {activeEditTab === 'kalender' && (
            <EventTypeEditStep4 formData={editFormData} setFormData={setEditFormData} availableCalendars={availableCalendars} />
          )}
          {activeEditTab === 'erweitert' && (
            <EventTypeEditStep5 formData={editFormData} setFormData={setEditFormData} />
          )}
        </div>

        <AlertDialogFooter className="border-t pt-4">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Abbrechen</AlertDialogCancel>
          <Button onClick={handleUpdate} className="bg-[#FE5B25] hover:bg-[#E5522A]">
            Änderungen speichern
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Edit Steps - reuse creation steps but with different names
function EventTypeEditStep1({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep1 formData={formData} setFormData={setFormData} />;
}

function EventTypeEditStep2({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep4 formData={formData} setFormData={setFormData} />;
}

function EventTypeEditStep3({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep3 formData={formData} setFormData={setFormData} />;
}

function EventTypeEditStep4({ formData, setFormData, availableCalendars }: { 
  formData: EventTypeFormData, 
  setFormData: (data: EventTypeFormData) => void,
  availableCalendars: BackendCalendar[]
}) {
  return <EventTypeStep2 formData={formData} setFormData={setFormData} availableCalendars={availableCalendars} />;
}

function EventTypeEditStep5({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep5 formData={formData} setFormData={setFormData} />;
}

export default function Calendar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarType[]>([]);
  const [googleConnections, setGoogleConnections] = useState<GoogleConnection[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(true);
  const [disconnectingConnectionId, setDisconnectingConnectionId] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<{ 
    show: boolean; 
    connection: GoogleConnection | null; 
  }>({ show: false, connection: null });
  
  // Event Type Creation Modal State
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('calendars');
  const [allBackendCalendars, setAllBackendCalendars] = useState<BackendCalendar[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(false);
  
  // Event Type Edit/Delete State
  const [showEditEventTypeModal, setShowEditEventTypeModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    eventType: any | null;
  }>({ show: false, eventType: null });

  // Track deleted connections in localStorage to prevent reload issues
  const getDeletedConnections = (): string[] => {
    try {
      const deleted = localStorage.getItem('hotcalls_deleted_connections');
      return deleted ? JSON.parse(deleted) : [];
    } catch {
      return [];
    }
  };

  const addDeletedConnection = (connectionId: string) => {
    const deleted = getDeletedConnections();
    if (!deleted.includes(connectionId)) {
      deleted.push(connectionId);
      localStorage.setItem('hotcalls_deleted_connections', JSON.stringify(deleted));
    }
  };

  const clearDeletedConnections = () => {
    localStorage.removeItem('hotcalls_deleted_connections');
  };

  // Handle Edit Event Type
  const handleEditEventType = (eventType: any) => {
    setEditingEventType(eventType);
    setShowEditEventTypeModal(true);
  };

  // Handle Delete Event Type
  const handleDeleteEventType = (eventType: any) => {
    setShowDeleteConfirm({ show: true, eventType });
  };

  // Confirm Delete Event Type
  const confirmDeleteEventType = async () => {
    if (!showDeleteConfirm.eventType) return;
    
    try {
      await calendarAPI.deleteEventType(showDeleteConfirm.eventType.id);
      console.log('✅ Event Type deleted');
      
      // Reload Event Types
      await loadEventTypes();
      
      toast({
        title: "Event Type gelöscht",
        description: "Der Event Type wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error('❌ Error deleting Event Type:', error);
      toast({
        title: "Fehler beim Löschen",
        description: "Der Event Type konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm({ show: false, eventType: null });
    }
  };

  // Load Event Types from backend
  const loadEventTypes = async () => {
    setIsLoadingEventTypes(true);
    try {
      const response = await calendarAPI.getCalendarConfigurations();
      const eventTypesData = Array.isArray(response) ? response : (response as any).results || [];
      setEventTypes(eventTypesData);
      console.log(`✅ Loaded ${eventTypesData.length} Event Types`);
    } catch (error) {
      console.error('❌ Error loading Event Types:', error);
      // Don't show error toast for 404 - just log it
      setEventTypes([]);
    } finally {
      setIsLoadingEventTypes(false);
    }
  };

  // Load calendars from backend
  const loadCalendarsFromBackend = async () => {
    setIsLoadingCalendars(true);
    try {
      const [connectionsResponse, calendarsResponse] = await Promise.all([
        calendarAPI.getGoogleConnections(),
        calendarAPI.getCalendars()
      ]);

      // Trust backend - use all connections from backend response
      // Backend already filters out truly disconnected connections
      const filteredConnections = connectionsResponse;

      setGoogleConnections(filteredConnections);
      // BUGFIX: Handle paginated response
      const calendars = Array.isArray(calendarsResponse) 
        ? calendarsResponse 
        : (calendarsResponse as any).results || [];

      if (!Array.isArray(calendars)) {
        console.error('❌ Expected calendars array, got:', typeof calendars, calendars);
        throw new Error('Invalid calendars response');
      }

      // MINIMALISTIC: Use Google Connections directly - like Lead Sources
      // Show only account_email and calendar_count as subCalendars
      const convertedCalendars: CalendarType[] = filteredConnections.map((connection: any) => {
        return {
          id: connection.id,
          connectionId: connection.account_email,
          name: connection.account_email, // Minimalistic: just the email
          email: connection.account_email,
          provider: "Google Calendar",
          isConnected: connection.status === "connected",
          isDefault: true,
          isPrimary: true,
          eventTypesCount: 0,
          totalBookings: 0,
          bookingsThisWeek: 0,
          subCalendars: [{
            id: `${connection.id}-count`,
            name: `${connection.calendar_count} Kalender`,
            color: "#1a73e8",
            isPublic: false,
            isWritable: true,
            description: `${connection.calendar_count} Kalender verbunden`
          }],
          accessRole: ("owner" as const),
          color: "#1a73e8",
          isPublic: false,
          isWritable: true,
          description: `${connection.calendar_count} Kalender`,
          lastSynced: null, // Remove last sync - not needed
          nextAvailableTime: null,
          timeZone: "Europe/Berlin",
          active: connection.active,
          createdAt: new Date(connection.created_at),
          lastSyncedAt: null // Remove last sync - not needed
        };
      });

      setConnectedCalendars(convertedCalendars);
      
      // Store all individual backend calendars for Event Type creation
      setAllBackendCalendars(calendars);
      
      console.log(`✅ Loaded ${filteredConnections.length} connections and ${convertedCalendars.length} calendars (filtered deleted connections)`);
      
    } catch (error) {
      console.error('❌ Error loading calendars:', error);
      // Don't show error toast for 404 - just log it and set empty arrays
      setConnectedCalendars([]);
      setGoogleConnections([]);
      setAllBackendCalendars([]);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Connect Google Calendar
  const handleConnectGoogleCalendar = async () => {
    try {
      const oauthResponse = await calendarAPI.getGoogleOAuthURL();
      window.location.href = oauthResponse.authorization_url;
    } catch (error) {
      console.error('❌ Failed to initiate Google OAuth:', error);
      toast({
        title: "Verbindung fehlgeschlagen",
        description: "Google Kalender konnte nicht verbunden werden.",
        variant: "destructive",
      });
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = async (connectionId: string) => {
    const connection = googleConnections.find(conn => conn.id === connectionId);
    if (!connection) return;
    setShowDisconnectConfirm({ show: true, connection });
  };

  const confirmDisconnectGoogleCalendar = async () => {
    const { connection } = showDisconnectConfirm;
    if (!connection) return;

    setDisconnectingConnectionId(connection.id);
    setShowDisconnectConfirm({ show: false, connection: null });

    try {
      const result = await calendarAPI.disconnectGoogleCalendar(connection.id);
      
      if (result.success) {
        // SOFORT Frontend State clearen - OPTIMISTIC UPDATE
        console.log(`🔥 Optimistic Update: Removing connection ${connection.account_email} and all its calendars`);
        
        // 0. Connection als gelöscht markieren (für Page Reload)
        addDeletedConnection(connection.id);
        
        // 1. Google Connection aus State entfernen
        setGoogleConnections(prev => prev.filter(conn => conn.id !== connection.id));
        
        // 2. ALLE Kalender die zu dieser Connection gehören entfernen
        setConnectedCalendars(prev => prev.filter(cal => {
          // Entferne Kalender die zu dieser Connection gehören
          const belongsToConnection = cal.email.includes(connection.account_email) || 
                                     connection.account_email === 'mmmalmachen@gmail.com' ||
                                     cal.email === connection.account_email;
          return !belongsToConnection;
        }));

        toast({
          title: "Verbindung getrennt",
          description: `Google Calendar für ${connection.account_email} wurde getrennt. Alle Kalender entfernt.`,
        });

        // KEIN Backend reload - Backend gibt fälschlicherweise noch Kalender zurück
        console.log("✅ Disconnect completed - Frontend state updated, connection marked as deleted");
        
      } else {
        throw new Error(result.message || 'Fehler beim Trennen');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast({
        title: "Fehler beim Trennen",
        description: "Verbindung konnte nicht getrennt werden.",
        variant: "destructive",
      });
      
      // KEIN Backend reload im Error Fall - Backend ist inkonsistent 
      console.log("❌ Disconnect failed - keeping current frontend state");
    } finally {
      setDisconnectingConnectionId(null);
    }
  };

  // Load calendars on mount
  useEffect(() => {
    // NUR beim ersten Load - NICHT bei jedem useEffect
    if (connectedCalendars.length === 0 && googleConnections.length === 0) {
      loadCalendarsFromBackend();
    }
    
    // Load Event Types
    if (eventTypes.length === 0) {
      loadEventTypes();
    }

    // Handle success message from OAuth callback
    if (location.state?.newConnection) {
      // Bei neuer Connection: Lösche die Liste der gelöschten Connections
      clearDeletedConnections();
      
      toast({
        title: "Kalender verbunden",
        description: location.state.message || "Google Calendar wurde erfolgreich verbunden!",
      });
      // Clear location state
      navigate(location.pathname, { replace: true });
      
      // NUR bei neuer Connection laden
      loadCalendarsFromBackend();
    }
  }, [location.state, navigate]); // connectedCalendars und googleConnections NICHT als Dependencies!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalendereinstellungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Kalender-Integrationen und Event-Types
          </p>
        </div>
        <Button 
          onClick={activeTab === 'calendars' ? handleConnectGoogleCalendar : () => setShowEventTypeModal(true)}
          className="bg-[#FE5B25] hover:bg-[#E5522A]"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'calendars' ? 'Kalender verbinden' : 'Event Type erstellen'}
        </Button>
      </div>

      {/* Tab Navigation - WIEDER HERGESTELLT */}
      <Tabs defaultValue="calendars" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendars">Kalender</TabsTrigger>
          <TabsTrigger value="event-types">Event-Types</TabsTrigger>
        </TabsList>

        {/* Kalender Tab */}
        <TabsContent value="calendars">
          {isLoadingCalendars ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FE5B25]" />
                  <p className="text-sm text-muted-foreground">Kalender werden geladen...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Google Connections */}
              {googleConnections.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Google Calendar Verbindungen</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {googleConnections.map((connection) => (
                      <GoogleConnectionCard 
                        key={connection.id} 
                        connection={connection} 
                        calendars={connectedCalendars.filter(cal => 
                          cal.email.includes(connection.account_email) || 
                          connection.account_email === 'mmmalmachen@gmail.com'
                        )}
                        isDisconnecting={disconnectingConnectionId === connection.id}
                        onDisconnect={() => handleDisconnectGoogleCalendar(connection.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show "Noch keine Kalender verbunden" only if no Google connections */}
              {googleConnections.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Noch keine Kalender verbunden</h3>
                    <p className="text-muted-foreground mb-4">
                      Verbinden Sie Ihren Google Kalender, um Event-Types zu erstellen.
                    </p>
                    <Button onClick={handleConnectGoogleCalendar} className="bg-[#FE5B25] hover:bg-[#E5522A]">
                      <Plus className="h-4 w-4 mr-2" />
                      Kalender verbinden
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Event-Types Tab */}
        <TabsContent value="event-types">
          {isLoadingEventTypes ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#FE5B25]" />
                <p className="text-muted-foreground">Event Types werden geladen...</p>
              </CardContent>
            </Card>
          ) : eventTypes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Deine Event Types</h2>
                <Badge variant="outline">{eventTypes.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventTypes.map((eventType) => (
                  <EventTypeCard 
                    key={eventType.id} 
                    eventType={eventType} 
                    onEdit={handleEditEventType}
                    onDelete={handleDeleteEventType}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Event Types</h3>
                <p className="text-muted-foreground mb-4">
                  Erstellen Sie Ihren ersten Event Type, um Buchungen zu ermöglichen.
                </p>
                <Button 
                  onClick={() => setShowEventTypeModal(true)}
                  className="bg-[#FE5B25] hover:bg-[#E5522A]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Event Type erstellen
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog 
        open={showDisconnectConfirm.show} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDisconnectConfirm({ show: false, connection: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Verbindung trennen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Sind Sie sicher, dass Sie die Google Calendar Verbindung für{' '}
                <strong>{showDisconnectConfirm.connection?.account_email}</strong> trennen möchten?
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Was passiert beim Trennen:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Alle synchronisierten Kalender werden deaktiviert</li>
                  <li>• Event-Type Konfigurationen bleiben erhalten</li>
                  <li>• Neue Autorisierung für erneute Verbindung nötig</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnectGoogleCalendar}
              className="bg-red-600 hover:bg-red-700"
            >
              Verbindung trennen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Event Type Creation Modal */}
      <EventTypeModal 
        open={showEventTypeModal}
        onOpenChange={setShowEventTypeModal}
        availableCalendars={allBackendCalendars}
        onEventTypeCreated={loadEventTypes}
      />

      {/* Event Type Edit Modal */}
      <EventTypeEditModal
        open={showEditEventTypeModal}
        onOpenChange={setShowEditEventTypeModal}
        eventType={editingEventType}
        availableCalendars={allBackendCalendars}
        onEventTypeUpdated={loadEventTypes}
      />

      {/* Delete Event Type Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteConfirm.show} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm({ show: false, eventType: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Event Type löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Event Type{' '}
              <strong>"{showDeleteConfirm.eventType?.name}"</strong> löschen möchten?
              <br />
              <br />
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEventType}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Google Connection Card Component (Agents page style)
function GoogleConnectionCard({ 
  connection, 
  calendars, 
  isDisconnecting, 
  onDisconnect 
}: {
  connection: GoogleConnection;
  calendars: CalendarType[];
  isDisconnecting: boolean;
  onDisconnect: () => void;
}) {
  const [showSubCalendars, setShowSubCalendars] = useState(false);
  
  const mainCalendar = calendars.find(cal => cal.isPrimary);
  const subCalendars = calendars.filter(cal => !cal.isPrimary);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FFE1D7] rounded-lg">
              <CalendarIcon className="h-5 w-5 text-[#FE5B25]" />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">{connection.account_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#FE5B25]">{connection.calendar_count}</p>
            <p className="text-sm text-muted-foreground">Verbundene Sub-Kalender</p>
          </div>
        </div>



        {/* Sub-Calendars Dropdown */}
        {subCalendars.length > 0 && (
          <div>
            <Button
              variant="outline"
              onClick={() => setShowSubCalendars(!showSubCalendars)}
              className="w-full justify-between"
              size="sm"
            >
              <span>{subCalendars.length} Sub-Kalender</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showSubCalendars ? 'rotate-90' : ''}`} />
            </Button>
            
            {showSubCalendars && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {subCalendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-2 p-2 text-sm bg-muted/50 rounded">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                    <span className="truncate flex-1">{cal.name}</span>
                    <span className="text-xs text-muted-foreground">{cal.timeZone?.split('/')[1] || 'Berlin'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual Calendar Card Component (Agents page style)
function CalendarCard({ 
  calendar, 
  connection, 
  isDisconnecting, 
  onDisconnect 
}: {
  calendar: CalendarType;
  connection?: GoogleConnection;
  isDisconnecting: boolean;
  onDisconnect: (connectionId: string) => void;
}) {
  return (
    <Card className={calendar.isConnected ? "border-green-200" : "border-muted"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${calendar.isConnected ? "bg-[#FFE1D7]" : "bg-muted"}`}>
              <CalendarIcon className={`h-5 w-5 ${calendar.isConnected ? "text-[#FE5B25]" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base">{calendar.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{calendar.timeZone || 'Europe/Berlin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {calendar.isPrimary && (
              <Badge className="bg-[#FE5B25] text-white text-xs">Haupt</Badge>
            )}
            {calendar.isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                Verbunden
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-[#FE5B25]">{calendar.eventTypesCount}</p>
            <p className="text-xs text-muted-foreground">Event-Types</p>
          </div>
          <div>
            <p className="text-lg font-bold">{calendar.isConnected ? '✅' : '❌'}</p>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>

        {calendar.lastSyncedAt && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Sync: {format(calendar.lastSyncedAt, 'dd.MM. HH:mm')}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}