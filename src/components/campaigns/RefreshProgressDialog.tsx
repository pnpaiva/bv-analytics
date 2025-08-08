
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface ProgressUpdate {
  campaignId: string;
  campaignName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedUrls: number;
  totalUrls: number;
  error?: string;
}

interface RefreshProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignIds: string[];
  onComplete: () => void;
}

export function RefreshProgressDialog({ 
  open, 
  onOpenChange, 
  campaignIds,
  onComplete 
}: RefreshProgressDialogProps) {
  const [progress, setProgress] = useState<Record<string, ProgressUpdate>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (!open || campaignIds.length === 0) return;

    console.log('Starting refresh progress tracking for campaigns:', campaignIds);
    
    // Reset state
    setProgress({});
    setIsComplete(false);
    setOverallProgress(0);

    // Initialize progress for all campaigns
    const initialProgress: Record<string, ProgressUpdate> = {};
    campaignIds.forEach(id => {
      initialProgress[id] = {
        campaignId: id,
        campaignName: `Campaign ${id.slice(0, 8)}...`,
        status: 'pending',
        processedUrls: 0,
        totalUrls: 0
      };
    });
    setProgress(initialProgress);

    // Start the refresh process
    const startRefresh = async () => {
      try {
        const FUNCTION_URL = 'https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/refresh-campaigns-with-progress';
        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ campaignIds }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'complete') {
                  setIsComplete(true);
                  setOverallProgress(100);
                  onComplete();
                  break;
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.message);
                  break;
                } else if ((data as ProgressUpdate).campaignId) {
                  const update = data as ProgressUpdate;
                  setProgress(prev => ({
                    ...prev,
                    [update.campaignId]: update
                  }));
                  
                  // Update overall progress
                  setProgress(currentProgress => {
                    const next: Record<string, ProgressUpdate> = { ...currentProgress, [update.campaignId]: update };
                    const allProgress = Object.values(next) as ProgressUpdate[];
                    const completedCount = allProgress.filter((p) => p.status === 'completed' || p.status === 'error').length;
                    const newOverallProgress = Math.round((completedCount / campaignIds.length) * 100);
                    setOverallProgress(newOverallProgress);
                    return currentProgress;
                  });
                }
              } catch (e) {
                console.error('Error parsing progress data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during refresh:', error);
        setIsComplete(true);
      }
    };

    startRefresh();
  }, [open, campaignIds, onComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const totalCampaigns = campaignIds.length;
  const completedCampaigns = Object.values(progress).filter(p => p.status === 'completed' || p.status === 'error').length;
  const totalUrls = Object.values(progress).reduce((sum, p) => sum + p.totalUrls, 0);
  const processedUrls = Object.values(progress).reduce((sum, p) => sum + p.processedUrls, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refreshing Campaigns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completedCampaigns} of {totalCampaigns} campaigns</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>

          {/* URL Progress */}
          {totalUrls > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>URLs Processed</span>
                <span>{processedUrls} of {totalUrls} URLs</span>
              </div>
              <Progress value={totalUrls > 0 ? (processedUrls / totalUrls) * 100 : 0} className="w-full" />
            </div>
          )}

          {/* Campaign Details */}
          <div className="space-y-3">
            <h4 className="font-medium">Campaign Details</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.values(progress).map((campaign) => (
                <div key={campaign.campaignId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(campaign.status)}
                    <div>
                      <p className="font-medium text-sm">{campaign.campaignName}</p>
                      {campaign.totalUrls > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {campaign.processedUrls} of {campaign.totalUrls} URLs
                        </p>
                      )}
                      {campaign.error && (
                        <p className="text-xs text-red-500">{campaign.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(campaign.status)}
                    {campaign.status === 'processing' && campaign.totalUrls > 0 && (
                      <div className="w-16">
                        <Progress 
                          value={(campaign.processedUrls / campaign.totalUrls) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              disabled={!isComplete}
              variant={isComplete ? "default" : "outline"}
            >
              {isComplete ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
