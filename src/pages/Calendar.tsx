import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Check, 
  Clock, 
  ExternalLink, 
  Loader2, 
  Plus, 
  Settings, 
  Trash2, 
  Users,
  ArrowRight,
  ArrowLeft,
  X
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { calendarAPI, BackendCalendar, GoogleConnection, MicrosoftConnection } from "@/lib/apiService";
import { getCalendarDisplayName, getCalendarEmail, saveCalendars } from "@/lib/calendarService";
import { useWorkspace } from "@/hooks/use-workspace";

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

function EventTypeStep2({ formData, setFormData, availableCalendars, workspaceId }: { 
  formData: EventTypeFormData, 
  setFormData: (data: EventTypeFormData) => void,
  availableCalendars: BackendCalendar[],
  workspaceId?: string
}) {
  const [subAccounts, setSubAccounts] = useState<Array<{ id: string; provider: 'google'|'outlook'; label: string }>>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    const loadSubs = async () => {
      if (!workspaceId) { setSubAccounts([]); return; }
      setLoadingSubs(true);
      try {
        const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
        const items = await eventTypeAPI.listSubAccounts(workspaceId);
        setSubAccounts(Array.isArray(items) ? items as any : []);
      } catch (e) {
        setSubAccounts([]);
      } finally {
        setLoadingSubs(false);
      }
    };
    loadSubs();
  }, [workspaceId]);

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
          onValueChange={(value) => {
            // Auto-select target as conflict (purely visual) and keep unique
            const targetId = value;
            const conflicts = new Set([...(formData.conflictCheckCalendars || [])]);
            if (targetId && targetId !== 'none') conflicts.add(targetId);
            setFormData({
              ...formData,
              calendar: value,
              conflictCheckCalendars: Array.from(conflicts)
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kalender auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Zielkalender</SelectItem>
            {(loadingSubs ? [] : subAccounts).map((sa) => (
              <SelectItem key={sa.id} value={sa.id}>
                {sa.label} ({sa.provider === 'outlook' ? 'Microsoft 365' : 'Google Calendar'})
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
          {(loadingSubs ? [] : subAccounts).map((sa) => (
            <div key={sa.id} className="flex items-center space-x-2">
              <Checkbox 
                id={sa.id}
                checked={formData.conflictCheckCalendars.includes(sa.id)}
                disabled
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData, 
                      conflictCheckCalendars: [...formData.conflictCheckCalendars, sa.id]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      conflictCheckCalendars: formData.conflictCheckCalendars.filter(id => id !== sa.id)
                    });
                  }
                }}
              />
              <Label htmlFor={sa.id} className="flex items-center space-x-2">
                <span>{sa.label} <span className="text-xs text-muted-foreground">({sa.provider === 'outlook' ? 'Microsoft 365' : 'Google Calendar'})</span></span>
                {formData.calendar === sa.id && formData.calendar !== 'none' && (
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

function EventTypeStep4({ formData, setFormData, availableCalendars }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void, availableCalendars?: BackendCalendar[] }) {
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
        <Label>Mindestvorlaufzeit (Stunden)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Mindestens diese Zeit vor Buchung und Gerplan-Termin
        </p>
        <Input
          type="number"
          min="0"
          max="72"
          value={formData.days_buffer}
          onChange={(e) => {
            const value = Math.max(0, parseInt(e.target.value) || 0);
            setFormData({...formData, days_buffer: value});
          }}
        />
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
          <Button
            variant={formData.meeting_type === 'online' ? 'default' : 'outline'}
            className={formData.meeting_type === 'online' ? 'bg-[#FE5B25]' : ''}
            onClick={() => setFormData({ ...formData, meeting_type: 'online' })}
          >
            📹 Online Meeting
          </Button>
          <Button
            variant={formData.meeting_type === 'in_person' ? 'default' : 'outline'}
            className={formData.meeting_type === 'in_person' ? 'bg-[#FE5B25]' : ''}
            onClick={() => setFormData({ ...formData, meeting_type: 'in_person' })}
          >
            📍 Vor Ort
          </Button>
        </div>
        {formData.meeting_type === 'online' && (
          <p className="text-xs text-muted-foreground mt-2">Der Meeting‑Link wird automatisch vom Provider erstellt (Google Meet oder Microsoft Teams).</p>
        )}
      </div>

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
            onChange={(e) => setFormData({ ...formData, meeting_address: e.target.value })}
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
  onEventTypeCreated,
  workspaceId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCalendars: BackendCalendar[];
  onEventTypeCreated: () => void;
  workspaceId: string;
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
    
    if (currentStep < 5) {
      
      setCurrentStep(currentStep + 1);
    } else {
      
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Build working_hours from workdays + times
      const weekdayMap: Record<string, number> = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
      const working_hours = (formData.workdays || []).map(d => ({ day_of_week: weekdayMap[d], start_time: formData.from_time, end_time: formData.to_time }));
      // Build calendar_mappings from selected target + conflicts
      const targetId = formData.calendar !== 'none' ? formData.calendar : null;
      const conflictIds = (formData.conflictCheckCalendars || []).filter(id => id && id !== targetId);
      const calendar_mappings = [
        ...(targetId ? [{ sub_account_id: targetId, role: 'target' as const }] : []),
        ...conflictIds.map(id => ({ sub_account_id: id, role: 'conflict' as const }))
      ];
      const payload = {
        name: formData.name,
        duration: formData.duration,
        timezone: 'Europe/Berlin',
        buffer_time: formData.days_buffer, // days->hours mapping can be refined if needed
        prep_time: formData.prep_time,
        working_hours,
        calendar_mappings,
      };

      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      const response = await eventTypeAPI.createEventType(String(workspaceId || ''), payload);
      
      
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
      console.error("[ERROR]:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Type erstellen - Schritt {currentStep} von 5</DialogTitle>
        </DialogHeader>
        
        {/* Multi-Step Content */}
        {currentStep === 1 && (
          <EventTypeStep1 formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 2 && (
          <EventTypeStep2 
            formData={formData} 
            setFormData={setFormData} 
            availableCalendars={availableCalendars} 
            workspaceId={workspaceId}
          />
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

        <DialogFooter className="flex justify-between">
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
              <Button onClick={handleNext} className="bg-[#FE5B25] hover:bg-[#fe5b25]/90">
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-[#FE5B25] hover:bg-[#fe5b25]/90">
                Event Type erstellen
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  const formatBufferTime = (hours: number) => {
    if (hours === 0) return null;
    if (hours === 1) return '1 Stunde';
    return `${hours} Stunden`;
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
            <p className="text-sm truncate">{eventType.name || 'Nicht zugewiesen'}</p>
          </div>
          
          {eventType.prep_time > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pufferzeit</p>
              <p className="text-sm">{eventType.prep_time} Min vor Termin</p>
            </div>
          )}

          {eventType.buffer_time > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vorlaufzeit</p>
              <p className="text-sm">{formatBufferTime(eventType.buffer_time)}</p>
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
  onEventTypeUpdated,
  workspaceId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: any;
  availableCalendars: BackendCalendar[];
  onEventTypeUpdated: () => void;
  workspaceId: string;
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

  // Load eventType data when modal opens (map backend fields → edit form)
  useEffect(() => {
    if (eventType && open) {
      const weekdayNames = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const wh = Array.isArray(eventType.working_hours) ? eventType.working_hours : [];
      const enabledDays = wh
        .map((h: any) => typeof h.day_of_week === 'number' ? weekdayNames[h.day_of_week] : null)
        .filter(Boolean);
      const firstWh = wh && wh.length > 0 ? wh[0] : { start_time: '09:00:00', end_time: '17:00:00' };
      const mappings = Array.isArray(eventType.calendar_mappings) ? eventType.calendar_mappings : [];
      const targetMap = mappings.find((m: any) => m.role === 'target');
      const conflictIds = mappings.filter((m: any) => m.role === 'conflict').map((m: any) => m.sub_account_id);

      setEditFormData({
        name: eventType.name || '',
        duration: eventType.duration || 60,
        calendar: targetMap ? String(targetMap.sub_account_id) : 'none',
        conflictCheckCalendars: conflictIds,
        workdays: enabledDays.length > 0 ? enabledDays as any : ['monday','tuesday','wednesday','thursday','friday'],
        from_time: (firstWh.start_time || '09:00:00'),
        to_time: (firstWh.end_time || '17:00:00'),
        prep_time: eventType.prep_time || 0,
        days_buffer: eventType.buffer_time || 0,
        meeting_type: eventType.meeting_type || 'online',
        meeting_link: eventType.meeting_link || '',
        meeting_address: eventType.meeting_address || ''
      });
    }
  }, [eventType, open]);

  const handleUpdate = async () => {
    try {
      const weekdayMap: Record<string, number> = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
      const working_hours = (editFormData.workdays || []).map(d => ({ day_of_week: weekdayMap[d], start_time: editFormData.from_time, end_time: editFormData.to_time }));
      const targetId = editFormData.calendar !== 'none' ? editFormData.calendar : null;
      const conflictIds = (editFormData.conflictCheckCalendars || []).filter(id => id && id !== targetId);
      const calendar_mappings = [
        ...(targetId ? [{ sub_account_id: targetId, role: 'target' as const }] : []),
        ...conflictIds.map(id => ({ sub_account_id: id, role: 'conflict' as const }))
      ];
      const payload = {
        name: editFormData.name,
        duration: editFormData.duration,
        timezone: 'Europe/Berlin',
        buffer_time: editFormData.days_buffer,
        prep_time: editFormData.prep_time,
        working_hours,
        calendar_mappings,
      };

      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      await eventTypeAPI.updateEventType(String(workspaceId || ''), eventType.id, payload);
      
      
      onEventTypeUpdated();
      onOpenChange(false);
      
    } catch (error) {
      console.error("[ERROR]:", error);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle>Event-Typ bearbeiten</DialogTitle>
            </div>
            
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
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {activeEditTab === 'grundinformationen' && (
            <EventTypeEditStep1 formData={editFormData} setFormData={setEditFormData} />
          )}
          {activeEditTab === 'planung' && (
            <EventTypeEditStep2 formData={editFormData} setFormData={setEditFormData} workspaceId={workspaceId} />
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

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleUpdate} className="bg-[#FE5B25] hover:bg-[#fe5b25]/90">
            Änderungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Steps - reuse creation steps but with different names
function EventTypeEditStep1({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep1 formData={formData} setFormData={setFormData} />;
}

function EventTypeEditStep2({ formData, setFormData, workspaceId }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void, workspaceId?: string }) {
  // Planung → same as creation Step2 (calendars), not Step4
  return <EventTypeStep2 formData={formData} setFormData={setFormData} availableCalendars={[]} workspaceId={workspaceId} />;
}

function EventTypeEditStep3({ formData, setFormData }: { formData: EventTypeFormData, setFormData: (data: EventTypeFormData) => void }) {
  return <EventTypeStep3 formData={formData} setFormData={setFormData} />;
}

function EventTypeEditStep4({ formData, setFormData, availableCalendars, workspaceId }: { 
  formData: EventTypeFormData, 
  setFormData: (data: EventTypeFormData) => void,
  availableCalendars: BackendCalendar[],
  workspaceId?: string
}) {
  // Kalender → calendars step
  return <EventTypeStep4 formData={formData} setFormData={setFormData} availableCalendars={availableCalendars} />;
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
  // Current workspace
  const { primaryWorkspace } = useWorkspace();
  const [googleConnections, setGoogleConnections] = useState<GoogleConnection[]>([]);
  const [microsoftConnections, setMicrosoftConnections] = useState<MicrosoftConnection[]>([]);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [msCalendarsByConnection, setMsCalendarsByConnection] = useState<Record<string, { id: string; name: string; is_primary: boolean; owner_email: string; can_edit: boolean }[]>>({});
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(true);
  const [disconnectingConnectionId, setDisconnectingConnectionId] = useState<string | null>(null);
  const [msDisconnectingConnectionId, setMsDisconnectingConnectionId] = useState<string | null>(null);
  const [msRefreshingConnectionId, setMsRefreshingConnectionId] = useState<string | null>(null);
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

  // Determine if any calendar exists - use generic calendar API as single source of truth
  const hasAnyCalendarConnected = React.useMemo(() => {
    // If the generic /api/calendars/ API returns any calendars, ALWAYS allow event type creation
    const hasCalendars = connectedCalendars.length > 0;
    
    return hasCalendars;
  }, [connectedCalendars.length]);

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
      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      await eventTypeAPI.deleteEventType(String(primaryWorkspace?.id || ''), showDeleteConfirm.eventType.id);
      
      
      // Reload Event Types
      await loadEventTypes();
      
      toast({
        title: "Event Type gelöscht",
        description: "Der Event Type wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error("[ERROR]:", error);
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
      if (!primaryWorkspace?.id) { setEventTypes([]); setIsLoadingEventTypes(false); return; }
      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      const eventTypesData = await eventTypeAPI.listEventTypes(String(primaryWorkspace.id));
      setEventTypes(eventTypesData);
      
    } catch (error) {
      console.error("[ERROR]:", error);
      setEventTypes([]);
    } finally {
      setIsLoadingEventTypes(false);
    }
  };

  // Load calendars from backend using generic calendar API
  const loadCalendarsFromBackend = async () => {
    setIsLoadingCalendars(true);
    try {
      console.log('📅 Loading calendars from generic API...');
      const calendarsResponse = await calendarAPI.getCalendars();
      const calendars = Array.isArray(calendarsResponse)
        ? calendarsResponse
        : (calendarsResponse as any).results || [];

      console.log('📅 Raw calendar API response:', { calendarsResponse, calendars, count: calendars.length });

      if (!Array.isArray(calendars)) {
        console.error("[ERROR]:", error);
        throw new Error('Invalid calendars response');
      }

      // Filter by workspace if needed
      const wsId = String(primaryWorkspace?.id || '');
      const filteredCalendars = wsId
        ? calendars.filter((c: any) => String(c.workspace) === wsId || String((c as any)?.workspace_id) === wsId)
        : calendars;

      console.log('📅 Filtered calendars for workspace:', { wsId, filteredCount: filteredCalendars.length, filteredCalendars });

      // Convert to frontend calendar format - focus on the generic calendar data
      const convertedCalendars: CalendarType[] = filteredCalendars.map((c: any) => {
        const isGoogle = (c.provider === 'google');
        const isOutlook = (c.provider === 'outlook' || c.provider === 'microsoft');
        const providerDetails = (c as any)?.provider_details || {};
        const finalProvider = isGoogle ? 'Google Calendar' : (isOutlook ? 'Microsoft 365' : 'Unknown Provider');
        
        return {
          id: c.id,
          connectionId: '',
          name: c.name,
          email: isGoogle ? (providerDetails.account_email || '') : (providerDetails.primary_email || ''),
          provider: finalProvider,
          isConnected: !!c.active,
          isDefault: false,
          isPrimary: !!providerDetails.primary,
          eventTypesCount: typeof c.config_count === 'number' ? c.config_count : 0,
          totalBookings: 0,
          bookingsThisWeek: 0,
          subCalendars: [],
          accessRole: ("owner" as const),
          color: isGoogle ? "#1a73e8" : (isOutlook ? "#2563eb" : "#6b7280"),
          timeZone: providerDetails.time_zone || providerDetails.timezone_windows || 'Europe/Berlin',
          active: !!c.active,
          createdAt: new Date(c.created_at),
          lastSyncedAt: null
        };
      });

      // Create simple connection maps for UI display (derived from generic calendar data)
      const googleConnections: GoogleConnection[] = [];
      const microsoftConnections: MicrosoftConnection[] = [];
      
      const googleEmails = new Set<string>();
      const microsoftEmails = new Set<string>();
      
      convertedCalendars.forEach(cal => {
        if (cal.provider === 'Google Calendar' && cal.email && !googleEmails.has(cal.email)) {
          googleEmails.add(cal.email);
          googleConnections.push({
            id: cal.id,
            account_email: cal.email,
            active: cal.isConnected,
            calendar_count: 1,
            status: cal.isConnected ? 'active' : 'inactive'
          });
        } else if (cal.provider === 'Microsoft 365' && cal.email && !microsoftEmails.has(cal.email)) {
          microsoftEmails.add(cal.email);
          microsoftConnections.push({
            id: cal.id,
            workspace: wsId,
            primary_email: cal.email,
            active: cal.isConnected
          });
        }
      });

      console.log('📅 Final calendar state:', {
        convertedCalendars: convertedCalendars.length,
        googleConnections: googleConnections.length,
        microsoftConnections: microsoftConnections.length
      });

      // Set state - the key is that connectedCalendars contains all the active calendars
      setConnectedCalendars(convertedCalendars);
      setGoogleConnections(googleConnections);
      setMicrosoftConnections(microsoftConnections);
      setMsCalendarsByConnection({}); // Legacy - no longer used
      setAllBackendCalendars(calendars);

    } catch (error) {
      console.error("[ERROR]:", error);
      setConnectedCalendars([]);
      setGoogleConnections([]);
      setMicrosoftConnections([]);
      setAllBackendCalendars([]);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Microsoft actions
  const handleRefreshMicrosoftConnection = async (connectionId: string) => {
    try {
      setMsRefreshingConnectionId(connectionId);
      // Generic approach: find a calendar to sync
      const cal = connectedCalendars.find(c => c.id === connectionId || c.email === (microsoftConnections.find(m => m.id === connectionId)?.primary_email));
      if (cal) await calendarAPI.syncCalendar(cal.id);
      toast({ title: 'Aktualisiert', description: 'Kalender synchronisiert.' });
    } catch (e) {
      console.error("[ERROR]:", error);
      toast({ title: 'Fehler', description: 'Aktualisieren fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setMsRefreshingConnectionId(null);
      loadCalendarsFromBackend();
    }
  };

  const handleDisconnectMicrosoftConnection = async (connectionId: string) => {
    setShowMsDisconnectConfirm({ show: true, connectionId });
  };

  const [showMsDisconnectConfirm, setShowMsDisconnectConfirm] = useState<{ show: boolean; connectionId: string | null }>({ show: false, connectionId: null });

  const confirmDisconnectMicrosoft = async () => {
    const id = showMsDisconnectConfirm.connectionId;
    if (!id) return;
    try {
      setMsDisconnectingConnectionId(id);
      const res = await calendarAPI.disconnectMicrosoftCalendar(id);
      if (res?.success) {
        setMicrosoftConnections(prev => prev.filter(c => c.id !== id));
        const map = { ...msCalendarsByConnection };
        delete map[id];
        setMsCalendarsByConnection(map);
        toast({ title: 'Verbindung getrennt', description: 'Microsoft 365 wurde getrennt.' });
        try { await loadEventTypes(); } catch {}
      } else {
        throw new Error(res?.message || 'Trennen fehlgeschlagen');
      }
    } catch (e) {
      console.error("[ERROR]:", error);
      toast({ title: 'Fehler', description: 'Trennen fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setMsDisconnectingConnectionId(null);
      setShowMsDisconnectConfirm({ show: false, connectionId: null });
    }
  };

  // Connect Google Calendar
  const handleConnectGoogleCalendar = async () => {
    try {
      const workspaceId = primaryWorkspace?.id ? String(primaryWorkspace.id) : undefined;
      const oauthResponse = await calendarAPI.getGoogleOAuthURL(workspaceId);
      window.location.href = oauthResponse.authorization_url;
    } catch (error) {
      console.error("[ERROR]:", error);
      toast({ title: "Verbindung fehlgeschlagen", description: "Google Kalender konnte nicht verbunden werden.", variant: "destructive" });
    }
  };

  const handleConnectMicrosoftCalendar = async () => {
    try {
      if (!primaryWorkspace?.id) throw new Error('No workspace');
      const oauthResponse = await calendarAPI.getMicrosoftOAuthURL(String(primaryWorkspace.id));
      window.location.href = oauthResponse.authorization_url;
    } catch (error) {
      console.error("[ERROR]:", error);
      toast({ title: "Verbindung fehlgeschlagen", description: "Microsoft 365 Kalender konnte nicht verbunden werden.", variant: "destructive" });
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
      // Delete all calendars for this account (provider-agnostic deletion)
      const allCalendars = await calendarAPI.getCalendars();
      const googleCalendars = (Array.isArray(allCalendars) ? allCalendars : (allCalendars as any)?.results || [])
        .filter((c: any) => c.provider === 'google');
      for (const cal of googleCalendars) {
        try { await calendarAPI.deleteCalendar(cal.id); } catch {}
      }

      // Update UI
      setGoogleConnections(prev => prev.filter(conn => conn.id !== connection.id));
      setConnectedCalendars(prev => prev.filter(cal => !(cal.email && connection.account_email && cal.email.includes(connection.account_email))));

      toast({ title: "Verbindung getrennt", description: `Google Calendar für ${connection.account_email} wurde getrennt.` });
      try { await loadEventTypes(); } catch {}
    } catch (error) {
      console.error("[ERROR]:", error);
      toast({ title: "Fehler beim Trennen", description: "Verbindung konnte nicht getrennt werden.", variant: "destructive" });
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

    // Handle success message from OAuth callback via state or query
    const params = new URLSearchParams(location.search);
    const oauthSuccess = params.get('oauth_success');
    const provider = params.get('provider');

    if (oauthSuccess === 'true') {
      const prov = provider === 'microsoft' ? 'Microsoft 365' : 'Google Calendar';
      toast({ title: 'Kalender verbunden', description: `${prov} erfolgreich verbunden.` });
      // Clear query params
      navigate(location.pathname, { replace: true });
      loadCalendarsFromBackend();
    }

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

  // Respond to calendar delete events to refresh lists
  useEffect(() => {
    const onUpdated = () => {
      loadCalendarsFromBackend();
      loadEventTypes();
    };
    window.addEventListener('hotcalls-calendars-updated', onUpdated as EventListener);
    return () => window.removeEventListener('hotcalls-calendars-updated', onUpdated as EventListener);
  }, []);

  // Ensure event types are fetched once workspace becomes available
  // and whenever user switches to the Event Types tab
  useEffect(() => {
    if (primaryWorkspace?.id && (activeTab === 'event-types')) {
      loadEventTypes();
    }
  }, [primaryWorkspace?.id, activeTab]);

  // Also fetch once as soon as workspace id is known (independent of tab)
  useEffect(() => {
    if (primaryWorkspace?.id) {
      loadEventTypes();
    }
  }, [primaryWorkspace?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalendereinstellungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Kalender‑Integrationen und Event‑Typen
          </p>
        </div>
        <Button 
          onClick={activeTab === 'calendars' ? () => setShowProviderDialog(true) : () => setShowEventTypeModal(true)}
          disabled={activeTab === 'event-types' && !hasAnyCalendarConnected}
          className="bg-[#FE5B25] hover:bg-[#fe5b25]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'calendars' ? 'Kalender verbinden' : 'Event‑Typ erstellen'}
        </Button>
      </div>

      {/* Tab Navigation - WIEDER HERGESTELLT */}
      <Tabs
        defaultValue="calendars"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          if (value === 'event-types') {
            try { loadEventTypes(); } catch {}
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendars">Kalender</TabsTrigger>
          <TabsTrigger value="event-types">Event‑Typen</TabsTrigger>
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
                          cal.email.includes(connection.account_email)
                        )}
                        isDisconnecting={disconnectingConnectionId === connection.id}
                        onDisconnect={() => handleDisconnectGoogleCalendar(connection.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Microsoft Connections */}
              {microsoftConnections.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Microsoft 365 Verbindungen</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {microsoftConnections.map((connection) => (
                      <MicrosoftConnectionCard 
                        key={connection.id} 
                        connection={connection} 
                        calendars={connectedCalendars.filter(cal => 
                          cal.provider === 'Microsoft 365' && (cal.email === connection.primary_email || cal.email.includes(connection.primary_email))
                        ).map(cal => ({ id: cal.id, name: cal.name, isPrimary: cal.isPrimary }))}
                        isDisconnecting={msDisconnectingConnectionId === connection.id}
                        onRefresh={() => handleRefreshMicrosoftConnection(connection.id)}
                        onDisconnect={() => handleDisconnectMicrosoftConnection(connection.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show "Noch keine Kalender verbunden" only if no connections */}
              {googleConnections.length === 0 && microsoftConnections.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Keine Kalender verbunden</h3>
                    <p className="text-muted-foreground mb-4">
                      Verbinde deinen Kalender (Google oder Microsoft 365), um Event‑Typen zu erstellen.
                    </p>
                    <Button onClick={() => setShowProviderDialog(true)} className="bg-[#FE5B25] hover:bg-[#fe5b25]/90">
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
                <p className="text-muted-foreground">Event‑Typen werden geladen...</p>
              </CardContent>
            </Card>
          ) : eventTypes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Deine Event‑Typen</h2>
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
                <h3 className="text-lg font-semibold mb-2">Noch keine Event‑Typen</h3>
                <p className="text-muted-foreground mb-4">
                  {hasAnyCalendarConnected
                    ? "Erstelle deinen ersten Event‑Typ, um Buchungen zu ermöglichen."
                    : "Verbinde zuerst einen Kalender (Google oder Microsoft 365), um Event‑Typen zu erstellen."
                 }
                </p>
                {/* Event Type Creation - Only if calendar connected (like WelcomeOverlay pattern) */}
                {hasAnyCalendarConnected && (
                  <Button 
                    onClick={() => setShowEventTypeModal(true)}
                    className="bg-[#FE5B25] hover:bg-[#fe5b25]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Event‑Typ erstellen
                  </Button>
                )}
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
              {(
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Was passiert beim Trennen:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Alle synchronisierten Kalender werden deaktiviert</li>
                    <li>• Event‑Types, die diesen Kalender als Ziel oder Konflikt nutzen, werden gelöscht</li>
                    <li>• Neue Autorisierung für erneute Verbindung nötig</li>
                  </ul>
                </div>
              )}
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

      {/* Provider Select Dialog */}
      <AlertDialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Kalender‑Provider auswählen</AlertDialogTitle>
            <AlertDialogDescription>
              Wähle, welchen Kalender du verbinden möchtest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="justify-start" onClick={handleConnectGoogleCalendar}>
              <img src="/192px.svg" alt="Google" className="mr-2 h-4 w-4" />
              Google Kalender verbinden
            </Button>
            <Button variant="outline" className="justify-start" onClick={handleConnectMicrosoftCalendar}>
              <img src="/Outlook.webp" alt="Outlook" className="mr-2 h-4 w-4" /> Microsoft 365 verbinden (Outlook/Exchange)
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Schließen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Microsoft Disconnect Confirmation Dialog */}
      <AlertDialog 
        open={showMsDisconnectConfirm.show}
        onOpenChange={(open) => {
          if (!open) setShowMsDisconnectConfirm({ show: false, connectionId: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Verbindung trennen (Microsoft 365)
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p> Sind Sie sicher, dass Sie die Microsoft 365 Verbindung trennen möchten?</p>
              {(
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Was passiert beim Trennen:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Alle synchronisierten Kalender werden deaktiviert</li>
                    <li>• Event‑Types, die diesen Kalender als Ziel oder Konflikt nutzen, werden gelöscht</li>
                    <li>• Neue Autorisierung für erneute Verbindung nötig</li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnectMicrosoft} className="bg-red-600 hover:bg-red-700">
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
        workspaceId={String(primaryWorkspace?.id || '')}
      />

      {/* Event Type Edit Modal */}
      <EventTypeEditModal
        open={showEditEventTypeModal}
        onOpenChange={setShowEditEventTypeModal}
        eventType={editingEventType}
        availableCalendars={allBackendCalendars}
        onEventTypeUpdated={loadEventTypes}
        workspaceId={String(primaryWorkspace?.id || '')}
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
  // Showing only the connection card without sub-calendars

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg">
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
        {/* Only show the connection; no sub-calendar count or dropdown */}
      </CardContent>
    </Card>
  );
}

// Microsoft 365 Connection Card Component
function MicrosoftConnectionCard({
  connection,
  calendars,
  isDisconnecting,
  onRefresh,
  onDisconnect
}: {
  connection: MicrosoftConnection;
  calendars: Array<{ id: string; name: string; isPrimary?: boolean }>;
  isDisconnecting: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const primaryCal = calendars.find(c => c.isPrimary);
  const subCount = calendars.length > 0 ? calendars.length - (primaryCal ? 1 : 0) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Microsoft 365</CardTitle>
              <p className="text-sm text-muted-foreground">{connection.primary_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aktualisieren'}
            </Button>
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
            <p className="text-2xl font-bold text-blue-600">{calendars.length}</p>
            <p className="text-sm text-muted-foreground">Verbundene Kalender</p>
          </div>
        </div>

        {subCount > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {calendars.map((cal) => (
              <div key={cal.id} className="flex items-center gap-2 p-2 text-sm bg-muted/50 rounded">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="truncate flex-1">{cal.name}</span>
                {cal.isPrimary ? (
                  <span className="text-xs text-blue-600">Primär</span>
                ) : null}
              </div>
            ))}
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [affectedEventTypes, setAffectedEventTypes] = useState<Array<{ id: string; name: string }> | null>(null);

  const handleDeleteCalendar = async () => {
    try {
      setIsDeleting(true);
      const [{ calendarAPI }] = await Promise.all([import("@/lib/apiService")]);
      await calendarAPI.deleteCalendar(calendar.id);
      // Optimistic UI: remove from local state by reloading calendars/events in parent via storage/event
      window.dispatchEvent(new CustomEvent('hotcalls-calendars-updated'));
    } catch (e) {
      console.error("[ERROR]:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Load affected Event-Types when the confirm dialog opens
  useEffect(() => {
    const loadAffected = async () => {
      try {
        setIsPreviewLoading(true);
        const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
        const items = await eventTypeAPI.listEventTypes(String((useWorkspace() as any)?.primaryWorkspace?.id || ''));
        const affected = items
          .filter((et: any) => String(et.calendar) === String(calendar.id))
          .map((et: any) => ({ id: et.id, name: et.name || et.title || 'Unbenannter Event Type' }));
        setAffectedEventTypes(affected);
      } catch (e) {
        setAffectedEventTypes([]);
      } finally {
        setIsPreviewLoading(false);
      }
    };
    if (confirmOpen) {
      loadAffected();
    } else {
      setAffectedEventTypes(null);
    }
  }, [confirmOpen, calendar.id]);
  return (
    <Card className={calendar.isConnected ? "border-green-200" : "border-muted"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${calendar.isConnected ? "bg-white" : "bg-muted"}`}>
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
            {/* Ein klarer Löschen-Button ohne Hover-Konflikte */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Kalender löschen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
        {/* Bestätigungsdialog fürs Löschen mit Vorschau der betroffenen Event‑Types */}
        <AlertDialog open={confirmOpen} onOpenChange={(o) => !isDeleting && setConfirmOpen(o)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" /> Kalender löschen
              </AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Kalender "{calendar.name}" wirklich löschen?
                <br />
                Folgende Event‑Types mit diesem Kalender würden gelöscht:
                {isPreviewLoading ? (
                  <div className="text-sm text-muted-foreground mt-2">Prüfe betroffene Event‑Types…</div>
                ) : (
                  <div className="mt-2">
                    {affectedEventTypes && affectedEventTypes.length > 0 ? (
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        {affectedEventTypes.slice(0, 8).map(et => (
                          <li key={et.id}>{et.name}</li>
                        ))}
                        {affectedEventTypes.length > 8 && (
                          <li className="text-xs text-muted-foreground">… und weitere {affectedEventTypes.length - 8}</li>
                        )}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">Keine Event‑Types betroffen.</div>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => { setConfirmOpen(false); await handleDeleteCalendar(); }}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Löscht…' : 'Löschen'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}