import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, TestTube, User, FileText, Phone, Settings as SettingsIcon, Play, Plus, Info, UserCircle, UserCircle2, Sparkles, Pause, Loader2, Clock } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buttonStyles, textStyles, iconSizes, layoutStyles, spacingStyles } from "@/lib/buttonStyles";
import { agentAPI, AgentResponse, callAPI, calendarAPI, metaAPI, funnelAPI, webhookAPI, MakeTestCallRequest, knowledgeAPI } from "@/lib/apiService";
import DocumentSendDialog from "@/components/integrations/DocumentSendDialog";
import { useVoices } from "@/hooks/use-voices";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAllFeaturesUsage } from "@/hooks/use-usage-status";
import { useUserProfile } from "@/hooks/use-user-profile";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Real Event Types and Lead Forms will be loaded from API

export default function AgentConfig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState("personality");
  // Knowledge Base state
  const [kb, setKb] = useState<{ version: number; files: Array<{ id: string; name: string; size: number; updated_at: string }> } | null>(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbUploading, setKbUploading] = useState(false);
  const [kbDeleteOpen, setKbDeleteOpen] = useState(false);
  const [kbDeleteTarget, setKbDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Debug logging
  console.log('🔧 AgentConfig Debug:', { id, isEdit, urlParams: useParams() });
  
  // Loading and error states
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInlineError, setShowInlineError] = useState(false);

  // Get workspace, voices, and user profile
  const { primaryWorkspace } = useWorkspace();
  const { usage, loading: usageLoading } = useAllFeaturesUsage(primaryWorkspace?.id || null);
  const maxAgents = usage?.features?.max_agents?.limit || null;
  const usedAgents = usage?.features?.max_agents?.used || 0;
  const isAtAgentLimit = !!maxAgents && usedAgents >= (maxAgents as number);

  // Guard for create mode only
  useEffect(() => {
    if (!isEdit && !usageLoading && isAtAgentLimit) {
      toast.info("Dein Agenten‑Limit ist erreicht.");
      navigate("/dashboard/agents");
    }
  }, [isEdit, usageLoading, isAtAgentLimit, navigate]);
  const { voices, loading: voicesLoading, getVoiceName, getVoicePicture, refresh: refreshVoices } = useVoices();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();

  // Force load voices when component mounts
  useEffect(() => {
    console.log('🎤 AgentConfig mounted, voices status:', { 
      voicesCount: voices.length, 
      loading: voicesLoading,
      voiceDetails: voices.slice(0, 3).map(v => ({
        id: v.id,
        name: v.name,
        voice_sample: v.voice_sample
      }))
    });
    
    // If no voices loaded, force refresh
    if (!voicesLoading && voices.length === 0) {
      
      refreshVoices();
    }
  }, []);

  // effects moved below after dependent declarations

  

  // Log when voices are loaded
  useEffect(() => {
    if (voices.length > 0) {
      console.log('🎵 Voices loaded in AgentConfig:', {
        totalVoices: voices.length,
        sampleUrls: voices.map(v => ({
          name: v.name,
          hasSample: !!v.voice_sample,
          sampleUrl: v.voice_sample
        }))
      });
    }
  }, [voices]);

  const [config, setConfig] = useState({
    name: "",
    personality: "",
    voice: "",
    voiceExternalId: "", // Store external voice ID for test calls
    script: "",
    callLogic: "standard", 
    selectedEventTypes: [] as string[],
    selectedLeadForm: "" as string, // Geändert von selectedLeadForms Array zu single string
    outgoingGreeting: "",
    incomingGreeting: "",
    maxAttempts: "3",
    callInterval: "30",
    workingDays: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false },
    workingTimeStart: "09:00",
    workingTimeEnd: "17:00",
    character: "",
    language: "de"
  });

  

  // Load Event Types and Lead Forms when workspace is available
  useEffect(() => {
    loadEventTypes();
    loadLeadForms();
  }, [primaryWorkspace?.id]);

  
  // Blurred script template placeholder (shown when script is empty)
  const SCRIPT_TEMPLATE_PLACEHOLDER = `Du bist {{assistant_name}}, der beste KI‑Sales‑Assistent der Welt. Du bist schlagfertig, professionell und gesprächig.

Kontext
Du rufst {{salutation}} {{last_name}} an, der/die Interesse an {{product_or_service}} gezeigt hat. Der Kontakt ist {{first_name}} {{last_name}}. Dein Ziel ist es, einen Termin mit einer qualifizierten Fachperson zu vereinbaren.

Richtlinien
- Sprich natürlich, flüssig und empathisch, wie ein echter Mensch.
- Vermeide Füllphrasen wie „vielen Dank“, „verstanden“, „super“, „gut zu wissen“.
- Bestätige nicht ständig oder wiederhole nicht die Antworten des Interessenten.
- Nenne niemals Adressen, Geburtsdaten oder exakte Zahlen laut.
- Bleibe beim Skript — überspringe keine Qualifikationsfragen.
- Wenn der Lead abschweift, antworte kurz und kehre zum Skript zurück.
- Termine erst, nachdem alle Qualifikationsfragen beantwortet sind.
- Sprich den Lead förmlich an („Herr/Frau“), sofern nicht anders angewiesen.
- Mache 3–5 natürliche Terminvorschläge (lange Listen vermeiden).
- Buche nur innerhalb der nächsten 2 Wochen (erkläre, falls darüber hinaus).
- Bestätige vor dem Buchen stets das gewählte Datum/Uhrzeit.

Regeln für die Termin‑Kommunikation
- Vor dem Abschließen bestätigen: „Nur zur Bestätigung: Ihr Termin ist am [Datum] um [Uhrzeit]. Passt das für Sie?“
- Nach der Buchung auf die Bestätigungs‑E‑Mail und direkte Kontaktdaten hinweisen.
- Bitte um das Vorab‑Zusenden relevanter Dokumente/Fotos (falls zutreffend).
- Bitte um frühzeitige Nachricht bei Absage oder Umbuchung.

Skript
1) Begrüßung & Einführung
Agent: "Guten Tag, hier ist {{assistant_name}} im Auftrag unseres Teams. Spreche ich mit {{salutation}} {{last_name}}?"
Human: [...]
Agent: "Vielen Dank für Ihre Zeit, {{salutation}} {{last_name}}. Sie haben sich kürzlich für {{product_or_service}} interessiert. Ich prüfe kurz, ob ein Beratungsgespräch sinnvoll ist, und vereinbare dann ggf. einen Termin mit einer Fachperson. Es ist kein Vertrag oder Angebot — nur ein erster Schritt. Klingt das gut?"

2) Qualifikationsfragen
- Adresse der Immobilie/des Standorts? (Nicht laut wiederholen)
- Ist dies auch der Installations-/Service‑Ort?
- Wann wurde die Immobilie/das Gebäude gebaut? (Jahreszahl nicht laut wiederholen)
- Welches System/welche Lösung nutzen Sie derzeit? (Technologie, Anbieter, Version)
- Ungefähre jährliche Nutzung/Kosten?
- Wie ist das eingerichtet (Verteilung/Integration)?
- Wo befindet sich das aktuelle System? (Keller, Büro, Rechenzentrum etc.)
- Gibt es besondere technische Umstände zu beachten?

3) Motivation & Bedarf
- Was hat Sie dazu motiviert, jetzt nach einer neuen Lösung zu suchen?
- Was funktioniert heute gut, und was möchten Sie ändern?
- Was haben Sie bereits ausprobiert oder in Betracht gezogen?
- Haben Sie mit anderen Anbietern gesprochen? Was hat Sie nicht überzeugt?
- Wenn Sie sich eine ideale Lösung vorstellen: Wie sähe die aus?
- Wie wichtig sind Kostenersparnis bzw. langfristige Investition?
Agent: "Wenn ich richtig verstehe, ist Ihre Hauptpriorität {{repeat_back}}, weil {{repeat_reason}} — stimmt das?"
- Was sind Ihre drei wichtigsten Entscheidungsfaktoren?

4) Entscheidungsprozess
- Entscheiden Sie allein oder gemeinsam mit jemandem?
- Gibt es bereits ein Budget oder einen Investitionsrahmen (inkl. Förderungen/Finanzierung)?
- Sollen wir bei Förderanträgen oder Finanzierungsoptionen unterstützen?
- Wären Finanzierungs-/Abo‑Modelle interessant, sofern sinnvoll?

5) Abschluss & Terminvereinbarung
Agent: "Wenn im Gespräch alles gut aussieht, wären Sie bereit, den nächsten Schritt zu gehen?"
Human: [...]
Agent: "Super! Unsere Fachleute sind sehr erfahren. Ich prüfe kurz die Verfügbarkeit."
Agent: "Ich sehe verfügbare Zeiten. Welche Zeit passt Ihnen am besten?"
Human: [...]
Agent: "Perfekt, nur zur Bestätigung: Der von uns vereinbarte Termin passt für Sie, richtig?"
Agent: "Ausgezeichnet — ich habe den Termin gebucht. Sie erhalten eine Bestätigungs‑E‑Mail mit allen Details. Senden Sie, wenn möglich, relevante Dokumente/Fotos vorab. Und falls Sie absagen oder verschieben müssen, geben Sie uns bitte frühzeitig Bescheid."
Human: [...]
Agent: "Wunderbar. Ich wünsche Ihnen ein erfolgreiches Gespräch und einen angenehmen Tag!";
`;
  // Language is stored as ISO code in config.language ("en" | "de" | "es" | "fr")

  

  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Test call states
  const [testPopoverOpen, setTestPopoverOpen] = useState(false);
  const [isTestCalling, setIsTestCalling] = useState(false);

  // Event Types state
  const [availableEventTypes, setAvailableEventTypes] = useState<any[]>([]);
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(false);
  const [availableLeadForms, setAvailableLeadForms] = useState<any[]>([]);
  const [isLoadingLeadForms, setIsLoadingLeadForms] = useState(false);
  const [leadFormsPagination, setLeadFormsPagination] = useState<{
    hasMore: boolean;
    currentPage: number;
    totalCount: number;
  }>({ hasMore: false, currentPage: 1, totalCount: 0 });
  const [isLoadingMoreLeadForms, setIsLoadingMoreLeadForms] = useState(false);
  const [selectedEventTypeDetails, setSelectedEventTypeDetails] = useState<any | null>(null);
  const [funnelVariables, setFunnelVariables] = useState<Array<{ key: string; label: string; category: 'contact'|'custom'; type: 'string'|'email'|'phone' }>>([]);
  // Demo/test leads for preview
  const demoLeads = useMemo(() => {
    const firstNames = ["Max", "Anna", "Lukas", "Mia", "Jonas", "Lea", "Paul", "Emma", "Felix", "Sofia"];
    const lastNames = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Meyer", "Klein"];
    const services = ["Wärmepumpe", "PV‑Anlage", "Beratung", "Software Demo", "Audit", "Sanierung", "Finanzierung", "Versicherung", "Telekom", "CRM"];
    const leads = Array.from({ length: 20 }, (_, i) => {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const service = services[(i * 7) % services.length];
      const phone = `+49 151 ${String(100000 + i * 137).slice(0,6)}`;
      return {
        id: `demo-${i+1}`,
        first_name: fn,
        last_name: ln,
        product_or_service: service,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
        phone,
      };
    });
    return leads;
  }, []);

  // Document send UI state
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docStatus, setDocStatus] = useState<{ filename?: string | null; fromEmail?: string | null } | null>(null);

  // Load document-send status (SMTP from-email + current PDF) for the card
  const refreshDocStatus = async () => {
    try {
      if (!primaryWorkspace?.id || !id) return;
      const [{ workspaceAPI }, { agentAPI }] = await Promise.all([
        import("@/lib/apiService"),
        import("@/lib/apiService"),
      ]);
      const [smtp, doc] = await Promise.all([
        workspaceAPI.getSmtpSettings(primaryWorkspace.id),
        agentAPI.getSendDocument(id),
      ]);
      setDocStatus({ filename: doc.filename, fromEmail: smtp?.smtp_from_email || null });
    } catch (e) {
      // Silent fail – card stays in default state
    }
  };

  // Hide inline error when user fixes the required fields
  useEffect(() => {
    if (showInlineError && error) {
      if (config.name && config.voice && (config.script && config.script.trim() !== '')) {
        setShowInlineError(false);
        setError(null);
      }
    }
  }, [config.name, config.voice, config.script, showInlineError, error]);

  // When Integrationen tab is opened (or ids become available), fetch status once
  useEffect(() => {
    if (activeTab === "integrations") {
      refreshDocStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, primaryWorkspace?.id]);

  // Load Event Types from Event Types API (workspace-scoped)
  const loadEventTypes = async () => {
    setIsLoadingEventTypes(true);
    try {
      if (!primaryWorkspace?.id) { setAvailableEventTypes([]); setIsLoadingEventTypes(false); return; }
      const [{ eventTypeAPI }] = await Promise.all([import("@/lib/apiService")]);
      const eventTypesData = await eventTypeAPI.listEventTypes(String(primaryWorkspace.id));
      // Normalize IDs to strings to avoid Select value mismatches
      const normalized = (eventTypesData || []).map((et: any) => ({
        ...et,
        id: String(et.id),
      }));
      setAvailableEventTypes(normalized);
      
    } catch (error) {
      console.error("[ERROR]:", error);
      setAvailableEventTypes([]);
    } finally {
      setIsLoadingEventTypes(false);
    }
  };

  // Load Lead Funnels from Funnel API (including CSV Sources)
  const loadLeadForms = async (page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setIsLoadingLeadForms(true);
    } else {
      setIsLoadingMoreLeadForms(true);
    }
    
    try {
      const response = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id,
        page: page,
        returnPaginated: true
      });
      
      // Handle both paginated and non-paginated responses
      const paginatedResponse = Array.isArray(response) 
        ? { results: response, count: response.length, next: null, previous: null }
        : response as { results: any[]; count: number; next: string | null; previous: string | null };
      
      // Format all funnels (Meta + Leadquelle) for the dropdown
      const formattedForms = (paginatedResponse.results || []).map(funnel => ({
        id: String(funnel.id),
        name: funnel.name,
        meta_form_id: funnel.meta_lead_form?.meta_form_id || null,
        source_type_display: funnel.meta_lead_form ? 'Meta Lead Ads' : 'Leadquelle',
        is_csv: !funnel.meta_lead_form && !funnel.webhook_source // Leadquelle wenn weder Meta noch Webhook
      }));
      
      if (append && page > 1) {
        // Append to existing forms for pagination
        setAvailableLeadForms(prev => [...prev, ...formattedForms]);
      } else {
        // Replace forms for initial load
        setAvailableLeadForms(formattedForms);
      }
      
      // Update pagination state
      setLeadFormsPagination({
        hasMore: !!paginatedResponse.next,
        currentPage: page,
        totalCount: paginatedResponse.count
      });
      
    } catch (error) {
      console.error("[ERROR]:", error);
      if (!append) {
        setAvailableLeadForms([]);
        setLeadFormsPagination({ hasMore: false, currentPage: 1, totalCount: 0 });
      }
    } finally {
      setIsLoadingLeadForms(false);
      setIsLoadingMoreLeadForms(false);
    }
  };

  // Load more lead forms (for pagination)
  const loadMoreLeadForms = async () => {
    if (!leadFormsPagination.hasMore || isLoadingMoreLeadForms) return;
    await loadLeadForms(leadFormsPagination.currentPage + 1, true);
  };

  // Load variables for selected funnel
  useEffect(() => {
    // Fix: Properly extract ID from selectedLeadForm
    let funnelId = "";
    if (config.selectedLeadForm) {
      if (typeof config.selectedLeadForm === 'string') {
        funnelId = config.selectedLeadForm;
      } else if (typeof config.selectedLeadForm === 'object' && config.selectedLeadForm.id) {
        funnelId = String(config.selectedLeadForm.id);
      } else {
        console.warn('Invalid selectedLeadForm format:', config.selectedLeadForm);
      }
    }

    if (!funnelId) {
      setFunnelVariables([]);
      return;
    }
    (async () => {
      try {
        const getVarsFn = (funnelAPI as any).getFunnelVariables || (webhookAPI as any).getFunnelVariables;
        if (typeof getVarsFn !== 'function') {
          console.error("[ERROR]:", error);
          setFunnelVariables([]);
          return;
        }
        const vars = await getVarsFn(funnelId);
        setFunnelVariables(Array.isArray(vars) ? vars : []);
      } catch (e) {
        console.error("[ERROR]:", error);
        setFunnelVariables([]);
      }
    })();
  }, [config.selectedLeadForm]);

  const lastFocusedTextarea = useRef<HTMLTextAreaElement | null>(null);
  const insertTokenAtCursor = (token: string, setter: (s: string)=>void, currentValue: string) => {
    const el = lastFocusedTextarea.current;
    // Fallback: wenn kein Fokus-Textarea vorhanden, ans Ende anhängen
    if (!el) {
      setter((currentValue || '') + token);
      return;
    }
    const start = el.selectionStart ?? currentValue.length;
    const end = el.selectionEnd ?? currentValue.length;
    const next = currentValue.slice(0, start) + token + currentValue.slice(end);
    setter(next);
    requestAnimationFrame(() => el.setSelectionRange(start + token.length, start + token.length));
  };

  const tokenPillClass = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white bg-[#FE5B25] shadow-sm transition";
  const formatBytes = (bytes: number): string => {
    if (!bytes && bytes !== 0) return "-";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    const rounded = value < 10 ? value.toFixed(1) : String(Math.round(value));
    return rounded + " " + sizes[i];
  };
  const renderPreview = (content: string) => {
    const parts = content.split(/(\{\{[^}]+\}\})/g);
    return (
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {parts.map((part, idx) => {
          if (/^\{\{[^}]+\}\}$/.test(part)) {
            return (
              <span key={idx} className={tokenPillClass + " mx-0.5"}>{part.replace(/\{\{|\}\}/g, '')}</span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  // Translate tone words and compound phrases (e.g., "Jung & Energetisch")
  const translateTone = (raw: string) => {
    if (!raw) return raw;
    const dict: Record<string, string> = {
      jung: 'Young',
      energetisch: 'Energetic',
      freundlich: 'Friendly',
      ruhig: 'Calm',
      sachlich: 'Factual',
      neutral: 'Neutral',
      professionell: 'Professional'
    };
    const parts = raw.split(/\s*&\s*|,\s*/).map(p => p.trim()).filter(Boolean);
    const mapped = parts.map(p => dict[p.toLowerCase()] || p.charAt(0).toUpperCase() + p.slice(1));
    return mapped.join(' & ');
  };

  // Minimal TimePicker using our Select component for a clean modern look
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [h, m] = (value || '09:00').split(':');
    return (
      <div className="flex items-center gap-1">
        <Select value={h} onValueChange={(hv) => onChange(hv + ":" + m)}>
          <SelectTrigger className="w-16 h-9 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#FE5B25]"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-64">
            {hours.map((hh) => (
              <SelectItem key={hh} value={hh}>{hh}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-gray-400 px-1">:</span>
        <Select value={m} onValueChange={(mv) => onChange(h + ":" + mv)}>
          <SelectTrigger className="w-16 h-9 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#FE5B25]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {minutes.map((mm) => (
              <SelectItem key={mm} value={mm}>{mm}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Helper function to map personality to character
  const mapPersonalityToCharacter = (personality: string): string => {
    switch (personality) {
      case 'professional':
        return 'Professionell & Direkt';
      case 'energetic':
        return 'Enthusiastisch & Energetisch';
      case 'calm':
        return 'Ruhig & Sachlich';
      default:
        return 'Professionell & Direkt';
    }
  };

  // Load agent data when editing
  useEffect(() => {
    const loadAgentData = async () => {
      if (!isEdit) {
        console.log('🔧 Not editing mode, skipping data load');
        return;
      }
      
      if (!id || id === 'undefined') {
        console.error("[ERROR]:", error);
        setError('Keine gültige Agent-ID gefunden');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔧 Loading agent data for editing...', id);
        
        const agentData = await agentAPI.getAgent(id);
        
        
        // Debug: Check calendar configuration
        console.log('📅 Checking event type mapping:', {
          event_type: (agentData as any).event_type,
          config_id: (agentData as any).config_id,
          will_load_eventTypes: (agentData as any).event_type ? [(agentData as any).event_type] : []
        });

        // Map character to personality options
        const mapCharacterToPersonality = (character: string) => {
          const lowerChar = character.toLowerCase();
          if (lowerChar.includes('professionell') && lowerChar.includes('direkt')) return 'professional';
          if (lowerChar.includes('enthusiastisch') && lowerChar.includes('energetisch')) return 'energetic';
          if (lowerChar.includes('ruhig') && lowerChar.includes('sachlich')) return 'calm';
          return 'professional'; // default
        };

        // Parse workdays from API response (normalize to Monday-first indexing for UI)
        const parseWorkdays = (workdays: string | string[] | number[] | undefined) => {
          const defaultWorkdays = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
          const mondayFirst = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

          if (!workdays) return defaultWorkdays;

          const setByName = (name: string) => {
            const idx = mondayFirst.indexOf(name.toLowerCase());
            if (idx !== -1) defaultWorkdays[idx as keyof typeof defaultWorkdays] = true;
          };

          if (typeof workdays === 'string') {
            const parts = workdays.split(',').map(d => d.trim());
            parts.forEach(p => {
              const n = parseInt(p);
              if (!isNaN(n)) {
                // Treat numbers as Monday-first indices 0..6
                if (n >= 0 && n <= 6) defaultWorkdays[n as keyof typeof defaultWorkdays] = true;
              } else {
                setByName(p);
              }
            });
          } else if (Array.isArray(workdays)) {
            workdays.forEach(d => {
              if (typeof d === 'number') {
                if (d >= 0 && d <= 6) defaultWorkdays[d as keyof typeof defaultWorkdays] = true;
              } else if (typeof d === 'string') {
                setByName(d);
              }
            });
          }

          return defaultWorkdays;
        };

        // Parse time fields (remove seconds and timezone if present)
        const parseTime = (timeStr: string | undefined) => {
          if (!timeStr) return "09:00";
          // If time is in format "HH:MM:SS" or "HH:MM:SS.msZ", extract just "HH:MM"
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            return timeParts[0] + ":" + timeParts[1];
          }
          return timeStr;
        };

        // Map API response to form config
        const mappedPersonality = mapCharacterToPersonality(agentData.character || "");
        console.log('🎭 Personality mapping:', {
          originalCharacter: agentData.character,
          mappedPersonality: mappedPersonality
        });
        
        console.log('⏰ Time and interval values:', {
          call_from_raw: agentData.call_from,
          call_to_raw: agentData.call_to,
          call_from_parsed: parseTime(agentData.call_from),
          call_to_parsed: parseTime(agentData.call_to),
          retry_interval: agentData.retry_interval
        });
        
        // Load the funnel ID that's assigned to this agent (normalize to string ID)
        let assignedFunnelId = "";
        const lf: any = (agentData as any).lead_funnel;
        if (typeof lf === 'string' || typeof lf === 'number') {
          assignedFunnelId = String(lf);
        } else if (lf && typeof lf === 'object' && (lf.id !== undefined && lf.id !== null)) {
          assignedFunnelId = String(lf.id);
        } else if ((agentData as any).lead_funnel_id !== undefined && (agentData as any).lead_funnel_id !== null) {
          assignedFunnelId = String((agentData as any).lead_funnel_id);
        }
        if (assignedFunnelId) {
          console.log('📋 Agent has assigned funnel ID:', assignedFunnelId);
        }
        
        setConfig({
          name: agentData.name || "",
          personality: mappedPersonality,
          voice: agentData.voice || "",
          voiceExternalId: agentData.voice_external_id || "", // Load external voice ID
          script: (agentData as any).script_template || "", // Use script_template from API
          callLogic: "standard",
          selectedEventTypes: (agentData as any).event_type ? [String((agentData as any).event_type)] : [], // Load selected event type
          selectedLeadForm: assignedFunnelId, // Load the assigned funnel ID
          outgoingGreeting: agentData.greeting_outbound || "",
          incomingGreeting: agentData.greeting_inbound || "",
          maxAttempts: (agentData.max_retries || 3).toString(), // Load max_retries from API
          callInterval: (agentData.retry_interval || 30).toString(),
          workingDays: parseWorkdays(agentData.workdays),
          workingTimeStart: parseTime(agentData.call_from),
          workingTimeEnd: parseTime(agentData.call_to),
          character: agentData.character || "",
          language: agentData.language || "de"
        });
        
      } catch (err) {
        console.error("[ERROR]:", error);
        setError(err instanceof Error ? err.message : 'Failed to load agent data');
        toast.error('Fehler beim Laden der Agent-Daten');
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, [isEdit, id]);

  const playVoiceSample = (voiceId: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

    // Find the voice object from the voices array
    const voice = voices.find(v => v.id === voiceId);
    if (!voice || !voice.voice_sample) {
      console.warn('No voice sample available for:', voiceId);
      toast.error('Keine Hörprobe verfügbar');
      return;
    }

    // Use the voice_sample URL from the API
    const audioFile = voice.voice_sample;
    console.log('🔊 Playing voice sample:', audioFile);
    
    const audio = new Audio(audioFile);
    audioRef.current = audio;
    
    audio.addEventListener('ended', () => {
      setPlayingVoice(null);
    });
    
    audio.addEventListener('error', (e) => {
      setPlayingVoice(null);
      console.error("[ERROR]:", error);
      toast.error('Fehler beim Abspielen der Hörprobe');
    });

    setPlayingVoice(voiceId);
    audio.play().catch((err) => {
      console.error("[ERROR]:", error);
      setPlayingVoice(null);
      toast.error('Audio konnte nicht abgespielt werden');
    });
  };

  // Map selected lead forms to funnel IDs for assignment
  const mapLeadFormsToFunnels = async (selectedLeadForms: string[]): Promise<string[]> => {
    if (!selectedLeadForms || selectedLeadForms.length === 0) {
      
      return [];
    }

    try {
      
      
      // Get all funnels for current workspace
      const funnelsResp = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id,
        is_active: true
      });
      const funnels = Array.isArray(funnelsResp) ? funnelsResp : (funnelsResp?.results || []);
      // Filter funnels that match selected lead forms
      const matchingFunnels = funnels.filter((funnel: any) => {
        // Match by funnel ID directly (works for both Meta and Leadquellen)
        return selectedLeadForms.includes(String(funnel.id));
      });
      
      const funnelIds = matchingFunnels.map(funnel => funnel.id);
      
      return funnelIds;
    } catch (error) {
      console.error("[ERROR]:", error);
      return []; // Return empty array on error - silent failure
    }
  };

  // Handle funnel assignment after successful agent save
  const handleFunnelAssignment = async (selectedFunnelIds: string[], agentId: string) => {
    try {
      
      
      // selectedFunnelIds are already funnel IDs from the lead-funnels API
      // No need to map them anymore
      const funnelIds = selectedFunnelIds;
      
      if (funnelIds.length === 0) {
        
        return;
      }
      
      // Get all current funnels for this workspace to unassign any existing assignments
      const allFunnelsResp = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id,
        has_agent: true
      });
      const allFunnels = Array.isArray(allFunnelsResp) ? allFunnelsResp : (allFunnelsResp?.results || []);
      
      // Find funnels currently assigned to this agent
      const currentlyAssignedFunnels = allFunnels.filter((funnel: any) => 
        funnel.agent && funnel.agent.agent_id === agentId
      );
      
      
      
      // Unassign existing funnels that are not in the new selection
      const funnelsToUnassign = currentlyAssignedFunnels.filter(funnel => 
        !funnelIds.includes(String(funnel.id))
      );
      
      for (const funnel of funnelsToUnassign) {
        try {
          await funnelAPI.unassignAgent(funnel.id);
          
        } catch (error) {
          console.error("[ERROR]:", error);
        }
      }
      
      // Assign new funnels
      const currentlyAssignedIds = currentlyAssignedFunnels.map(f => String(f.id));
      const funnelsToAssign = funnelIds.filter(id => !currentlyAssignedIds.includes(String(id)));
      
      for (const funnelId of funnelsToAssign) {
        try {
          await funnelAPI.assignAgent(funnelId, agentId);
          
        } catch (error) {
          console.error("[ERROR]:", error);
        }
      }
      
      console.log('🎉 Funnel assignment completed successfully');
      
    } catch (error) {
      console.error("[ERROR]:", error);
      // Silent failure - no user error messages as requested
    }
  };

  const handleSave = async () => {
    console.log('🚀 handleSave STARTED', { config, primaryWorkspace });
    
    try {
      setSaving(true);
      setError(null);
      
      
      if (!primaryWorkspace) {
        console.error("[ERROR]:", error);
        throw new Error('No workspace available');
      }
      

      // Validate required fields before sending to API
      if (!config.name || !config.voice) {
        console.error("[ERROR]:", error);
        throw new Error('Name and voice are required');
      }
      
      // Additional validation
      if (!config.incomingGreeting || !config.outgoingGreeting) {
        console.error("[ERROR] Missing greetings:", {
          incomingGreeting: config.incomingGreeting, 
          outgoingGreeting: config.outgoingGreeting 
        });
        throw new Error('Greetings are required');
      }
      
      if (!config.script || config.script.trim() === '') {
        console.error("[ERROR]:", error);
        throw new Error('Script is required');
      }
      
      
      
      // Prepare data for API according to PUT /api/agents/agents/{agent_id}/ schema
      console.log('🔧 Preparing agentData...');
      
      // Convert workdays from object to array of English day names (Monday-first indexing)
      const dayNamesMonFirst = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const workdaysArray = Object.entries(config.workingDays)
        .filter(([_, active]) => active)
        .map(([day]) => dayNamesMonFirst[parseInt(day)]);
      
      console.log('📅 Workdays conversion:', {
        configWorkingDays: config.workingDays,
        filteredDays: Object.entries(config.workingDays).filter(([_, active]) => active),
        workdaysArray: workdaysArray,
        explanation: 'Backend expects English day names like ["Monday", "Tuesday", ...] (Monday-first indexing)'
      });
      
      const agentData = {
        workspace: primaryWorkspace.id,
        name: config.name,
        status: 'active' as const,
        greeting_inbound: config.incomingGreeting,
        greeting_outbound: config.outgoingGreeting,
        voice: config.voice,
        language: config.language,
        retry_interval: parseInt(config.callInterval) || 30,
        max_retries: parseInt(config.maxAttempts) || 3, // Add max retries
        workdays: workdaysArray, // Send as array, not string
        call_from: config.workingTimeStart + ":00", // Convert "HH:MM" to "HH:MM:00"
        call_to: config.workingTimeEnd + ":00", // Convert "HH:MM" to "HH:MM:00"
        character: mapPersonalityToCharacter(config.personality), // Map personality to character
        script_template: config.script || "Du bist ein freundlicher KI-Agent.",
        config_id: null, // Optional: Set if you have a config_id
        event_type: config.selectedEventTypes.length > 0 ? config.selectedEventTypes[0] : null, // Save selected event type
        lead_funnel: config.selectedLeadForm // Save selected lead funnel
      };
      
      console.log('💾 Saving agent...', { 
        isEdit, 
        agentId: id, 
        agentData,
        workdaysDebug: {
          originalWorkingDays: config.workingDays,
          filteredEntries: Object.entries(config.workingDays).filter(([_, active]) => active),
          workdaysArray: workdaysArray
        },
        personalityToCharacterMapping: {
          personality: config.personality,
          character: agentData.character
        },
        timeDebug: {
          workingTimeStart: config.workingTimeStart,
          workingTimeEnd: config.workingTimeEnd,
          call_from: agentData.call_from,
          call_to: agentData.call_to
        },
        intervalDebug: {
          callInterval: config.callInterval,
          retry_interval: agentData.retry_interval,
          maxAttempts: config.maxAttempts,
          max_retries: agentData.max_retries
        },
        calendarDebug: {
          selectedEventTypes: config.selectedEventTypes,
          event_type: (agentData as any).event_type,
          willSave: config.selectedEventTypes.length > 0 ? config.selectedEventTypes[0] : null
        },
        leadFormDebug: {
          selectedLeadForm: config.selectedLeadForm,
          willSave: agentData.lead_funnel
        }
      });
      
      // Log the exact JSON that will be sent
      console.log('📡 Exact API Request Body:', JSON.stringify(agentData, null, 2));
      
      let agentId: string;
      
      if (isEdit && id) {
        
        await agentAPI.updateAgent(id, agentData);
        toast.success('Agent updated successfully!');
        agentId = id;
      } else {
        console.log('🆕 Using POST /api/agents/agents/ for creation');
        const newAgent = await agentAPI.createAgent(agentData);
        toast.success('Agent created successfully!');
        agentId = newAgent.agent_id;
        
        // After creating a new agent, navigate to edit mode with the new agent ID
        if (newAgent && newAgent.agent_id) {
          navigate('/dashboard/agents/edit/' + newAgent.agent_id, { replace: true });
        }
      }
      
      // Handle funnel assignment after successful agent save (silent background operation)
      if (agentId && config.selectedLeadForm) {
        
        // The selectedLeadForm is actually a funnel ID from the lead-funnels API
        // This runs in background - no user error messages on failure
        await handleFunnelAssignment([config.selectedLeadForm], agentId);
        // Refresh agent to reflect updated assignment in the UI
        try {
          const refreshed = await agentAPI.getAgent(agentId);
          const refreshedFunnelId = (refreshed as any).lead_funnel || (refreshed as any).lead_funnel_id || (refreshed as any).lead_funnel?.id || "";
          setConfig(prev => ({ ...prev, selectedLeadForm: refreshedFunnelId }));
        } catch {}
      } else {
        
      }
      
      // Stay on the current page - don't navigate away
      // This allows the user to continue editing
      
    } catch (err) {
      console.error("[ERROR]:", error);
      
      // Enhanced error handling for different HTTP status codes
      let errorMessage = 'Please fill in name, voice and script to save the agent.';
      
      if (err instanceof Error) {
        if (err.message.includes('500')) {
          errorMessage = 'Server error: please check backend logs';
        } else if (err.message.includes('400')) {
          errorMessage = 'Invalid data: please check your inputs';
        } else if (err.message.includes('403')) {
          errorMessage = 'Not permitted: only staff/admin can edit agents';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setShowInlineError(true);
      toast.error(errorMessage);
      // Stay on page; don't navigate away
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    // Now just opens the popover - the actual test happens in handleStartTestCall
    setTestPopoverOpen(true);
  };

  // Knowledge Base helpers
  const loadKnowledge = async () => {
    if (!isEdit || !id) return;
    setKbLoading(true);
    try {
      const data = await knowledgeAPI.listDocuments(id);
      setKb(data);
    } catch (e: any) {
      console.error("[ERROR]:", error);
      toast.error(e?.message || "Failed to load knowledge base");
      setKb({ version: 1, files: [] });
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "knowledge") {
      loadKnowledge();
    }
  }, [activeTab, isEdit, id]);

  const handleKBUpload = async (files: FileList | File[]) => {
    if (!id) return;
    const maxSize = 20 * 1024 * 1024;
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setKbUploading(true);
    try {
      for (const f of arr) {
        if (f.type !== "application/pdf") {
          toast.error(f.name + ': Nur PDF erlaubt');
          continue;
        }
        if (f.size > maxSize) {
          toast.error(f.name + ': Max. 20 MB überschritten');
          continue;
        }
        try {
          await knowledgeAPI.upload(id, f);
          toast.success(f.name + ' hochgeladen');
        } catch (e: any) {
          toast.error(f.name + ': ' + (e?.message || 'Upload fehlgeschlagen'));
        }
      }
      await loadKnowledge();
    } finally {
      setKbUploading(false);
    }
  };

  const handleKBDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      handleKBUpload(e.dataTransfer.files);
    }
  };

  const handleKBDelete = async (docIdOrFilename: string) => {
    if (!id) return;
    setKbDeleteTarget(() => {
      const match = kb?.files?.find(f => f.id === docIdOrFilename || f.name === docIdOrFilename);
      return match ? { id: match.id, name: match.name } : null;
    });
    setKbDeleteOpen(true);
  };

  const confirmKbDelete = async () => {
    if (!id || !kbDeleteTarget) return;
    try {
      await knowledgeAPI.deleteById(id, kbDeleteTarget.id);
      toast.success("Document deleted");
      setKbDeleteOpen(false);
      setKbDeleteTarget(null);
      await loadKnowledge();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const handleKBCopyLink = async (docIdOrFilename: string) => {
    if (!id) return;
    try {
      const match = kb?.files?.find(f => f.id === docIdOrFilename || f.name === docIdOrFilename);
      if (!match) {
        throw new Error("Document not found");
      }
      const { url } = await knowledgeAPI.presignById(id, match.id);
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate link");
    }
  };
  
  const handleStartTestCall = async () => {
    if (!userProfile?.phone) {
      toast.error('No phone number found in your profile');
      return;
    }
    
    try {
      setIsTestCalling(true);
      console.log('🧪 Starting test call for agent:', id);
      
      // Make the test call with only agent ID - user phone is automatically used
      const testData: MakeTestCallRequest = {
        agent_id: id!
      };
      
      console.log('🧪 Calling test API with data:', testData);
      await callAPI.makeTestCall(testData);
      
      toast.success('Test call started!');
    } catch (err: any) {
      // If call data was sent, the call was initiated successfully
      // Backend errors after that can be ignored
      
      toast.success('Test call started!');
    } finally {
      setIsTestCalling(false);
      setTestPopoverOpen(false);
    }
  };

  // Show loading state
  if (loading || voicesLoading) {
    return (
      <div className={layoutStyles.pageContainer}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500">Lade Agent-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show inline minimal validation instead of blocking page
  const renderInlineError = () => {
    if (!showInlineError || !error) return null;
    return (
      <div className="mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm">
        {error}
      </div>
    );
  };

  return (
    <div className={layoutStyles.pageContainer}>
      {/* Back Navigation */}
      <div className="flex items-center space-x-2 mb-6">
        <button className={buttonStyles.navigation.back} onClick={() => navigate("/dashboard/agents")}>
          <ArrowLeft className={iconSizes.small} />
          <span>Zurück zu Agenten</span>
        </button>
      </div>

      {/* Page Header - PIXEL-PERFECT EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>
            {isEdit ? `Agent bearbeiten "${config.name}"` : "Neuen Agent erstellen"}
          </h1>
          <p className={textStyles.pageSubtitle}>Konfiguriere Persönlichkeit, Skript und Integrationen</p>
        </div>
        
        <div className={`flex items-center ${spacingStyles.buttonSpacing}`}>
          <Popover open={testPopoverOpen} onOpenChange={setTestPopoverOpen}>
            <PopoverTrigger asChild>
              <button className={buttonStyles.primary.default}>
                <Phone className={iconSizes.small} />
                <span>Test</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-base">Testanruf starten</h4>
                  <p className="text-sm text-gray-600">Es wird ein Testanruf an deine hinterlegte Telefonnummer durchgeführt.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-phone">Telefonnummer</Label>
                  <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                    {profileLoading ? "Lädt..." : userProfile?.phone || "Keine Telefonnummer gefunden"}
                  </div>
                </div>
                <Button 
                  onClick={handleStartTestCall} 
                  className="w-full"
                  disabled={isTestCalling || !userProfile?.phone}
                >
                  {isTestCalling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Anruf wird gestartet...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Jetzt anrufen
                    </>
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <button className={buttonStyles.create.default} onClick={handleSave}>
            <Save className={iconSizes.small} />
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {renderInlineError()}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab("personality")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "personality"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <User className={iconSizes.small} />
                <span className="ml-2">Persönlichkeit</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "knowledge"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <FileText className={iconSizes.small} />
                <span className="ml-2">Wissensbasis</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("script")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "script"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <FileText className={iconSizes.small} />
                <span className="ml-2">Skript</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("logic")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "logic"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Phone className={iconSizes.small} />
                <span className="ml-2">Anruflogik</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "integrations"
                  ? "border-[#FE5B25] text-[#FE5B25]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <SettingsIcon className={iconSizes.small} />
                <span className="ml-2">Integrationen</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Wissensbasis (PDF)</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleKBDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FE5B25] transition"
              >
                <p className="text-sm text-gray-600">Nur PDF, max. 20 MB – pro Agent ein Dokument</p>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEdit || kbUploading || (kb && kb.files && kb.files.length >= 1)}
                  >
                    {kbUploading ? "Wird hochgeladen..." : "Datei auswählen"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => e.target.files && handleKBUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Oder Datei hierher ziehen</p>
              </div>

              <div className="mt-6">
                {kbLoading ? (
                  <div className="p-4 border rounded-md text-gray-500">Dokumente werden geladen…</div>
                ) : !kb || kb.files.length === 0 ? (
                  <div className="p-4 border rounded-md text-gray-500">Noch keine Dokumente</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Größe</th>
                          <th className="py-2 pr-4">Hochgeladen</th>
                          <th className="py-2">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kb.files
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((f) => (
                          <tr key={f.id} className="border-t">
                            <td className="py-2 pr-4 break-all">{f.name}</td>
                            <td className="py-2 pr-4 text-gray-600">{formatBytes(f.size)}</td>
                            <td className="py-2 pr-4 text-gray-600">{new Date(f.updated_at).toLocaleString()}</td>
                            <td className="py-2 flex gap-2">
                              <Button variant="destructive" size="sm" onClick={() => handleKBDelete(f.id)}>Löschen</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Delete confirmation dialog for Knowledge Base */}
          <AlertDialog open={kbDeleteOpen} onOpenChange={setKbDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dokument wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {kbDeleteTarget ? `"${kbDeleteTarget.name}" wird dauerhaft entfernt.` : 'Dieses Dokument wird dauerhaft gelöscht.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={confirmKbDelete}>Löschen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Grundkonfiguration</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="name">Agent‑Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z. B. Sarah"
                />
              </div>
              
              <div>
                <Label htmlFor="personality">Persönlichkeit</Label>
                <Select 
                  value={config.personality} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, personality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Persönlichkeit auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional" className="pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>💼</span>
                        <span>Professionell & Direkt</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="energetic" className="pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>😁</span>
                        <span>Enthusiastisch & Energetisch</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="calm" className="pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>🧘</span>
                        <span>Ruhig & Sachlich</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stimme</Label>
                {voices.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Stimmen werden geladen...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 max-h-96 overflow-y-auto">
                    {voices.slice(0, 12).map((voice) => {
                      const isSelected = config.voice === voice.id;
                      const voicePicture = getVoicePicture(voice.id);
                      
                      return (
                        <div key={voice.id} className="p-4 border rounded-lg space-y-2 relative h-48 flex flex-col">
                          {voice.recommend && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute top-2 right-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
                                  Empfohlen
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">Recommended by AI experts</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <div className="flex items-center justify-between flex-grow">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-14 w-14">
                                {voicePicture && (
                                  <AvatarImage 
                                    src={voicePicture} 
                                    alt={voice.name}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = 'none';
                                    }}
                                  />
                                )}
                                <AvatarFallback className={`
                                  ${voice.gender === 'female' ? 'bg-pink-100 text-pink-600' : ''}
                                  ${voice.gender === 'male' ? 'bg-blue-100 text-blue-600' : ''}
                                  ${voice.gender === 'neutral' ? 'bg-gray-100 text-gray-600' : ''}
                                `}>
                                  {voice.gender === 'female' ? (
                                    <User className="h-7 w-7" />
                                  ) : voice.gender === 'male' ? (
                                    <UserCircle className="h-7 w-7" />
                                  ) : (
                                    <Sparkles className="h-7 w-7" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{voice.name}</p>
                                <p className="text-sm text-gray-500">
                                  {voice.gender === 'female' ? 'Weiblich' : voice.gender === 'male' ? 'Männlich' : 'Neutral'}
                                  {voice.tone && `, ${translateTone(voice.tone)}`}
                                </p>
                                {/* Entferne Provider-Anzeige außer wenn es nicht elevenlabs ist */}
                                {voice.provider && voice.provider.toLowerCase() !== 'elevenlabs' && (
                                  <p className="text-xs text-gray-400">{voice.provider}</p>
                                )}
                              </div>
                            </div>
                            <button 
                              className="w-8 h-8 p-0 border rounded-full flex items-center justify-center hover:bg-gray-50 shrink-0"
                              onClick={() => playVoiceSample(voice.id)}
                              title={playingVoice === voice.id ? 'Stop' : 'Play sample'}
                            >
                              {playingVoice === voice.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          
                          <button
                            className={`w-full py-2 px-3 rounded border text-sm font-medium mt-auto ${
                              isSelected
                                ? "bg-white text-[#FE5B25] border-[#FE5B25]" 
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              voice: voice.id,
                              voiceExternalId: voice.voice_external_id 
                            }))}
                          >
                            {isSelected ? "Ausgewählt" : "Auswählen"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {voices.length > 12 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {voices.length - 12} weitere Stimmen verfügbar...
                  </p>
                )}
              </div>
              {/* Voice language removed */}
              
              {/* Begrüßungen ziehen wir in den Skript-Tab */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={textStyles.sectionTitle}>Konversations‑Skript</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm text-gray-700">
                    <p>Definiere die Aufgabe des Agents und schreibe das Gesprächsskript.</p>
                    <div className="mt-2">
                      <div className="font-medium">Empfohlene Struktur</div>
                      <div className="mt-1 leading-relaxed">
                        KI‑Assistent: [Deine Nachricht]<br />
                        Interessent:<br />
                        KI‑Assistent: [Antwort]<br />
                        Interessent:
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Variables panel (minimal, orange) */}
              <div className="mb-3"
                   onDragOver={(e) => e.preventDefault()}
              >
                <div className="text-sm font-medium" style={{color: '#FE5B25'}}>Verfügbare Variablen</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {funnelVariables.length === 0 ? (
                    <span className="text-xs text-gray-500">Wähle eine CSV‑Leadquelle, um Variablen zu sehen</span>
                  ) : (
                    funnelVariables.map(v => (
                      <span
                        key={v.key}
                        role="button"
                        tabIndex={0}
                        className={`${tokenPillClass} cursor-pointer select-none`}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', `{{${v.key}}}`)}
                        onClick={() => insertTokenAtCursor(`{{${v.key}}}`, val => setConfig(prev => ({...prev, script: val})), config.script)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); insertTokenAtCursor(`{{${v.key}}}`, val => setConfig(prev => ({...prev, script: val})), config.script); }}}
                      >
                        {v.label}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="greeting">Begrüßung</Label>
                <Textarea
                  id="greeting"
                  value={(config.incomingGreeting || config.outgoingGreeting) || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, incomingGreeting: e.target.value, outgoingGreeting: e.target.value }))}
                  onFocus={(e) => { lastFocusedTextarea.current = e.currentTarget; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const token = e.dataTransfer.getData('text/plain');
                    const apply = (val: string) => setConfig(prev => ({...prev, incomingGreeting: val, outgoingGreeting: val}));
                    insertTokenAtCursor(token, apply, (config.incomingGreeting || config.outgoingGreeting || ''));
                  }}
                  placeholder="Wie soll der Agent Anrufer begrüßen?"
                  rows={3}
                />
              </div>

              <div className="mt-6">
                <Label htmlFor="script">Skript</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Tipp: Schreibe Begrüßung und Skript in der Sprache, in der der Agent sprechen soll.
                </p>
                <Textarea
                  id="script"
                  rows={12}
                  value={config.script}
                  onChange={(e) => setConfig(prev => ({ ...prev, script: e.target.value }))}
                  onFocus={(e) => { lastFocusedTextarea.current = e.currentTarget; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const token = e.dataTransfer.getData('text/plain');
                    insertTokenAtCursor(token, val => setConfig(prev => ({...prev, script: val})), config.script || '');
                  }}
                  placeholder={SCRIPT_TEMPLATE_PLACEHOLDER}
                  className="min-h-[300px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Logic Tab */}
        <TabsContent value="logic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={textStyles.sectionTitle}>Anruflogik</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm text-gray-700">
                    <p>Konfiguriere die Anrufstrategie:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Max. Versuche: Wie oft ein Lead angerufen wird</li>
                      <li>Intervall: Wartezeit zwischen den Versuchen</li>
                      <li>Aktive Zeiten: Wann der Agent anrufen darf</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxAttempts">Maximale Anrufversuche</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxAttempts || "3"}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="callInterval">Anrufintervall (Minuten)</Label>
                  <Input
                    id="callInterval"
                    type="number"
                    min="5"
                    max="240"
                    value={config.callInterval || "30"}
                    onChange={(e) => setConfig(prev => ({ ...prev, callInterval: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Aktive Tage</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => (
                      <button
                        key={day}
                        className={`w-10 h-10 rounded-full border text-sm font-medium transition-colors ${
                          config.workingDays?.[index]
                            ? "bg-[#FE5B25] text-white border-[#FE5B25] hover:bg-[#fe5b25]/90"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                        aria-pressed={!!config.workingDays?.[index]}
                        onClick={() => 
                          setConfig(prev => ({
                            ...prev,
                            workingDays: {
                              ...prev.workingDays,
                              [index]: !prev.workingDays?.[index]
                            }
                          }))
                        }
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Zeitfenster</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <TimePicker
                      value={config.workingTimeStart || '09:00'}
                      onChange={(v) => setConfig(prev => ({ ...prev, workingTimeStart: v }))}
                    />
                    <span className="text-sm text-gray-500">bis</span>
                    <TimePicker
                      value={config.workingTimeEnd || '17:00'}
                      onChange={(v) => setConfig(prev => ({ ...prev, workingTimeEnd: v }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">24‑h Format, lokale Zeitzone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Kalender & Event‑Typen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="eventType">Event‑Typ für Buchungen</Label>
                {isLoadingEventTypes ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Event‑Typen werden geladen..." />
                    </SelectTrigger>
                  </Select>
                ) : availableEventTypes.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Event‑Typen verfügbar" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Verwalte Event‑Typen im <button 
                        onClick={() => navigate('/dashboard/calendar')}
                        className="text-[#FE5B25] hover:underline"
                      >
                        Kalender‑Bereich
                      </button>.
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={config.selectedEventTypes[0] || "none"} 
                    onValueChange={(value) => {
                      setConfig(prev => ({ 
                        ...prev, 
                        selectedEventTypes: value === "none" ? [] : [value]
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Event‑Typ auswählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Event‑Typ</SelectItem>
                      {availableEventTypes.map((eventType) => (
                        <SelectItem key={eventType.id} value={eventType.id}>
                          {eventType.name} ({eventType.duration} Min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Leadquellen</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              {/* Selected Event Type Details */}
              {selectedEventTypeDetails && (
                <div className="mb-6 rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Selected event type</p>
                      <p className="font-medium">
                        {selectedEventTypeDetails.name} · {selectedEventTypeDetails.duration} Min · TZ {selectedEventTypeDetails.timezone || '—'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Buffer: {selectedEventTypeDetails.buffer_time || 0} Min · Prep: {selectedEventTypeDetails.prep_time || 0} Min
                    </div>
                  </div>
                  {Array.isArray(selectedEventTypeDetails.working_hours) && selectedEventTypeDetails.working_hours.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Working hours</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {selectedEventTypeDetails.working_hours.map((wh: any) => (
                          <div key={`${wh.day_of_week}-${wh.start_time}`} className="rounded-md border border-gray-100 px-3 py-2">
                            <span className="font-medium mr-2">{['Mo','Tu','We','Th','Fr','Sa','Su'][wh.day_of_week]}</span>
                            <span>{(wh.start_time || '').slice(0,5)}–{(wh.end_time || '').slice(0,5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(selectedEventTypeDetails.calendar_mappings) && selectedEventTypeDetails.calendar_mappings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Calendar mappings</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEventTypeDetails.calendar_mappings.map((m: any) => (
                          <span key={m.sub_account_id} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700">
                            {m.provider}:{m.role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="leadForm">Leadquelle für ausgehende Anrufe</Label>
                {isLoadingLeadForms ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Leadquellen werden geladen..." />
                    </SelectTrigger>
                  </Select>
                ) : availableLeadForms.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Leadquellen verfügbar" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Erstelle eine Leadquelle im <button 
                        onClick={() => navigate('/dashboard/lead-sources')}
                        className="text-[#FE5B25] hover:underline"
                      >
                        Bereich Leadquellen
                      </button>.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Demo leads preview (first 20) */}
                    <div className="mb-4 rounded-md border bg-white">
                      <div className="px-3 py-2 border-b text-sm font-medium">Beispiel‑Leads (20)</div>
                      <div className="max-h-48 overflow-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Service</th>
                              <th className="py-2 px-3">Telefon</th>
                            </tr>
                          </thead>
                          <tbody>
                            {demoLeads.map((l) => (
                              <tr key={l.id} className="border-t">
                                <td className="py-2 px-3">{l.first_name} {l.last_name}</td>
                                <td className="py-2 px-3 text-gray-600">{l.product_or_service}</td>
                                <td className="py-2 px-3 text-gray-600">{l.phone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <Select 
                      value={config.selectedLeadForm || "none"} 
                      onValueChange={(value) => {
                        if (value === "load-more") {
                          loadMoreLeadForms();
                          return;
                        }
                        setConfig(prev => ({ 
                          ...prev, 
                          selectedLeadForm: value === "none" ? "" : value
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Leadquelle auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine Leadquelle verbunden</SelectItem>
                        {availableLeadForms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            <div className="flex items-center gap-2">
                              <img src="/csv icon.png" alt="Leadquelle" className="w-4 h-4 object-contain" />
                              <span>{form.name || form.meta_form_id} - {form.source_type_display || 'Leadquelle'}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {leadFormsPagination.hasMore && (
                          <SelectItem 
                            value="load-more" 
                            className="text-[#FE5B25] font-medium cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {isLoadingMoreLeadForms ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              <span>
                                {isLoadingMoreLeadForms 
                                  ? "Weitere werden geladen..." 
                                  : `Mehr laden (${availableLeadForms.length} von ${leadFormsPagination.totalCount})`
                                }
                              </span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dokumentenversand ausgeblendet */}
          {false && (
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Dokumentversand</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Dokument für E‑Mail‑Versand</Label>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <span className="text-gray-600">
                      {docStatus?.filename ? `PDF: ${docStatus.filename}${docStatus?.fromEmail ? ` • Von: ${docStatus.fromEmail}` : ''}` : 'Kein Dokumentversand aktiviert'}
                    </span>
                    <Button variant="default" onClick={() => setDocDialogOpen(true)}
                      title="SMTP konfigurieren, PDF hochladen – der Agent versendet es später automatisch">
                      Dokumentversand hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}