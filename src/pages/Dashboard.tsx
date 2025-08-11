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
import { leadAPI, LeadStatsResponse } from '@/lib/apiService';

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

// Letzte Anrufe Daten
const generateRecentCalls = () => {
  const leadNames = ["Max Mustermann", "Anna Schmidt", "Thomas Weber", "Julia Müller", "Robert Klein", "Sarah Wagner", "Michael Brown", "Lisa Davis", "Peter Johnson", "Maria Garcia"];
  const agentNames = ["Agent Max", "Agent Sarah", "Agent Tom", "Agent Lisa", "Agent Kevin"];
  const leadSources = ["Google Ads", "Facebook", "LinkedIn", "Website", "Empfehlung", "Cold Call"];
  const statuses = ["Termin vereinbart", "Kein Interesse", "Nicht erreicht"];
  
  const calls = [];
  for (let i = 0; i < 15; i++) {
    const date = subDays(new Date(), Math.floor(Math.random() * 7));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    // Follow-up nur bei "Nicht erreicht" (nochmal versuchen) oder selten bei "Kein Interesse"
    const hasFollowUp = (status === 'Nicht erreicht' && Math.random() > 0.4) || 
                       (status === 'Kein Interesse' && Math.random() > 0.9);
    
    calls.push({
      id: i.toString(),
      lead: leadNames[Math.floor(Math.random() * leadNames.length)],
      agent: agentNames[Math.floor(Math.random() * agentNames.length)],
      leadSource: leadSources[Math.floor(Math.random() * leadSources.length)],
      phone: `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
      status,
      followUpDate: hasFollowUp ? 
        (() => {
          // Follow-up zwischen heute und in 7 Tagen
          const followUpTime = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
          // Arbeitszeiten: 8-17 Uhr
          const hour = Math.floor(Math.random() * 9) + 8;
          const minute = Math.random() > 0.5 ? 0 : 30;
          followUpTime.setHours(hour, minute, 0, 0);
          return followUpTime.toISOString();
        })() : null,
      date: format(date, 'yyyy-MM-dd'),
    });
  }
  
  return calls;
};

// Neue Termine Daten
const generateNewAppointments = () => {
  const names = ["Sarah Fischer", "Tom Schneider", "Nina Bauer", "Kevin Hoffmann", "Laura Zimmermann", "Daniel Koch", "Sophie Richter", "Marco Lehmann", "Jana Werner", "Felix Neumann"];
  
  const appointments = [];
  for (let i = 0; i < 12; i++) {
    const appointmentDate = new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000); // Nächste 14 Tage
    
    // Uhrzeit zwischen 8:00 und 17:00 Uhr
    const hour = Math.floor(Math.random() * 9) + 8; // 8-16 Uhr
    const minute = Math.random() > 0.5 ? 0 : 30; // 00 oder 30 Minuten
    appointmentDate.setHours(hour, minute, 0, 0);
    
    appointments.push({
      id: i.toString(),
      lead: names[Math.floor(Math.random() * names.length)],
      appointmentDate: format(appointmentDate, 'dd.MM.yyyy HH:mm'),
      date: format(subDays(new Date(), Math.floor(Math.random() * 3)), 'yyyy-MM-dd'), // Vereinbart in den letzten 3 Tagen
    });
  }
  
  return appointments;
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
    default:
      return {
        icon: Clock,
        variant: 'outline' as const,
        className: 'bg-gray-50 border-gray-600 text-gray-700 hover:bg-gray-100'
      };
  }
};

const recentCalls = generateRecentCalls();
const newAppointments = generateNewAppointments();
const leadDetails = generateLeadDetails();

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'calls' | 'appointments' | 'conversion'>('leads');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  
  // API State für Real Data
  const [leadsStats, setLeadsStats] = useState<LeadStatsResponse | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // API Call für Leads Stats
  useEffect(() => {
    const fetchLeadsStats = async () => {
      setLeadsLoading(true);
      setLeadsError(null);
      
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          // Fallback to dummy data if no token (user not logged in)
          console.warn('No authentication token found, using dummy data');
          setLeadsStats({
            total_leads: 0,
            leads_with_calls: 0,
            leads_without_calls: 0
          });
          setLeadsLoading(false);
          return;
        }

        const data = await leadAPI.getLeadStats();
        setLeadsStats(data);
      } catch (error) {
        console.error('Error fetching leads stats:', error);
        setLeadsError(error instanceof Error ? error.message : 'Failed to load leads data');
      } finally {
        setLeadsLoading(false);
      }
    };

    fetchLeadsStats();
  }, []); // Run once on mount

  // Analytics-Daten generieren basierend auf aktuellem Zeitraum
  const analyticsData = useMemo(() => generateAnalyticsData(dateRange), [dateRange]);
  
  // Erweiterte Analytics-Daten mit Conversion Rate
  const enhancedAnalyticsData = useMemo(() => {
    return analyticsData.map(item => ({
      ...item,
      conversion: item.leads > 0 ? ((item.appointments / item.leads) * 100) : 0
    }));
  }, [analyticsData]);
  
  // Prüfe ob es ein einzelner Tag ist für unterschiedliche Formatierung
  const isSingleDay = useMemo(() => {
    return format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd');
  }, [dateRange]);

  // Metriken-Definitionen
  const metricConfig = {
    leads: { key: 'leads', name: 'Leads', icon: Users },
    calls: { key: 'calls', name: 'Erreichte Leads', icon: Phone },
    appointments: { key: 'appointments', name: 'Vereinbarte Termine', icon: CalendarIcon },
    conversion: { key: 'conversion', name: 'Conversion Rate', icon: TrendingUp, suffix: '%' }
  };

  // Statistiken basierend auf echten API-Daten + Dummy-Daten berechnen
  const stats = useMemo(() => {
    // Dummy data für andere Metriken (werden später auch ersetzt)
    const totalCalls = analyticsData.reduce((sum, item) => sum + item.calls, 0);
    const totalAppointments = analyticsData.reduce((sum, item) => sum + item.appointments, 0);
    
    // Real Leads Data von API
    const totalLeads = leadsStats?.total_leads || 0;
    
    const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100) : 0;

    // Vergleichszeitraum generieren (für Dummy-Daten)
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevFromDate = subDays(dateRange.from, daysDiff);
    const prevToDate = subDays(dateRange.to, daysDiff);
    
    const prevData = generateAnalyticsData({ from: prevFromDate, to: prevToDate });
    
    const prevTotalCalls = prevData.reduce((sum, item) => sum + item.calls, 0);
    const prevTotalAppointments = prevData.reduce((sum, item) => sum + item.appointments, 0);
    
    // Für Leads: simuliere 5% Wachstum da wir keine historischen Daten haben
    const prevTotalLeads = Math.floor(totalLeads * 0.95);
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
        title: "Erreichte Leads", 
        value: totalCalls.toLocaleString('de-DE'),
        change: calculateChange(totalCalls, prevTotalCalls),
        icon: Phone,
        color: "text-success",
      },
      {
        id: 'appointments',
        title: "Vereinbarte Termine",
        value: totalAppointments.toLocaleString('de-DE'),
        change: calculateChange(totalAppointments, prevTotalAppointments),
        icon: CalendarIcon,
        color: "text-warning",
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
  }, [analyticsData, dateRange, leadsStats, leadsLoading, leadsError]);

  // Gefilterte Anrufe basierend auf Zeitraum
  const filteredCalls = useMemo(() => {
    return recentCalls.filter(call => {
      const callDate = new Date(call.date);
      return isWithinInterval(callDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    });
  }, [dateRange]);

  // Gefilterte Termine basierend auf Zeitraum
  const filteredAppointments = useMemo(() => {
    return newAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    });
  }, [dateRange]);

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Page Header - EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>Dashboard</h1>
          <p className={textStyles.pageSubtitle}>Übersicht über deine KI-Agenten Performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Performance Chart + Neue Termine Grid - nur anzeigen wenn nicht Single-Day View */}
      {!isSingleDay && (
        <div className="grid gap-6 grid-cols-5">
          {/* Analytics Chart - 3/5 der Breite */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border p-6 h-[416px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-semibold">Performance Übersicht</h2>
                  <p className="text-sm text-muted-foreground mt-1">{metricConfig[selectedMetric].name}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Zeitraum</span>
                  <div className="[&_button]:w-[240px] [&_button]:px-2 [&_button]:justify-center">
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
                          return format(date, "HH:mm");
                        } else {
                          const totalDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (totalDays <= 7) {
                            return format(date, "EEE", { locale: de });
                          } else if (totalDays <= 31) {
                            return format(date, "dd");
                          } else {
                            return format(date, "MMM", { locale: de });
                          }
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
          <div className="col-span-2">
                        <div className="bg-white rounded-lg border p-6 h-[416px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Neue Termine</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {filteredAppointments.length} Termine
                  </span>
                </div>
              </div>
              
              {filteredAppointments.length > 0 ? (
                <div className="space-y-2 h-[344px] overflow-y-auto">
                    {filteredAppointments.slice(0, 5).map((appointment) => (
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
                    
                                        {filteredAppointments.length > 5 && (
                      <div className="text-center py-2">
                        <Button variant="outline" size="sm">
                          <span>+{filteredAppointments.length - 5} weitere Termine</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Keine neuen Termine</div>
                  <div className="text-xs">
                    Keine Termine im gewählten Zeitraum vereinbart.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Letzte Anrufe - moderne Tabelle */}
      {!isSingleDay && (
        <div className="bg-white rounded-lg border">
          {/* Header mit Suche und Aktionen */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-semibold">Letzte Anrufe</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Suchen"
                  className="w-80 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sortieren
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter
              </Button>
            </div>
          </div>

          {/* Tabelle */}
          {filteredCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead-Quelle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
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
                          {leadDetails[call.lead] ? leadDetails[call.lead].email : `${call.lead.toLowerCase().replace(' ', '.')}@example.com`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {leadDetails[call.lead] ? leadDetails[call.lead].phone : `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{call.agent}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusBadge = getStatusBadge(call.status);
                          const StatusIcon = statusBadge.icon;
                          
                          // Vereinfachtes Follow-up: Wenn Follow-up geplant ist, "Nicht erreicht" durch Datum ersetzen
                          let displayStatus = call.status;
                          if (call.status === 'Nicht erreicht' && call.followUpDate) {
                            displayStatus = `Follow-up ${formatFollowUpDate(call.followUpDate)}`;
                          }
                          
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {displayStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{call.leadSource}</div>
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
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
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
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <div className="text-lg font-medium">Keine Anrufe</div>
              <div className="text-sm">
                Keine Anrufe im gewählten Zeitraum getätigt.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lead Details Slide-in Panel */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent side="right" className="w-[35vw] min-w-[500px] max-w-[40vw] focus:outline-none">
          {selectedLead && leadDetails[selectedLead] && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">
                  Lead Details: {selectedLead}
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                <div className="space-y-6">
                  {/* Lead Informationen */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">
                      Kontaktinformationen
                    </h3>
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
                      Gesprächsstatistik
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Anrufe gesamt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedLead].callCount}
                          </div>
                          <p className="text-xs text-muted-foreground">Anrufe gesamt</p>
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
                          <p className="text-xs text-muted-foreground">Minuten gesamt</p>
                        </CardContent>
                      </Card>
                      
                      {/* Letzter Anruf */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedLead].lastCall?.date || '-'}
                          </div>
                          <p className="text-xs text-muted-foreground">Letzter Anruf</p>
                        </CardContent>
                      </Card>
                      
                      {/* Nächster Anruf */}
                      <Card>
                        <CardContent className="p-3">
                          {(() => {
                            // Suche nach Follow-up in den ursprünglichen Anruf-Daten oder Terminen
                            const leadCall = filteredCalls.find(call => call.lead === selectedLead);
                            const leadAppointment = filteredAppointments.find(appointment => appointment.lead === selectedLead);
                            
                            if (leadCall?.followUpDate) {
                              return (
                                <>
                                  <div className="text-lg font-bold">
                                    {formatFullDateTime(leadCall.followUpDate)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Nächster Anruf</p>
                                </>
                              );
                            } else if (leadAppointment) {
                              // Wenn es einen Termin gibt, ist das der "nächste Anruf"
                              return (
                                <>
                                  <div className="text-lg font-bold">
                                    {leadAppointment.appointmentDate}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Nächster Anruf</p>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <div className="text-sm text-muted-foreground text-center leading-tight">
                                    Kein Follow-up<br />geplant
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
                    <h3 className="text-lg font-medium mb-3">
                      Gesprächshistorie
                    </h3>
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
                                <span>Dauer: {call.duration}</span>
                                <span>{expandedTranscript === call.id ? '▼ Transkript schließen' : '▶ Transkript anzeigen'}</span>
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