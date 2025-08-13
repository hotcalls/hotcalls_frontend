import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/lib/authService";

const EmailVerificationPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get('next');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const email = location.state?.email || '';
  const token = searchParams.get('token');

  useEffect(() => {
    // If we have a token in the URL, automatically attempt verification
    if (token && email) {
      handleEmailVerification();
    }
  }, [token, email]);

  const handleEmailVerification = async () => {
    if (!email || !token) {
      toast.error("Ungültiger Verifizierungslink");
      return;
    }

    setIsVerifying(true);
    
    try {
      console.log('Verifying email with token...');
      const user = await authService.verifyEmail(email, token);
      
      // Don't store user data or mark as logged in - user needs to login first!
      // authService.storeUser(user); // REMOVED - user is not logged in yet
      
      // Clear temporary registration data
      authService.clearRegistrationData();
      
      setVerificationStatus('success');
      
      toast.success("E-Mail erfolgreich bestätigt!", {
        description: `Willkommen, ${user.first_name}! Ihr Konto ist jetzt aktiv.`
      });

      // Navigate to login page (not dashboard) after a short delay
      // User needs to actually login to get session cookies!
      setTimeout(() => {
        const loginUrl = nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : "/login";
        navigate(loginUrl, { 
          state: { 
            email: user.email,
            message: "Ihr Konto wurde erfolgreich verifiziert. Bitte melden Sie sich an."
          } 
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setVerificationStatus('error');
      
      let errorMessage = "Die E-Mail-Verifizierung ist fehlgeschlagen.";
      
      if (error.message.includes('token') || error.message.includes('invalid')) {
        errorMessage = "Der Verifizierungslink ist ungültig oder abgelaufen. Bitte registrieren Sie sich erneut.";
      } else if (error.message.includes('email')) {
        errorMessage = "Die E-Mail-Adresse konnte nicht verifiziert werden.";
      }
      
      toast.error("Verifizierung fehlgeschlagen", {
        description: errorMessage
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToSignup = () => {
    navigate("/signup");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">E-Mail bestätigt!</CardTitle>
            <CardDescription className="text-gray-600">
              Ihr Konto wurde erfolgreich aktiviert. Sie werden automatisch weitergeleitet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#FE5B25]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verifizierung fehlgeschlagen</CardTitle>
            <CardDescription className="text-gray-600">
              Der Verifizierungslink ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleBackToSignup}
              className="w-full bg-[#FE5B25] hover:bg-[#E54E1F] text-white"
            >
              Erneut registrieren
            </Button>
            <Button 
              onClick={handleGoToLogin}
              variant="outline"
              className="w-full"
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending verification state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">E-Mail bestätigen</CardTitle>
          <CardDescription className="text-gray-600">
            {email ? `Eine Bestätigungs-E-Mail wurde an ${email} gesendet.` : 'Bitte bestätigen Sie Ihre E-Mail-Adresse.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den Bestätigungslink in der E-Mail.</p>
            <p>Falls Sie keine E-Mail erhalten haben, überprüfen Sie auch Ihren Spam-Ordner.</p>
          </div>

          {token && (
            <Button 
              onClick={handleEmailVerification}
              disabled={isVerifying}
              className="w-full bg-[#FE5B25] hover:bg-[#E54E1F] text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird bestätigt...
                </>
              ) : (
                'E-Mail jetzt bestätigen'
              )}
            </Button>
          )}

          <div className="text-center">
            <Button 
              onClick={handleGoToLogin}
              variant="link"
              className="text-[#FE5B25] hover:underline"
            >
              Bereits bestätigt? Zur Anmeldung
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPending; 