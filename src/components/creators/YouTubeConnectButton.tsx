import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Youtube, Loader2 } from 'lucide-react';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';

interface YouTubeConnectButtonProps {
  creatorId: string;
  isConnected?: boolean;
  onSuccess?: () => void;
}

export function YouTubeConnectButton({ 
  creatorId, 
  isConnected = false,
  onSuccess 
}: YouTubeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { selectedOrganizationId } = useOrganizationContext();

  const handleConnect = async () => {
    if (!selectedOrganizationId) {
      toast.error('Please select an organization first');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-oauth-initiate', {
        body: {
          creatorId,
          organizationId: selectedOrganizationId,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to generate authorization URL');
      }
    } catch (error) {
      console.error('Error initiating YouTube OAuth:', error);
      toast.error(error.message || 'Failed to start YouTube connection');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading || isConnected}
      variant={isConnected ? 'outline' : 'default'}
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <Youtube className="h-4 w-4 mr-2" />
          YouTube Connected
        </>
      ) : (
        <>
          <Youtube className="h-4 w-4 mr-2" />
          Connect YouTube
        </>
      )}
    </Button>
  );
}
