
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [totalProcessedUrls, setTotalProcessedUrls] = useState(0);
  const [grandTotalUrls, setGrandTotalUrls] = useState(0);
  const [streamEnded, setStreamEnded] = useState(false);

  useEffect(() => {
    if (!open || campaignIds.length === 0) return;

    console.log('Starting refresh progress tracking for campaigns:', campaignIds);
    
    // Reset state
    setProgress({});
    setIsComplete(false);
    setOverallProgress(0);
    setTotalProcessedUrls(0);
    setGrandTotalUrls(0);

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

    // Prefill campaign names for a better UX
    (async () => {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('id, brand_name')
          .in('id', campaignIds);
        if (data) {
          setProgress(prev => {
            const next = { ...prev };
            data.forEach((c: any) => {
              if (next[c.id]) next[c.id].campaignName = c.brand_name;
            });
            return next;
          });
        }
      } catch (e) {
        console.warn('Could not prefill campaign names', e);
      }
    })();

    // Start the refresh process
    const startRefresh = async () => {
      try {
        const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://hepscjgcjnlofdpoewqx.supabase.co'}/functions/v1/refresh-campaigns-with-progress`;
        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify({ campaignIds }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const dataLine = event.split('\n').find(l => l.startsWith('data: '));
            if (!dataLine) continue;
            try {
              const data = JSON.parse(dataLine.slice(6));
              console.log('Received SSE data:', data);
              
              if (data.type === 'complete') {
                console.log('Refresh complete (stream ended)');
                setStreamEnded(true);
                onComplete();
                continue;
              }
              if (data.type === 'error') {
                console.error('Stream error:', data.message);
                setStreamEnded(true);
                continue;
              }
              if (data.campaignId) {
                const update = data as ProgressUpdate;
                console.log('Updating campaign progress:', update);
                
                setProgress(prev => {
                  const next = {
                    ...prev,
                    [update.campaignId]: update
                  };
                  
                  // Calculate cumulative progress
                  const allProgress = Object.values(next);
                  const completedCount = allProgress.filter(p => p.status === 'completed' || p.status === 'error').length;
                  const newOverallProgress = Math.round((completedCount / campaignIds.length) * 100);
                  
                  // Update cumulative URL counts
                  const newTotalUrls = allProgress.reduce((sum, p) => sum + (p.totalUrls || 0), 0);
                  const newProcessedUrls = allProgress.reduce((sum, p) => sum + (p.processedUrls || 0), 0);
                  
                  setOverallProgress(newOverallProgress);
                  setGrandTotalUrls(newTotalUrls);
                  setTotalProcessedUrls(newProcessedUrls);
                  
                  return next;
                });
              }
            } catch (e) {
              console.error('Error parsing progress data:', e, 'Raw event:', event);
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
  // Derive overall progress and completion from progress map
  useEffect(() => {
    const all = Object.values(progress);
    const totalC = campaignIds.length;
    const completedCount = all.filter(p => p.status === 'completed' || p.status === 'error').length;
    const urlsTotal = all.reduce((sum, p) => sum + (p.totalUrls || 0), 0);
    const urlsDone = all.reduce((sum, p) => sum + (p.processedUrls || 0), 0);

    const ratioUrls = urlsTotal > 0 ? Math.round((urlsDone / urlsTotal) * 100) : 0;
    const ratioCamps = Math.round((completedCount / totalC) * 100);
    setOverallProgress(urlsTotal > 0 ? ratioUrls : ratioCamps);

    if (streamEnded && completedCount === totalC) setIsComplete(true);
  }, [progress, campaignIds.length, streamEnded]);

  const totalCampaigns = campaignIds.length;
  const completedCampaigns = Object.values(progress).filter(p => p.status === 'completed' || p.status === 'error').length;

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
          {grandTotalUrls > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>URLs Processed</span>
                <span>{totalProcessedUrls} of {grandTotalUrls} URLs</span>
              </div>
              <Progress value={grandTotalUrls > 0 ? (totalProcessedUrls / grandTotalUrls) * 100 : 0} className="w-full" />
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
