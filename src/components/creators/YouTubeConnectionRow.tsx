import { Youtube, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useYouTubeConnection, useDisconnectYouTube } from '@/hooks/useCreatorInvitations';
import { useFetchYouTubeDemographics } from '@/hooks/useYouTubeAnalytics';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface YouTubeConnectionRowProps {
  creatorId: string;
}

export function YouTubeConnectionRow({ creatorId }: YouTubeConnectionRowProps) {
  const { data: connection } = useYouTubeConnection(creatorId);
  const disconnectYouTube = useDisconnectYouTube();
  const fetchDemographics = useFetchYouTubeDemographics();

  const handleDisconnect = async () => {
    await disconnectYouTube.mutateAsync(creatorId);
  };

  const handleFetchDemographics = async () => {
    try {
      await fetchDemographics.mutateAsync(creatorId);
    } catch (error) {
      console.error('Demographics fetch error:', error);
    }
  };

  // Format last synced time
  const lastSynced = connection?.last_synced_at 
    ? new Date(connection.last_synced_at).toLocaleDateString()
    : 'Never';

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-2">
        <Youtube className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">YouTube</span>
      </div>
      
      {connection ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
              Connected
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Synced: {lastSynced}
            </span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleFetchDemographics}
                  disabled={fetchDemographics.isPending}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${fetchDemographics.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh demographics (Last: {lastSynced})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      disabled={disconnectYouTube.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent>
                  <p>Disconnect</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect YouTube?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will disconnect the YouTube channel from this creator. 
                  Demographics data will remain, but real-time updates will stop.
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
        </div>
      ) : (
        <Badge variant="outline" className="text-xs">Not Connected</Badge>
      )}
    </div>
  );
}
