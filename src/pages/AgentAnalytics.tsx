import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Phone, Calendar as CalendarIcon, TrendingUp, TrendingDown, Clock, MessageSquare, Check, X, PhoneMissed } from "lucide-react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

// Agent-Daten (würde normalerweise aus einer API kommen)
const agentData = {
  "1": { name: "Sarah", status: "Aktiv" },
  "2": { name: "Marcus", status: "Aktiv" }, 
  "3": { name: "Lisa", status: "Pausiert" }
};

// Generiere Analytics-Daten für einen Agent
const generateAgentAnalyticsData = (dateRange: {from: Date, to: Date}, agentId: string) => {
  const data = [];
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  days.forEach(day => {
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Agent-spezifische Leistung (Sarah ist der beste Performer)
    const performanceMultiplier = agentId === "1" ? 1.5 : agentId === "2" ? 1.2 : 0.8;
    
    const baseLeads = (isWeekend ? 10 : 25) * performanceMultiplier;
    const baseCallsRate = isWeekend ? 0.6 : 0.85;
    const baseAppointmentRate = isWeekend ? 0.15 : 0.25;
    
    const leads = Math.floor(baseLeads + (Math.random() - 0.5) * 10);
    const calls = Math.floor(leads * baseCallsRate + (Math.random() - 0.5) * 5);
    const appointments = Math.floor(leads * baseAppointmentRate + (Math.random() - 0.5) * 2);
    
    // Durchschnittliche Gesprächsdauer für diesen Tag
    const avgDuration = calls > 0 ? Math.floor(5 + Math.random() * 10) : 0; // 5-15 Min
    
    // Conversion Rate für diesen Tag
    const dayConversion = leads > 0 ? ((appointments / leads) * 100) : 0;
    
    data.push({
      date: day.toISOString(),
      leads: Math.max(0, leads),
      calls: Math.max(0, calls),
      appointments: Math.max(0, appointments),
      conversion: Math.round(dayConversion * 10) / 10, // Auf 1 Dezimalstelle gerundet
      avgDuration: avgDuration
    });
  });
  
  return data;
};

// Generiere agent-spezifische Anrufe
const generateAgentCalls = (agentId: string) => {
  const leadNames = ["Max Mustermann", "Anna Schmidt", "Thomas Weber", "Julia Müller", "Robert Klein"];
  const leadSources = ["Google Ads", "Facebook", "LinkedIn", "Website", "Empfehlung"];
  const statuses = ["Termin vereinbart", "Kein Interesse", "Nicht erreicht"];
  
  const calls = [];
  for (let i = 0; i < 10; i++) {
    const date = subDays(new Date(), Math.floor(Math.random() * 7));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    calls.push({
      id: i.toString(),
      lead: leadNames[Math.floor(Math.random() * leadNames.length)],
      leadSource: leadSources[Math.floor(Math.random() * leadSources.length)],
      phone: `+49 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`,
      status,
      date: date.toISOString(),
      duration: `${Math.floor(Math.random() * 15 + 2)} Min`,
      agentId: agentId,
    });
  }
  
  return calls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generiere Lead-Details für Agent-Anrufe
const generateLeadDetails = (calls: any[]) => {
  const details: any = {};
  
  calls.forEach(call => {
    if (!details[call.lead]) {
      details[call.lead] = {
        name: call.lead,
        company: `${call.lead.split(' ')[1]} GmbH`,
        phone: call.phone,
        email: `${call.lead.toLowerCase().replace(' ', '.')}@${call.lead.split(' ')[1].toLowerCase()}.de`,
        callCount: 1,
        lastCall: {
          date: format(new Date(call.date), 'dd.MM.yyyy HH:mm', { locale: de }),
          outcome: call.status
        },
        allCalls: [{
          id: call.id,
          date: format(new Date(call.date), 'dd.MM.yyyy HH:mm', { locale: de }),
          duration: call.duration,
          outcome: call.status,
          transcript: `Agent: Guten Tag ${call.lead.split(' ')[0]}, hier ist Agent ${agentData[call.agentId]?.name || 'Sarah'} von HotCalls. Vielen Dank für Ihr Interesse an unseren Dienstleistungen.\n\nKunde: Hallo, ja ich habe mich auf Ihrer Website über Ihre Lösungen informiert.\n\nAgent: Das freut mich zu hören! Darf ich fragen, welcher Bereich Sie besonders interessiert?\n\nKunde: Wir suchen nach einer Lösung für unser Lead Management.\n\nAgent: Verstehe. Können Sie mir etwas mehr über Ihre aktuellen Herausforderungen erzählen?\n\nKunde: ${call.status === 'Termin vereinbart' ? 'Ja gerne, können wir einen Termin vereinbaren?' : call.status === 'Kein Interesse' ? 'Eigentlich haben wir doch kein Interesse.' : 'Ich bin gerade nicht erreichbar, können Sie später nochmal anrufen?'}`
        }]
      };
    } else {
      details[call.lead].callCount++;
      details[call.lead].allCalls.push({
        id: call.id,
        date: format(new Date(call.date), 'dd.MM.yyyy HH:mm', { locale: de }),
        duration: call.duration,
        outcome: call.status,
        transcript: `Agent: Hallo ${call.lead.split(' ')[0]}, hier ist wieder Agent ${agentData[call.agentId]?.name || 'Sarah'} von HotCalls.\n\nKunde: Hallo!\n\nAgent: Wie versprochen melde ich mich nochmal bei Ihnen.\n\nKunde: ${call.status === 'Termin vereinbart' ? 'Ja perfekt, lassen Sie uns einen Termin vereinbaren.' : call.status === 'Kein Interesse' ? 'Danke, aber wir haben uns dagegen entschieden.' : 'Können Sie später nochmal anrufen?'}`
      });
    }
  });
  
  return details;
};

export default function AgentAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'calls' | 'appointments' | 'conversion' | 'avgDuration'>('leads');
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);

  const agent = agentData[id as keyof typeof agentData];
  
  if (!agent) {
    return <div>Agent nicht gefunden</div>;
  }

  // Analytics-Daten für den Agent
  const analyticsData = useMemo(() => 
    generateAgentAnalyticsData(dateRange, id!), 
    [dateRange, id]
  );

  const agentCalls = useMemo(() => generateAgentCalls(id!), [id]);
  const leadDetails = useMemo(() => generateLeadDetails(agentCalls), [agentCalls]);

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

  // Berechne Gesamt-Metriken
  const totalLeads = analyticsData.reduce((sum, day) => sum + day.leads, 0);
  const totalCalls = analyticsData.reduce((sum, day) => sum + day.calls, 0);
  const totalAppointments = analyticsData.reduce((sum, day) => sum + day.appointments, 0);
  const totalMinutes = agentCalls.reduce((sum, call) => {
    const minutes = parseInt(call.duration.replace(' Min', '')) || 0;
    return sum + minutes;
  }, 0);

  const conversionRate = totalLeads > 0 ? ((totalAppointments / totalLeads) * 100).toFixed(1) : "0.0";
  const avgDuration = totalCalls > 0 ? Math.round(totalMinutes / totalCalls) : 0;

  // Vergleichszeitraum berechnen
  const { prevAnalyticsData, prevFromDate, prevToDate } = useMemo(() => {
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevFromDate = subDays(dateRange.from, daysDiff);
    const prevToDate = subDays(dateRange.to, daysDiff);
    
    return {
      prevAnalyticsData: generateAgentAnalyticsData({ from: prevFromDate, to: prevToDate }, id!),
      prevFromDate,
      prevToDate
    };
  }, [dateRange, id]);

  const prevAgentCalls = useMemo(() => generateAgentCalls(id!), [id]);

  // Vergleichswerte berechnen
  const prevTotalLeads = prevAnalyticsData.reduce((sum, day) => sum + day.leads, 0);
  const prevTotalCalls = prevAnalyticsData.reduce((sum, day) => sum + day.calls, 0);
  const prevTotalAppointments = prevAnalyticsData.reduce((sum, day) => sum + day.appointments, 0);
  const prevTotalMinutes = prevAgentCalls.reduce((sum, call) => {
    const minutes = parseInt(call.duration.replace(' Min', '')) || 0;
    return sum + minutes;
  }, 0);
  
  const prevConversionRate = prevTotalLeads > 0 ? ((prevTotalAppointments / prevTotalLeads) * 100) : 0;
  const prevAvgDuration = prevTotalCalls > 0 ? Math.round(prevTotalMinutes / prevTotalCalls) : 0;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Stats für klickbare Cards
  const stats = [
    {
      id: 'leads',
      title: "Eingangene Leads",
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
      title: "Termine vereinbart", 
      value: totalAppointments.toLocaleString('de-DE'),
      change: calculateChange(totalAppointments, prevTotalAppointments),
      icon: CalendarIcon,
      color: "text-warning",
    },
    {
      id: 'conversion',
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      change: calculateChange(parseFloat(conversionRate), prevConversionRate),
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      id: 'avgDuration',
      title: "⌀ Gesprächsdauer",
      value: `${avgDuration} Min`,
      change: calculateChange(avgDuration, prevAvgDuration),
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  // Metriken-Konfiguration für Chart
  const metricConfig = {
    leads: { name: 'Eingangene Leads', color: '#8884d8' },
    calls: { name: 'Erreichte Leads', color: '#82ca9d' },
    appointments: { name: 'Termine vereinbart', color: '#ffc658' },
    conversion: { name: 'Conversion Rate', color: '#ff7300' },
    avgDuration: { name: '⌀ Gesprächsdauer', color: '#8b5cf6' }
  } as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/agents')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Agents
          </Button>
          <h2 className="text-xl font-semibold">Agent Analytics: {agent.name}</h2>
        </div>
      </div>

      {/* Stats Cards - Klickbar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

      {/* Analytics Chart */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
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
        
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analyticsData} margin={{ top: 20, right: 20, left: 25, bottom: 20 }}>
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
                tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: de })}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#6b7280' }}
                width={35}
                tickMargin={5}
              />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd. MMM yyyy', { locale: de })}
                formatter={(value, name) => [`${value}${selectedMetric === 'conversion' ? '%' : ''}`, metricConfig[selectedMetric].name]}
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

      {/* Letzte Anrufe - moderne Tabelle */}
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
        {agentCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead-Quelle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dauer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentCalls.slice(0, 10).map((call) => (
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
                      <div className="text-sm text-gray-900">{call.phone}</div>
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
                      <div className="text-sm text-gray-900">{call.leadSource}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(call.date), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{call.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCall(call.lead)}
                          className="h-8 w-8 p-0"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCall(call.lead)}
                          className="h-8 w-8 p-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
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
              Keine Anrufe in diesem Zeitraum gefunden.
            </div>
          </div>
        )}
      </div>

      {/* Lead Details Slide-in Panel */}
      <Sheet open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <SheetContent side="right" className="w-[35vw] min-w-[500px] max-w-[40vw] focus:outline-none">
          {selectedCall && leadDetails[selectedCall] && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">
                  Lead Details: {selectedCall}
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
                        <span className="text-sm">{leadDetails[selectedCall].company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadDetails[selectedCall].phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadDetails[selectedCall].email}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Gesprächsstatistik */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium mb-3">
                      Gesprächsstatistik
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Anrufe gesamt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedCall].callCount}
                          </div>
                          <p className="text-xs text-muted-foreground">Anrufe gesamt</p>
                        </CardContent>
                      </Card>
                      
                      {/* Minuten gesamt */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedCall].allCalls.reduce((total: number, call: any) => {
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
                            {leadDetails[selectedCall].lastCall?.date || '-'}
                          </div>
                          <p className="text-xs text-muted-foreground">Letzter Anruf</p>
                        </CardContent>
                      </Card>
                      
                      {/* Status */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="text-lg font-bold">
                            {leadDetails[selectedCall].lastCall?.outcome || '-'}
                          </div>
                          <p className="text-xs text-muted-foreground">Status</p>
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
                      {leadDetails[selectedCall].allCalls.map((call: any) => (
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
                                            Agent {agent.name}
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
                                            Lead {selectedCall}
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