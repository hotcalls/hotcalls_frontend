import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, Phone, Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight, Info, Clock, MessageSquare, Check, X, PhoneMissed } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, isToday, isThisWeek, getDay } from 'date-fns';
import { de } from 'date-fns/locale';

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

  // Statistiken basierend auf generierten Daten berechnen
  const stats = useMemo(() => {
    const totalLeads = analyticsData.reduce((sum, item) => sum + item.leads, 0);
    const totalCalls = analyticsData.reduce((sum, item) => sum + item.calls, 0);
    const totalAppointments = analyticsData.reduce((sum, item) => sum + item.appointments, 0);
    const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100) : 0;

    // Vergleichszeitraum generieren
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevFromDate = subDays(dateRange.from, daysDiff);
    const prevToDate = subDays(dateRange.to, daysDiff);
    
    const prevData = generateAnalyticsData({ from: prevFromDate, to: prevToDate });
    
    const prevTotalLeads = prevData.reduce((sum, item) => sum + item.leads, 0);
    const prevTotalCalls = prevData.reduce((sum, item) => sum + item.calls, 0);
    const prevTotalAppointments = prevData.reduce((sum, item) => sum + item.appointments, 0);
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
        value: totalLeads.toLocaleString('de-DE'),
        change: calculateChange(totalLeads, prevTotalLeads),
        icon: Users,
        color: "text-info",
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
  }, [analyticsData, dateRange]);

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>

      {/* Stats Cards - Klickbar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.title}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedMetric === stat.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedMetric(stat.id as any)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${
                selectedMetric === stat.id ? 'text-primary' : stat.color
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stat.change}</span> vs. letzter Zeitraum
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Performance Übersicht</h2>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Zeitraum</span>
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
        
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enhancedAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (isSingleDay) {
                    // Stündliche Anzeige: "08:00", "12:00", etc.
                    return format(date, "HH:mm");
                  } else {
                    // Prüfe ob der Zeitraum nahe der Gegenwart ist
                    const today = new Date();
                    const daysDiff = Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    const totalDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (totalDays <= 7 && daysDiff <= 7) {
                      // Aktuelle Woche oder nah dran: Wochentage
                      return format(date, "EEEE", { locale: de }).substring(0, 2);
                    } else {
                      // Weiter zurück: Datum + Wochentag
                      return format(date, "dd.MM EE", { locale: de });
                    }
                  }
                }}
                stroke="#64748b"
              />
              <YAxis stroke="#64748b" />
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name={metricConfig[selectedMetric].name}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Neue Termine und Letzte Anrufe - nur anzeigen wenn nicht Single-Day View */}
      {!isSingleDay && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Neue Termine - Links */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Neue Termine</h2>
              <div className="text-sm text-muted-foreground">
                {filteredAppointments.length} Termine
              </div>
            </div>
            
            {filteredAppointments.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredAppointments.slice(0, 10).map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="hover:shadow-md transition-shadow min-h-[80px]"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-warning/10 text-warning flex-shrink-0">
                            <CalendarIcon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {appointment.lead}
                            </h3>
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {appointment.appointmentDate}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => setSelectedLead(appointment.lead)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredAppointments.length > 10 && (
                  <div className="text-center py-3">
                    <Button variant="outline" size="sm">
                      Alle {filteredAppointments.length} Termine anzeigen
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

          {/* Letzte Anrufe - Rechts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Letzte Anrufe</h2>
              <div className="text-sm text-muted-foreground">
                {filteredCalls.length} Anrufe
              </div>
            </div>
            
            {filteredCalls.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredCalls.slice(0, 10).map((call) => (
                  <Card
                    key={call.id}
                    className="hover:shadow-md transition-shadow min-h-[80px]"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        {/* Links: Lead Name + Status */}
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0">
                            <Phone className="h-4 w-4" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-sm">
                              {call.lead}
                            </h3>
                            <div className="mt-1 flex items-center space-x-2">
                              {(() => {
                                const statusBadge = getStatusBadge(call.status);
                                const StatusIcon = statusBadge.icon;
                                return (
                                  <Badge className={`text-xs flex items-center space-x-1 ${statusBadge.className}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    <span>{call.status}</span>
                                  </Badge>
                                );
                              })()}
                              
                              {(call.followUpDate || call.status === 'Nicht erreicht') && (
                                <Badge className={`text-xs flex items-center space-x-1 ${
                                  call.followUpDate 
                                    ? 'bg-orange-50 border-orange-500 text-orange-700 hover:bg-orange-100'
                                    : 'bg-gray-50 border-gray-400 text-gray-600 hover:bg-gray-100'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {call.followUpDate 
                                      ? `Follow-Up: ${formatFollowUpDate(call.followUpDate)}`
                                      : 'Follow-Up nicht geplant'
                                    }
                                  </span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Rechts: Agent + Leadquelle + Info Icon */}
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <h4 className="font-medium text-sm">
                              {call.agent}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {call.leadSource}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => setSelectedLead(call.lead)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
                
                {filteredCalls.length > 10 && (
                  <div className="text-center py-3">
                    <Button variant="outline" size="sm">
                      Alle {filteredCalls.length} Anrufe anzeigen
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Anrufe</div>
                <div className="text-xs">
                  Keine Anrufe im gewählten Zeitraum getätigt.
                </div>
              </div>
            )}
          </div>
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