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
                  <Badge className="bg-[#3d5097] text-white text-xs">Zielkalender</Badge>
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
                    ? 'bg-[#3d5097] border-[#3d5097] text-white' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#3d5097]'
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
          <Button
            variant={formData.meeting_type === 'online' ? 'default' : 'outline'}
            className={formData.meeting_type === 'online' ? 'bg-[#3d5097]' : ''}
            onClick={() => setFormData({ ...formData, meeting_type: 'online' })}
          >
            📹 Online Meeting
          </Button>
          <Button
            variant={formData.meeting_type === 'in_person' ? 'default' : 'outline'}
            className={formData.meeting_type === 'in_person' ? 'bg-[#3d5097]' : ''}
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
    console.log('🔄 handleNext called - currentStep:', currentStep);
    if (currentStep < 5) {
      console.log('✅ Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('❌ Already at last step:', currentStep);
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
              <Button onClick={handleNext} className="bg-[#3d5097] hover:bg-[#3d5097]">
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-[#3d5097] hover:bg-[#3d5097]">
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
            <Badge className="bg-[#3d5097] text-white">Aktiv</Badge>
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

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleUpdate} className="bg-[#3d5097] hover:bg-[#3d5097]">
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
  return <EventTypeStep4 formData={formData} setFormData={setFormData} />;
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
  return <EventTypeStep2 formData={formData} setFormData={setFormData} availableCalendars={availableCalendars} workspaceId={workspaceId} />;
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

  // Determine if any provider has at least one connected calendar
  const hasAnyCalendarConnected = React.useMemo(() => {
    const hasGoogle = googleConnections.length > 0 && connectedCalendars.length > 0;
    const msCalendarsCount = Object.values(msCalendarsByConnection || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const hasMicrosoft = microsoftConnections.length > 0 && msCalendarsCount > 0;
    return hasGoogle || hasMicrosoft;
  }, [googleConnections.length, connectedCalendars.length, microsoftConnections.length, msCalendarsByConnection]);

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
      if (!primaryWorkspace?.id) { setEventTypes([]); setIsLoadingEventTypes(false); return; }
      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      const eventTypesData = await eventTypeAPI.listEventTypes(String(primaryWorkspace.id));
      setEventTypes(eventTypesData);
      console.log(`✅ Loaded ${eventTypesData.length} Event Types`);
    } catch (error) {
      console.error('❌ Error loading Event Types:', error);
      setEventTypes([]);
    } finally {
      setIsLoadingEventTypes(false);
    }
  };

  // Load calendars from backend
  const loadCalendarsFromBackend = async () => {
    setIsLoadingCalendars(true);
    try {
      const calendarsResponse = await calendarAPI.getCalendars();
      const calendars = Array.isArray(calendarsResponse)
        ? calendarsResponse
        : (calendarsResponse as any).results || [];

      if (!Array.isArray(calendars)) {
        console.error('❌ Expected calendars array, got:', typeof calendars, calendars);
        throw new Error('Invalid calendars response');
      }

      const wsId = String(primaryWorkspace?.id || '');
      const filteredCalendars = wsId
        ? calendars.filter((c: any) => String(c.workspace) === wsId || String((c as any)?.workspace_id) === wsId)
        : calendars;

      const convertedCalendars: CalendarType[] = filteredCalendars.map((c: any) => {
        const isGoogle = (c.provider === 'google');
        const providerDetails = (c as any)?.provider_details || {};
        return {
          id: c.id,
          connectionId: '',
          name: c.name,
          email: isGoogle ? (providerDetails.account_email || '') : (providerDetails.primary_email || ''),
          provider: isGoogle ? 'Google Calendar' : 'Microsoft 365',
          isConnected: !!c.active,
          isDefault: false,
          isPrimary: !!providerDetails.primary,
          eventTypesCount: typeof c.config_count === 'number' ? c.config_count : 0,
          totalBookings: 0,
          bookingsThisWeek: 0,
          subCalendars: [],
          accessRole: ("owner" as const),
          color: isGoogle ? "#1a73e8" : "#2563eb",
          timeZone: providerDetails.time_zone || providerDetails.timezone_windows || 'Europe/Berlin',
          active: !!c.active,
          createdAt: new Date(c.created_at),
          lastSyncedAt: null
        };
      });

      // Derive connections list from calendars by provider/email for rendering
      const googleConnectionsMap = new Map<string, GoogleConnection>();
      const microsoftConnectionsMap = new Map<string, MicrosoftConnection>();
      convertedCalendars.forEach(cal => {
        if (cal.provider === 'Google Calendar') {
          const email = cal.email || 'Google Calendar';
          if (!googleConnectionsMap.has(email)) {
            googleConnectionsMap.set(email, { id: cal.id, account_email: email, active: cal.isConnected, calendar_count: 1, status: cal.isConnected ? 'active' : 'inactive' });
          } else {
            const prev = googleConnectionsMap.get(email)!;
            googleConnectionsMap.set(email, { ...prev, calendar_count: prev.calendar_count + 1 });
          }
        } else {
          const email = cal.email || 'Microsoft 365';
          if (!microsoftConnectionsMap.has(email)) {
            microsoftConnectionsMap.set(email, { id: cal.id, workspace: String(primaryWorkspace?.id || ''), primary_email: email, active: cal.isConnected });
          }
        }
      });

      setGoogleConnections(Array.from(googleConnectionsMap.values()));
      setMicrosoftConnections(Array.from(microsoftConnectionsMap.values()));
      setMsCalendarsByConnection({});
      setConnectedCalendars(convertedCalendars);
      setAllBackendCalendars(calendars);
    } catch (error) {
      console.error('❌ Error loading calendars:', error);
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
      console.error('❌ Refresh Microsoft error:', e);
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
      console.error('❌ Disconnect Microsoft error:', e);
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
      console.error('❌ Failed to initiate Google OAuth:', error);
      toast({ title: "Verbindung fehlgeschlagen", description: "Google Kalender konnte nicht verbunden werden.", variant: "destructive" });
    }
  };

  const handleConnectMicrosoftCalendar = async () => {
    try {
      if (!primaryWorkspace?.id) throw new Error('No workspace');
      const oauthResponse = await calendarAPI.getMicrosoftOAuthURL(String(primaryWorkspace.id));
      window.location.href = oauthResponse.authorization_url;
    } catch (error) {
      console.error('❌ Failed to initiate Microsoft OAuth:', error);
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
      console.error('❌ Error disconnecting:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar settings</h1>
          <p className="text-muted-foreground">
            Manage your calendar integrations and event types
          </p>
        </div>
        <Button 
          onClick={activeTab === 'calendars' ? () => setShowProviderDialog(true) : () => setShowEventTypeModal(true)}
          disabled={activeTab === 'event-types' && !hasAnyCalendarConnected}
          className="bg-[#3d5097] hover:bg-[#3d5097] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'calendars' ? 'Connect calendar' : 'Create event type'}
        </Button>
      </div>

      {/* Tab Navigation - WIEDER HERGESTELLT */}
      <Tabs defaultValue="calendars" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendars">Calendars</TabsTrigger>
          <TabsTrigger value="event-types">Event types</TabsTrigger>
        </TabsList>

        {/* Kalender Tab */}
        <TabsContent value="calendars">
          {isLoadingCalendars ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3d5097]" />
                  <p className="text-sm text-muted-foreground">Loading calendars...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Google Connections */}
              {googleConnections.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Google Calendar connections</h2>
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

              {/* Microsoft Connections hidden: show only Google Calendar connections */}

              {/* Show "Noch keine Kalender verbunden" only if no connections */}
              {googleConnections.length === 0 && microsoftConnections.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No calendars connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your calendar (Google or Microsoft 365) to create event types.
                    </p>
                    <Button onClick={() => setShowProviderDialog(true)} className="bg-[#3d5097] hover:bg-[#3d5097]">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect calendar
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3d5097]" />
                <p className="text-muted-foreground">Loading event types...</p>
              </CardContent>
            </Card>
          ) : eventTypes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your event types</h2>
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
                <h3 className="text-lg font-semibold mb-2">No event types yet</h3>
                <p className="text-muted-foreground mb-4">
                  {hasAnyCalendarConnected
                    ? "Create your first event type to enable bookings."
                    : "Connect a calendar (Google or Microsoft 365) first to create event types."
                 }
                </p>
                {/* Event Type Creation - Only if calendar connected (like WelcomeOverlay pattern) */}
                {hasAnyCalendarConnected && (
                  <Button 
                    onClick={() => setShowEventTypeModal(true)}
                    className="bg-[#3d5097] hover:bg-[#3d5097]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create event type
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
            <AlertDialogTitle>Select calendar provider</AlertDialogTitle>
            <AlertDialogDescription>
              Choose which calendar you want to connect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="justify-start" onClick={handleConnectGoogleCalendar}>
              <span className="mr-2">🟢</span> Connect Google Calendar
            </Button>
            <Button variant="outline" className="justify-start" onClick={handleConnectMicrosoftCalendar}>
              <span className="mr-2">🔵</span> Connect Microsoft 365 (Outlook/Exchange)
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
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
              <CalendarIcon className="h-5 w-5 text-[#3d5097]" />
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
      console.error('❌ Kalender löschen fehlgeschlagen', e);
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
              <CalendarIcon className={`h-5 w-5 ${calendar.isConnected ? "text-[#3d5097]" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base">{calendar.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{calendar.timeZone || 'Europe/Berlin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {calendar.isPrimary && (
              <Badge className="bg-[#3d5097] text-white text-xs">Haupt</Badge>
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
            <p className="text-lg font-bold text-[#3d5097]">{calendar.eventTypesCount}</p>
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