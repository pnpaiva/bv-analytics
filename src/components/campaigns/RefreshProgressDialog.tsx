
import React, { useState, useEffect, useRef } from 'react';
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

interface RefreshSummary {
  total: number;
  successful: number;
  failed: number;
  skipped?: number;
  resourceUsageMB?: number;
  resourceLimitReached?: boolean;
  results: Array<{
    id: string;
    name: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
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
  const [summary, setSummary] = useState<RefreshSummary | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const startedKeyRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || campaignIds.length === 0 || isComplete) return;

    // Build a stable key for the set of campaign IDs to avoid duplicate starts
    const idsKey = [...campaignIds].sort().join(',');
    if (startedKeyRef.current === idsKey) {
      return; // already streaming for this exact set
    }
    startedKeyRef.current = idsKey;

    console.log('Starting refresh progress tracking for campaigns:', campaignIds);
    
    // Reset state
    setProgress({});
    setIsComplete(false);
    setIsCancelled(false);
    setOverallProgress(0);
    setTotalProcessedUrls(0);
    setGrandTotalUrls(0);
    setSummary(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

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

    // Start the refresh process using CLIENT-SIDE sequential processing with delays
    const processCampaignsSequentially = async () => {
      const results: Array<{id: string, name: string, status: 'success' | 'failed', error?: string}> = [];
      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      for (let i = 0; i < campaignIds.length; i++) {
        // Check for cancellation
        if (isCancelled || abortControllerRef.current?.signal.aborted) {
          console.log('Refresh process cancelled by user');
          setStreamEnded(true);
          setIsComplete(true);
          return;
        }

        const campaignId = campaignIds[i];
        
        // Get campaign name from current progress state
        const getCampaignName = () => {
          const currentProgress = progress[campaignId];
          return currentProgress?.campaignName || `Campaign ${campaignId.slice(0, 8)}...`;
        };
        
        // Update progress to show this campaign is starting
        setProgress(prev => ({
          ...prev,
          [campaignId]: {
            ...prev[campaignId],
            status: 'processing',
            processedUrls: 0,
            totalUrls: 0
          }
        }));

        try {
          console.log(`Processing campaign ${i + 1}/${campaignIds.length}: ${campaignId}`);
          
          // Call the bulk refresh function with a single campaign ID
          const { data, error } = await supabase.functions.invoke('refresh-campaigns-with-progress', {
            body: { campaignIds: [campaignId] }
          });

          if (error) {
            console.error(`Error refreshing campaign ${campaignId}:`, error);
            setProgress(prev => ({
              ...prev,
              [campaignId]: {
                ...prev[campaignId],
                status: 'error',
                error: error.message
              }
            }));
            results.push({
              id: campaignId,
              name: getCampaignName(),
              status: 'failed',
              error: error.message
            });
            totalFailed++;
          } else {
            console.log(`Successfully refreshed campaign ${campaignId}`);
            setProgress(prev => ({
              ...prev,
              [campaignId]: {
                ...prev[campaignId],
                status: 'completed',
                processedUrls: 1,
                totalUrls: 1
              }
            }));
            results.push({
              id: campaignId,
              name: getCampaignName(),
              status: 'success'
            });
            totalSuccessful++;
          }
        } catch (err) {
          console.error(`Exception refreshing campaign ${campaignId}:`, err);
          setProgress(prev => ({
            ...prev,
            [campaignId]: {
              ...prev[campaignId],
              status: 'error',
              error: String(err)
            }
          }));
          results.push({
            id: campaignId,
            name: getCampaignName(),
            status: 'failed',
            error: String(err)
          });
          totalFailed++;
        }

        totalProcessed++;

        // Add delay between campaigns to avoid overwhelming APIs
        if (i < campaignIds.length - 1) {
          console.log(`Waiting 8 seconds before processing next campaign...`);
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }

      // Check for cancellation before setting completion
      if (isCancelled || abortControllerRef.current?.signal.aborted) {
        console.log('Refresh process cancelled by user');
        setStreamEnded(true);
        setIsComplete(true);
        return;
      }

      // Set completion summary
      setSummary({
        total: campaignIds.length,
        successful: totalSuccessful,
        failed: totalFailed,
        results: results
      });

      setStreamEnded(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    };

    // Start the sequential processing
    processCampaignsSequentially().catch(err => {
      console.error('Error in sequential processing:', err);
      setStreamEnded(true);
    });

    return () => {
      startedKeyRef.current = null;
      // Cancel any ongoing operations when component unmounts or dialog closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, campaignIds, isComplete, isCancelled]);

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

    console.log('Progress update:', { completedCount, totalC, urlsDone, urlsTotal, streamEnded });

    setGrandTotalUrls(urlsTotal);
    setTotalProcessedUrls(urlsDone);
    
    const ratioUrls = urlsTotal > 0 ? Math.round((urlsDone / urlsTotal) * 100) : 0;
    const ratioCamps = Math.round((completedCount / totalC) * 100);
    setOverallProgress(urlsTotal > 0 ? ratioUrls : ratioCamps);

    // Mark complete when all campaigns are done OR when stream ended and we have some completed campaigns
    if ((completedCount === totalC) || (streamEnded && completedCount > 0 && completedCount === Object.keys(progress).length)) {
      console.log('Marking as complete');
      setIsComplete(true);
    }
  }, [progress, campaignIds.length, streamEnded]);

  const totalCampaigns = campaignIds.length;
  const completedCampaigns = Object.values(progress).filter(p => p.status === 'completed' || p.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isComplete ? 'Refresh Complete' : 'Refreshing Campaigns'}
          </DialogTitle>
        </DialogHeader>
        
        
        {summary ? (
          // Show summary when refresh is complete
          <div className="space-y-4">
            {/* Resource Usage Warning */}
            {summary.resourceLimitReached && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Resource Limit Reached</h4>
                    <p className="text-sm text-yellow-700">
                      Processing stopped due to Apify free tier limits. Some campaigns were skipped to prevent exceeding the 8GB processing limit.
                    </p>
                    {summary.resourceUsageMB && (
                      <p className="text-sm text-yellow-700 mt-1">
                        Resource usage: {summary.resourceUsageMB}MB of 8GB limit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`grid gap-4 p-4 bg-muted rounded-lg ${summary.skipped ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              {summary.skipped && summary.skipped > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
              )}
            </div>

            {/* Resource Usage Info */}
            {summary.resourceUsageMB && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Resource Usage</span>
                  <span className="text-sm text-blue-700">{summary.resourceUsageMB}MB / 8GB</span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((summary.resourceUsageMB / 8192) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Campaign Details:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {summary.results.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{result.name}</span>
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <Badge className="bg-green-100 text-green-800">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(summary.failed > 0 || (summary.skipped && summary.skipped > 0)) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  {summary.resourceLimitReached ? 'Failed/Skipped Campaigns:' : 'Failed Campaigns:'}
                </h4>
                <div className="space-y-2 text-sm">
                  {summary.results
                    .filter(r => r.status === 'failed')
                    .map((result) => (
                      <div key={result.id} className="space-y-1">
                        <div className="font-medium">{result.name}</div>
                        {result.error && (
                          <div className={`ml-2 ${result.error.includes('resource limits') ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                            {result.error.includes('resource limits') ? '⚠️ ' : 'Error: '}{result.error}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {summary.resourceLimitReached && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Tip:</strong> To process more campaigns, try refreshing in smaller batches or wait for the Apify resource limit to reset.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          // Show progress when refresh is in progress
          <div className="space-y-6">
            {/* Apify Resource Limit Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Apify Starter Subscription</h4>
                  <p className="text-xs text-yellow-700">
                    You're using Apify's starter plan with a $200 platform limit. Processing will stop if limits are reached.
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{completedCampaigns} of {totalCampaigns} campaigns</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Processing campaigns one by one with 8-second delays to avoid rate limits. This will take several minutes for large batches.
              </p>
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
            <div className="flex justify-end gap-2">
              {!isComplete && !isCancelled && (
                <Button 
                  onClick={() => {
                    setIsCancelled(true);
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                  }}
                  variant="destructive"
                >
                  Cancel Refresh
                </Button>
              )}
              <Button 
                onClick={() => onOpenChange(false)}
                disabled={!isComplete && !isCancelled}
                variant={isComplete || isCancelled ? "default" : "outline"}
              >
                {isComplete ? 'Close' : isCancelled ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
