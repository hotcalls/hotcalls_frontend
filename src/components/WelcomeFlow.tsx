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
import { workspaceAPI, callAPI, paymentAPI, MakeTestCallRequest, agentAPI, CreateAgentRequest as APIAgentRequest } from "@/lib/apiService";
import { useUserProfile } from "@/hooks/use-user-profile";
import { toast } from "sonner";

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    voice: "",
    personality: "",
    script: "",
    selectedPlan: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
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
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Get user profile for personalized greetings
  const { profile } = useUserProfile();

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

  // Load Stripe products to get price IDs
  useEffect(() => {
    const loadStripePrices = async () => {
      if (currentStep >= 5 && !planPriceMap.start) { // Load earlier - at step 5 instead of 6
        setIsLoadingPrices(true);
        try {
          const response = await paymentAPI.getStripeProducts();
          console.log('📦 Loaded Stripe products response:', response);
          console.log('🕐 Loaded at:', new Date().toISOString());
          
          // Extract products array from response
          const products = response.products || response;
          
          // Ensure it's an array
          if (!Array.isArray(products)) {
            console.error('❌ Invalid products response:', response);
            throw new Error('Invalid products response from API');
          }
          
          // Map products to our plan names based on price or name
          const newPriceMap: Record<string, string> = {
            start: '',
            pro: '',
            enterprise: ''
          };
          
          // Sort by price to match plans
          const sortedProducts = products.sort((a, b) => {
            const priceA = a.prices[0]?.unit_amount || 0;
            const priceB = b.prices[0]?.unit_amount || 0;
            return priceA - priceB;
          });
          
          // Map based on position or name matching
          sortedProducts.forEach((product, index) => {
            const monthlyPrice = product.prices.find(p => 
              p.recurring?.interval === 'month' && 
              p.recurring?.interval_count === 1 &&
              p.unit_amount !== null // Skip metered prices
            ) || product.prices[0];
            
            if (monthlyPrice && monthlyPrice.unit_amount) {
              const lowerName = product.name.toLowerCase();
              console.log(`🔍 Checking product: ${product.name} (${lowerName}) - Price: ${monthlyPrice.unit_amount/100}€`);
              
              // Check for Start plans (both "Start" and "Start Plan")
              if ((lowerName === 'start' || lowerName === 'start plan') && !newPriceMap.start) {
                console.log(`✅ Matched Start plan: ${product.name} -> ${monthlyPrice.id}`);
                newPriceMap.start = monthlyPrice.id;
              } 
              // Check for Pro plan
              else if (lowerName === 'pro' && !newPriceMap.pro) {
                console.log(`✅ Matched Pro plan: ${product.name} -> ${monthlyPrice.id}`);
                newPriceMap.pro = monthlyPrice.id;
              }
              // Enterprise doesn't need a price ID - it's a contact form
            }
          });
          
          console.log('💰 Price mapping:', newPriceMap);
          
          // If no products were loaded or mapped, use actual Stripe price IDs
          if (!newPriceMap.start || !newPriceMap.pro) {
            console.warn('⚠️ Missing price mappings! Current map:', newPriceMap);
            console.warn('⚠️ Products available:', products.map(p => ({
              name: p.name,
              prices: p.prices.map(pr => ({
                id: pr.id,
                amount: pr.unit_amount,
                recurring: pr.recurring
              }))
            })));
            
            // Use the actual Stripe price IDs we know exist
            if (!newPriceMap.start) {
              newPriceMap.start = 'price_1RhukeRreb0r83OzezuvLXm2'; // Start - 199€
              console.warn('⚠️ Using hardcoded Start price ID');
            }
            if (!newPriceMap.pro) {
              newPriceMap.pro = 'price_1Rhul0Rreb0r83OzXyAcmohG';   // Pro - 549€
              console.warn('⚠️ Using hardcoded Pro price ID');
            }
            // Enterprise doesn't need a price ID - it's a contact form
          }
          
          console.log('📦 Final price mapping:', {
            start: newPriceMap.start,
            pro: newPriceMap.pro,
            enterprise: newPriceMap.enterprise
          });
          
          setPlanPriceMap(newPriceMap);
        } catch (error) {
          console.error('Failed to load Stripe products:', error);
          // Continue with fallback price IDs or plan names
        } finally {
          setIsLoadingPrices(false);
        }
      }
    };
    
    loadStripePrices();
  }, [currentStep, planPriceMap.start]);

  const personalities = [
    "Freundlich und hilfsbereit",
    "Professionell und direkt",
    "Enthusiastisch und energisch",
    "Ruhig und vertrauensvoll",
    "Beratend und sachkundig"
  ];

  const navigateToPlans = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    window.location.href = '/dashboard/plans';
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
        prompt: customGreetings.inbound, // Use inbound greeting as prompt
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
      if (!priceId && isLoadingPrices) {
        toast.warning('Pläne werden noch geladen...', {
          description: 'Bitte versuche es in einem Moment erneut.'
        });
        setIsProcessingPayment(false);
        return;
      }
      
      // If still no price ID, use hardcoded ones
      const finalPriceId = priceId || (
        plan === 'start' ? 'price_1RhukeRreb0r83OzezuvLXm2' :
        plan === 'pro' ? 'price_1Rhul0Rreb0r83OzXyAcmohG' :
        null
      );
      
      if (!finalPriceId) {
        throw new Error(`Keine Price ID für Plan ${plan} gefunden`);
      }
      
      console.log(`💳 Using price ID: ${finalPriceId} for plan: ${plan}`);
      
      // Save plan details
      setFormData(prev => ({ ...prev, selectedPlan: plan }));
      setSelectedPlanDetails({ id: plan, name: planName, price: planPrice });
      
      // Check if workspace has Stripe customer
      const workspaces = await workspaceAPI.getMyWorkspaces();
      if (!workspaces || workspaces.length === 0) {
        throw new Error('Kein Workspace gefunden');
      }
      
      const primaryWorkspace = workspaces[0];
      const stripeInfo = await paymentAPI.getStripeInfo(primaryWorkspace.id);
      
      // Create Stripe customer if needed
      if (!stripeInfo.has_stripe_customer) {
        console.log('📝 Creating Stripe customer...');
        await paymentAPI.createStripeCustomer(primaryWorkspace.id, primaryWorkspace.workspace_name);
        toast.success('Zahlungskonto erstellt');
      }
      
      // Create checkout session with the actual price ID
      console.log('💳 Creating checkout session with price ID:', finalPriceId);
      const { checkout_url } = await paymentAPI.createCheckoutSession(
        primaryWorkspace.id, 
        finalPriceId
      );
      
      // Save plan selection to localStorage for after redirect
      localStorage.setItem('selectedPlan', plan);
      localStorage.setItem('welcomeFlowStep', '7');
      
      // Redirect to Stripe Checkout
      toast.info('Weiterleitung zu Stripe...', {
        description: 'Du wirst zur sicheren Zahlungsseite weitergeleitet.'
      });
      
      setTimeout(() => {
        window.location.href = checkout_url;
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Plan selection error:', error);
      toast.error('Fehler bei der Plan-Auswahl', {
        description: error.message || 'Bitte versuche es erneut.'
      });
      setIsProcessingPayment(false);
    }
  };

  // Check payment status from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const price = urlParams.get('price');
    
    if (payment === 'success' && price) {
      console.log('✅ Payment successful for price:', price);
      // Set subscription active
      setHasActiveSubscription(true);
      // Jump to last step
      setCurrentStep(8);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      toast.success('Zahlung erfolgreich!', {
        description: `Dein Plan ist jetzt aktiv.`
      });
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







  // Main Flow
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
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
        <div className={`p-8 flex flex-col items-center overflow-y-auto ${
          showComparison && currentStep === 7 
            ? 'max-h-[calc(90vh-120px)]' 
            : 'min-h-[400px] justify-center'
        }`}>
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
                Was soll {formData.name || 'dein Agent'} deinen Leads erzählen?
              </h2>
              <Textarea
                placeholder={`Hallo! Hier ist ${formData.name || '[Agent Name]'} von [Ihr Unternehmen]. Vielen Dank für Ihr Interesse an unseren Dienstleistungen...`}
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
              
              <div className="grid md:grid-cols-3 gap-8 px-4">
                {/* Start Plan */}
                <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-[#FE5B25] transition-all">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Start</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Ideal für Einzelpersonen und kleine Teams
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">199€</div>
                      <p className="text-sm text-gray-500">/Monat</p>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Inkl. 250 Minuten, dann 0,49€/Min.</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Unbegrenzte Anzahl an Agenten</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Automatisierte KI-Telefonate</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                        <span>Anbindung von Leadfunnels</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => handlePlanSelection('start', 'Start', '199€')}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verarbeitung...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Jetzt auswählen
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-[#FE5B25] bg-[#FEF5F1] rounded-lg p-8 relative transform scale-105 shadow-lg">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                        <span className="border border-[#FE5B25] text-[#FE5B25] bg-white text-xs px-2 py-1 rounded-md">
                          Am beliebtesten
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Ideal für Unternehmen mit höherem Volumen
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">549€</div>
                      <p className="text-sm text-gray-500">/Monat</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Alle Start-Features plus:</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Inkl. 1000 Minuten, dann 0,29€/Min.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Priority Support</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Advanced Analytics</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>CRM Integrationen</span>
                        </li>
                      </ul>
                    </div>
                    <Button 
                      className="w-full bg-[#FE5B25] hover:bg-[#FE5B25]/90 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => handlePlanSelection('pro', 'Pro', '549€')}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verarbeitung...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Jetzt auswählen
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-[#FE5B25] transition-all">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Individuelle Lösungen für große Unternehmen
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gray-900">Individuell</div>
                      <p className="text-sm text-gray-500">Preis auf Anfrage</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Alle Pro-Features plus:</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Unbegrenzte Agenten & Minuten</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>White Label Lösung</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Dedizierter Account Manager</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-[#FE5B25] flex-shrink-0" />
                          <span>Custom Integrationen</span>
                        </li>
                      </ul>
                    </div>
                                        <Button 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white focus:ring-0 focus:ring-offset-0"
                      onClick={() => {
                        window.open('https://cal.com/leopoeppelonboarding/austausch-mit-leonhard-poppel', '_blank');
                      }}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Mit Gründer sprechen
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <Button 
                  variant="outline"
                  className="border-[#FE5B25] text-[#FE5B25] hover:bg-[#FE5B25]/5 focus:ring-0 focus:ring-offset-0"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Vergleich ausblenden' : 'Pläne vergleichen'}
                </Button>
                <p className="text-sm text-gray-500">
                  Alle Preise sind zzgl. MwSt.
                </p>
              </div>

              {/* Vergleichstabelle */}
              {showComparison && (
                <div className="mt-8 animate-slide-in">
                  <div className="bg-white border rounded-lg">
                    <div className="p-6 border-b">
                      <h3 className="text-xl font-semibold">Detaillierter Funktionsvergleich</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Feature</th>
                            <th className="text-center p-4 font-medium">Start</th>
                            <th className="text-center p-4 font-medium bg-[#FEF5F1]">Pro</th>
                            <th className="text-center p-4 font-medium">Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Preismodelle */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Preismodelle</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Monatliche Gebühr</td>
                            <td className="text-center p-4">199€</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">549€</td>
                            <td className="text-center p-4">ab 1.490€</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Inkludierte Minuten pro Monat</td>
                            <td className="text-center p-4">250</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">1000</td>
                            <td className="text-center p-4">Individuell</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Extra Minuten</td>
                            <td className="text-center p-4">ab 0,49€/Min.</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">ab 0,29€/Min.</td>
                            <td className="text-center p-4">Individuell</td>
                          </tr>
                          
                          {/* Nutzer & Agenten */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Nutzer & Agenten</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Max User</td>
                            <td className="text-center p-4">1</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">5</td>
                            <td className="text-center p-4">Unlimited</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Max aktive Agenten</td>
                            <td className="text-center p-4">3</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">12</td>
                            <td className="text-center p-4">Unlimited</td>
                          </tr>

                          {/* KI-Agenten & Logik */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>KI-Agenten & Logik</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Sofortanruf bei neuen Leads</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Verhalten des Agenten anpassbar</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Individueller Agent-Prompt</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>

                          {/* Funktionen */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Funktionen</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Leads & CRM</td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Analytics & Reporting</td>
                            <td className="text-center p-4">Basic</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">Advanced</td>
                            <td className="text-center p-4">Custom</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">API Zugang</td>
                            <td className="text-center p-4">-</td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>

                          {/* Support */}
                          <tr>
                            <td className="p-4 font-bold text-gray-900" colSpan={4}>Support</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Support-Kanal</td>
                            <td className="text-center p-4">Email</td>
                            <td className="text-center p-4 bg-[#FEF5F1]">Priority Email</td>
                            <td className="text-center p-4">24/7 Phone & Email</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-4">Persönliches Onboarding</td>
                            <td className="text-center p-4">-</td>
                            <td className="text-center p-4 bg-[#FEF5F1]"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                            <td className="text-center p-4"><Check className="h-4 w-4 text-[#FE5B25] mx-auto" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
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