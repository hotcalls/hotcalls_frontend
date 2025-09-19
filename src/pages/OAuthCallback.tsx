import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { extractAuthCode, validateState, handleOAuthCallback } from "@/lib/googleOAuth";
import { buttonStyles, textStyles, iconSizes, layoutStyles } from "@/lib/buttonStyles";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Google Kalender wird verbunden...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for new Backend redirect parameters first
        const success = searchParams.get('success');
        const calendarsCount = searchParams.get('calendars');
        const email = searchParams.get('email');
        const error = searchParams.get('error');

        // NEW: Handle Backend redirect format
        if (success === 'true' && calendarsCount && email) {
          
          setStatus('success');
          setMessage(`Google Kalender erfolgreich verbunden! ${calendarsCount} Kalender synchronisiert.`);
          
          // Redirect to calendar page after short delay
          setTimeout(() => {
            navigate('/dashboard/calendar', {
              state: {
                message: `Google Kalender für ${email} wurde erfolgreich verbunden! ${calendarsCount} Kalender synchronisiert.`,
                type: 'success',
                newConnection: true,
                calendarsCount: parseInt(calendarsCount)
              }
            });
          }, 1500);
          return;
        }

        // Handle Backend error redirects
        if (error) {
          const errorMessages = {
            'oauth_failed': 'Google OAuth Fehler',
            'no_code': 'Kein Authorization Code erhalten',
            'invalid_state': 'Ungültige Session',
            'user_not_found': 'User existiert nicht',
            'no_workspace': 'User gehört zu keinem Workspace',
            'server_error': 'Server-Fehler'
          };
          
          const errorMessage = errorMessages[error as keyof typeof errorMessages] || 'Unbekannter Fehler';
          throw new Error(errorMessage);
        }

        // LEGACY: Extract params from URL (old OAuth flow)
        const { code, state, error: oldError } = extractAuthCode(searchParams);

        // Check for errors from Google
        if (oldError) {
          throw new Error(`Google OAuth error: ${oldError}`);
        }

        // Validate state for CSRF protection
        if (!state || !validateState(state)) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Ensure we have an authorization code
        if (!code) {
          throw new Error('No authorization code received');
        }

        

        // VEREINFACHT: Backend hat bereits alles verarbeitet
        // Frontend lädt nur die neuen Kalender-Verbindungen
        setMessage('Kalender werden synchronisiert...');
        const result = await handleOAuthCallback(); // KEIN code Parameter - Backend macht alles

        if (result.success) {
          setStatus('success');
          setMessage('Google Kalender erfolgreich verbunden!');
          
          // Redirect to calendar page after short delay
          setTimeout(() => {
            navigate('/dashboard/calendar', {
              state: {
                message: 'Google Kalender wurde erfolgreich verbunden!',
                type: 'success',
                newConnection: true,
                calendars: result.calendars // Google Connections vom Backend
              }
            });
          }, 1500);
        } else {
          throw new Error(result.error || 'Failed to connect calendar');
        }

      } catch (err) {
        console.error("[ERROR]:", error);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        
        // For error case, still navigate to calendar after delay
        setTimeout(() => {
          navigate('/dashboard/calendar');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className={layoutStyles.pageContainer}>
      <div className="min-h-screen flex items-center justify-center -mt-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {status === 'processing' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-[#3d5097] mx-auto" />
                  <div>
                    <h3 className={textStyles.sectionTitle}>{message}</h3>
                    <p className={textStyles.cardSubtitle}>Bitte warten...</p>
                  </div>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <h3 className={textStyles.sectionTitle}>{message}</h3>
                    <p className={textStyles.cardSubtitle}>Sie werden weitergeleitet...</p>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                  <div>
                    <h3 className={textStyles.sectionTitle}>Verbindung fehlgeschlagen</h3>
                    <p className={textStyles.cardSubtitle}>{message}</p>
                  </div>
                  <button 
                    className={buttonStyles.primary.default}
                    onClick={() => navigate('/dashboard/calendar')}
                  >
                    <span>Zurück zu Kalendern</span>
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 