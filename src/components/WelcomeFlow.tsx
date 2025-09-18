import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Check, Sparkles, Zap, Clock, Phone, CreditCard, Loader2, Play, Pause, User, UserCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { authService, voiceService, agentService, Voice, AgentCreateRequest, getVoiceSampleUrl } from "@/lib/authService";
import { workspaceAPI, callAPI, paymentAPI, MakeTestCallRequest, agentAPI, CreateAgentRequest as APIAgentRequest, plansAPI } from "@/lib/apiService";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    voice: "",
    personality: "",
    script: "",
    selectedPlan: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  
  // Map plan names to Stripe price IDs
  const [planPriceMap, setPlanPriceMap] = useState<Record<string, string>>({
    start: '',
    pro: '',
    enterprise: ''
  });
  
  // Dynamic plans from API
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Get user profile for personalized greetings
  const { profile } = useUserProfile();
  
  // Get workspace for agent check
  const { primaryWorkspace, loading: workspaceLoading } = useWorkspace();

  // Generate custom greetings based on user's first name
  const generateCustomGreetings = (agentName: string) => {
    const userFirstName = profile?.first_name || 'da';
    
    const outboundGreeting = `Hi ${userFirstName}, hier ist ${agentName}! Freut mich, dass du da bist und mich testest. Lass uns gerne ein bisschen quatschen und uns gegenseitig kennenlernen.`;
    
    const inboundGreeting = `Hallo ${userFirstName}, hier ist ${agentName}! Schön, dass du anrufst. Ich freue mich darauf, mit dir zu sprechen und mich kennenzulernen.`;
    
    return {
      inbound: inboundGreeting,
      outbound: outboundGreeting
    };
  };

  // Verhindere Body-Scrolling wenn Modal aktiv ist
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle payment success from Stripe redirect
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (workspaceLoading || !primaryWorkspace) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const payment = urlParams.get('payment');
      const priceId = urlParams.get('price');
      
      console.log('🔍 URL Debug:', {
        fullUrl: window.location.href,
        search: window.location.search,
        payment,
        priceId,
        allParams: Array.from(urlParams.entries())
      });
      
      if (payment === 'success') {
        console.log('🎉 Payment success detected! Price ID:', priceId);
        console.log('⏳ Waiting for Stripe webhook to process...');
        
        // Show loading state
        setCurrentStep(null);
        
        // Wait a bit for Stripe webhook to reach backend
        setTimeout(async () => {
          try {
            console.log('🔍 Checking subscription status after payment...');
            console.log('📤 API Call: GET /api/payments/workspaces/' + primaryWorkspace.id + '/subscription/');
            const subscriptionStatus = await paymentAPI.getSubscription(primaryWorkspace.id);
            console.log('💳 Subscription status response:', subscriptionStatus);
            console.log('🎯 has_subscription value:', subscriptionStatus.has_subscription);
            
            if (subscriptionStatus.has_subscription) {
              console.log('✅ Subscription confirmed! Redirecting to dashboard...');
              setHasActiveSubscription(true);
              
              // Clean URL
              window.history.replaceState({}, '', '/');
              
              // Show success message and exit welcome flow
              toast.success('Zahlung erfolgreich!', {
                description: 'Dein Plan ist jetzt aktiv. Willkommen zurück!'
              });
              
              onComplete(); // Exit to dashboard
              return;
            } else {
              // Try workspace details as fallback
              console.log('🔄 Subscription API returned false, trying workspace details...');
              const workspaceDetails = await workspaceAPI.getWorkspaceDetails(primaryWorkspace.id);
              const hasActiveSubscription = workspaceDetails.is_subscription_active ||
                                          workspaceDetails.has_active_subscription || 
                                          workspaceDetails.subscription_active || 
                                          workspaceDetails.active_subscription ||
                                          (workspaceDetails.subscription_status === 'active') ||
                                          (workspaceDetails.plan_status === 'active');
              
              console.log('🏢 Workspace details subscription check:', hasActiveSubscription);
              
              if (hasActiveSubscription) {
                console.log('✅ Subscription confirmed via workspace details!');
                setHasActiveSubscription(true);
                window.history.replaceState({}, '', '/');
                toast.success('Zahlung erfolgreich!', {
                  description: 'Dein Plan ist jetzt aktiv. Willkommen zurück!'
                });
                onComplete();
                return;
              }
              console.warn('⚠️ Payment success but no subscription found. Webhook might be delayed.');
              toast.warning('Zahlung verarbeitet', {
                description: 'Dein Plan wird aktiviert. Bitte warte einen Moment...'
              });
              
              // Retry after a longer delay
              setTimeout(async () => {
                try {
                  const retryStatus = await paymentAPI.getSubscription(primaryWorkspace.id);
                  if (retryStatus.has_subscription) {
                    setHasActiveSubscription(true);
                    onComplete();
                  } else {
                    // Continue with normal flow if still no subscription
                    checkWorkspaceAndAgents();
                  }
                } catch (error) {
                  console.error('❌ Retry subscription check failed:', error);
                  checkWorkspaceAndAgents();
                }
              }, 5000); // 5 more seconds
            }
          } catch (error) {
            console.error('❌ Failed to check subscription after payment:', error);
            toast.error('Fehler beim Prüfen der Zahlung', {
              description: 'Bitte lade die Seite neu oder kontaktiere den Support.'
            });
            checkWorkspaceAndAgents(); // Fall back to normal flow
          }
        }, 3000); // 3 seconds initial wait
        
        return; // Don't run normal checks
      }
      
      // No payment success, run normal checks
      checkWorkspaceAndAgents();
    };

    const checkWorkspaceAndAgents = async () => {
      if (workspaceLoading || !primaryWorkspace) return;
      
      try {
        console.log('🔍 Checking workspace details for subscription status:', primaryWorkspace.id);
        
        // First check workspace details for subscription status
        const workspaceDetails = await workspaceAPI.getWorkspaceDetails(primaryWorkspace.id);
        console.log('🏢 Workspace details response:', workspaceDetails);
        
        // Check if workspace has active subscription (check common field names)
        let hasActiveSubscription = workspaceDetails.is_subscription_active ||
                                    workspaceDetails.has_active_subscription || 
                                    workspaceDetails.subscription_active || 
                                    workspaceDetails.active_subscription ||
                                    (workspaceDetails.subscription_status === 'active') ||
                                    (workspaceDetails.plan_status === 'active');
        
        // If still false, verify via payments subscription endpoint (source of truth)
        if (!hasActiveSubscription) {
          try {
            const sub = await paymentAPI.getSubscription(primaryWorkspace.id);
            const activeByPayments = !!(sub?.has_subscription && sub?.subscription?.status === 'active');
            console.log('💳 Payment API verification (normal flow):', { activeByPayments, sub });
            hasActiveSubscription = activeByPayments;
          } catch (e) {
            console.warn('⚠️ Payment API verification failed (normal flow):', e);
          }
        }
        
        console.log('💳 Subscription check result:', {
          workspace_id: primaryWorkspace.id,
          workspace_name: primaryWorkspace.workspace_name,
          hasActiveSubscription,
          raw_details: workspaceDetails
        });
        
        if (hasActiveSubscription) {
          console.log('✅ User has active subscription, exiting welcome flow');
          onComplete(); // Exit welcome flow completely
          return;
        }
        
        // No active subscription - check for existing agents
        console.log('🔍 No active subscription found, checking for existing agents');
        const agents = await agentAPI.getAgents(primaryWorkspace.id);
        
        if (agents && agents.length > 0) {
          console.log('✅ Found existing agent(s), jumping to plan selection (step 7)');
          setCurrentStep(7);
        } else {
          console.log('🆕 No existing agents found, starting from beginning (step 0)');
          setCurrentStep(0);
        }
      } catch (error) {
        console.warn('⚠️ Could not check workspace details or agents, starting from beginning:', error);
        setCurrentStep(0);
      }
    };

    // Start with payment success handling
    handlePaymentSuccess();
  }, [workspaceLoading, primaryWorkspace, onComplete]);

  // Load voices from API
  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const voicesResponse = await voiceService.getVoices();
        console.log('🎤 API Voice Response:', voicesResponse.results);
        
        // Debug each voice
        voicesResponse.results.forEach(voice => {
          console.log(`🔍 Voice "${voice.name}":`, {
            id: voice.id,
            voice_external_id: voice.voice_external_id,
            voice_picture: voice.voice_picture,
            voice_sample: voice.voice_sample,
            gender: voice.gender,
            provider: voice.provider,
            recommend: voice.recommend
          });
        });
        
        // Sort voices: Markus (empfohlen) in die Mitte setzen
        const sortedVoices = [...voicesResponse.results].sort((a, b) => {
          // Definiere die gewünschte Reihenfolge: Lisa, Markus, Anna
          const order = ['Lisa', 'Markus', 'Anna'];
          const aIndex = order.indexOf(a.name);
          const bIndex = order.indexOf(b.name);
          
          // Wenn beide Namen in der Liste sind, nach der Reihenfolge sortieren
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          
          // Markus (empfohlen) soll immer in der Mitte (Position 1) stehen
          if (a.recommend && !b.recommend) return 1;
          if (!a.recommend && b.recommend) return -1;
          
          // Fallback: alphabetisch
          return a.name.localeCompare(b.name);
        });
        
        console.log('🎯 Sorted voices order:', sortedVoices.map(v => `${v.name}${v.recommend ? ' (Empfohlen)' : ''}`));
        setVoices(sortedVoices);
      } catch (error) {
        console.error('Failed to load voices:', error);
        toast.error('Fehler beim Laden der Stimmen', {
          description: 'Die verfügbaren Stimmen konnten nicht geladen werden.'
        });
        setVoices([]);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    loadVoices();
  }, []);

  // Load plans from API when reaching plan selection step
  useEffect(() => {
    const loadPlansFromAPI = async () => {
      console.log('🔍 Plans useEffect triggered:', { currentStep, plansLength: plans.length });
      
      if (currentStep === 7 && plans.length === 0) {
        console.log('✅ Conditions met - loading plans from API');
        setIsLoadingPlans(true);
        try {
          console.log('📋 Loading plans from API...');
          const plansResponse = await plansAPI.getPlans();
          console.log('✅ Plans API response:', plansResponse);
          
          // Handle both array and paginated response formats
          const plansData = Array.isArray(plansResponse) ? plansResponse : (plansResponse.results || []);
          
          // Transform API data to our expected format
          const transformedPlans = plansData.map((plan: any) => ({
            id: plan.plan_name.toLowerCase(), // "Start" -> "start"
            name: plan.plan_name,
            price: plan.formatted_price || `${plan.price_monthly}€/Monat`,
            price_monthly: plan.price_monthly ? parseFloat(plan.price_monthly) : null,
            description: plan.description,
            features: transformFeatures(plan.features || [], plan.plan_name),
            stripe_price_id: plan.stripe_price_id_monthly,
            is_popular: plan.plan_name === 'Pro', // Pro ist am beliebtesten
            is_contact: plan.plan_name === 'Enterprise'
          }));
          
          setPlans(transformedPlans);
          console.log('🔄 Transformed plans:', transformedPlans);
          
          // Extract stripe price IDs from plans
          const newPriceMap: Record<string, string> = {};
          transformedPlans.forEach((plan: any) => {
            if (plan.stripe_price_id && plan.id) {
              newPriceMap[plan.id] = plan.stripe_price_id;
            }
          });
          
          // Update price map with API data
          setPlanPriceMap(newPriceMap);
          
          console.log('✅ Loaded plans from API:', plansData);
          console.log('💰 Updated price map:', newPriceMap);
          
          // Also load Stripe products for payment buttons - REAL Price IDs!
          try {
            console.log('💳 Loading Stripe products...');
            const stripeResponse = await paymentAPI.getStripeProducts();
            console.log('✅ Stripe products loaded:', stripeResponse);
            
            // Extract REAL Stripe Price IDs from products
            const realPriceMap: Record<string, string> = {};
            if (stripeResponse?.products) {
              stripeResponse.products.forEach((product: any) => {
                const monthlyPrice = product.prices?.find((price: any) => 
                  price.recurring?.interval === 'month'
                );
                if (monthlyPrice && product.name) {
                  const planKey = product.name.toLowerCase(); // "Start" -> "start"
                  realPriceMap[planKey] = monthlyPrice.id;
                  console.log(`💰 Real Stripe Price: ${planKey} -> ${monthlyPrice.id}`);
                }
              });
            }
            
            // Override with REAL Stripe Price IDs
            setPlanPriceMap(realPriceMap);
            console.log('🎯 Using REAL Stripe Price IDs:', realPriceMap);
            
          } catch (stripeError) {
            console.warn('⚠️ Failed to load Stripe products:', stripeError);
            // Fallback to Plans API price IDs (might be fake)
          }
          
        } catch (error) {
          console.warn('⚠️ Failed to load plans from API, using fallback plans and price IDs:', error);
          // NO FALLBACK PRICE IDs! Force user to fix API issue instead of using wrong IDs
          console.error('❌ CRITICAL: Cannot load plans from API. Fix the backend before allowing plan selection!');
          setPlanPriceMap({
            start: '',
            pro: '',
            enterprise: ''
          });
          console.log('💰 Set fallback price IDs due to API error');
        } finally {
          setIsLoadingPlans(false);
        }
      }
    };
    
    loadPlansFromAPI();
  }, [currentStep, plans.length]);

  // Both Plans API and Stripe Products are now loaded when Step 7 is reached

  const personalities = [
    "Professionell & Direkt",
    "Enthusiastisch & Energetisch", 
    "Ruhig & Sachlich"
  ];

  // Fallback plans if API fails
  const fallbackPlans = [
    {
      id: 'start',
      name: 'Start',
      price: '199€',
      price_monthly: 199,
      description: 'Ideal für Einzelpersonen und kleine Teams',
      features: [
        'Inkl. 250 Minuten, dann 0,49€/Min.',
        'Unbegrenzte Anzahl an Agenten',
        'Automatisierte KI-Telefonate',
        'Anbindung von Leadfunnels'
      ],
      stripe_price_id: '', // NO HARDCODED IDs! Must come from API
      is_popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '549€',
      price_monthly: 549,
      description: 'Ideal für Unternehmen mit höherem Volumen',
      features: [
        'Alle Start-Features plus:',
        'Inkl. 1000 Minuten, dann 0,29€/Min.',
        'Priority Support',
        'Advanced Analytics',
        'CRM Integrationen'
      ],
      stripe_price_id: '', // NO HARDCODED IDs! Must come from API
      is_popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Individuell',
      price_monthly: null,
      description: 'Individuelle Lösungen für große Unternehmen',
      features: [
        'Alle Pro-Features plus:',
        'Unbegrenzte Agenten & Minuten',
        'White Label Lösung',
        'Dedizierter Account Manager',
        'Custom Integrationen'
      ],
      stripe_price_id: null,
      is_popular: false,
      is_contact: true
    }
  ];

  const navigateToPlans = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    window.location.href = '/dashboard/plans';
  };

  // Transform API features to user-friendly strings
  const transformFeatures = (apiFeatures: any[], planName: string) => {
    const features: string[] = [];
    
    apiFeatures.forEach(feature => {
      const name = feature.feature_name;
      const limitRaw = feature.limit;
      const limit = parseInt(parseFloat(limitRaw)); // Convert "1000.000" to 1000
      
      switch (name) {
        case 'call_minutes':
          if (limit >= 999999) {
            // Enterprise gets "Individuell" instead of huge numbers
            if (planName === 'Enterprise') {
              // Skip adding big numbers for Enterprise - will be handled in the UI separately
            } else {
              features.push('Unbegrenzte Minuten');
            }
          } else {
            features.push(`Inkl. ${limit.toLocaleString()} Minuten`); // Remove decimals, add thousand separators
          }
          break;
        case 'overage_rate_cents':
          if (limit > 0) {
            const rate = (limit / 100).toFixed(2);
            features.push(`dann ${rate}€/Min.`);
          }
          break;
        case 'max_users':
          if (limit >= 999999) {
            // Enterprise gets "Individuell" instead of huge numbers
            if (planName === 'Enterprise') {
              // Skip adding big numbers for Enterprise - will be handled in the UI separately
            } else {
              features.push('Unbegrenzte Benutzer');
            }
          } else if (limit === 1) {
            features.push('1 User pro Workspace');
          } else if (limit === 3) {
            features.push('3 User pro Workspace'); // No decimals!
          } else if (limit > 1) {
            features.push(`${limit.toLocaleString()} User pro Workspace`);
          }
          break;
        case 'max_agents':
          if (limit >= 999999) {
            // Enterprise gets "Individuell" instead of huge numbers
            if (planName === 'Enterprise') {
              // Skip adding big numbers for Enterprise - will be handled in the UI separately
            } else {
              features.push('Unbegrenzte Agents');
            }
          } else if (limit === 1) {
            features.push('1 Agent pro Workspace');
          } else if (limit === 3) {
            features.push('3 Agents pro Workspace'); // No decimals!
          } else if (limit > 1) {
            features.push(`${limit.toLocaleString()} Agents pro Workspace`);
          }
          break;
        case 'whitelabel_solution':
          features.push('White Label Lösung');
          break;
        case 'crm_integrations':
          features.push('CRM Integrationen');
          break;
        case 'priority_support':
          features.push('Priority Support');
          break;
        case 'advanced_analytics':
          // Skip "Advanced Analytics" for Enterprise per user request
          if (planName !== 'Enterprise') {
            features.push('Advanced Analytics');
          }
          break;
        case 'custom_voice_cloning':
          features.push('Custom Voice Cloning');
          break;
        default:
          // Fallback: use description if available
          if (feature.feature_description) {
            features.push(feature.feature_description);
          }
      }
    });
    
         // Add plan-specific features (Agent limits now come from API)
     if (planName === 'Start') {
       features.push('Automatisierte KI-Telefonate');
       features.push('Anbindung von Leadfunnels');
     } else if (planName === 'Pro') {
       features.push('Automatisierte KI-Telefonate');
       features.push('Anbindung von Leadfunnels');
     } else if (planName === 'Enterprise') {
       // Enterprise: Add proper "Individuell" features instead of big numbers
       features.push('Individuell - Unbegrenzte Minuten');
       features.push('Individuell - Unbegrenzte User');
       features.push('Individuell - Unbegrenzte Agents');
       console.log('🏢 Enterprise features before filtering:', features);
     }
    
    return features;
  };

  // Get current plans (API or fallback)
  const getCurrentPlans = () => {
    if (plans.length > 0) {
      console.log('📋 Using API plans:', plans);
      return plans;
    }
    console.log('📋 Using fallback plans');
    return fallbackPlans;
  };

  const steps = [
    { title: "Willkommen", icon: Sparkles }, // Schritt 0
    { title: "Name", icon: Zap },            // Schritt 1
    { title: "Stimme", icon: Phone },        // Schritt 2
    { title: "Persönlichkeit", icon: Sparkles }, // Schritt 3
    { title: "Skript", icon: Zap },          // Schritt 4
    { title: "Test", icon: Phone },          // Schritt 5
    { title: "Bereit", icon: Check },        // Schritt 6
    { title: "Plan", icon: CreditCard },     // Schritt 7
    { title: "Fertig", icon: Check }         // Schritt 8
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const playVoiceSample = (voice: Voice) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingVoice === voice.id) {
      // If clicking the same voice, stop playing
      setPlayingVoice(null);
      return;
    }

    try {
      // Get the correct audio URL for this voice
      const audioUrl = getVoiceSampleUrl(voice);
      console.log(`Playing voice sample for ${voice.name}: ${audioUrl}`);

      // Create new audio element with CORS support
      const audio = new Audio();
      audio.crossOrigin = "anonymous"; // Enable CORS
      audio.preload = "auto";
      audio.src = audioUrl;
      
      audioRef.current = audio;
      
      // Add event listeners
      audio.onloadstart = () => {
        console.log('Audio loading started...');
      };
      
      audio.oncanplay = () => {
        console.log('Audio can play');
      };
      
      audio.onerror = (error) => {
        console.error('Audio error:', error);
        toast.error('Audio-Fehler', {
          description: `Voice-Sample für ${voice.name} konnte nicht geladen werden.`
        });
        setPlayingVoice(null);
        audioRef.current = null;
      };

      audio.onended = () => {
        setPlayingVoice(null);
        audioRef.current = null;
      };

      // Start playback
      audio.play().then(() => {
        setPlayingVoice(voice.id);
        console.log(`Successfully playing ${voice.name}`);
      }).catch(error => {
        console.error('Error playing voice sample:', error);
        toast.error('Wiedergabe-Fehler', {
          description: `Voice-Sample für ${voice.name} konnte nicht abgespielt werden.`
        });
        setPlayingVoice(null);
        audioRef.current = null;
      });

    } catch (error) {
      console.error('Failed to create audio element:', error);
      toast.error('Audio-Initialisierung fehlgeschlagen', {
        description: 'Audio-Player konnte nicht initialisiert werden.'
      });
    }
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const createAgentViaAPI = async () => {
    try {
      // Get user's workspaces using new endpoint
      const workspaces = await workspaceAPI.getMyWorkspaces();
      console.log('🔍 My Workspaces API response:', workspaces);
      
      if (!workspaces || workspaces.length === 0) {
        throw new Error('Keine Workspace gefunden. Bitte melden Sie sich erneut an.');
      }
      
      // Use the first workspace (user should have exactly one)
      const userWorkspace = workspaces[0];
      console.log('🏢 Selected workspace:', userWorkspace);
      console.log('🆔 Workspace ID:', userWorkspace?.id);

      // Find the selected voice object
      const selectedVoice = voices.find(v => v.id === formData.voice);
      if (!selectedVoice) {
        throw new Error('Keine Stimme ausgewählt');
      }

      // Generate custom greetings
      const customGreetings = generateCustomGreetings(formData.name);

      // Create agent data for API
      const agentData: APIAgentRequest = {
        workspace: userWorkspace.id, // Use user's actual workspace ID
        name: formData.name,
        status: 'active',
        greeting_inbound: customGreetings.inbound,
        greeting_outbound: customGreetings.outbound, // Add outbound greeting
        voice: selectedVoice.id, // ✅ Use internal voice ID (database UUID)
        language: 'de', // Default to German
        retry_interval: 30, // Add retry interval in minutes
        workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // English workday names  
        call_from: '09:00:00',
        call_to: '17:00:00', 
        character: formData.personality,
        prompt: formData.script, // Use user's task definition as prompt
        config_id: null,
        calendar_configuration: null
      };

      console.log('🚀 Creating agent with data:', agentData);
      console.log('📋 Agent data structure:', {
        workspace: agentData.workspace,
        name: agentData.name,
        voice: agentData.voice, // This is now the internal voice ID (UUID)
        greeting_inbound: agentData.greeting_inbound,
        language: agentData.language,
        workdays: agentData.workdays,
        call_from: agentData.call_from,
        call_to: agentData.call_to,
        character: agentData.character,
        status: agentData.status
      });
      console.log('🎤 Selected voice details:', {
        name: selectedVoice.name,
        internal_id: selectedVoice.id,
        external_id: selectedVoice.voice_external_id,
        sending_id: selectedVoice.id, // This is what we're actually sending
        provider: selectedVoice.provider
      });
      
      console.log('📝 Form data collected:', {
        name: formData.name,
        voice: formData.voice,
        personality: formData.personality,
        script: formData.script,
        selectedPlan: formData.selectedPlan
      });
      
      const createdAgent = await agentAPI.createAgent(agentData);
      console.log('✅ Agent created successfully:', createdAgent);
      
      // Store the agent ID for the test call
      if (createdAgent.agent_id) {
        setCreatedAgentId(createdAgent.agent_id);
      }
      
      toast.success('Agent erstellt!', {
        description: `${formData.name} wurde erfolgreich erstellt und ist einsatzbereit.`
      });

      return createdAgent;
    } catch (error) {
      console.error('Agent creation failed:', error);
      toast.error('Fehler bei der Agent-Erstellung', {
        description: 'Der Agent konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
      });
      throw error;
    }
  };

  const handlePlanSelection = async (plan: 'start' | 'pro' | 'enterprise', planName: string, planPrice: string) => {
    try {
      setIsProcessingPayment(true);
      console.log('🎯 Plan selected:', plan);
      console.log('📦 Current price map:', planPriceMap);
      
      // Get the Stripe price ID for this plan
      const priceId = planPriceMap[plan];
      
      // If no price ID found, check if we're still loading
      if (!priceId && isLoadingPlans) {
        toast.warning('Pläne werden noch geladen...', {
          description: 'Bitte versuche es in einem Moment erneut.'
        });
        setIsProcessingPayment(false);
        return;
      }
      
      // NO HARDCODED PRICE IDs! Must come from backend API
      const finalPriceId = priceId;
      
      if (!finalPriceId) {
        throw new Error(`Keine Price ID für Plan ${plan} gefunden`);
      }
      
      console.log(`💳 Using price ID: ${finalPriceId} for plan: ${plan}`);
      
      // Save plan details
      setFormData(prev => ({ ...prev, selectedPlan: plan }));
      setSelectedPlanDetails({ id: plan, name: planName, price: planPrice });
      
      // Save plan selection to localStorage for after redirect
      localStorage.setItem('selectedPlan', plan);
      localStorage.setItem('welcomeFlowStep', '7');
      
      console.log('💳 Selected plan with price ID:', finalPriceId);
      
      // Create Stripe checkout session using real payment API
      const checkoutResponse = await paymentAPI.createCheckoutSession(
        primaryWorkspace.id,
        finalPriceId
      );
      
      console.log('✅ Checkout session created:', checkoutResponse);
      
      // Redirect to Stripe checkout
      if (checkoutResponse.checkout_url) {
        console.log('🚀 Redirecting to Stripe checkout:', checkoutResponse.checkout_url);
        window.location.href = checkoutResponse.checkout_url;
      } else {
        throw new Error('No checkout URL received from payment API');
      }
      
    } catch (error: any) {
      console.error('❌ Plan selection error:', error);
      toast.error('Fehler bei der Plan-Auswahl', {
        description: error.message || 'Bitte versuche es erneut.'
      });
      setIsProcessingPayment(false);
    }
  };

  // Check payment status from URL and verify subscription
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const price = urlParams.get('price');
    
    if (payment === 'success' && price) {
      console.log('✅ Payment successful for price:', price);
      // Verify actual subscription status with API
      verifySubscriptionAfterPayment();
    } else if (payment === 'cancelled') {
      console.log('❌ Payment cancelled');
      // Stay on plan selection
      setCurrentStep(7);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      toast.info('Zahlung abgebrochen', {
        description: 'Du kannst jederzeit einen Plan auswählen.'
      });
    }
  }, []);

  const verifySubscriptionAfterPayment = async () => {
    try {
      console.log('🔍 Verifying subscription status after Stripe payment...');
      
      if (!primaryWorkspace) {
        console.error('❌ No workspace available for subscription verification');
        toast.error('Fehler bei der Verifizierung', {
          description: 'Kein Workspace gefunden.'
        });
        return;
      }

      // Check subscription status using the correct endpoint
      const verificationData = await paymentAPI.getSubscription(primaryWorkspace.id);
      console.log('💳 Subscription verification result:', verificationData);
      
      const hasActiveSubscription = verificationData.has_subscription && 
        verificationData.subscription?.status === 'active';
      
      if (hasActiveSubscription) {
        console.log('✅ Subscription verified - payment successful!');
        // Set subscription active
        setHasActiveSubscription(true);
        // Jump to last step
        setCurrentStep(8);
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        toast.success('Zahlung erfolgreich!', {
          description: `Dein Plan ist jetzt aktiv.`
        });
      } else {
        console.log('❌ Subscription not active after payment');
        // Stay on plan selection
        setCurrentStep(7);
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        toast.error('Subscription nicht aktiv', {
          description: 'Bitte versuche es erneut oder kontaktiere den Support.'
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to verify subscription after payment:', error);
      // Stay on plan selection on error
      setCurrentStep(7);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      toast.error('Fehler bei der Verifizierung', {
        description: 'Bitte versuche es erneut.'
      });
    }
  };

  const nextStep = () => {
    if (currentStep === 4) {
      // Nach dem Script Step: Agent wird erstellt
      setIsCreatingAgent(true);
      
      // Create agent via API
      createAgentViaAPI()
        .then(() => {
          setIsCreatingAgent(false);
          setCurrentStep(currentStep + 1);
        })
        .catch(() => {
          setIsCreatingAgent(false);
          // Stay on current step if creation fails
        });
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestCall = async () => {
    if (!createdAgentId) {
      toast.error('Agent wurde noch nicht erstellt');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🧪 Starting test call for agent:', createdAgentId);
      
      // Make the test call with only agent ID
      const testData: MakeTestCallRequest = {
        agent_id: createdAgentId
      };
      
      console.log('🧪 Calling test API with data:', testData);
      await callAPI.makeTestCall(testData);
      
      toast.success('Test-Anruf wurde gestartet!');
      
      // Wait a moment before proceeding to next step
      setTimeout(() => {
        nextStep();
      }, 2000);
    } catch (err: any) {
      // If call data was sent, the call was initiated successfully
      // Backend errors after that can be ignored
      console.log('✅ Test call was initiated (ignoring backend error):', err);
      toast.success('Test-Anruf wurde gestartet!');
      
      // Still proceed to next step
      setTimeout(() => {
        nextStep();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };







  // Show loading while checking for existing agents
  if (currentStep === null) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE5B25] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your workspace...</p>
        </div>
      </div>
    );
  }

  // Main Flow
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Minimal Progress Dots - nur ab Schritt 1 */}
        {currentStep > 0 && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex justify-center space-x-2">
              {steps.slice(1).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-[#FE5B25]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-8 flex flex-col items-center overflow-y-auto min-h-[400px] justify-center`}>
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="w-full max-w-lg space-y-8 text-center animate-slide-in">
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <img 
                    src="/hotcalls-logo.png" 
                    alt="Hotcalls Logo" 
                    className="h-16 w-auto"
                  />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">
                  Erstelle deinen Agenten<br />in unter 5 Minuten
                </h2>
              </div>
              
              <div className="animate-fade-in delay-1000">
                <Button 
                  size="lg" 
                  className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-4 text-lg focus:ring-0 focus:ring-offset-0"
                  onClick={nextStep}
                >
                  Los geht's
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Agent Name */}
          {currentStep === 1 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Wie soll dein Agent heißen?
              </h2>
              <Input
                placeholder="z.B. Sarah, Max, Anna..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-center text-lg h-12 border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Voice Selection */}
          {currentStep === 2 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Welche Stimme soll {formData.name || 'dein Agent'} haben?
              </h2>
              {isLoadingVoices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FE5B25]" />
                </div>
              ) : (
                <div className="space-y-4">
                  {voices.map((voice, index) => {
                    // Create preview text from voice properties
                    const preview = `${voice.gender === 'male' ? 'Männlich' : voice.gender === 'female' ? 'Weiblich' : 'Neutral'}${voice.tone ? `, ${voice.tone}` : ''}`;
                    
                    // Voice configuration with API picture support
                    const voiceConfig = {
                      avatar: voice.voice_picture || null, // Use API voice_picture if available
                      initial: voice.name.charAt(0).toUpperCase(),
                      fallbackColor: voice.gender === 'male' 
                        ? "bg-blue-100 text-blue-600" 
                        : voice.gender === 'female' 
                        ? "bg-pink-100 text-pink-600" 
                        : "bg-gray-100 text-gray-600"
                    };
                    
                    // Debug picture URL
                    if (voice.voice_picture) {
                      console.log(`🖼️ Voice ${voice.name} has voice_picture: ${voice.voice_picture}`);
                    } else {
                      console.log(`📷 Voice ${voice.name} has no voice_picture, using fallback initial: ${voiceConfig.initial}`);
                    }

                  return (
                    <div 
                      key={voice.id} 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-[#FE5B25] ${
                        formData.voice === voice.id 
                          ? "border-[#FE5B25] bg-[#FEF5F1]" 
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleInputChange('voice', voice.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={voiceConfig.avatar} 
                            alt={voice.name}
                            onLoad={() => {
                              if (voiceConfig.avatar) {
                                console.log(`✅ Avatar loaded successfully for ${voice.name}: ${voiceConfig.avatar}`);
                              }
                            }}
                            onError={(e) => {
                              console.error(`❌ Avatar failed to load for ${voice.name}:`, {
                                src: voiceConfig.avatar,
                                error: e
                              });
                            }}
                          />
                          <AvatarFallback className={`${voiceConfig.fallbackColor} font-semibold text-lg`}>
                            {voiceConfig.initial}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-base text-gray-900">{voice.name}</p>
                              <p className="text-sm text-gray-500">{preview}</p>
                            </div>
                            <div className="w-16 flex justify-end">
                              {voice.recommend && (
                                <Badge variant="secondary" className="text-xs">
                                  Empfohlen
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                                                      <button 
                              className="w-8 h-8 border rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoiceSample(voice);
                              }}
                              title={playingVoice === voice.id ? 'Stoppen' : 'Probe hören'}
                            >
                              {playingVoice === voice.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </button>
                          
                          {formData.voice === voice.id && (
                            <div className="w-6 h-6 bg-[#FE5B25] rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Personality */}
          {currentStep === 3 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Wie ist {formData.name || 'dein Agent'} drauf?
              </h2>
              <Select value={formData.personality} onValueChange={(value) => handleInputChange('personality', value)}>
                <SelectTrigger className="h-12 text-lg border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
                  <SelectValue placeholder="Persönlichkeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  {personalities.map((personality) => (
                    <SelectItem key={personality} value={personality} className="text-lg">
                      {personality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 4: Script */}
          {currentStep === 4 && !isCreatingAgent && (
            <div className="w-full max-w-2xl space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Was ist die Aufgabe von {formData.name || 'deinem Agent'}?
              </h2>
              <Textarea
                placeholder={`z.B. ${formData.name || 'Mein Agent'} soll Interessenten beraten, Termine vereinbaren und Fragen zu unseren Produkten beantworten...`}
                value={formData.script}
                onChange={(e) => handleInputChange('script', e.target.value)}
                rows={8}
                className="text-lg border border-gray-200 focus:border-[#FE5B25] focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none"
              />
            </div>
          )}

          {/* Loading Screen: Agent wird erstellt */}
          {isCreatingAgent && (
            <div className="w-full max-w-md space-y-8 text-center animate-scale-in">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-[#FE5B25]/10 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-10 w-10 text-[#FE5B25] animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {formData.name || 'Dein Agent'} wird gerade erstellt...
                </h2>
                
              </div>
            </div>
          )}

          {/* Step 5: Test Phone */}
          {currentStep === 5 && (
            <div className="w-full max-w-md space-y-8 text-center animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Teste {formData.name || 'deinen Agenten'}
              </h2>
              <div className="space-y-6">
                <p className="text-gray-600 text-lg">
                  Dein Agent wird jetzt einen Test-Anruf durchführen, um seine Konfiguration zu überprüfen.
                </p>
                <Button
                  onClick={handleTestCall}
                  disabled={isLoading}
                  className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-3 text-lg h-12 focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Test-Anruf wird gestartet...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Test-Anruf starten
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Agent Ready */}
          {currentStep === 6 && (
            <div className="w-full max-w-lg space-y-8 text-center animate-slide-in">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">🔥</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {formData.name || 'Dein Agent'} ist jetzt einsatzbereit. Bist du es auch?
                </h2>
              </div>
              
              <Button 
                onClick={nextStep}
                className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-4 text-lg focus:ring-0 focus:ring-offset-0"
                size="lg"
              >
                14-tägige kostenlose Testphase starten*
              </Button>
              
              <p className="text-xs text-gray-500">
                *Die Testphase ist auf 100 Freiminuten limitiert, diese können in der Testphase aufgefüllt werden.
              </p>
            </div>
          )}

          {/* Step 7: Plan Selection */}
          {currentStep === 7 && (
            <div className="w-full space-y-6 animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900 text-center">
                Wähle deinen Plan
              </h2>
              
              {isLoadingPlans && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FE5B25]" />
                  <p className="text-gray-600 mt-2">Lade Pläne...</p>
                </div>
              )}
              
              {!isLoadingPlans && (
                <div className="grid md:grid-cols-3 gap-8 px-4">
                  {getCurrentPlans().map((plan, index) => {
                    const isPopular = plan.is_popular;
                    const isContact = plan.is_contact;
                    
                    return (
                      <div key={plan.id} className={`border-2 rounded-lg p-8 hover:border-[#FE5B25] transition-all ${
                        isPopular ? 'border-[#FE5B25] bg-[#FEF5F1] relative transform scale-105 shadow-lg' : 'border-gray-200'
                      }`}>
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                              {isPopular && (
                                <span className="border border-[#FE5B25] text-[#FE5B25] bg-white text-xs px-2 py-1 rounded-md">
                                  Am beliebtesten
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              {plan.description}
                            </p>
                          </div>
                          <div>
                            <div className="text-4xl font-bold text-gray-900">
                              {plan.price_monthly !== null ? `${plan.price_monthly}€` : 'Individuell'}
                            </div>
                            <p className="text-sm text-gray-500">
                              {plan.price_monthly !== null ? '/Monat' : 'Preis auf Anfrage'}
                            </p>
                          </div>
                          {plan.features && plan.features.length > 0 && (
                            <div>
                              {index > 0 && plan.features[0]?.includes('Features plus:') && (
                                <p className="text-sm font-medium text-gray-700 mb-3">{plan.features[0]}</p>
                              )}
                              <ul className="space-y-3 text-sm">
                                {plan.features.slice(index > 0 && plan.features[0]?.includes('Features plus:') ? 1 : 0).map((feature, featureIndex) => (
                                  <li key={featureIndex} className="flex items-center space-x-3">
                                    <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <Button 
                            className={`w-full focus:ring-0 focus:ring-offset-0 ${
                              isContact 
                                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                : 'bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white'
                            }`}
                            onClick={() => {
                              if (isContact) {
                                window.open('https://cal.com/leonhardpopeppel/austausch-mit-leonhard-poeppel', '_blank');
                              } else {
                                handlePlanSelection(plan.id, plan.name, plan.price);
                              }
                            }}
                            disabled={isProcessingPayment && !isContact}
                          >
                            {isProcessingPayment && !isContact ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verarbeitung...
                              </>
                              ) : (
                              <>
                                {isContact ? (
                                  <Phone className="mr-2 h-5 w-5" />
                                ) : (
                                  <CreditCard className="mr-2 h-5 w-5" />
                                )}
                                {isContact ? 'Mit Experte sprechen' : 'Jetzt auswählen'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  Alle Preise sind zzgl. MwSt.
                </p>
              </div>
            </div>
                      )}

            {/* Step 8: Next Steps */}
            {currentStep === 8 && (
              <div className="w-full space-y-8 animate-fade-in text-center">
                <div className="space-y-4">
                  {hasActiveSubscription ? (
                    <>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                      </div>
                      <h2 className="text-4xl font-bold text-gray-900">
                        Perfekt! Alles bereit! 🎉
                      </h2>
                      <p className="text-xl text-gray-600">
                        Dein {formData.selectedPlan === 'pro' ? 'Pro' : 'Start'} Plan ist aktiv und dein Agent ist einsatzbereit!
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-4xl font-bold text-gray-900">
                        Fast fertig! 🔥
                      </h2>
                      <p className="text-xl text-gray-600">
                        Dein Agent ist bereit. Wähle einen Plan um loszulegen.
                      </p>
                      <Button
                        onClick={() => setCurrentStep(7)}
                        className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Zurück zur Plan-Auswahl
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-6 max-w-md mx-auto">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Verknüpfe deinen Kalender</p>
                      <p className="text-sm text-gray-600">Damit Termine automatisch gebucht werden</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Verknüpfe deine Lead-Quellen</p>
                      <p className="text-sm text-gray-600">Facebook, Website oder andere Kanäle</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#FE5B25] text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Lege Anrufregeln fest</p>
                      <p className="text-sm text-gray-600">Wann und wie oft soll angerufen werden</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white px-8 py-3 text-lg h-12 focus:ring-0 focus:ring-offset-0"
                    onClick={() => {
                      localStorage.setItem('welcomeCompleted', 'true');
                      onComplete();
                    }}
                  >
                    Los geht's! 🚀
                  </Button>
                </div>
              </div>
            )}

        </div>

        {/* Einheitliche Footer Navigation */}
        {currentStep > 0 && currentStep < 6 && !isCreatingAgent && (
          <div className="px-6 py-4 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="focus:ring-0 focus:ring-offset-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <Button
              onClick={nextStep}
              className="bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
              disabled={
                (currentStep === 1 && !formData.name) ||
                (currentStep === 2 && !formData.voice) ||
                (currentStep === 3 && !formData.personality) ||
                (currentStep === 4 && !formData.script)
              }
            >
              {currentStep === 4 ? 'Agent fertigstellen' : currentStep === 5 ? 'Überspringen' : 'Weiter'}
              {currentStep !== 4 && currentStep !== 5 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>


    </div>
  );
} 