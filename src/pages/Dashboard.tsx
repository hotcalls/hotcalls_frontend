import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  Clock,
  Phone,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Target,
  PhoneCall,
  UserCheck,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  PhoneMissed
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, isToday, isThisWeek, getDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { DateRangePicker } from '@/components/DateRangePicker';
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { leadAPI, callAPI, CallLog, AppointmentStats, chartAPI, ChartDataPoint, AppointmentCallLog, agentAPI } from '@/lib/apiService';
import { useWorkspace } from '@/hooks/use-workspace';
import { useUserProfile } from '@/hooks/use-user-profile';

// Generiere Analytics-Daten basierend auf Zeitraum
const generateAnalyticsData = (dateRange: {from: Date, to: Date}) => {
  const data = [];
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);
  
  // Prüfe ob es ein einzelner Tag ist
  const isSingleDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  
  if (isSingleDay) {
    // Stündliche Daten für einen einzelnen Tag
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(startDate);
      date.setHours(hour, 0, 0, 0);
      
      // Realistische Verteilung über den Tag (mehr Activity während Arbeitszeit)
      const isWorkingHour = hour >= 8 && hour <= 18;
      const baseLeads = isWorkingHour ? Math.floor(3 + Math.random() * 8) : Math.floor(Math.random() * 2);
      const baseCallsRate = isWorkingHour ? 0.8 : 0.3;
      const baseAppointmentRate = isWorkingHour ? 0.25 : 0.1;
      
      const leads = Math.max(0, baseLeads);
      const calls = Math.max(0, Math.floor(leads * baseCallsRate + (Math.random() - 0.5) * 2));
      const appointments = Math.max(0, Math.floor(leads * baseAppointmentRate + (Math.random() - 0.5) * 1));
      
      data.push({
        date: date.toISOString(),
        leads,
        calls,
        appointments,
        hour
      });
    }
  } else {
    // Tägliche Daten für Zeiträume
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    days.forEach(day => {
      const dayOfWeek = day.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Weniger Activity am Wochenende
      const baseLeads = isWeekend ? 15 : 45;
      const baseCallsRate = isWeekend ? 0.6 : 0.85;
      const baseAppointmentRate = isWeekend ? 0.15 : 0.25;
      
      // Zufällige Variationen
      const leads = Math.floor(baseLeads + (Math.random() - 0.5) * 20);
      const calls = Math.floor(leads * baseCallsRate + (Math.random() - 0.5) * 10);
      const appointments = Math.floor(leads * baseAppointmentRate + (Math.random() - 0.5) * 5);
      
      data.push({
        date: day.toISOString(),
        leads: Math.max(0, leads),
        calls: Math.max(0, calls),
        appointments: Math.max(0, appointments)
      });
    });
  }
  
  return data;
};


// Lead-Details mit Gesprächshistorie
const generateLeadDetails = () => {
  const leadDetails: Record<string, any> = {};
  // Kombiniere alle Lead-Namen aus beiden Listen
  const appointmentNames = ["Sarah Fischer", "Tom Schneider", "Nina Bauer", "Kevin Hoffmann", "Laura Zimmermann", "Daniel Koch", "Sophie Richter", "Marco Lehmann", "Jana Werner", "Felix Neumann"];
  const callNames = ["Max Mustermann", "Anna Schmidt", "Thomas Weber", "Julia Müller", "Robert Klein", "Sarah Wagner", "Michael Brown", "Lisa Davis", "Peter Johnson", "Maria Garcia"];
  const allNames = [...new Set([...appointmentNames, ...callNames])]; // Entferne Duplikate
  
  allNames.forEach((name, index) => {
    const callCount = Math.floor(Math.random() * 5) + 1; // 1-5 Anrufe
    const calls = [];
    
    for (let i = 0; i < callCount; i++) {
      const callDate = subDays(new Date(), Math.floor(Math.random() * 30));
      const duration = Math.floor(Math.random() * 25) + 5; // 5-30 Minuten
      const outcomes = ['Termin vereinbart', 'Kein Interesse', 'Nicht erreicht'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const firstName = name.split(' ')[0];
      
      let transcript = `Agent: Guten Tag ${firstName}, hier ist Max von HotCalls. Wie geht es Ihnen heute?\n\nKunde: `;
      
      if (outcome === 'Termin vereinbart') {
        transcript += 'Hallo, mir geht es gut, danke.\n\nAgent: Das freut mich zu hören. Ich rufe Sie an, weil wir eine neue Lösung für Ihr Unternehmen haben, die Ihnen Zeit und Kosten sparen könnte. Darf ich Ihnen kurz davon erzählen?\n\nKunde: Ja, gerne. Das klingt interessant.\n\nAgent: Perfekt! Unsere Lösung automatisiert Ihre Vertriebsprozesse und kann Ihre Conversion-Rate um bis zu 40% steigern. Wann hätten Sie Zeit für einen kurzen Termin?\n\nKunde: Das klingt sehr interessant. Nächste Woche Dienstag um 14:00 Uhr würde mir gut passen.\n\nAgent: Ausgezeichnet! Ich trage Sie für Dienstag, 14:00 Uhr ein. Sie erhalten noch heute eine Bestätigung per E-Mail.';
      } else if (outcome === 'Kein Interesse') {
        transcript += 'Hallo, mir geht es gut, danke.\n\nAgent: Das freut mich zu hören. Ich rufe Sie an, weil wir eine neue Lösung für Ihr Unternehmen haben, die Ihnen Zeit und Kosten sparen könnte. Darf ich Ihnen kurz davon erzählen?\n\nKunde: Nein, danke. Ich habe wirklich kein Interesse an solchen Angeboten.\n\nAgent: Das kann ich verstehen. Vielen Dank für Ihre Zeit und einen schönen Tag noch.\n\nKunde: Danke, Ihnen auch.';
      } else {
        transcript += '[Kunde nicht erreicht - Mailbox]\n\nAgent: Hallo, hier ist Max von HotCalls. Leider konnte ich Sie nicht persönlich erreichen. Ich rufe bezüglich einer interessanten Geschäftsmöglichkeit an. Bitte rufen Sie mich unter 0800-HOTCALLS zurück. Vielen Dank und einen schönen Tag!';
      }
      
      calls.push({
        id: `${index}-${i}`,
        date: format(callDate, 'dd.MM.yyyy HH:mm'),
        duration: `${duration} Min`,
        outcome,
        transcript
      });
    }
    
    leadDetails[name] = {
      name,
      email: `${name.toLowerCase().replace(' ', '.')}.${index}@example.com`,
      phone: `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
      company: `${['Tech Solutions', 'Marketing Pro', 'Sales Force', 'Digital Hub', 'Growth Corp'][Math.floor(Math.random() * 5)]} GmbH`,
      callCount,
      lastCall: calls[0],
      allCalls: calls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  });
  
  return leadDetails;
};

// Follow-up Datum intelligent formatieren
const formatFollowUpDate = (dateString: string) => {
  const followUpDate = new Date(dateString);
  
  if (isToday(followUpDate)) {
    // Heute: nur Uhrzeit
    return format(followUpDate, 'HH:mm');
  } else if (isThisWeek(followUpDate)) {
    // Diese Woche: Wochentag + Uhrzeit
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return `${weekdays[getDay(followUpDate)]} ${format(followUpDate, 'HH:mm')}`;
  } else {
    // Weiter weg: Datum ohne Jahr + Uhrzeit
    return format(followUpDate, 'dd.MM HH:mm');
  }
};

// Vollständiges Datum + Uhrzeit formatieren (wie beim letzten Anruf)
const formatFullDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'dd.MM.yyyy HH:mm');
};

// Status Badge Funktion mit Icon und Farbe
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Termin vereinbart':
      return {
        icon: Check,
        variant: 'outline' as const,
        className: 'bg-green-50 border-green-600 text-green-700 hover:bg-green-100'
      };
    case 'Kein Interesse':
      return {
        icon: X,
        variant: 'outline' as const,
        className: 'bg-red-50 border-red-600 text-red-700 hover:bg-red-100'
      };
    case 'Nicht erreicht':
      return {
        icon: PhoneMissed,
        variant: 'outline' as const,
        className: 'bg-yellow-50 border-yellow-600 text-yellow-700 hover:bg-yellow-100'
      };
    case 'Erreicht':
      return {
        icon: CheckCircle,
        variant: 'outline' as const,
        className: 'bg-[#FE5B25]/10 border-[#FE5B25] text-[#FE5B25] hover:bg-[#FE5B25]/20'
      };
    default:
      return {
        icon: Clock,
        variant: 'outline' as const,
        className: 'bg-gray-50 border-gray-600 text-gray-700 hover:bg-gray-100'
      };
  }
};

// Status-Ableitung aus CallLog-Feldern (Backend liefert kein status-Feld)
const deriveDisplayStatus = (call: CallLog): string => {
  // Termin vorhanden → Termin vereinbart
  if ((call as any).appointment_datetime) return 'Termin vereinbart';
  // Erreicht, wenn Gesprächsdauer > 0 oder successful true
  const successfulFlag = typeof (call as any).successful === 'boolean' ? (call as any).successful : false;
  if ((call as any).duration > 0 || successfulFlag) return 'Erreicht';
  // Nicht erreicht bei Dauer 0 oder Fehlgründen
  const reason = String((call as any).disconnection_reason || '').toLowerCase();
  const failReasons = ['busy', 'no_answer', 'declined', 'failed', 'network_error', 'not_reached', 'timeout'];
  if ((call as any).duration === 0 || (reason && failReasons.some(r => reason.includes(r)))) return 'Nicht erreicht';
  // Spezifisch „Kein Interesse“ nur wenn Grund darauf hindeutet
  if (reason.includes('no_interest') || reason.includes('kein_interesse')) return 'Kein Interesse';
  return 'Offen';
};

// Interface für Recent Call Data
interface RecentCallData {
  id: string;
  lead: string;           // lead_name + lead_surname
  email: string;          // lead_email  
  phone: string;          // to_number (für Outbound) oder from_number
  agent: string;          // agent_workspace_name
  status: string;         // Gemappter Status
  date: string;          // timestamp → 'yyyy-MM-dd'
  summary?: string;       // optionale Zusammenfassung aus API
  transcript?: string;    // optional formatiertes Transkript aus API
}

// Transform API CallLog zu Frontend RecentCallData
const transformCallLogToRecentCall = (callLog: CallLog, agentNameById?: Record<string, string>): RecentCallData => {
  const fullName = callLog.lead_surname 
    ? `${callLog.lead_name} ${callLog.lead_surname}`
    : callLog.lead_name;
    
  const displayPhone = callLog.direction === 'outbound' 
    ? callLog.to_number 
    : callLog.from_number;
  const agentDisplay = (agentNameById && agentNameById[(callLog as any).agent as any])
    || (callLog as any).agent_name
    || callLog.agent_workspace_name;
  // Summary direkt aus API wenn vorhanden
  const apiSummary = (callLog as any)?.summary as string | undefined;
  // Transcript kann als Array von Messages oder als String kommen → in anzeigbaren Text umwandeln
  const rawTranscript = (callLog as any)?.transcript as any;
  const transcriptText = (() => {
    if (!rawTranscript) return undefined;
    if (typeof rawTranscript === 'string') return rawTranscript;
    if (Array.isArray(rawTranscript)) {
      try {
        return rawTranscript
          .map((m: any) => {
            const role = (m?.role || '').toString().toLowerCase();
            const speaker = role.includes('agent') ? 'Agent' : role.includes('user') || role.includes('lead') ? 'Lead' : (role || '');
            return speaker ? `${speaker}: ${m?.content ?? ''}` : `${m?.content ?? ''}`;
          })
          .join('\n\n');
      } catch {
        return undefined;
      }
    }
    return undefined;
  })();
    
  return {
    id: callLog.id,
    lead: fullName,
    email: callLog.lead_email,
    phone: displayPhone,
    agent: agentDisplay,
    status: deriveDisplayStatus(callLog as any),
    date: format(new Date(callLog.timestamp), 'yyyy-MM-dd'),
    summary: apiSummary,
    transcript: transcriptText
  };
};

const leadDetails = generateLeadDetails();

export default function Dashboard() {
  const { primaryWorkspace } = useWorkspace();
  const { profile } = useUserProfile();
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'calls' | 'appointments' | 'conversion'>('leads');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [hoverLead, setHoverLead] = useState<null | {
    lead: string; email: string; phone: string; agent: string; status: string; date: string;
    summary?: string; transcript?: string;
  }>(null);
  
  // API State für Real Data
  const [leadsStats, setLeadsStats] = useState<{count: number} | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // API State für Reached Leads (Call Data)
  const [reachedLeadsCount, setReachedLeadsCount] = useState<number>(0);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<string | null>(null);

  // API State für Appointments
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  // API State für Real Appointment List
  const [realAppointments, setRealAppointments] = useState<AppointmentCallLog[]>([]);
  const [appointmentListLoading, setAppointmentListLoading] = useState(true);
  const [appointmentListError, setAppointmentListError] = useState<string | null>(null);

  // API State für Recent Calls (Letzte Anrufe)
  const [realRecentCalls, setRealRecentCalls] = useState<RecentCallData[]>([]);
  const [recentCallsLoading, setRecentCallsLoading] = useState(true);
  const [recentCallsError, setRecentCallsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // API Call für Leads Count
  useEffect(() => {
    const fetchLeadsCount = async () => {
      setLeadsLoading(true);
      setLeadsError(null);
      
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          // Fallback to dummy data if no token (user not logged in)
          console.warn('No authentication token found, using dummy data');
          setLeadsStats({
            count: 0
          });
          setLeadsLoading(false);
          return;
        }

        // Get count filtered by current workspace
        const data = await leadAPI.getLeads({ page_size: 1, workspace: String(primaryWorkspace?.id || '') });
        setLeadsStats({ count: data.count || 0 });
      } catch (error) {
        console.error('Error fetching leads count:', error);
        setLeadsError(error instanceof Error ? error.message : 'Failed to load leads data');
      } finally {
        setLeadsLoading(false);
      }
    };

    if (primaryWorkspace?.id) fetchLeadsCount();
  }, [primaryWorkspace?.id]);

  // API Call für Reached Leads Count
  useEffect(() => {
    const fetchReachedLeadsCount = async () => {
      setCallsLoading(true);
      setCallsError(null);
      
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          // Fallback to 0 if no token (user not logged in)
          console.warn('No authentication token found, using dummy data for calls');
          setReachedLeadsCount(0);
          setCallsLoading(false);
          return;
        }

        // Workspace-scoped successful calls (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const callLogsData = await callAPI.getCallLogs({ successful: true as any, agentworkspace: String(primaryWorkspace?.id || ''), timestamp_after: thirtyDaysAgo, page_size: 1000 });
        const reachedCount = callAPI.calculateReachedLeads(callLogsData.results || []);
        setReachedLeadsCount(reachedCount);
      } catch (error) {
        console.error('Error fetching call logs for reached leads:', error);
        setCallsError(error instanceof Error ? error.message : 'Failed to load call data');
        setReachedLeadsCount(0); // Fallback to 0 on error
      } finally {
        setCallsLoading(false);
      }
    };

    if (primaryWorkspace?.id) fetchReachedLeadsCount();
  }, [primaryWorkspace?.id]);

  // API Call für Appointment Stats
  useEffect(() => {
    const fetchAppointmentStats = async () => {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          // Fallback to dummy data if no token (user not logged in)
          console.warn('No authentication token found, using dummy data');
          setAppointmentStats({
            total_appointments: 0,
            appointments_today: 0,
            appointments_this_week: 0,
            appointments_this_month: 0,
            upcoming_appointments: 0,
            past_appointments: 0
          });
          setAppointmentsLoading(false);
          return;
        }

        // Workspace-genauer Count via call logs mit Termin ab jetzt
        const nowIso = new Date().toISOString();
        const apptLogs = await callAPI.getCallLogs({ has_appointment: true, agentworkspace: String(primaryWorkspace?.id || ''), appointment_datetime_after: nowIso, page_size: 1 });
        const total = apptLogs?.count || 0;
        setAppointmentStats({
          total_appointments: total,
          appointments_today: 0,
          appointments_this_week: 0,
          appointments_this_month: 0,
          upcoming_appointments: total,
          past_appointments: 0,
        });
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        setAppointmentsError(error instanceof Error ? error.message : 'Failed to load appointment data');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (primaryWorkspace?.id) fetchAppointmentStats();
  }, [primaryWorkspace?.id]);

  // Real: Termine (Appointments) über API laden – nächster 14‑Tage‑Zeitraum
  useEffect(() => {
    const fetchAppointments = async () => {
      setAppointmentListLoading(true);
      setAppointmentListError(null);
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          setRealAppointments([]);
          return;
        }

        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const appts = await callAPI.getAppointmentCallLogs({
          appointment_datetime_after: now.toISOString(),
          appointment_datetime_before: twoWeeksLater.toISOString(),
          ordering: 'appointment_datetime',
          page_size: 50,
          agent__workspace: String(primaryWorkspace?.id || ''),
        });

        setRealAppointments(appts || []);
      } catch (error) {
        setAppointmentListError(error instanceof Error ? error.message : 'Failed to load appointments');
        setRealAppointments([]);
      } finally {
        setAppointmentListLoading(false);
      }
    };

    if (primaryWorkspace?.id) fetchAppointments();
  }, [primaryWorkspace?.id]);

  // API Call für Recent Calls (Letzte Anrufe)
  useEffect(() => {
    console.log('🔥 RECENT CALLS useEffect TRIGGERED - dateRange:', dateRange, 'searchQuery:', searchQuery);
    
    const fetchRecentCalls = async () => {
      console.log('🔥 STARTING fetchRecentCalls function...');
      setRecentCallsLoading(true);
      setRecentCallsError(null);
      
      try {
        console.log('📞 Fetching recent calls...');
        
        // Zeitraum-Filter synchron mit Performance-Übersicht (dateRange)
        const startDate = startOfDay(dateRange.from).toISOString();
        const endDate = endOfDay(dateRange.to).toISOString();
        
        // Optional: Agent-ID zu Name auflösen (für saubere Anzeige)
        let agentNameById: Record<string, string> | undefined;
        try {
          const agents = await agentAPI.getAgents(primaryWorkspace?.id ? String(primaryWorkspace.id) : undefined);
          agentNameById = Object.fromEntries((agents || []).map((a: any) => [a.agent_id, a.name]));
        } catch {}

        const apiCalls = await callAPI.getRecentCallLogs({
          page_size: 10,                    // Standard: 10 Calls
          ordering: '-timestamp',          // Neueste zuerst
          timestamp_after: startDate,      // Gleicher Filter wie Chart
          timestamp_before: endDate,       // Gleicher Filter wie Chart
          agent__workspace: String(primaryWorkspace?.id || ''),
          search: searchQuery || undefined
        });
        
        // Transform API → Frontend
        const transformedCalls = apiCalls.map((c) => transformCallLogToRecentCall(c, agentNameById));
        setRealRecentCalls(transformedCalls);
        
        
      } catch (error) {
        console.error("[ERROR]:", error);
        setRecentCallsError('Fehler beim Laden der Anrufe');
      } finally {
        setRecentCallsLoading(false);
      }
    };
    
    fetchRecentCalls();
  }, [dateRange, primaryWorkspace?.id, searchQuery]); // Bei serverseitiger Suche auch auf searchQuery reagieren

  // Real Chart Data State
  const [realChartData, setRealChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fetch Real Chart Data
  useEffect(() => {
    const fetchRealChartData = async () => {
      console.log('🔄 Date range changed, fetching new chart data:', {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        workspaceId: primaryWorkspace?.id
      });

      setChartLoading(true);
      setChartError(null);
      // DON'T clear realChartData immediately - keep previous data during loading

      try {
        // Get real chart data from APIs with workspace filter
        const chartData = await chartAPI.generateRealChartData(dateRange, primaryWorkspace?.id ? String(primaryWorkspace.id) : undefined);

        console.log('📊 Received chart data from API:', chartData.length, 'data points');
        setRealChartData(chartData);
      } catch (error) {
        console.error('❌ Error fetching real chart data:', error);
        setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
        // Fallback to empty array on error (let enhancedAnalyticsData handle the fallback logic)
        setRealChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchRealChartData();
  }, [dateRange, primaryWorkspace?.id]); // Re-fetch when date range or workspace changes

  // Prüfe ob es ein einzelner Tag ist für unterschiedliche Formatierung
  const isSingleDay = useMemo(() => {
    const fromDate = format(dateRange.from, 'yyyy-MM-dd');
    const toDate = format(dateRange.to, 'yyyy-MM-dd');
    const isSingle = fromDate === toDate;
    
    return isSingle;
  }, [dateRange]);
  
  // SIMPLE CHART DATA: Use the SAME data that "Letzte Anrufe" uses!
  const enhancedAnalyticsData = useMemo(() => {
    console.log('🔍 realRecentCalls:', realRecentCalls);
    console.log('🔍 Using SAME data as "Letzte Anrufe" section');

    if (!realRecentCalls || !Array.isArray(realRecentCalls)) {
      console.log('❌ No recent calls data available');
      return [];
    }

    // Group calls by day and count them (same as "Letzte Anrufe")
    const callsByDay = new Map();

    realRecentCalls.forEach(call => {
      if (call.timestamp) {
        const date = new Date(call.timestamp);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        callsByDay.set(dayKey, (callsByDay.get(dayKey) || 0) + 1);
      }
    });

    // Convert to chart data format
    const chartData = Array.from(callsByDay.entries()).map(([date, count]) => ({
      date: new Date(date).toISOString(),
      leads: count,  // Use call count as leads since that's what we see
      calls: count,
      appointments: 0,
      conversion: 0
    }));

    console.log('📊 Generated chart data from SAME DATA as Letzte Anrufe:', chartData);
    console.log('📊 Total calls found:', realRecentCalls.length);
    return chartData;
  }, [realRecentCalls]);

  // Metriken-Definitionen
  const metricConfig = {
    leads: { key: 'leads', name: 'Leads', icon: Users },
    calls: { key: 'calls', name: 'Erreichte Leads', icon: Phone },
    appointments: { key: 'appointments', name: 'Termine', icon: CalendarIcon },
    conversion: { key: 'conversion', name: 'Konversionsrate', icon: TrendingUp, suffix: '%' }
  };

  // Statistiken basierend auf echten API-Daten berechnen
  const stats = useMemo(() => {
    // Real Reached Leads Data von Call API
    const totalCalls = reachedLeadsCount;

    // Real Appointments Data von Call API
    const totalAppointments = appointmentStats?.total_appointments || 0;

    // Real Leads Data von API
    const totalLeads = leadsStats?.count || 0;

    const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100) : 0;

    // Statische Vergleichswerte (nicht zeitraumabhängig für Cards)
    const prevTotalCalls = Math.floor(totalCalls * 0.9); // 10% weniger als aktuell
    const prevTotalAppointments = Math.floor(totalAppointments * 0.85); // 15% weniger
    const prevTotalLeads = Math.floor(totalLeads * 0.95); // 5% weniger
    const prevConversionRate = prevTotalLeads > 0 ? ((prevTotalAppointments / prevTotalLeads) * 100) : 0;
    
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return "+100%";
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return [
      {
        id: 'leads',
        title: metricConfig.leads.name,
        value: leadsLoading ? "..." : leadsError ? "Error" : totalLeads.toLocaleString('de-DE'),
        change: leadsLoading ? "" : leadsError ? "" : calculateChange(totalLeads, prevTotalLeads),
        icon: Users,
        color: "text-info",
        loading: leadsLoading,
        error: leadsError,
      },
      {
        id: 'calls',
        title: metricConfig.calls.name,
        value: callsLoading ? "..." : callsError ? "Error" : totalCalls.toLocaleString('de-DE'),
        change: callsLoading ? "" : callsError ? "" : calculateChange(totalCalls, prevTotalCalls),
        icon: Phone,
        color: "text-success",
        loading: callsLoading,
        error: callsError,
      },
      {
        id: 'appointments',
        title: metricConfig.appointments.name,
        value: appointmentsLoading ? "..." : appointmentsError ? "Error" : totalAppointments.toLocaleString('de-DE'),
        change: appointmentsLoading ? "" : appointmentsError ? "" : calculateChange(totalAppointments, prevTotalAppointments),
        icon: CalendarIcon,
        color: "text-warning",
        loading: appointmentsLoading,
        error: appointmentsError,
      },
      {
        id: 'conversion',
        title: metricConfig.conversion.name,
        value: `${conversionRate.toFixed(1)}%`,
        change: calculateChange(conversionRate, prevConversionRate),
        icon: TrendingUp,
        color: "text-primary",
      },
    ];
  }, [leadsStats, leadsLoading, leadsError, reachedLeadsCount, callsLoading, callsError, appointmentStats, appointmentsLoading, appointmentsError]);

  const displayedCalls = useMemo(() => {
    if (recentCallsLoading) return [];
    if (recentCallsError) return [];
    const base = realRecentCalls || [];
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return base;
    const qDigits = q.replace(/\D/g, '');
    const qNoSpace = q.replace(/\s+/g, '');
    return base.filter((c) => {
      const leadLower = (c.lead || '').toLowerCase();
      const nameMatch = leadLower.includes(q) || leadLower.replace(/\s+/g, '').includes(qNoSpace);
      const emailMatch = (c.email || '').toLowerCase().includes(q);
      const phoneDigits = (c.phone || '').replace(/\D/g, '');
      const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [realRecentCalls, searchQuery, recentCallsLoading, recentCallsError]);

  // Static Appointments Logic - Always show next 2 weeks from today
  const staticAppointments = useMemo(() => {
    // If we have real appointments and no error, use them
    if (!appointmentListLoading && !appointmentListError && realAppointments.length > 0) {
      
      return realAppointments;
    }
    
    // If loading real appointments, return empty for now
    if (appointmentListLoading) {
      console.log('⏳ Loading static appointments...');
      return [];
    }
    
    // If API loaded but no appointments found, return empty (will show "Keine neuen Termine")
    console.log('📋 No appointments found in next 2 weeks - showing empty state');
    return [];
  }, [realAppointments, appointmentListLoading, appointmentListError]);

  return (
    <div className={`${layoutStyles.pageContainer} max-w-full overflow-x-hidden`}>
      {/* Page Header - EINHEITLICH */}
      <div className={`${layoutStyles.pageHeader} flex-col sm:flex-row items-start sm:items-center gap-2`}>
        <div>
          <h1 className={textStyles.pageTitle}>Dashboard</h1>
          <p className={textStyles.pageSubtitle}>Überblick über die Performance deiner KI‑Agenten</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 group ${
              selectedMetric === stat.id 
                ? 'border-[#FE5B25]/30 bg-[#FE5B25]/5' 
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedMetric(stat.id as any)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedMetric === stat.id 
                    ? 'bg-[#FE5B25]/10 text-[#FE5B25]' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-end gap-3 mt-1">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mb-1 ${
                      stat.change.startsWith('+') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : stat.change.startsWith('-')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      {stat.change.startsWith('+') ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : stat.change.startsWith('-') ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart + Neue Termine Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          {/* Analytics Chart - 3/5 der Breite */}
          <div className="lg:col-span-3 min-w-0">
            <div className="bg-white rounded-lg border p-6 h-[416px] flex flex-col">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-xl font-semibold">Performance‑Übersicht</h2>
                  <p className="text-sm text-muted-foreground mt-1">{metricConfig[selectedMetric].name}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground">Zeitraum</span>
                  <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-[240px] [&_button]:px-2 [&_button]:justify-center">
                    <DateRangePicker 
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={enhancedAnalyticsData} margin={{ top: 20, right: 20, left: 25, bottom: 20 }}>
                    {/* Gradient Definition für Area */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FE5B25" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#FE5B25" stopOpacity={0}/>
                      </linearGradient>
                    </defs>

                    {/* Horizontale Gridlines */}
                    <CartesianGrid horizontal={true} vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 14, fill: '#6b7280' }}
                      tickMargin={8}
                      padding={{ left: 20, right: 20 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        if (isSingleDay) {
                          return format(date, "dd. MMM yyyy, HH:mm 'h'", { locale: de });
                        } else {
                          return format(date, "dd. MMM yyyy", { locale: de });
                        }
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 14, fill: '#6b7280' }}
                      width={35}
                      tickMargin={5}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        if (isSingleDay) {
                          return format(date, "dd. MMM yyyy, HH:mm 'Uhr'", { locale: de });
                        } else {
                          return format(date, "dd. MMM yyyy", { locale: de });
                        }
                      }}
                      formatter={(value, name) => {
                        const suffix = selectedMetric === 'conversion' ? '%' : '';
                        return [`${value}${suffix}`, metricConfig[selectedMetric].name];
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '14px'
                      }}
                      cursor={{ stroke: '#FE5B25', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    {/* Area mit Gradient-Fill */}
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="none"
                      fill="url(#areaGradient)"
                      name={metricConfig[selectedMetric].name}
                    />

                    {/* Linie über der Area */}
                    <Line
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#FE5B25"
                      strokeWidth={2.5}
                      name={metricConfig[selectedMetric].name}
                      dot={false}
                      activeDot={{ r: 5, fill: "#FE5B25", strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Neue Termine - 2/5 der Breite */}
          <div className="lg:col-span-2 min-w-0">
                        <div className="bg-white rounded-lg border p-6 h-[416px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-semibold">Neue Termine</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{staticAppointments.length} Termine</span>
                </div>
              </div>
              
              {appointmentListLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Lade Termine...</div>
                </div>
              ) : appointmentListError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Termine konnten nicht geladen werden</div>
                  <div className="text-xs">{appointmentListError}</div>
                </div>
              ) : staticAppointments.length > 0 ? (
                <div className="space-y-2 h-[344px] overflow-y-auto">
                    {staticAppointments.slice(0, 5).map((appointment) => (
                      <Card
                        key={appointment.id}
                        className="hover:shadow-md transition-shadow min-h-[60px]"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="p-1.5 rounded-full bg-warning/10 text-warning flex-shrink-0">
                                <CalendarIcon className="h-3.5 w-3.5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">
                                  {appointment.lead}
                                </h3>
                                <div className="flex items-center space-x-1 mt-0.5">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {appointment.appointmentDate}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Info button vorübergehend entfernt */}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                                        {staticAppointments.length > 5 && (
                      <div className="text-center py-2">
                        <Button variant="outline" size="sm">
                          <span>+{staticAppointments.length - 5} weitere Termine</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Keine neuen Termine</div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Letzte Anrufe - moderne Tabelle */}
      <div className="bg-white rounded-lg border">
          {/* Header mit Suche und Aktionen */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-b">
            <h2 className="text-2xl font-semibold">Letzte Anrufe</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput); }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Suche"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(searchInput); }}
                  className="w-full sm:w-80 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE5B25]"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Button
                type="submit"
                variant="default"
                className="h-9 relative z-10"
              >
                Suchen
              </Button>
            </form>
          </div>

          {/* Tabelle */}
          {(displayedCalls.length > 0 || (profile?.email === 'leonhard@malmachen.com' && !recentCallsLoading)) ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontaktname</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E‑Mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedCalls.slice(0, 20).map((call) => (
                    <tr
                      key={call.id}
                      role="button"
                      tabIndex={0}
                      className="hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FE5B25]/40"
                      onClick={() => {
                        const notReached = String(call.status).toLowerCase().includes('nicht erreicht');
                        const summary = call.summary && call.summary.trim().length > 0
                          ? call.summary
                          : (notReached
                            ? 'Lead wurde noch nicht erreicht. Es liegt noch keine Gesprächszusammenfassung vor.'
                            : 'Keine Zusammenfassung verfügbar.');
                        const transcript = call.transcript && call.transcript.trim().length > 0
                          ? call.transcript
                          : '— Kein Transkript vorhanden —';
                        setHoverLead({ ...call, summary, transcript });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault();
                        const notReached = String(call.status).toLowerCase().includes('nicht erreicht');
                        const summary = call.summary && call.summary.trim().length > 0
                          ? call.summary
                          : (notReached
                            ? 'Lead wurde noch nicht erreicht. Es liegt noch keine Gesprächszusammenfassung vor.'
                            : 'Keine Zusammenfassung verfügbar.');
                        const transcript = call.transcript && call.transcript.trim().length > 0
                          ? call.transcript
                          : '— Kein Transkript vorhanden —';
                        setHoverLead({ ...call, summary, transcript });
                      }}}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#FE5B25]/10 text-[#FE5B25] flex items-center justify-center mr-3">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{call.lead}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {call.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {call.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{call.agent}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusBadge = getStatusBadge(call.status);
                          const StatusIcon = statusBadge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {call.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{call.date}</div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : recentCallsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE5B25] mx-auto"></div>
              <div className="text-sm text-muted-foreground mt-2">Lade Anrufe...</div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <div className="text-base font-medium mb-1">Keine neuen Anrufe</div>
              {searchQuery && (
                <div className="text-sm opacity-70">
                  Keine Ergebnisse für "{searchQuery}"
                </div>
              )}
              {!searchQuery && (
                <div className="text-sm opacity-70">
                  Keine Anrufe für den ausgewählten Zeitraum gefunden
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lead Overview Dialog */}
        <Dialog open={!!hoverLead} onOpenChange={(o)=>{ if (!o) setHoverLead(null); }}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle>Anruf Details</DialogTitle>
            </DialogHeader>
            {hoverLead && (
              <div className="px-6 pb-6">
                <div className="text-xs text-muted-foreground mb-3">{format(new Date(hoverLead.date), 'dd.MM.yyyy')}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4 bg-white">
                    <h3 className="font-semibold mb-3">Anruf Informationen</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{hoverLead.lead}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="px-2 py-0.5 text-xs rounded-full bg-[#FE5B25]/10 text-[#FE5B25]">{hoverLead.status}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Telefon:</span><span>{hoverLead.phone}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">E‑Mail:</span><span className="truncate max-w-[60%] text-right">{hoverLead.email}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Agent:</span><span>{hoverLead.agent}</span></div>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4 bg-white">
                    <h3 className="font-semibold mb-3">Anruf Analyse</h3>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[#FE5B25]/10 text-[#FE5B25]">{hoverLead.status}</span>
                    </div>
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {hoverLead.summary}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border bg-white max-h-72 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">Transkript</h3>
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">{hoverLead.transcript}</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Lead Details Slide-in Panel */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent side="right" className="w-[35vw] min-w-[500px] max-w-[40vw] focus:outline-none">
          {selectedLead && leadDetails[selectedLead] && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">
                  Lead details: {selectedLead}
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                <div className="space-y-6">
                  {/* Lead Informationen */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">Contact information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadDetails[selectedLead].company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadDetails[selectedLead].phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadDetails[selectedLead].email}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Gesprächsstatistik */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Conversation statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Anrufe gesamt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedLead].callCount}
                          </div>
                          <p className="text-xs text-muted-foreground">Total calls</p>
                        </CardContent>
                      </Card>
                      
                      {/* Minuten gesamt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedLead].allCalls.reduce((total, call) => {
                              const minutes = parseInt(call.duration.replace(' Min', '')) || 0;
                              return total + minutes;
                            }, 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Total minutes</p>
                        </CardContent>
                      </Card>
                      
                      {/* Letzter Anruf */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedLead].lastCall?.date || '-'}
                          </div>
                          <p className="text-xs text-muted-foreground">Last call</p>
                        </CardContent>
                      </Card>
                      
                      {/* Nächster Anruf */}
                      <Card>
                        <CardContent className="p-3">
                          {(() => {
                            // Suche nach Follow-up in den ursprünglichen Anruf-Daten oder Terminen
                            const leadCall = displayedCalls.find(call => call.lead === selectedLead);
                            const leadAppointment = staticAppointments.find(appointment => appointment.lead === selectedLead);
                            
                            if (leadAppointment) {
                              // Wenn es einen Termin gibt, ist das der "nächste Anruf"
                              return (
                                <>
                                  <div className="text-lg font-bold">
                                    {leadAppointment.appointmentDate}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Next call</p>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <div className="text-sm text-muted-foreground text-center leading-tight">
                                    No follow-up planned
                                  </div>
                                </>
                              );
                            }
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Gesprächshistorie */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">Conversation history</h3>
                    <div className="space-y-3">
                      {leadDetails[selectedLead].allCalls.map((call: any) => (
                        <div key={call.id}>
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setExpandedTranscript(expandedTranscript === call.id ? null : call.id)}
                          >
                            <CardContent className="p-4">
                                                          <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{call.date}</span>
                              </div>
                              <div>
                                {(() => {
                                  const statusBadge = getStatusBadge(call.outcome);
                                  const StatusIcon = statusBadge.icon;
                                  return (
                                    <Badge className={`text-xs flex items-center space-x-1 ${statusBadge.className}`}>
                                      <StatusIcon className="h-3 w-3" />
                                      <span>{call.outcome}</span>
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Duration: {call.duration}</span>
                                <span>{expandedTranscript === call.id ? '▼ Hide transcript' : '▶ Show transcript'}</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Aufgeklapptes Transkript */}
                          {expandedTranscript === call.id && (
                            <div className="mt-2 ml-4 border-l-2 border-muted pl-4">
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <div className="space-y-6">
                                  {call.transcript.split('\n\n').map((paragraph: string, index: number) => {
                                    if (paragraph.startsWith('Agent:')) {
                                      const agentText = paragraph.replace('Agent: ', '');
                                      return (
                                        <div key={index} className="text-left">
                                          <div className="font-medium text-gray-500 text-sm mb-1">
                                            Agent Max
                                          </div>
                                          <div className="text-sm leading-relaxed text-gray-500">
                                            {agentText}
                                          </div>
                                        </div>
                                      );
                                    } else if (paragraph.startsWith('Kunde:')) {
                                      const leadText = paragraph.replace('Kunde: ', '');
                                      return (
                                        <div key={index} className="text-right">
                                          <div className="font-medium text-black text-sm mb-1">
                                            Lead {selectedLead}
                                          </div>
                                          <div className="text-sm leading-relaxed text-black">
                                            {leadText}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}