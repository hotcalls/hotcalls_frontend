import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import SignupStep1 from "./SignupStep1";
import SignupStep2 from "./SignupStep2";
import { 
  authService, 
  SignupStep1Data, 
  SignupStep2Data, 
  CompleteSignupData 
} from "@/lib/authService";

const SignUp = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get('next');
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState<Partial<CompleteSignupData>>({});

  const handleStep1Complete = (step1Data: SignupStep1Data) => {
    setSignupData(prev => ({ ...prev, ...step1Data }));
    setCurrentStep(2);
  };

  const handleStep2Complete = async (step2Data: SignupStep2Data) => {
    const completeData: CompleteSignupData = {
      ...signupData as SignupStep1Data,
      ...step2Data
    };

    setIsLoading(true);

    try {
      console.log('Attempting to register user with email verification...');
      
      // Use the new registration endpoint with email verification
      const registrationResponse = await authService.register(completeData);
      
      // Store registration data temporarily for potential verification
      authService.storeRegistrationData(completeData);
      
      toast.success("Registrierung erfolgreich!", {
        description: `Eine Bestätigungs-E-Mail wurde an ${registrationResponse.email} gesendet. Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den Bestätigungslink.`
      });

      // Navigate to a verification pending page or show instructions
      navigate(`/email-verification-pending${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`, { 
        state: { email: registrationResponse.email } 
      });
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      
      // Handle specific error cases
      if (error.message.includes('email') && error.message.includes('already')) {
        errorMessage = "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.";
      } else if (error.message.includes('email')) {
        errorMessage = "Bitte überprüfen Sie Ihre E-Mail-Adresse.";
      } else if (error.message.includes('phone')) {
        errorMessage = "Bitte überprüfen Sie Ihre Telefonnummer.";
      } else if (error.message.includes('password')) {
        errorMessage = "Das Passwort entspricht nicht den Anforderungen oder die Passwörter stimmen nicht überein.";
      }
      
      toast.error("Registrierung fehlgeschlagen", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  if (currentStep === 1) {
    return (
      <SignupStep1 
        onNext={handleStep1Complete}
        initialData={signupData as SignupStep1Data}
      />
    );
  }

  return (
    <SignupStep2 
      onBack={handleBackToStep1}
      onComplete={handleStep2Complete}
      initialData={signupData as SignupStep2Data}
      isLoading={isLoading}
    />
  );
};

export default SignUp; 