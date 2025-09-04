// Calendar Service for production-ready calendar management

export interface SubCalendar {
  id: string;
  name: string;
  color?: string;
  isPublic?: boolean;
  isWritable?: boolean;
  description?: string;
}

export interface Calendar {
  id: string;
  connectionId?: string;
  name: string;
  email: string;
  provider: string;
  isConnected: boolean;
  isDefault: boolean;
  isPrimary?: boolean;
  eventTypesCount: number;
  totalBookings: number;
  bookingsThisWeek: number;
  subCalendars: SubCalendar[];
  color?: string;
  accessRole?: string;
  timeZone?: string;
  active?: boolean;
  createdAt?: Date;
  lastSyncedAt?: Date;
}

export interface CalendarConnection {
  id: string;
  provider: string;
  accountEmail: string;
  calendars: Calendar[];
  createdAt: Date;
  lastSyncedAt: Date;
}

// LocalStorage keys
const STORAGE_KEYS = {
  CALENDARS: 'hotcalls_calendars',
  CONNECTIONS: 'hotcalls_calendar_connections',
  LAST_SYNC: 'hotcalls_calendar_last_sync'
};

/**
 * Get all stored calendars
 */
export function getStoredCalendars(): Calendar[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CALENDARS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading calendars:', error);
    return [];
  }
}

/**
 * Save calendars to localStorage
 */
export function saveCalendars(calendars: Calendar[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDARS, JSON.stringify(calendars));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving calendars:', error);
  }
}

/**
 * Add new calendars from OAuth connection
 */
export function addCalendarsFromOAuth(oauthCalendars: any[], existingCalendars: Calendar[], provider?: string): Calendar[] {
  // Create a map of existing calendars by email for quick lookup
  const existingMap = new Map(existingCalendars.map(cal => [cal.email, cal]));
  
  // Process new calendars
  const processedCalendars = oauthCalendars.map(oauthCal => {
    const existing = existingMap.get(oauthCal.email || oauthCal.external_id);
    
    // Determine provider for this calendar
    const calendarProvider = provider || 
                            (oauthCal.provider === 'outlook' ? 'Microsoft 365' : 
                             oauthCal.provider === 'google' ? 'Google Calendar' : 
                             'Google Calendar'); // fallback

    // If calendar already exists, update it
    if (existing) {
      return {
        ...existing,
        isConnected: true,
        name: oauthCal.name || existing.name,
        provider: calendarProvider, // Update provider in case it changed
        color: oauthCal.color || existing.color,
        isPrimary: oauthCal.primary,
        accessRole: oauthCal.access_role,
        timeZone: oauthCal.time_zone,
        lastSyncedAt: new Date(),
        connectionId: oauthCal.connection_id
      };
    }
    
    // Create new calendar entry
    return {
      id: oauthCal.id || `${oauthCal.email}-${Date.now()}`,
      connectionId: oauthCal.connection_id,
      name: oauthCal.name,
      email: oauthCal.email || oauthCal.external_id,
      provider: calendarProvider,
      isConnected: true,
      isDefault: oauthCal.primary || false,
      isPrimary: oauthCal.primary,
      eventTypesCount: 0,
      totalBookings: 0,
      bookingsThisWeek: 0,
      subCalendars: [],
      color: oauthCal.color,
      accessRole: oauthCal.access_role,
      timeZone: oauthCal.time_zone,
      active: true,
      createdAt: new Date(),
      lastSyncedAt: new Date()
    };
  });
  
  // Merge with existing calendars (keep calendars not in the new list)
  const newEmails = new Set(processedCalendars.map(cal => cal.email));
  const keptCalendars = existingCalendars.filter(cal => !newEmails.has(cal.email));
  
  const mergedCalendars = [...processedCalendars, ...keptCalendars];
  
  // Save to localStorage
  saveCalendars(mergedCalendars);
  
  return mergedCalendars;
}

/**
 * Disconnect a calendar (soft delete - keeps data but marks as disconnected)
 */
export function disconnectCalendar(calendarId: string, calendars: Calendar[]): Calendar[] {
  const updatedCalendars = calendars.map(cal => 
    cal.id === calendarId 
      ? { ...cal, isConnected: false, connectionId: undefined, lastSyncedAt: new Date() }
      : cal
  );
  
  saveCalendars(updatedCalendars);
  return updatedCalendars;
}

/**
 * Delete a calendar permanently
 */
export function deleteCalendar(calendarId: string, calendars: Calendar[]): Calendar[] {
  const filteredCalendars = calendars.filter(cal => cal.id !== calendarId);
  saveCalendars(filteredCalendars);
  return filteredCalendars;
}

/**
 * Set default calendar
 */
export function setDefaultCalendar(calendarId: string, calendars: Calendar[]): Calendar[] {
  const updatedCalendars = calendars.map(cal => ({
    ...cal,
    isDefault: cal.id === calendarId
  }));
  
  saveCalendars(updatedCalendars);
  return updatedCalendars;
}

/**
 * Update calendar statistics
 */
export function updateCalendarStats(
  calendarId: string, 
  stats: Partial<Pick<Calendar, 'eventTypesCount' | 'totalBookings' | 'bookingsThisWeek'>>,
  calendars: Calendar[]
): Calendar[] {
  const updatedCalendars = calendars.map(cal => 
    cal.id === calendarId 
      ? { ...cal, ...stats }
      : cal
  );
  
  saveCalendars(updatedCalendars);
  return updatedCalendars;
}

/**
 * Check if a calendar can be edited (has write access)
 */
export function canEditCalendar(calendar: Calendar): boolean {
  return calendar.isConnected && 
         (calendar.accessRole === 'owner' || calendar.accessRole === 'writer');
}

/**
 * Get calendar display name - improved for backend schema
 */
export function getCalendarDisplayName(calendar: Calendar): string {
  // Use the calendar name from backend as primary display
  if (calendar.name && calendar.name.trim() !== '') {
    const isPrimary = calendar.isPrimary || calendar.isDefault;
    return isPrimary ? `${calendar.name} (Haupt)` : calendar.name;
  }
  
  // Fallback to email if name is not available
  if (calendar.email && calendar.email.includes('@')) {
    // If it's a real email, extract username
    const emailParts = calendar.email.split('@');
    const username = emailParts[0];
    const isPrimary = calendar.isPrimary || calendar.isDefault;
    return isPrimary ? `${username} (Haupt)` : username;
  }
  
  // Fallback to connection ID or generic name
  return calendar.connectionId ? `Kalender ${calendar.connectionId.substring(0, 8)}` : 'Unbekannter Kalender';
}

/**
 * Get calendar email for display - handles external_id vs real email
 */
export function getCalendarEmail(calendar: Calendar): string {
  // If email looks like a real email, return it
  if (calendar.email && calendar.email.includes('@') && !calendar.email.includes('group.calendar.google.com')) {
    return calendar.email;
  }
  
  // If it's a Google Calendar group ID, return a friendly version
  if (calendar.email && calendar.email.includes('group.calendar.google.com')) {
    return 'Google Kalender';
  }
  
  // Fallback
  return calendar.email || 'Unbekannt';
}

/**
 * Get all connections
 */
export function getStoredConnections(): CalendarConnection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading connections:', error);
    return [];
  }
}

/**
 * Save a new connection
 */
export function saveConnection(accountEmail: string, calendars: Calendar[], provider?: string): void {
  try {
    const connections = getStoredConnections();
    const existingIndex = connections.findIndex(conn => conn.accountEmail === accountEmail);
    
    const connectionProvider = provider || 'Google Calendar';
    const idPrefix = connectionProvider === 'Microsoft 365' ? 'microsoft' : 'google';
    
    const newConnection: CalendarConnection = {
      id: `${idPrefix}-${Date.now()}`,
      provider: connectionProvider,
      accountEmail,
      calendars,
      createdAt: existingIndex >= 0 ? connections[existingIndex].createdAt : new Date(),
      lastSyncedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      connections[existingIndex] = newConnection;
    } else {
      connections.push(newConnection);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
  } catch (error) {
    console.error('Error saving connection:', error);
  }
}

/**
 * Remove a connection and all its calendars
 */
export function removeConnection(accountEmail: string): Calendar[] {
  const calendars = getStoredCalendars();
  const connections = getStoredConnections();
  
  // Remove connection
  const filteredConnections = connections.filter(conn => conn.accountEmail !== accountEmail);
  localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(filteredConnections));
  
  // Disconnect all calendars from this connection
  const updatedCalendars = calendars.map(cal => 
    cal.email === accountEmail || cal.email.includes(accountEmail)
      ? { ...cal, isConnected: false, connectionId: undefined }
      : cal
  );
  
  saveCalendars(updatedCalendars);
  return updatedCalendars;
}

/**
 * Clear all test/dummy calendars
 */
export function clearTestCalendars(): Calendar[] {
  const calendars = getStoredCalendars();
  
  // Remove calendars with test email patterns
  const filteredCalendars = calendars.filter(cal => {
    // Keep real email addresses (with proper format)
    const isTestEmail = /^user\d+@gmail\.com$/.test(cal.email);
    return !isTestEmail;
  });
  
  saveCalendars(filteredCalendars);
  return filteredCalendars;
} 