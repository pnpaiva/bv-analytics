import { Youtube, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useYouTubeConnection, useDisconnectYouTube } from '@/hooks/useCreatorInvitations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface YouTubeConnectionStatusProps {
  creatorId: string;
  showDisconnect?: boolean;
}

export function YouTubeConnectionStatus({ creatorId, showDisconnect = false }: YouTubeConnectionStatusProps) {
  const { data: connection } = useYouTubeConnection(creatorId);
  const disconnectYouTube = useDisconnectYouTube();

  const handleDisconnect = async () => {
    await disconnectYouTube.mutateAsync(creatorId);
  };

  if (!connection) {
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        <span className="text-xs">No YouTube</span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        <Youtube className="h-3 w-3" />
        <span className="text-xs">Connected</span>
      </Badge>
      
      {showDisconnect && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              disabled={disconnectYouTube.isPending}
            >
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect YouTube Channel?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect the YouTube channel from this creator's profile. 
                The demographics data will remain, but real-time updates will stop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisconnect}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
