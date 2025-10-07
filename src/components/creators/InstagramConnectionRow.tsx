import { Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface InstagramConnectionRowProps {
  creatorId: string;
}

export function InstagramConnectionRow({ creatorId }: InstagramConnectionRowProps) {
  // Placeholder for future Instagram connection functionality
  const isConnected = false;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-2">
        <Instagram className="h-4 w-4 text-pink-500" />
        <span className="text-sm font-medium">Instagram</span>
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
