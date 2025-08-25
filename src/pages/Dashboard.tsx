import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  Info,
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
import { leadAPI, callAPI, CallLog, AppointmentStats, chartAPI, ChartDataPoint, AppointmentCallLog } from '@/lib/apiService';
import { useWorkspace } from '@/hooks/use-workspace';

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
        className: 'bg-blue-50 border-blue-600 text-blue-700 hover:bg-blue-100'
      };
    default:
      return {
        icon: Clock,
        variant: 'outline' as const,
        className: 'bg-gray-50 border-gray-600 text-gray-700 hover:bg-gray-100'
      };
  }
};

// Status Mapping von API zu Frontend
const mapApiStatusToDisplayStatus = (apiStatus: string | null): string => {
  switch(apiStatus) {
    case 'appointment_scheduled': return 'Termin vereinbart';
    case 'not_reached': return 'Nicht erreicht';  
    case 'reached': return 'Erreicht';
    case 'no_interest': return 'Kein Interesse';
    case null: return 'Offen';
    default: return 'Unbekannt';
  }
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
}

// Transform API CallLog zu Frontend RecentCallData
const transformCallLogToRecentCall = (callLog: CallLog): RecentCallData => {
  const fullName = callLog.lead_surname 
    ? `${callLog.lead_name} ${callLog.lead_surname}`
    : callLog.lead_name;
    
  const displayPhone = callLog.direction === 'outbound' 
    ? callLog.to_number 
    : callLog.from_number;
    
  return {
    id: callLog.id,
    lead: fullName,
    email: callLog.lead_email,
    phone: displayPhone,
    agent: callLog.agent_workspace_name,
    status: mapApiStatusToDisplayStatus(callLog.status),
    date: format(new Date(callLog.timestamp), 'yyyy-MM-dd')
  };
};

const leadDetails = generateLeadDetails();

export default function Dashboard() {
  const { primaryWorkspace } = useWorkspace();
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'calls' | 'appointments' | 'conversion'>('leads');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  
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

        // Get call logs filtered by workspace
        const callLogsData = await callAPI.getCallLogs({ agent__workspace: String(primaryWorkspace?.id || '') });
        const reachedCount = callAPI.calculateReachedLeads(callLogsData.results);
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

        // Get appointment statistics filtered by workspace
        const stats = await callAPI.getAppointmentStats({ agent__workspace: String(primaryWorkspace?.id || '') });
        setAppointmentStats(stats);
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        setAppointmentsError(error instanceof Error ? error.message : 'Failed to load appointment data');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (primaryWorkspace?.id) fetchAppointmentStats();
  }, [primaryWorkspace?.id]);

  // API Call für Static Appointment List (nächste 2 Wochen ab heute)
  useEffect(() => {
    const fetchAppointmentList = async () => {
      setAppointmentListLoading(true);
      setAppointmentListError(null);
      
      try {
        console.log('📅 Fetching static appointment list (next 2 weeks)...');
        
        // Define static 2-week period from today
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        // Get appointments in next 2 weeks
        const appointments = await callAPI.getAppointmentCallLogs({
          page_size: 5, // Get exactly 5 appointments
          ordering: 'appointment_datetime', // Order by appointment time (earliest first)
          appointment_datetime_after: now.toISOString(),
          appointment_datetime_before: twoWeeksLater.toISOString(),
          agent__workspace: String(primaryWorkspace?.id || '')
        });
        
        setRealAppointments(appointments);
        console.log(`✅ Static appointment list loaded: ${appointments.length} upcoming appointments (next 2 weeks)`);
      } catch (error) {
        console.error('❌ Error fetching appointment list:', error);
        setAppointmentListError(error instanceof Error ? error.message : 'Failed to load appointments');
      } finally {
        setAppointmentListLoading(false);
      }
    };

    fetchAppointmentList();
  }, []); // Run once on mount - STATIC, not dependent on dateRange

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
        
        const apiCalls = await callAPI.getRecentCallLogs({
          page_size: 10,                    // Standard: 10 Calls
          ordering: '-timestamp',          // Neueste zuerst
          timestamp_after: startDate,      // Gleicher Filter wie Chart
          timestamp_before: endDate,       // Gleicher Filter wie Chart
          search: searchQuery || undefined, // Keyword Search
          agent__workspace: String(primaryWorkspace?.id || '')
        });
        
        // Transform API → Frontend
        const transformedCalls = apiCalls.map(transformCallLogToRecentCall);
        setRealRecentCalls(transformedCalls);
        console.log(`✅ Recent calls loaded: ${transformedCalls.length} calls`);
        
      } catch (error) {
        console.error('❌ Error fetching recent calls:', error);
        setRecentCallsError('Fehler beim Laden der Anrufe');
      } finally {
        setRecentCallsLoading(false);
      }
    };
    
    fetchRecentCalls();
  }, [dateRange, searchQuery, primaryWorkspace?.id]); // Abhängig von Datum, Search und Workspace

  // Real Chart Data State
  const [realChartData, setRealChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fetch Real Chart Data
  useEffect(() => {
    const fetchRealChartData = async () => {
      setChartLoading(true);
      setChartError(null);
      // DON'T clear realChartData immediately - keep previous data during loading
      
      try {
        console.log('🔍 Starting real chart data fetch...');
        
        // Get real chart data from APIs with workspace filter
        const chartData = await chartAPI.generateRealChartData(dateRange, primaryWorkspace?.id ? String(primaryWorkspace.id) : undefined);
        console.log('✅ Chart data received:', chartData);
        setRealChartData(chartData);
      } catch (error) {
        console.error('Error fetching real chart data:', error);
        setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
        // Fallback to zero-filled data on error
        const zeros = (() => {
          const isSingle = format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd');
          if (isSingle) {
            const arr: any[] = [];
            for (let h = 0; h < 24; h++) {
              const d = new Date(dateRange.from);
              d.setHours(h, 0, 0, 0);
              arr.push({ date: d.toISOString(), leads: 0, calls: 0, appointments: 0, conversion: 0 });
            }
            return arr;
          }
          const start = new Date(dateRange.from);
          start.setHours(0,0,0,0);
          const end = new Date(dateRange.to);
          end.setHours(23,59,59,999);
          const days = Math.ceil((end.getTime()-start.getTime())/(1000*60*60*24))+1;
          const arr: any[] = [];
          for (let i=0;i<days;i++) {
            const d = new Date(start);
            d.setDate(start.getDate()+i);
            arr.push({ date: d.toISOString(), leads: 0, calls: 0, appointments: 0, conversion: 0 });
          }
          return arr;
        })();
        setRealChartData(zeros);
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
    console.log('🔍 isSingleDay check:', { fromDate, toDate, isSingle, dateRange });
    return isSingle;
  }, [dateRange]);
  
  // Use Real Chart Data or Fallback to zero-filled data
  const enhancedAnalyticsData = useMemo(() => {
    // For single day, we expect 24 points; for multi-day, days count
    const expectedDataPoints = isSingleDay ? 24 : Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    console.log('🔍 Chart data decision:', {
      isSingleDay,
      expectedDataPoints,
      realDataLength: realChartData.length,
      willUseZeroFill: realChartData.length < expectedDataPoints
    });
    
    // If we have sufficient real chart data, use it
    if (realChartData.length >= expectedDataPoints) {
      console.log('✅ Using real chart data');
      return realChartData;
    }
    
    // Zero-fill structure, no fake numbers
    console.log('📊 Using zero-filled fallback');
    if (isSingleDay) {
      // Generate 24 hours of ZERO data for single day
      const minimalData = [];
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(dateRange.from);
        date.setHours(hour, 0, 0, 0);
        minimalData.push({
          date: date.toISOString(),
          leads: 0,
          calls: 0,
          appointments: 0,
          conversion: 0
        });
      }
      console.log('📊 Generated 24 hours of zero data');
      return minimalData;
    } else {
      // For multi-day, generate zero-filled days
      const start = new Date(dateRange.from);
      start.setHours(0,0,0,0);
      const end = new Date(dateRange.to);
      end.setHours(23,59,59,999);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1;
      const zeros = [] as any[];
      for (let i=0;i<days;i++) {
        const d = new Date(start);
        d.setDate(start.getDate()+i);
        zeros.push({ date: d.toISOString(), leads: 0, calls: 0, appointments: 0, conversion: 0 });
      }
      console.log('📊 Using zero-filled data for multi-day range');
      return zeros;
    }
  }, [realChartData, isSingleDay, dateRange]);

  // Metriken-Definitionen
  const metricConfig = {
    leads: { key: 'leads', name: 'Leads', icon: Users },
    calls: { key: 'calls', name: 'Reached Leads', icon: Phone },
    appointments: { key: 'appointments', name: 'Appointments', icon: CalendarIcon },
    conversion: { key: 'conversion', name: 'Conversion Rate', icon: TrendingUp, suffix: '%' }
  };

  // Statistiken basierend auf echten API-Daten + Dummy-Daten berechnen
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
        title: "Leads",
        value: leadsLoading ? "..." : leadsError ? "Error" : totalLeads.toLocaleString('de-DE'),
        change: leadsLoading ? "" : leadsError ? "" : calculateChange(totalLeads, prevTotalLeads),
        icon: Users,
        color: "text-info",
        loading: leadsLoading,
        error: leadsError,
      },
      {
        id: 'calls',
        title: "Reached Leads", 
        value: callsLoading ? "..." : callsError ? "Error" : totalCalls.toLocaleString('de-DE'),
        change: callsLoading ? "" : callsError ? "" : calculateChange(totalCalls, prevTotalCalls),
        icon: Phone,
        color: "text-success",
        loading: callsLoading,
        error: callsError,
      },
      {
        id: 'appointments',
        title: "Appointments",
        value: appointmentsLoading ? "..." : appointmentsError ? "Error" : totalAppointments.toLocaleString('de-DE'),
        change: appointmentsLoading ? "" : appointmentsError ? "" : calculateChange(totalAppointments, prevTotalAppointments),
        icon: CalendarIcon,
        color: "text-warning",
        loading: appointmentsLoading,
        error: appointmentsError,
      },
      {
        id: 'conversion',
        title: "Conversion Rate",
        value: `${conversionRate.toFixed(1)}%`,
        change: calculateChange(conversionRate, prevConversionRate),
        icon: TrendingUp,
        color: "text-primary",
      },
    ];
  }, [leadsStats, leadsLoading, leadsError, reachedLeadsCount, callsLoading, callsError, appointmentStats, appointmentsLoading, appointmentsError]);

  // Recent Calls Logic - Use real API data
  const filteredCalls = useMemo(() => {
    // API macht bereits das Filtering - einfache Logic
    if (recentCallsLoading) return [];
    if (recentCallsError) return [];
    return realRecentCalls; // Bereits gefiltert durch API
  }, [realRecentCalls, recentCallsLoading, recentCallsError]);

  // Static Appointments Logic - Always show next 2 weeks from today
  const staticAppointments = useMemo(() => {
    // If we have real appointments and no error, use them
    if (!appointmentListLoading && !appointmentListError && realAppointments.length > 0) {
      console.log('✅ Using static appointment data (next 2 weeks)');
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
          <p className={textStyles.pageSubtitle}>Overview of your AI agents' performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`bg-white rounded-lg border p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 group ${
              selectedMetric === stat.id 
                ? 'border-[#3d5097]/30 bg-[#3d5097]/5' 
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedMetric(stat.id as any)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedMetric === stat.id 
                    ? 'bg-[#3d5097]/10 text-[#3d5097]' 
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
                  <h2 className="text-xl font-semibold">Performance overview</h2>
                  <p className="text-sm text-muted-foreground mt-1">{metricConfig[selectedMetric].name}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground">Period</span>
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
                        <stop offset="0%" stopColor="#3d5097" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#3d5097" stopOpacity={0}/>
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
                      cursor={{ stroke: '#3d5097', strokeWidth: 1, strokeDasharray: '5 5' }}
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
                      stroke="#3d5097" 
                      strokeWidth={2.5}
                      name={metricConfig[selectedMetric].name}
                      dot={false}
                      activeDot={{ r: 5, fill: "#3d5097", strokeWidth: 0 }}
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
                <h2 className="text-xl font-semibold">New appointments</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{staticAppointments.length} appointments</span>
                </div>
              </div>
              
              {appointmentListLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Loading appointments...</div>
                </div>
              ) : appointmentListError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Failed to load appointments</div>
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
                            
                            <button
                              className="flex items-center justify-center flex-shrink-0 text-gray-500 hover:text-gray-700"
                              onClick={() => setSelectedLead(appointment.lead)}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                                        {staticAppointments.length > 5 && (
                      <div className="text-center py-2">
                        <Button variant="outline" size="sm">
                          <span>+{staticAppointments.length - 5} more appointments</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No new appointments</div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Letzte Anrufe - moderne Tabelle */}
      <div className="bg-white rounded-lg border">
          {/* Header mit Suche und Aktionen */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-b">
            <h2 className="text-2xl font-semibold">Recent calls</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border rounded">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border rounded">F</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Tabelle */}
          {filteredCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCalls.slice(0, 10).map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLead(call.lead)}
                            className="h-8 w-8 p-0"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : recentCallsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <div className="text-sm text-muted-foreground mt-2">Loading calls...</div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <div className="text-base font-medium mb-1">No new calls</div>
              {searchQuery && (
                <div className="text-sm opacity-70">
                  No results for "{searchQuery}"
                </div>
              )}
              {!searchQuery && (
                <div className="text-sm opacity-70">
                  No calls found for the selected period
                </div>
              )}
            </div>
          )}
        </div>

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
                            const leadCall = filteredCalls.find(call => call.lead === selectedLead);
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