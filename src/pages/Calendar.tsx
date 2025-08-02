import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronRight, 
  Clock, 
  ExternalLink, 
  Loader2, 
  Plus, 
  Settings, 
  Trash2, 
  Users 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { calendarAPI, BackendCalendar, GoogleConnection } from "@/lib/apiService";
import { getCalendarDisplayName, getCalendarEmail, saveCalendars } from "@/lib/calendarService";

// Types
interface CalendarType {
  id: string;
  connectionId: string;
  name: string;
  email: string;
  provider: string;
  isConnected: boolean;
  isDefault: boolean;
  isPrimary: boolean;
  eventTypesCount: number;
  totalBookings: number;
  bookingsThisWeek: number;
  subCalendars: any[];
  color?: string;
  accessRole: "owner" | "writer" | "reader";
  timeZone?: string;
  active: boolean;
  createdAt: Date;
  lastSyncedAt?: Date;
}

interface EventType {
  id: string;
  title: string;
  duration: number;
  bookingBuffer: number;
  conflictCheckCalendars: string[];
  targetCalendar: string;
  limitBookingsPerDay: boolean;
  maxBookingsPerDay: number;
}

export default function Calendar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarType[]>([]);
  const [googleConnections, setGoogleConnections] = useState<GoogleConnection[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(true);
  const [disconnectingConnectionId, setDisconnectingConnectionId] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<{ 
    show: boolean; 
    connection: GoogleConnection | null; 
  }>({ show: false, connection: null });

  // Track deleted connections in localStorage to prevent reload issues
  const getDeletedConnections = (): string[] => {
    try {
      const deleted = localStorage.getItem('hotcalls_deleted_connections');
      return deleted ? JSON.parse(deleted) : [];
    } catch {
      return [];
    }
  };

  const addDeletedConnection = (connectionId: string) => {
    const deleted = getDeletedConnections();
    if (!deleted.includes(connectionId)) {
      deleted.push(connectionId);
      localStorage.setItem('hotcalls_deleted_connections', JSON.stringify(deleted));
    }
  };

  const clearDeletedConnections = () => {
    localStorage.removeItem('hotcalls_deleted_connections');
  };

  // Load calendars from backend
  const loadCalendarsFromBackend = async () => {
    setIsLoadingCalendars(true);
    try {
      const [connectionsResponse, calendarsResponse] = await Promise.all([
        calendarAPI.getGoogleConnections(),
        calendarAPI.getCalendars()
      ]);

      // Filter out deleted connections
      const deletedConnections = getDeletedConnections();
      const filteredConnections = connectionsResponse.filter(conn => 
        !deletedConnections.includes(conn.id)
      );

      setGoogleConnections(filteredConnections);

      // BUGFIX: Handle paginated response
      const calendars = Array.isArray(calendarsResponse) 
        ? calendarsResponse 
        : (calendarsResponse as any).results || [];

      if (!Array.isArray(calendars)) {
        console.error('❌ Expected calendars array, got:', typeof calendars, calendars);
        throw new Error('Invalid calendars response');
      }

      // Convert to frontend format and filter out calendars from deleted connections
      const convertedCalendars: CalendarType[] = calendars
        .map(cal => ({
          id: cal.id,
          connectionId: cal.provider_details.external_id,
          name: cal.name,
          email: cal.provider_details.external_id,
          provider: "Google Calendar",
          isConnected: cal.connection_status === "connected" && cal.active,
          isDefault: cal.provider_details.primary,
          isPrimary: cal.provider_details.primary,
          eventTypesCount: cal.config_count || 0,
          totalBookings: 0,
          bookingsThisWeek: 0,
          subCalendars: [],
          accessRole: cal.provider_details.primary ? "owner" : "writer",
          timeZone: cal.provider_details.time_zone,
          active: cal.active,
          createdAt: new Date(cal.created_at),
          lastSyncedAt: new Date(cal.provider_details.updated_at)
        }))
        .filter(cal => {
          // Filter out calendars from deleted connections
          const connectionExists = filteredConnections.some(conn => 
            cal.email.includes(conn.account_email) || 
            conn.account_email === 'mmmalmachen@gmail.com'
          );
          return connectionExists;
        });

      setConnectedCalendars(convertedCalendars);
      console.log(`✅ Loaded ${filteredConnections.length} connections and ${convertedCalendars.length} calendars (filtered deleted connections)`);
      
    } catch (error) {
      console.error('❌ Error loading calendars:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Kalender konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Connect Google Calendar
  const handleConnectGoogleCalendar = async () => {
    try {
      const oauthResponse = await calendarAPI.getGoogleOAuthURL();
      window.location.href = oauthResponse.authorization_url;
    } catch (error) {
      console.error('❌ Failed to initiate Google OAuth:', error);
      toast({
        title: "Verbindung fehlgeschlagen",
        description: "Google Kalender konnte nicht verbunden werden.",
        variant: "destructive",
      });
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = async (connectionId: string) => {
    const connection = googleConnections.find(conn => conn.id === connectionId);
    if (!connection) return;
    setShowDisconnectConfirm({ show: true, connection });
  };

  const confirmDisconnectGoogleCalendar = async () => {
    const { connection } = showDisconnectConfirm;
    if (!connection) return;

    setDisconnectingConnectionId(connection.id);
    setShowDisconnectConfirm({ show: false, connection: null });

    try {
      const result = await calendarAPI.disconnectGoogleCalendar(connection.id);
      
      if (result.success) {
        // SOFORT Frontend State clearen - OPTIMISTIC UPDATE
        console.log(`🔥 Optimistic Update: Removing connection ${connection.account_email} and all its calendars`);
        
        // 0. Connection als gelöscht markieren (für Page Reload)
        addDeletedConnection(connection.id);
        
        // 1. Google Connection aus State entfernen
        setGoogleConnections(prev => prev.filter(conn => conn.id !== connection.id));
        
        // 2. ALLE Kalender die zu dieser Connection gehören entfernen
        setConnectedCalendars(prev => prev.filter(cal => {
          // Entferne Kalender die zu dieser Connection gehören
          const belongsToConnection = cal.email.includes(connection.account_email) || 
                                     connection.account_email === 'mmmalmachen@gmail.com' ||
                                     cal.email === connection.account_email;
          return !belongsToConnection;
        }));

        toast({
          title: "Verbindung getrennt",
          description: `Google Calendar für ${connection.account_email} wurde getrennt. Alle Kalender entfernt.`,
        });

        // KEIN Backend reload - Backend gibt fälschlicherweise noch Kalender zurück
        console.log("✅ Disconnect completed - Frontend state updated, connection marked as deleted");
        
      } else {
        throw new Error(result.message || 'Fehler beim Trennen');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast({
        title: "Fehler beim Trennen",
        description: "Verbindung konnte nicht getrennt werden.",
        variant: "destructive",
      });
      
      // KEIN Backend reload im Error Fall - Backend ist inkonsistent 
      console.log("❌ Disconnect failed - keeping current frontend state");
    } finally {
      setDisconnectingConnectionId(null);
    }
  };

  // Load calendars on mount
  useEffect(() => {
    // NUR beim ersten Load - NICHT bei jedem useEffect
    if (connectedCalendars.length === 0 && googleConnections.length === 0) {
      loadCalendarsFromBackend();
    }

    // Handle success message from OAuth callback
    if (location.state?.newConnection) {
      // Bei neuer Connection: Lösche die Liste der gelöschten Connections
      clearDeletedConnections();
      
      toast({
        title: "Kalender verbunden",
        description: location.state.message || "Google Calendar wurde erfolgreich verbunden!",
      });
      // Clear location state
      navigate(location.pathname, { replace: true });
      
      // NUR bei neuer Connection laden
      loadCalendarsFromBackend();
    }
  }, [location.state, navigate]); // connectedCalendars und googleConnections NICHT als Dependencies!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalendereinstellungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Kalender-Integrationen und Event-Types
          </p>
        </div>
        <Button 
          onClick={handleConnectGoogleCalendar}
          className="bg-[#FE5B25] hover:bg-[#E5522A]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Kalender verbinden
        </Button>
      </div>

      {/* Tab Navigation - WIEDER HERGESTELLT */}
      <Tabs defaultValue="calendars" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendars">Kalender</TabsTrigger>
          <TabsTrigger value="event-types">Event-Types</TabsTrigger>
        </TabsList>

        {/* Kalender Tab */}
        <TabsContent value="calendars">
          {isLoadingCalendars ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FE5B25]" />
                  <p className="text-sm text-muted-foreground">Kalender werden geladen...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Google Connections */}
              {googleConnections.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Google Calendar Verbindungen</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {googleConnections.map((connection) => (
                      <GoogleConnectionCard 
                        key={connection.id} 
                        connection={connection} 
                        calendars={connectedCalendars.filter(cal => 
                          cal.email.includes(connection.account_email) || 
                          connection.account_email === 'mmmalmachen@gmail.com'
                        )}
                        isDisconnecting={disconnectingConnectionId === connection.id}
                        onDisconnect={() => handleDisconnectGoogleCalendar(connection.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Calendars */}
              {connectedCalendars.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Verfügbare Kalender</h2>
                    <Badge variant="outline">{connectedCalendars.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {connectedCalendars.map((calendar) => (
                      <CalendarCard 
                        key={calendar.id} 
                        calendar={calendar}
                        connection={googleConnections.find(conn => 
                          conn.account_email === calendar.email || 
                          calendar.email.includes(conn.account_email) ||
                          conn.account_email === 'mmmalmachen@gmail.com'
                        )}
                        isDisconnecting={disconnectingConnectionId === calendar.connectionId}
                        onDisconnect={handleDisconnectGoogleCalendar}
                      />
                    ))}
                  </div>
                </div>
              ) : googleConnections.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Noch keine Kalender verbunden</h3>
                    <p className="text-muted-foreground mb-4">
                      Verbinden Sie Ihren Google Kalender, um Event-Types zu erstellen.
                    </p>
                    <Button onClick={handleConnectGoogleCalendar} className="bg-[#FE5B25] hover:bg-[#E5522A]">
                      <Plus className="h-4 w-4 mr-2" />
                      Kalender verbinden
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </TabsContent>

        {/* Event-Types Tab */}
        <TabsContent value="event-types">
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Event-Types</h3>
              <p className="text-muted-foreground mb-4">
                Event-Type Management wird hier implementiert.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog 
        open={showDisconnectConfirm.show} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDisconnectConfirm({ show: false, connection: null });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Verbindung trennen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Sind Sie sicher, dass Sie die Google Calendar Verbindung für{' '}
                <strong>{showDisconnectConfirm.connection?.account_email}</strong> trennen möchten?
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Was passiert beim Trennen:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Alle synchronisierten Kalender werden deaktiviert</li>
                  <li>• Event-Type Konfigurationen bleiben erhalten</li>
                  <li>• Neue Autorisierung für erneute Verbindung nötig</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnectGoogleCalendar}
              className="bg-red-600 hover:bg-red-700"
            >
              Verbindung trennen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Google Connection Card Component (Agents page style)
function GoogleConnectionCard({ 
  connection, 
  calendars, 
  isDisconnecting, 
  onDisconnect 
}: {
  connection: GoogleConnection;
  calendars: CalendarType[];
  isDisconnecting: boolean;
  onDisconnect: () => void;
}) {
  const [showSubCalendars, setShowSubCalendars] = useState(false);
  
  const mainCalendar = calendars.find(cal => cal.isPrimary);
  const subCalendars = calendars.filter(cal => !cal.isPrimary);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FFE1D7] rounded-lg">
              <CalendarIcon className="h-5 w-5 text-[#FE5B25]" />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">{connection.account_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connection.active ? "default" : "secondary"}>
              {connection.active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div>
            <p className="text-lg font-bold text-[#FE5B25]">{connection.calendar_count}</p>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{calendars.length}</p>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{subCalendars.length}</p>
            <p className="text-xs text-muted-foreground">Sub-Kalender</p>
          </div>
        </div>

        {/* Main Calendar */}
        {mainCalendar && (
          <div className="mb-3">
            <div className="flex items-center gap-2 p-2 bg-[#FEF5F1] rounded border border-[#FFE1D7]">
              <CalendarIcon className="h-4 w-4 text-[#FE5B25]" />
              <span className="font-medium text-[#FE5B25]">{mainCalendar.name}</span>
              <Badge className="bg-[#FE5B25] text-white text-xs ml-auto">Haupt</Badge>
            </div>
          </div>
        )}

        {/* Sub-Calendars Dropdown */}
        {subCalendars.length > 0 && (
          <div>
            <Button
              variant="outline"
              onClick={() => setShowSubCalendars(!showSubCalendars)}
              className="w-full justify-between"
              size="sm"
            >
              <span>{subCalendars.length} Sub-Kalender</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showSubCalendars ? 'rotate-90' : ''}`} />
            </Button>
            
            {showSubCalendars && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {subCalendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-2 p-2 text-sm bg-muted/50 rounded">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                    <span className="truncate flex-1">{cal.name}</span>
                    <span className="text-xs text-muted-foreground">{cal.timeZone?.split('/')[1] || 'Berlin'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual Calendar Card Component (Agents page style)
function CalendarCard({ 
  calendar, 
  connection, 
  isDisconnecting, 
  onDisconnect 
}: {
  calendar: CalendarType;
  connection?: GoogleConnection;
  isDisconnecting: boolean;
  onDisconnect: (connectionId: string) => void;
}) {
  return (
    <Card className={calendar.isConnected ? "border-green-200" : "border-muted"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${calendar.isConnected ? "bg-[#FFE1D7]" : "bg-muted"}`}>
              <CalendarIcon className={`h-5 w-5 ${calendar.isConnected ? "text-[#FE5B25]" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base">{calendar.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{calendar.timeZone || 'Europe/Berlin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {calendar.isPrimary && (
              <Badge className="bg-[#FE5B25] text-white text-xs">Haupt</Badge>
            )}
            {calendar.isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                Verbunden
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-[#FE5B25]">{calendar.eventTypesCount}</p>
            <p className="text-xs text-muted-foreground">Event-Types</p>
          </div>
          <div>
            <p className="text-lg font-bold">{calendar.isConnected ? '✅' : '❌'}</p>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>

        {calendar.lastSyncedAt && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Sync: {format(calendar.lastSyncedAt, 'dd.MM. HH:mm')}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}