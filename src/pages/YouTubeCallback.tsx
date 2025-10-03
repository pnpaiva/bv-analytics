import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your YouTube channel...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error('Authorization was denied or cancelled');
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        const redirectUri = `${window.location.origin}/youtube-callback`;

        // Call the callback edge function
        const { data, error: callbackError } = await supabase.functions.invoke(
          'youtube-oauth-callback',
          {
            body: { code, state, redirectUri },
          }
        );

        if (callbackError) {
          console.error('Callback error details:', callbackError);
          throw new Error(callbackError.message || 'Failed to connect YouTube channel');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to connect YouTube channel');
        }

        setStatus('success');
        setMessage(`Successfully connected ${data.channel.title}!`);
        toast.success('YouTube channel connected successfully');

        // Redirect back to creator profiles after 2 seconds
        setTimeout(() => {
          navigate('/creator-profiles');
        }, 2000);
      } catch (error) {
        console.error('YouTube callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect YouTube channel');
        toast.error(error.message || 'Failed to connect YouTube channel');

        // Redirect back after 3 seconds
        setTimeout(() => {
          navigate('/creator-profiles');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">{message}</h2>
            <p className="text-muted-foreground">Please wait while we set up your connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">{message}</h2>
            <p className="text-muted-foreground">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
}
