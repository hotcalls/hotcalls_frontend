import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Users, Phone, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
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
  const names = ["Max Mustermann", "Anna Schmidt", "Thomas Weber", "Julia Müller", "Robert Klein", "Sarah Wagner", "Michael Brown", "Lisa Davis", "Peter Johnson", "Maria Garcia"];
  const statuses = ["Erreicht", "Nicht erreicht"];
  
  const calls = [];
  for (let i = 0; i < 15; i++) {
    const date = subDays(new Date(), Math.floor(Math.random() * 7));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hasFollowUp = Math.random() > 0.7; // 30% chance für Nachfolgetermin
    
    calls.push({
      id: i.toString(),
      lead: names[Math.floor(Math.random() * names.length)],
      phone: `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
      status,
      followUpDate: hasFollowUp ? format(new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), 'dd.MM HH:mm') : null,
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
    
    appointments.push({
      id: i.toString(),
      lead: names[Math.floor(Math.random() * names.length)],
      appointmentDate: format(appointmentDate, 'dd.MM HH:mm'),
      date: format(subDays(new Date(), Math.floor(Math.random() * 3)), 'yyyy-MM-dd'), // Vereinbart in den letzten 3 Tagen
    });
  }
  
  return appointments;
};

const recentCalls = generateRecentCalls();
const newAppointments = generateNewAppointments();

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'calls' | 'appointments' | 'conversion'>('leads');

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

      {/* Recent Calls & New Appointments - nur anzeigen wenn nicht Single-Day View */}
      {!isSingleDay && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Letzte Anrufe */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Letzte Anrufe</h2>
            
            <div className="space-y-3">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{call.lead}</p>
                    <p className="text-sm text-muted-foreground">{call.phone}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{call.status}</p>
                      {call.followUpDate && (
                        <p className="text-xs text-muted-foreground">Nachfolgetermin: {call.followUpDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCalls.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Anrufe im gewählten Zeitraum gefunden.
                </div>
              )}
            </div>
          </div>

          {/* Neue Termine */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Neue Termine</h2>
            
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{appointment.lead}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">Termin: {appointment.appointmentDate}</p>
                  </div>
                </div>
              ))}
              
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Termine im gewählten Zeitraum gefunden.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}