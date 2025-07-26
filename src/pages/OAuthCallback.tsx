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
        // Extract params from URL
        const { code, state, error } = extractAuthCode(searchParams);

        // Check for errors from Google
        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        // Validate state for CSRF protection
        if (!state || !validateState(state)) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Ensure we have an authorization code
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Extract email hint from URL if available
        const hd = searchParams.get('hd'); // hosted domain
        const authuser = searchParams.get('authuser');

        // Exchange code for tokens via backend
        setMessage('Autorisierung wird verarbeitet...');
        const result = await handleOAuthCallback(code);

        if (result.success) {
          setStatus('success');
          setMessage('Google Kalender erfolgreich verbunden!');
          
          // Redirect to calendar page after short delay
          setTimeout(() => {
            navigate('/calendar', { 
              state: { 
                newConnection: true, 
                calendars: result.calendars 
              } 
            });
          }, 1500);
        } else {
          throw new Error(result.error || 'Failed to connect calendar');
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        
        // Redirect to calendar page after delay to show error
        setTimeout(() => {
          navigate('/calendar');
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
                  <Loader2 className="h-12 w-12 animate-spin text-[#FE5B25] mx-auto" />
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
                    onClick={() => navigate('/calendar')}
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