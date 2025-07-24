import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreators } from '@/hooks/useCreators';
import { Trash2, Plus } from 'lucide-react';

interface CreatorWithUrls {
  creator_id: string;
  content_urls: {
    youtube: string[];
    instagram: string[];
    tiktok: string[];
  };
}

interface CampaignCreatorManagerProps {
  creators: CreatorWithUrls[];
  onChange: (creators: CreatorWithUrls[]) => void;
}

export function CampaignCreatorManager({ creators, onChange }: CampaignCreatorManagerProps) {
  const { data: availableCreators = [] } = useCreators();

  const addCreator = () => {
    const newCreator: CreatorWithUrls = {
      creator_id: '',
      content_urls: {
        youtube: [''],
        instagram: [''],
        tiktok: [''],
      },
    };
    onChange([...creators, newCreator]);
  };

  const removeCreator = (index: number) => {
    const updatedCreators = creators.filter((_, i) => i !== index);
    onChange(updatedCreators);
  };

  const updateCreator = (index: number, updates: Partial<CreatorWithUrls>) => {
    const updatedCreators = creators.map((creator, i) => 
      i === index ? { ...creator, ...updates } : creator
    );
    onChange(updatedCreators);
  };

  const addUrlToCreator = (creatorIndex: number, platform: string) => {
    const updatedCreators = [...creators];
    if (!updatedCreators[creatorIndex].content_urls[platform]) {
      updatedCreators[creatorIndex].content_urls[platform] = [];
    }
    updatedCreators[creatorIndex].content_urls[platform].push('');
    onChange(updatedCreators);
  };

  const updateUrlForCreator = (creatorIndex: number, platform: string, urlIndex: number, url: string) => {
    const updatedCreators = [...creators];
    updatedCreators[creatorIndex].content_urls[platform][urlIndex] = url;
    onChange(updatedCreators);
  };

  const removeUrlFromCreator = (creatorIndex: number, platform: string, urlIndex: number) => {
    const updatedCreators = [...creators];
    updatedCreators[creatorIndex].content_urls[platform] = 
      updatedCreators[creatorIndex].content_urls[platform].filter((_, i) => i !== urlIndex);
    onChange(updatedCreators);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Campaign Creators</Label>
        <Button type="button" onClick={addCreator} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Creator
        </Button>
      </div>

      {creators.map((creator, creatorIndex) => {
        const selectedCreator = availableCreators.find(c => c.id === creator.creator_id);
        
        return (
          <Card key={creatorIndex} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Creator {creatorIndex + 1}
                  {selectedCreator && (
                    <Badge variant="outline">{selectedCreator.name}</Badge>
                  )}
                </CardTitle>
                {creators.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCreator(creatorIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Creator Selection */}
              <div className="space-y-2">
                <Label>Select Creator *</Label>
                <Select
                  value={creator.creator_id}
                  onValueChange={(value) => updateCreator(creatorIndex, { creator_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCreators.map((availableCreator) => (
                      <SelectItem key={availableCreator.id} value={availableCreator.id}>
                        {availableCreator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform URLs */}
              {['youtube', 'instagram', 'tiktok'].map((platform) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{platform} URLs</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addUrlToCreator(creatorIndex, platform)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add URL
                    </Button>
                  </div>
                  
                  {(creator.content_urls[platform] || ['']).map((url, urlIndex) => (
                    <div key={urlIndex} className="flex items-center space-x-2">
                      <Input
                        placeholder={`Enter ${platform} URL`}
                        value={url}
                        onChange={(e) => updateUrlForCreator(creatorIndex, platform, urlIndex, e.target.value)}
                        className="flex-1"
                      />
                      {(creator.content_urls[platform]?.length || 0) > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUrlFromCreator(creatorIndex, platform, urlIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {creators.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No creators added yet. Click "Add Creator" to get started.</p>
        </div>
      )}
    </div>
  );
}