import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Calendar, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Leads",
    value: "1,247",
    change: "+20.1%",
    icon: Users,
    color: "text-info",
  },
  {
    title: "Erreichte Leads", 
    value: "892",
    change: "+15.3%",
    icon: Phone,
    color: "text-success",
  },
  {
    title: "Vereinbarte Termine",
    value: "234",
    change: "+8.7%", 
    icon: Calendar,
    color: "text-warning",
  },
  {
    title: "Conversion Rate",
    value: "18.8%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "text-primary",
  },
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
  },
  {
    id: "2", 
    lead: "Anna Schmidt",
    phone: "+49 171 98765432",
    status: "Nicht erreicht",
    time: "vor 12 Min",
    agent: "Marcus",
    statusColor: "bg-destructive",
  },
  {
    id: "3",
    lead: "Thomas Weber",
    phone: "+49 162 55566677",
    status: "Callback angefordert",
    time: "vor 18 Min", 
    agent: "Lisa",
    statusColor: "bg-warning",
  },
  {
    id: "4",
    lead: "Julia Müller",
    phone: "+49 175 33344455",
    status: "Kein Interesse",
    time: "vor 25 Min",
    agent: "Sarah",
    statusColor: "bg-muted",
  },
  {
    id: "5",
    lead: "Robert Klein",
    phone: "+49 152 77788899",
    status: "Termin vereinbart",
    time: "vor 32 Min",
    agent: "Marcus",
    statusColor: "bg-success",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
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
                <span className="text-success">{stat.change}</span> seit letztem Monat
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Calls */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Letzte Anrufe</h2>
        
        <div className="space-y-3">
          {recentCalls.map((call) => (
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
        </div>
      </div>
    </div>
  );
}