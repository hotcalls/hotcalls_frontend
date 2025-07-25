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

// Erweiterte Anruf-Daten
const generateRecentCalls = () => {
  const names = ["Max Mustermann", "Anna Schmidt", "Thomas Weber", "Julia Müller", "Robert Klein", "Sarah Wagner", "Michael Brown", "Lisa Davis", "Peter Johnson", "Maria Garcia"];
  const agents = ["Sarah", "Marcus", "Lisa", "David", "Emma"];
  const statuses = [
    { text: "Termin vereinbart", color: "bg-success" },
    { text: "Nicht erreicht", color: "bg-destructive" },
    { text: "Callback angefordert", color: "bg-warning" },
    { text: "Kein Interesse", color: "bg-muted" },
    { text: "Interessiert", color: "bg-info" },
    { text: "Qualifiziert", color: "bg-success" }
  ];
  
  const calls = [];
  for (let i = 0; i < 20; i++) {
    const date = subDays(new Date(), Math.floor(Math.random() * 7));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    calls.push({
      id: i.toString(),
      lead: names[Math.floor(Math.random() * names.length)],
      phone: `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
      status: status.text,
      time: `vor ${Math.floor(Math.random() * 120 + 5)} Min`,
      agent: agents[Math.floor(Math.random() * agents.length)],
      statusColor: status.color,
      date: format(date, 'yyyy-MM-dd'),
    });
  }
  
  return calls;
};

const recentCalls = generateRecentCalls();

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 6),
    to: new Date()
  });

  // Analytics-Daten generieren basierend auf aktuellem Zeitraum
  const analyticsData = useMemo(() => generateAnalyticsData(dateRange), [dateRange]);
  
  // Prüfe ob es ein einzelner Tag ist für unterschiedliche Formatierung
  const isSingleDay = useMemo(() => {
    return format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd');
  }, [dateRange]);

  // Statistiken basierend auf generierten Daten berechnen
  const stats = useMemo(() => {
    const totalLeads = analyticsData.reduce((sum, item) => sum + item.leads, 0);
    const totalCalls = analyticsData.reduce((sum, item) => sum + item.calls, 0);
    const totalAppointments = analyticsData.reduce((sum, item) => sum + item.appointments, 0);
    const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100).toFixed(1) : "0";

    // Vergleichszeitraum generieren
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevFromDate = subDays(dateRange.from, daysDiff);
    const prevToDate = subDays(dateRange.to, daysDiff);
    
    const prevData = generateAnalyticsData({ from: prevFromDate, to: prevToDate });
    
    const prevTotalLeads = prevData.reduce((sum, item) => sum + item.leads, 0);
    const prevTotalCalls = prevData.reduce((sum, item) => sum + item.calls, 0);
    const prevTotalAppointments = prevData.reduce((sum, item) => sum + item.appointments, 0);
    
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return "+100%";
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return [
      {
        title: "Leads",
        value: totalLeads.toLocaleString('de-DE'),
        change: calculateChange(totalLeads, prevTotalLeads),
        icon: Users,
        color: "text-info",
      },
      {
        title: "Erreichte Leads", 
        value: totalCalls.toLocaleString('de-DE'),
        change: calculateChange(totalCalls, prevTotalCalls),
        icon: Phone,
        color: "text-success",
      },
      {
        title: "Vereinbarte Termine",
        value: totalAppointments.toLocaleString('de-DE'),
        change: calculateChange(totalAppointments, prevTotalAppointments),
        icon: CalendarIcon,
        color: "text-warning",
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        change: calculateChange(
          totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0,
          prevTotalLeads > 0 ? (prevTotalAppointments / prevTotalLeads) * 100 : 0
        ),
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        
        <DateRangePicker 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
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
      <Card>
        <CardHeader>
          <CardTitle>Performance Übersicht</CardTitle>
          <p className="text-sm text-muted-foreground">
            Zeitraum: {format(dateRange.from, "dd. MMM yyyy", { locale: de })} - {format(dateRange.to, "dd. MMM yyyy", { locale: de })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
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
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="hsl(217 91% 60%)" 
                  strokeWidth={2}
                  name="Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="hsl(142 71% 45%)" 
                  strokeWidth={2}
                  name="Anrufe"
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="hsl(13 99% 57%)" 
                  strokeWidth={2}
                  name="Termine"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Calls - nur anzeigen wenn nicht Single-Day View */}
      {!isSingleDay && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Letzte Anrufe</h2>
          
          <div className="space-y-3">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${call.statusColor}`}></div>
                  <div>
                    <p className="font-medium">{call.lead}</p>
                    <p className="text-sm text-muted-foreground">{call.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{call.agent}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{call.status}</p>
                    <p className="text-xs text-muted-foreground">{call.time}</p>
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
      )}
    </div>
  );
}