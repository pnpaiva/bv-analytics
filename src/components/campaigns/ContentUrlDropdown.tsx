import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ExternalLink, ChevronDown } from 'lucide-react';

const getEmbedUrl = (url: string, platform: string): string | null => {
  try {
    if (platform === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    } else if (platform === 'tiktok') {
      const videoId = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)?.[1];
      if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
    } else if (platform === 'instagram') {
      return `${url}embed`;
    }
  } catch (e) {
    console.error('Error parsing embed URL:', e);
  }
  return null;
};

interface ContentUrlDropdownProps {
  contentUrls: Record<string, string[]>;
}

export function ContentUrlDropdown({ contentUrls }: ContentUrlDropdownProps) {
  const allUrls = Object.entries(contentUrls).flatMap(([platform, urls]) =>
    urls.map(url => ({ platform, url }))
  );

  if (allUrls.length === 0) {
    return null;
  }

  if (allUrls.length === 1) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(allUrls[0].url, '_blank')}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4 mr-1" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allUrls.map((item, index) => {
          const embedUrl = getEmbedUrl(item.url, item.platform);
          
          return (
            <HoverCard key={`${item.platform}-${index}`} openDelay={300}>
              <HoverCardTrigger asChild>
                <DropdownMenuItem
                  onClick={() => window.open(item.url, '_blank')}
                  className="cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium capitalize">{item.platform}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {item.url}
                    </span>
                  </div>
                </DropdownMenuItem>
              </HoverCardTrigger>
              {embedUrl && (
                <HoverCardContent side="left" className="w-80 p-0">
                  <iframe
                    src={embedUrl}
                    className="w-full aspect-video rounded-md"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </HoverCardContent>
              )}
            </HoverCard>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}