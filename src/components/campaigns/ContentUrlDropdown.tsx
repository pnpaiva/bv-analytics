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
    const embedUrl = getEmbedUrl(allUrls[0].url, allUrls[0].platform);
    
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(allUrls[0].url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </HoverCardTrigger>
        {embedUrl && (
          <HoverCardContent side="left" className="w-96 p-2">
            <iframe
              src={embedUrl}
              className="w-full aspect-video rounded-md border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </HoverCardContent>
        )}
      </HoverCard>
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
      <DropdownMenuContent align="end" className="w-56">
        {allUrls.map((item, index) => {
          const embedUrl = getEmbedUrl(item.url, item.platform);
          
          return (
            <HoverCard key={`${item.platform}-${index}`} openDelay={200}>
              <HoverCardTrigger asChild>
                <div>
                  <DropdownMenuItem
                    onClick={() => window.open(item.url, '_blank')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium capitalize">{item.platform}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {item.url}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </HoverCardTrigger>
              {embedUrl && (
                <HoverCardContent side="left" className="w-96 p-2" sideOffset={10}>
                  <iframe
                    src={embedUrl}
                    className="w-full aspect-video rounded-md border-0"
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