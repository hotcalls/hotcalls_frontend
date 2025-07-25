import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Phone, Calendar as CalendarIcon, TrendingUp, Clock, MessageSquare, Check, X, PhoneMissed } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/agents')}
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
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: de })}
                stroke="#64748b"
              />
              <YAxis stroke="#64748b" />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd. MMM yyyy', { locale: de })}
                formatter={(value, name) => [`${value}`, metricConfig[selectedMetric].name]}
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

      {/* Letzte Anrufe */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Letzte Anrufe</h2>
          <div className="text-sm text-muted-foreground">
            {agentCalls.length} Anrufe
          </div>
        </div>
        
        {agentCalls.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {agentCalls.slice(0, 10).map((call) => (
              <Card
                key={call.id}
                className="hover:shadow-md transition-shadow min-h-[80px] cursor-pointer"
                onClick={() => setSelectedCall(call.lead)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{call.lead}</p>
                        <p className="text-sm text-muted-foreground">{call.leadSource} • {call.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(call.date), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {call.duration}
                      </div>
                      <Badge variant={
                        call.status === "Termin vereinbart" ? "outline" :
                        call.status === "Kein Interesse" ? "outline" : "outline"
                      } className={
                        call.status === "Termin vereinbart" ? "bg-green-50 border-green-600 text-green-700 hover:bg-green-100" :
                        call.status === "Kein Interesse" ? "bg-red-50 border-red-600 text-red-700 hover:bg-red-100" :
                        "bg-yellow-50 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                      }>
                        {call.status === "Termin vereinbart" ? <Check className="h-3 w-3 mr-1" /> :
                         call.status === "Kein Interesse" ? <X className="h-3 w-3 mr-1" /> :
                         <PhoneMissed className="h-3 w-3 mr-1" />}
                        {call.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Anrufe in diesem Zeitraum gefunden
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