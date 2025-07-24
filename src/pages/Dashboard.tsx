import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Phone, Calendar as CalendarIcon, TrendingUp, CalendarDays } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

// Mock data für Analytics mit Zeitstempel
const analyticsData = [
  { date: '2024-01-15', leads: 45, calls: 38, appointments: 12 },
  { date: '2024-01-16', leads: 52, calls: 44, appointments: 15 },
  { date: '2024-01-17', leads: 38, calls: 31, appointments: 8 },
  { date: '2024-01-18', leads: 61, calls: 52, appointments: 18 },
  { date: '2024-01-19', leads: 49, calls: 41, appointments: 14 },
  { date: '2024-01-20', leads: 55, calls: 47, appointments: 16 },
  { date: '2024-01-21', leads: 43, calls: 36, appointments: 11 },
  { date: '2024-01-22', leads: 68, calls: 58, appointments: 22 },
  { date: '2024-01-23', leads: 41, calls: 35, appointments: 10 },
  { date: '2024-01-24', leads: 57, calls: 48, appointments: 17 },
];

const recentCalls = [
  {
    id: "1",
    lead: "Max Mustermann",
    phone: "+49 151 12345678",
    status: "Termin vereinbart",
    time: "vor 5 Min",
    agent: "Sarah",
    statusColor: "bg-success",
    date: "2024-01-24",
  },
  {
    id: "2", 
    lead: "Anna Schmidt",
    phone: "+49 171 98765432",
    status: "Nicht erreicht",
    time: "vor 12 Min",
    agent: "Marcus",
    statusColor: "bg-destructive",
    date: "2024-01-24",
  },
  {
    id: "3",
    lead: "Thomas Weber",
    phone: "+49 162 55566677",
    status: "Callback angefordert",
    time: "vor 18 Min", 
    agent: "Lisa",
    statusColor: "bg-warning",
    date: "2024-01-24",
  },
  {
    id: "4",
    lead: "Julia Müller",
    phone: "+49 175 33344455",
    status: "Kein Interesse",
    time: "vor 25 Min",
    agent: "Sarah",
    statusColor: "bg-muted",
    date: "2024-01-23",
  },
  {
    id: "5",
    lead: "Robert Klein",
    phone: "+49 152 77788899",
    status: "Termin vereinbart",
    time: "vor 32 Min",
    agent: "Marcus",
    statusColor: "bg-success",
    date: "2024-01-23",
  },
];

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [fromDate, setFromDate] = useState<Date | undefined>(dateRange.from);
  const [toDate, setToDate] = useState<Date | undefined>(dateRange.to);

  // Daten basierend auf gewähltem Zeitraum filtern
  const filteredData = useMemo(() => {
    return analyticsData.filter(item => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    });
  }, [dateRange]);

  // Statistiken basierend auf gefilterter Daten berechnen
  const stats = useMemo(() => {
    const totalLeads = filteredData.reduce((sum, item) => sum + item.leads, 0);
    const totalCalls = filteredData.reduce((sum, item) => sum + item.calls, 0);
    const totalAppointments = filteredData.reduce((sum, item) => sum + item.appointments, 0);
    const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100).toFixed(1) : "0";

    return [
      {
        title: "Leads",
        value: totalLeads.toString(),
        change: "+20.1%",
        icon: Users,
        color: "text-info",
      },
      {
        title: "Erreichte Leads", 
        value: totalCalls.toString(),
        change: "+15.3%",
        icon: Phone,
        color: "text-success",
      },
      {
        title: "Vereinbarte Termine",
        value: totalAppointments.toString(),
        change: "+8.7%", 
        icon: CalendarIcon,
        color: "text-warning",
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        change: "+2.1%",
        icon: TrendingUp,
        color: "text-primary",
      },
    ];
  }, [filteredData]);

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

  const updateDateRange = () => {
    if (fromDate && toDate) {
      setDateRange({ from: fromDate, to: toDate });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        
        {/* Datepicker für Zeitraum */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "dd.MM.yyyy") : "Von"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">bis</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "dd.MM.yyyy") : "Bis"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Button onClick={updateDateRange} size="sm">
              Aktualisieren
            </Button>
          </div>
        </div>
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
            Zeitraum: {format(dateRange.from, "dd.MM.yyyy")} - {format(dateRange.to, "dd.MM.yyyy")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), "dd.MM")}
                  stroke="#64748b"
                />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), "dd.MM.yyyy")}
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

      {/* Recent Calls */}
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
    </div>
  );
}