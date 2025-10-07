import { Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TikTokConnectionRowProps {
  creatorId: string;
}

export function TikTokConnectionRow({ creatorId }: TikTokConnectionRowProps) {
  // Placeholder for future TikTok connection functionality
  const isConnected = false;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 text-black dark:text-white" />
        <span className="text-sm font-medium">TikTok</span>
      </div>
      
      {isConnected ? (
        <Badge variant="default" className="text-xs">Connected</Badge>
      ) : (
        <Button size="sm" variant="outline" disabled className="h-7 text-xs">
          Coming Soon
        </Button>
      )}
    </div>
  );
}
