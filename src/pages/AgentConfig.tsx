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
import { useState, useEffect, useRef } from "react";
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
      toast.info("Your agent limit has been reached.");
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
      console.log('🔄 No voices loaded, forcing refresh...');
      refreshVoices();
    }
  }, []);

  // Load Event Types and Lead Forms when workspace is available
  useEffect(() => {
    loadEventTypes();
    loadLeadForms();
  }, [primaryWorkspace?.id]);

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
  const [funnelVariables, setFunnelVariables] = useState<Array<{ key: string; label: string; category: 'contact'|'custom'; type: 'string'|'email'|'phone' }>>([]);

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

  // Load Event Types from Calendar API
  const loadEventTypes = async () => {
    setIsLoadingEventTypes(true);
    try {
      const response = await calendarAPI.getCalendarConfigurations();
      const eventTypesData = Array.isArray(response) ? response : (response as any).results || [];
      setAvailableEventTypes(eventTypesData);
      console.log(`✅ Loaded ${eventTypesData.length} Event Types for Agent Config`);
    } catch (error) {
      console.error('❌ Error loading Event Types in Agent Config:', error);
      setAvailableEventTypes([]);
    } finally {
      setIsLoadingEventTypes(false);
    }
  };

  // Load Lead Funnels from Funnel API (including CSV Sources)
  const loadLeadForms = async () => {
    setIsLoadingLeadForms(true);
    try {
      const leadFunnelsData = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id
      });
      
      // Format all funnels (Meta + CSV) for the dropdown
      const formattedForms = (leadFunnelsData || []).map(funnel => ({
        id: funnel.id,
        name: funnel.name,
        meta_form_id: funnel.meta_lead_form?.meta_form_id || null,
        source_type_display: funnel.meta_lead_form ? 'Meta Lead Ads' : 'CSV Import',
        is_csv: !funnel.meta_lead_form && !funnel.webhook_source // CSV if no meta or webhook
      }));
      
      setAvailableLeadForms(formattedForms);
      console.log(`✅ Loaded ${formattedForms.length} Lead Sources for Agent Config:`, {
        meta: formattedForms.filter(f => !f.is_csv).length,
        csv: formattedForms.filter(f => f.is_csv).length
      });
    } catch (error) {
      console.error('❌ Error loading Lead Funnels in Agent Config:', error);
      setAvailableLeadForms([]);
    } finally {
      setIsLoadingLeadForms(false);
    }
  };

  // Load variables for selected funnel
  useEffect(() => {
    const funnelId = config.selectedLeadForm;
    if (!funnelId) {
      setFunnelVariables([]);
      return;
    }
    (async () => {
      try {
        const getVarsFn = (funnelAPI as any).getFunnelVariables || (webhookAPI as any).getFunnelVariables;
        if (typeof getVarsFn !== 'function') {
          console.error('❌ No getFunnelVariables function available on funnelAPI or webhookAPI');
          setFunnelVariables([]);
          return;
        }
        const vars = await getVarsFn(funnelId);
        setFunnelVariables(Array.isArray(vars) ? vars : []);
      } catch (e) {
        console.error('❌ Failed to load funnel variables:', e);
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

  const tokenPillClass = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white bg-[#3d5097] shadow-sm transition";
  const formatBytes = (bytes: number): string => {
    if (!bytes && bytes !== 0) return "-";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${sizes[i]}`;
  };
  const renderPreview = (content: string) => {
    const parts = content.split(/(\{\{[^}]+\}\})/g);
    return (
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {parts.map((part, idx) => {
          if (/^\{\{[^}]+\}\}$/.test(part)) {
            return (
              <span key={idx} className={`${tokenPillClass} mx-0.5`}>{part.replace(/\{\{|\}\}/g, '')}</span>
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
        <Select value={h} onValueChange={(hv) => onChange(`${hv}:${m}`)}>
          <SelectTrigger className="w-16 h-9 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#3d5097]"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-64">
            {hours.map((hh) => (
              <SelectItem key={hh} value={hh}>{hh}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-gray-400 px-1">:</span>
        <Select value={m} onValueChange={(mv) => onChange(`${h}:${mv}`)}>
          <SelectTrigger className="w-16 h-9 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#3d5097]"><SelectValue /></SelectTrigger>
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
        console.error('❌ No valid agent ID provided:', { id, isEdit });
        setError('Keine gültige Agent-ID gefunden');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔧 Loading agent data for editing...', id);
        
        const agentData = await agentAPI.getAgent(id);
        console.log('✅ Agent data loaded:', agentData);
        
        // Debug: Check calendar configuration
        console.log('📅 Checking calendar configuration:', {
          calendar_configuration: agentData.calendar_configuration,
          config_id: (agentData as any).config_id,
          has_calendar_config: 'calendar_configuration' in agentData,
          will_load_eventTypes: agentData.calendar_configuration ? [agentData.calendar_configuration] : []
        });

        // Map character to personality options
        const mapCharacterToPersonality = (character: string) => {
          const lowerChar = character.toLowerCase();
          if (lowerChar.includes('professionell') && lowerChar.includes('direkt')) return 'professional';
          if (lowerChar.includes('enthusiastisch') && lowerChar.includes('energetisch')) return 'energetic';
          if (lowerChar.includes('ruhig') && lowerChar.includes('sachlich')) return 'calm';
          return 'professional'; // default
        };

        // Parse workdays from API response (can be string or array of day names)
        const parseWorkdays = (workdays: string | string[] | number[] | undefined) => {
          const defaultWorkdays = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          
          if (!workdays) return defaultWorkdays;
          
          // Handle string format (e.g., "1,2,3,4,5" or "Monday,Tuesday,Wednesday")
          if (typeof workdays === 'string') {
            const days = workdays.split(',').map(d => d.trim().toLowerCase());
            days.forEach(day => {
              // Check if it's a number
              const dayNum = parseInt(day);
              if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
                defaultWorkdays[dayNum as keyof typeof defaultWorkdays] = true;
              } else {
                // Check if it's a day name
                const dayIndex = dayNames.indexOf(day);
                if (dayIndex !== -1) {
                  defaultWorkdays[dayIndex as keyof typeof defaultWorkdays] = true;
                }
              }
            });
          }
          // Handle array format
          else if (Array.isArray(workdays)) {
            workdays.forEach(day => {
              if (typeof day === 'number' && day >= 0 && day <= 6) {
                defaultWorkdays[day as keyof typeof defaultWorkdays] = true;
              } else if (typeof day === 'string') {
                const dayIndex = dayNames.indexOf(day.toLowerCase());
                if (dayIndex !== -1) {
                  defaultWorkdays[dayIndex as keyof typeof defaultWorkdays] = true;
                }
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
            return `${timeParts[0]}:${timeParts[1]}`;
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
        if (typeof lf === 'string') {
          assignedFunnelId = lf;
        } else if (lf && typeof lf === 'object' && lf.id) {
          assignedFunnelId = lf.id as string;
        } else if ((agentData as any).lead_funnel_id) {
          assignedFunnelId = (agentData as any).lead_funnel_id as string;
        }
        if (assignedFunnelId) {
          console.log('📋 Agent has assigned funnel ID:', assignedFunnelId);
        }
        
        setConfig({
          name: agentData.name || "",
          personality: mappedPersonality,
          voice: agentData.voice || "",
          voiceExternalId: agentData.voice_external_id || "", // Load external voice ID
          script: (agentData as any).prompt || "", // Get prompt from API
          callLogic: "standard",
          selectedEventTypes: agentData.calendar_configuration ? [agentData.calendar_configuration] : [], // Load calendar config
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
        console.error('❌ Failed to load agent data:', err);
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
      toast.error('No voice sample available');
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
      console.error('❌ Voice sample playback error:', e);
      toast.error('Error playing sample');
    });

    setPlayingVoice(voiceId);
    audio.play().catch((err) => {
      console.error('❌ Failed to play audio:', err);
      setPlayingVoice(null);
      toast.error('Audio could not be played');
    });
  };

  // Map selected lead forms to funnel IDs for assignment
  const mapLeadFormsToFunnels = async (selectedLeadForms: string[]): Promise<string[]> => {
    if (!selectedLeadForms || selectedLeadForms.length === 0) {
      console.log('🔍 No lead forms selected, skipping funnel mapping');
      return [];
    }

    try {
      console.log('🔍 Mapping lead forms to funnels:', selectedLeadForms);
      
      // Get all funnels for current workspace
      const funnels = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id,
        is_active: true
      });
      
      // Filter funnels that match selected lead forms
      const matchingFunnels = funnels.filter(funnel => {
        // Match by funnel ID directly (works for both Meta and CSV funnels)
        return selectedLeadForms.includes(funnel.id);
      });
      
      const funnelIds = matchingFunnels.map(funnel => funnel.id);
      
      console.log('🎯 Mapped funnels:', {
        selectedLeadForms,
        matchingFunnels: matchingFunnels.map(f => ({
          id: f.id,
          name: f.name,
          type: f.meta_lead_form ? 'Meta' : 'CSV',
          meta_form_id: f.meta_lead_form?.meta_form_id
        })),
        funnelIds
      });
      
      return funnelIds;
    } catch (error) {
      console.error('❌ Failed to map lead forms to funnels:', error);
      return []; // Return empty array on error - silent failure
    }
  };

  // Handle funnel assignment after successful agent save
  const handleFunnelAssignment = async (selectedFunnelIds: string[], agentId: string) => {
    try {
      console.log('🔗 Starting funnel assignment for agent:', { selectedFunnelIds, agentId });
      
      // selectedFunnelIds are already funnel IDs from the lead-funnels API
      // No need to map them anymore
      const funnelIds = selectedFunnelIds;
      
      if (funnelIds.length === 0) {
        console.log('ℹ️ No funnels to assign - skipping funnel assignment');
        return;
      }
      
      // Get all current funnels for this workspace to unassign any existing assignments
      const allFunnels = await funnelAPI.getLeadFunnels({
        workspace: primaryWorkspace?.id,
        has_agent: true
      });
      
      // Find funnels currently assigned to this agent
      const currentlyAssignedFunnels = allFunnels.filter(funnel => 
        funnel.agent && funnel.agent.agent_id === agentId
      );
      
      console.log('🔄 Current funnel assignments:', currentlyAssignedFunnels.map(f => f.id));
      
      // Unassign existing funnels that are not in the new selection
      const funnelsToUnassign = currentlyAssignedFunnels.filter(funnel => 
        !funnelIds.includes(funnel.id)
      );
      
      for (const funnel of funnelsToUnassign) {
        try {
          await funnelAPI.unassignAgent(funnel.id);
          console.log(`✅ Unassigned funnel ${funnel.id} from agent ${agentId}`);
        } catch (error) {
          console.error(`❌ Failed to unassign funnel ${funnel.id}:`, error);
        }
      }
      
      // Assign new funnels
      const currentlyAssignedIds = currentlyAssignedFunnels.map(f => f.id);
      const funnelsToAssign = funnelIds.filter(id => !currentlyAssignedIds.includes(id));
      
      for (const funnelId of funnelsToAssign) {
        try {
          await funnelAPI.assignAgent(funnelId, agentId);
          console.log(`✅ Assigned funnel ${funnelId} to agent ${agentId}`);
        } catch (error) {
          console.error(`❌ Failed to assign funnel ${funnelId}:`, error);
        }
      }
      
      console.log('🎉 Funnel assignment completed successfully');
      
    } catch (error) {
      console.error('❌ Funnel assignment failed:', error);
      // Silent failure - no user error messages as requested
    }
  };

  const handleSave = async () => {
    console.log('🚀 handleSave STARTED', { config, primaryWorkspace });
    
    try {
      setSaving(true);
      setError(null);
      console.log('🔄 Save state set, validating...');
      
      if (!primaryWorkspace) {
        console.error('❌ No workspace available');
        throw new Error('No workspace available');
      }
      console.log('✅ Workspace available:', primaryWorkspace.id);

      // Validate required fields before sending to API
      if (!config.name || !config.voice) {
        console.error('❌ Validation failed:', { name: config.name, voice: config.voice });
        throw new Error('Name and voice are required');
      }
      
      // Additional validation
      if (!config.incomingGreeting || !config.outgoingGreeting) {
        console.error('❌ Greetings missing:', { 
          incomingGreeting: config.incomingGreeting, 
          outgoingGreeting: config.outgoingGreeting 
        });
        throw new Error('Greetings are required');
      }
      
      if (!config.script || config.script.trim() === '') {
        console.error('❌ Script/Prompt missing');
        throw new Error('Script is required');
      }
      
      console.log('✅ Validation passed');
      
      // Prepare data for API according to PUT /api/agents/agents/{agent_id}/ schema
      console.log('🔧 Preparing agentData...');
      
      // Convert workdays from object to array of English day names
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const workdaysArray = Object.entries(config.workingDays)
        .filter(([_, active]) => active)
        .map(([day]) => dayNames[parseInt(day)]);
      
      console.log('📅 Workdays conversion:', {
        configWorkingDays: config.workingDays,
        filteredDays: Object.entries(config.workingDays).filter(([_, active]) => active),
        workdaysArray: workdaysArray,
        explanation: 'Backend expects English day names like ["Monday", "Tuesday", ...]'
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
        prompt: config.script || "Du bist ein freundlicher KI-Agent.",
        config_id: null, // Optional: Set if you have a config_id
        calendar_configuration: config.selectedEventTypes.length > 0 ? config.selectedEventTypes[0] : null, // Save selected event type
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
          calendar_configuration: agentData.calendar_configuration,
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
        console.log('🔄 Using PUT /api/agents/agents/{agent_id}/ for update');
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
          navigate(`/dashboard/agents/edit/${newAgent.agent_id}`, { replace: true });
        }
      }
      
      // Handle funnel assignment after successful agent save (silent background operation)
      if (agentId && config.selectedLeadForm) {
        console.log('🔗 Agent saved successfully, starting funnel assignment...');
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
        console.log('ℹ️ No lead funnel selected, skipping funnel assignment');
      }
      
      // Stay on the current page - don't navigate away
      // This allows the user to continue editing
      
    } catch (err) {
      console.error('❌ Failed to save agent:', err);
      
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
      console.error("❌ KB list failed", e);
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
          toast.error(`${f.name}: Nur PDF erlaubt`);
          continue;
        }
        if (f.size > maxSize) {
          toast.error(`${f.name}: Max. 20 MB überschritten`);
          continue;
        }
        try {
          await knowledgeAPI.upload(id, f);
          toast.success(`${f.name} hochgeladen`);
        } catch (e: any) {
          toast.error(`${f.name}: ${e?.message || "Upload fehlgeschlagen"}`);
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
      console.log('✅ Test call was initiated (ignoring backend error):', err);
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
          <span>Back to agents</span>
        </button>
      </div>

      {/* Page Header - PIXEL-PERFECT EINHEITLICH */}
      <div className={layoutStyles.pageHeader}>
        <div>
          <h1 className={textStyles.pageTitle}>
            {isEdit ? `Edit agent "${config.name}"` : "Create new agent"}
          </h1>
          <p className={textStyles.pageSubtitle}>Configure personality, script and integrations</p>
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
                  <h4 className="font-medium text-base">Start test call</h4>
                  <p className="text-sm text-gray-600">A test call will be made to your registered phone number.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-phone">Phone number</Label>
                  <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                    {profileLoading ? "Loading..." : userProfile?.phone || "No phone number found"}
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
                      Starting call...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Start call now
                    </>
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <button className={buttonStyles.create.default} onClick={handleSave}>
            <Save className={iconSizes.small} />
            <span>Save</span>
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
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <User className={iconSizes.small} />
                <span className="ml-2">Personality</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "knowledge"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <FileText className={iconSizes.small} />
                <span className="ml-2">Knowledge base</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("script")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "script"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <FileText className={iconSizes.small} />
                <span className="ml-2">Script</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("logic")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "logic"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <Phone className={iconSizes.small} />
                <span className="ml-2">Call logic</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === "integrations"
                  ? "border-[#3d5097] text-[#3d5097]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
            >
              <div className="flex items-center">
                <SettingsIcon className={iconSizes.small} />
                <span className="ml-2">Integrations</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Knowledge base (PDF)</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleKBDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3d5097] transition"
              >
                <p className="text-sm text-gray-600">PDF only, max 20 MB – each agent can have one document</p>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEdit || kbUploading || (kb && kb.files && kb.files.length >= 1)}
                  >
                    {kbUploading ? "Uploading..." : "Choose file"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => e.target.files && handleKBUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Or drag file here</p>
              </div>

              <div className="mt-6">
                {kbLoading ? (
                  <div className="p-4 border rounded-md text-gray-500">Loading documents…</div>
                ) : !kb || kb.files.length === 0 ? (
                  <div className="p-4 border rounded-md text-gray-500">No documents yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Size</th>
                          <th className="py-2 pr-4">Uploaded</th>
                          <th className="py-2">Actions</th>
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
                              <Button variant="destructive" size="sm" onClick={() => handleKBDelete(f.id)}>Delete</Button>
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
              <CardTitle className={textStyles.sectionTitle}>Basic configuration</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="name">Agent name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sarah"
                />
              </div>
              
              <div>
                <Label htmlFor="personality">Personality</Label>
                <Select 
                  value={config.personality} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, personality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a personality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional & Direct</SelectItem>
                    <SelectItem value="energetic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="calm">Calm & Factual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agent-language">Agent language</Label>
                <Select 
                  value={config.language}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en"><div className="flex items-center gap-2"><span className="text-lg">🇬🇧</span><span>English</span></div></SelectItem>
                    <SelectItem value="de"><div className="flex items-center gap-2"><span className="text-lg">🇩🇪</span><span>German</span></div></SelectItem>
                    <SelectItem value="es"><div className="flex items-center gap-2"><span className="text-lg">🇪🇸</span><span>Spanish</span></div></SelectItem>
                    <SelectItem value="fr"><div className="flex items-center gap-2"><span className="text-lg">🇫🇷</span><span>French</span></div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Voice</Label>
                {voices.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading voices...</p>
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
                                  Recommended
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
                                  {voice.gender === 'female' ? 'Female' : voice.gender === 'male' ? 'Male' : 'Neutral'}
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
                                ? "bg-white text-[#3d5097] border-[#3d5097]" 
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              voice: voice.id,
                              voiceExternalId: voice.voice_external_id 
                            }))}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {voices.length > 12 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {voices.length - 12} more voices available...
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
                <span className={textStyles.sectionTitle}>Conversation script</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm text-gray-700">
                    <p>
                      Define the agent's task and write the conversation script.
                    </p>
                    <div className="mt-2">
                      <div className="font-medium">Suggested structure</div>
                      <div className="mt-1 leading-relaxed">
                        AI Assistant: [Your message]<br />
                        Prospect:<br />
                        AI Assistant: [Reply]<br />
                        Prospect:
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
                <div className="text-sm font-medium" style={{color: '#3d5097'}}>Available variables</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {funnelVariables.length === 0 ? (
                    <span className="text-xs text-gray-500">Select a CSV lead source to see variables</span>
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
                <Label htmlFor="greeting">Greeting</Label>
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
                  placeholder="How should the agent greet the caller?"
                  rows={3}
                />
              </div>

              <div className="mt-6">
                <Label htmlFor="script">Script</Label>
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
                  placeholder="Write the conversation script here..."
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
                <span className={textStyles.sectionTitle}>Call logic</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm text-gray-700">
                    <p>Configure the calling strategy:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Max attempts: how many times to call a lead</li>
                      <li>Interval: waiting time between attempts</li>
                      <li>Active times: when the agent may call</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxAttempts">Maximum call attempts</Label>
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
                  <Label htmlFor="callInterval">Call interval (minutes)</Label>
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
                  <Label>Active days</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, index) => (
                      <button
                        key={day}
                        className={`w-10 h-10 rounded-full border text-sm font-medium transition-colors ${
                          config.workingDays?.[index]
                            ? "bg-[#3d5097] text-white border-[#3d5097] hover:bg-[#344482]"
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
                  <Label>Time window</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <TimePicker
                      value={config.workingTimeStart || '09:00'}
                      onChange={(v) => setConfig(prev => ({ ...prev, workingTimeStart: v }))}
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <TimePicker
                      value={config.workingTimeEnd || '17:00'}
                      onChange={(v) => setConfig(prev => ({ ...prev, workingTimeEnd: v }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">24h format, local timezone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Calendar & event types</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="eventType">Event type for bookings</Label>
                {isLoadingEventTypes ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Loading event types..." />
                    </SelectTrigger>
                  </Select>
                ) : availableEventTypes.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="No event types available" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Manage event types in the <button 
                        onClick={() => navigate('/dashboard/calendar')}
                        className="text-[#3d5097] hover:underline"
                      >
                        calendar section
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
                      <SelectValue placeholder="Select event type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No event type</SelectItem>
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
              <CardTitle className={textStyles.sectionTitle}>CSV Lead sources</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div>
                <Label htmlFor="leadForm">CSV lead source for outbound calls</Label>
                {isLoadingLeadForms ? (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Loading lead forms..." />
                    </SelectTrigger>
                  </Select>
                ) : availableLeadForms.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="No CSV leads available" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Upload CSV leads in the <button 
                        onClick={() => navigate('/dashboard/lead-sources')}
                        className="text-[#3d5097] hover:underline"
                      >
                        CSV upload
                      </button>.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select 
                      value={config.selectedLeadForm || "none"} 
                      onValueChange={(value) => {
                        setConfig(prev => ({ 
                          ...prev, 
                          selectedLeadForm: value === "none" ? "" : value
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select CSV lead source (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lead source connected</SelectItem>
                        {availableLeadForms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            <div className="flex items-center gap-2">
                              <img src="/csv icon.png" alt="CSV" className="w-4 h-4 object-contain" />
                              <span>{form.name || form.meta_form_id} - {form.source_type_display || 'CSV Import'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dokumentenversand (minimal, gleicher Stil wie Kalender-Zeile) */}
          <Card>
            <CardHeader>
              <CardTitle className={textStyles.sectionTitle}>Document sending</CardTitle>
            </CardHeader>
            <CardContent className={layoutStyles.cardContent}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Document for email sending</Label>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <span className="text-gray-600">
                      {docStatus?.filename ? `PDF: ${docStatus.filename}${docStatus?.fromEmail ? ` • From: ${docStatus.fromEmail}` : ''}` : 'No document sending'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="default" onClick={() => setDocDialogOpen(true)}
                        title="Configure SMTP, upload PDF – the agent will send it automatically later">
                        Add document sending
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog für Dokumentenversand */}
          <DocumentSendDialog
            open={docDialogOpen}
            onOpenChange={setDocDialogOpen}
            workspaceId={primaryWorkspace?.id || ""}
            agentId={id || ""}
            onChanged={async () => {
              try {
                if (!primaryWorkspace?.id || !id) return;
                // Nach Änderungen den sichtbaren Status aktualisieren (leichtgewichtiger GET)
                const [{ workspaceAPI }, { agentAPI }] = await Promise.all([
                  import("@/lib/apiService"),
                  import("@/lib/apiService"),
                ]);
                const [smtp, doc] = await Promise.all([
                  workspaceAPI.getSmtpSettings(primaryWorkspace.id),
                  agentAPI.getSendDocument(id),
                ]);
                setDocStatus({ filename: doc.filename, fromEmail: smtp?.smtp_from_email || null });
              } catch {}
            }}
          />

        </TabsContent>
      </Tabs>
    </div>
  );
} 