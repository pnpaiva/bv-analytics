import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { YouTubeConnectionRow } from './YouTubeConnectionRow';
import { InstagramConnectionRow } from './InstagramConnectionRow';
import { TikTokConnectionRow } from './TikTokConnectionRow';
import { useYouTubeConnection } from '@/hooks/useCreatorInvitations';

interface PlatformConnectionsManagerProps {
  creatorId: string;
}

export function PlatformConnectionsManager({ creatorId }: PlatformConnectionsManagerProps) {
  const { data: youtubeConnection } = useYouTubeConnection(creatorId);
  
  // Count connected platforms
  const connectedCount = [
    youtubeConnection,
    // Future: instagramConnection
    // Future: tiktokConnection
  ].filter(Boolean).length;
  
  const totalPlatforms = 3;
  
  // Determine badge color based on connection status
  const getVariant = () => {
    if (connectedCount === 0) return 'outline';
    if (connectedCount === totalPlatforms) return 'default';
    return 'secondary';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={getVariant()} 
          size="sm" 
          className="gap-1.5"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="text-xs">Platforms: {connectedCount}/{totalPlatforms}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Platform Connections</div>
          <div className="space-y-2">
            <YouTubeConnectionRow creatorId={creatorId} />
            <InstagramConnectionRow creatorId={creatorId} />
            <TikTokConnectionRow creatorId={creatorId} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
