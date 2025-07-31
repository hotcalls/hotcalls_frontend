import { Calendar, SubCalendar } from './calendarService';

// Dummy Sub-Kalender
const subCalendarsForMain: SubCalendar[] = [
  {
    id: "main-personal",
    name: "Persönlich",
    color: "#1a73e8",
    isPublic: false,
    isWritable: true,
    description: "Private Termine"
  },
  {
    id: "main-business",
    name: "Geschäftlich",
    color: "#0d7377",
    isPublic: true,
    isWritable: true,
    description: "Geschäftstermine und Meetings"
  },
  {
    id: "main-blocked",
    name: "Blockierungen",
    color: "#dc2626",
    isPublic: false,
    isWritable: true,
    description: "Geblockte Zeiten"
  }
];

const subCalendarsForTeam: SubCalendar[] = [
  {
    id: "team-meetings",
    name: "Team Meetings",
    color: "#f4511e",
    isPublic: true,
    isWritable: true,
    description: "Regelmäßige Team-Meetings"
  },
  {
    id: "team-events",
    name: "Team Events",
    color: "#9c27b0",
    isPublic: true,
    isWritable: false,
    description: "Firmenevents und Feiern"
  }
];

const subCalendarsForLisa: SubCalendar[] = [
  {
    id: "lisa-calls",
    name: "Kundengespräche",
    color: "#16a34a",
    isPublic: false,
    isWritable: true,
    description: "Lisa's Kundentermine"
  }
];

// Dummy Kalender mit Sub-Kalendern
export const dummyCalendars: Calendar[] = [
  {
    id: "main",
    connectionId: "google-main-123",
    name: "Marcus Weber",
    email: "marcus.weber@example.com",
    provider: "Google Calendar",
    isConnected: true,
    isDefault: true,
    isPrimary: true,
    eventTypesCount: 3,
    totalBookings: 82,
    bookingsThisWeek: 20,
    subCalendars: subCalendarsForMain,
    color: "#1a73e8",
    accessRole: "owner",
    timeZone: "Europe/Berlin",
    active: true,
    createdAt: new Date("2024-01-15"),
    lastSyncedAt: new Date()
  },
  {
    id: "team",
    connectionId: "google-team-456",
    name: "Team Calendar",
    email: "team@company.example.com",
    provider: "Google Calendar",
    isConnected: true,
    isDefault: false,
    isPrimary: false,
    eventTypesCount: 1,
    totalBookings: 15,
    bookingsThisWeek: 1,
    subCalendars: subCalendarsForTeam,
    color: "#f4511e",
    accessRole: "writer",
    timeZone: "Europe/Berlin",
    active: true,
    createdAt: new Date("2024-01-20"),
    lastSyncedAt: new Date()
  },
  {
    id: "lisa",
    connectionId: "google-lisa-789",
    name: "Lisa Schmidt",
    email: "lisa.schmidt@example.com",
    provider: "Google Calendar",
    isConnected: true,
    isDefault: false,
    isPrimary: false,
    eventTypesCount: 0,
    totalBookings: 0,
    bookingsThisWeek: 0,
    subCalendars: subCalendarsForLisa,
    color: "#16a34a",
    accessRole: "reader",
    timeZone: "Europe/Berlin",
    active: true,
    createdAt: new Date("2024-02-01"),
    lastSyncedAt: new Date()
  },
  {
    id: "marketing",
    connectionId: undefined,
    name: "Marketing Team",
    email: "marketing@company.example.com",
    provider: "Google Calendar",
    isConnected: false,
    isDefault: false,
    isPrimary: false,
    eventTypesCount: 0,
    totalBookings: 0,
    bookingsThisWeek: 0,
    subCalendars: [],
    color: "#8e24aa",
    accessRole: "owner",
    timeZone: "Europe/Berlin",
    active: false,
    createdAt: new Date("2024-02-10"),
    lastSyncedAt: undefined
  }
];

// Funktion zum Laden der Dummy-Daten
export function loadDummyCalendars(): Calendar[] {
  return dummyCalendars;
}

// Funktion zum Abrufen aller verfügbaren Kalender (Haupt- und Sub-Kalender) für Dropdowns
export function getAllAvailableCalendarsForDropdown(calendars: Calendar[]): Array<{id: string, name: string, isSubCalendar: boolean, parentId?: string}> {
  const result: Array<{id: string, name: string, isSubCalendar: boolean, parentId?: string}> = [];
  
  calendars.forEach(calendar => {
    if (calendar.isConnected) {
      // Hauptkalender hinzufügen
      result.push({
        id: calendar.id,
        name: `${calendar.name} (Hauptkalender)`,
        isSubCalendar: false
      });
      
      // Sub-Kalender hinzufügen
      calendar.subCalendars.forEach(subCalendar => {
        result.push({
          id: `${calendar.id}-${subCalendar.id}`,
          name: `${calendar.name} - ${subCalendar.name}`,
          isSubCalendar: true,
          parentId: calendar.id
        });
      });
    }
  });
  
  return result;
} 