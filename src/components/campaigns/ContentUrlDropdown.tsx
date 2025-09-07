import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExternalLink, ChevronDown } from 'lucide-react';

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
        {allUrls.map((item, index) => (
          <DropdownMenuItem
            key={`${item.platform}-${index}`}
            onClick={() => window.open(item.url, '_blank')}
            className="cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium capitalize">{item.platform}</span>
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {item.url}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}