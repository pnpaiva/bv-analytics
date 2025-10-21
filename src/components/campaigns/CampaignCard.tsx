import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Campaign, useDeleteCampaign, useUpdateCampaignStatus } from '@/hooks/useCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { useCampaignUrlAnalytics } from '@/hooks/useCampaignUrlAnalytics';
import { useAggregateCampaignSentiment } from '@/hooks/useCampaignSentiment';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Heart, Trash2, BarChart3, RefreshCw, Edit3, ExternalLink, Youtube, Instagram, Link2, Download, Users, MessageCircle, Smile, Frown, Meh, Sparkles, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { EditCampaignDialog } from './EditCampaignDialog';
import { MasterCampaignDialog } from './MasterCampaignDialog';
import { CampaignManagementDialog } from './CampaignManagementDialog';
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter';
import { toast } from 'sonner';
import { useVideoScriptAnalysis } from '@/hooks/useVideoScriptAnalysis';
import { VideoScriptAnalysisDialog } from './VideoScriptAnalysisDialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CampaignCardProps {
  campaign: Campaign;
  onViewAnalytics: (campaign: Campaign) => void;
  isSelected?: boolean;
  onSelect?: (isSelected: boolean) => void;
  showCheckbox?: boolean;
  showDealValue?: boolean;
}

export function CampaignCard({ 
  campaign, 
  onViewAnalytics, 
  isSelected = false,
  onSelect,
  showCheckbox = false,
  showDealValue = true
}: CampaignCardProps) {
  
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [masterCampaignDialogOpen, setMasterCampaignDialogOpen] = useState(false);
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [scriptAnalysisDialogOpen, setScriptAnalysisDialogOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const deleteCampaign = useDeleteCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const queryClient = useQueryClient();
  const { data: campaignCreators = [] } = useCampaignCreators(campaign.id);
  const { data: urlAnalytics = [] } = useCampaignUrlAnalytics(campaign.id);
  const { aggregate: sentimentData } = useAggregateCampaignSentiment(campaign.id);
  const { canEdit, canDelete } = useUserPermissions();
  const { mutateAsync: analyzeScript, isPending: isAnalyzingScript } = useVideoScriptAnalysis();

  // Use campaign totals as the single source of truth
  // URL analytics are only used for individual URL breakdowns, not totals
  const campaignTotals = React.useMemo(() => {
    console.log('🔍 CAMPAIGN CARD DEBUG for:', campaign.brand_name, {
      campaign_id: campaign.id,
      total_views: campaign.total_views,
      total_engagement: campaign.total_engagement,
      engagement_rate: campaign.engagement_rate,
      urlAnalyticsCount: urlAnalytics?.length || 0,
      urlAnalyticsData: urlAnalytics?.slice(0, 2) // Show first 2 records for debugging
    });

    return {
      totalViews: campaign.total_views || 0,
      totalEngagement: campaign.total_engagement || 0,
      engagementRate: campaign.engagement_rate || 0
    };
  }, [campaign.total_views, campaign.total_engagement, campaign.engagement_rate, urlAnalytics?.length]);

  // Debug logging
  console.log('CampaignCard rendered for:', campaign.brand_name, {
    campaign_data: {
      total_views: campaign.total_views,
      total_engagement: campaign.total_engagement,
      engagement_rate: campaign.engagement_rate
    },
    url_analytics_count: urlAnalytics?.length || 0,
    calculated_totals: campaignTotals
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'analyzing':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Update status to analyzing first
      await updateStatus.mutateAsync({ id: campaign.id, status: 'analyzing' });
      
      // Use the bulk refresh function with a single campaign ID
      const { data, error } = await supabase.functions.invoke('refresh-campaigns-with-progress', {
        body: { campaignIds: [campaign.id] },
      });

      if (error) {
        console.error('Error refreshing analytics:', error);
        await updateStatus.mutateAsync({ id: campaign.id, status: 'error' });
      } else {
        console.log('Refresh completed successfully for campaign:', campaign.id);
        console.log('Refresh response data:', data);
        
        // Collect daily performance data after refresh
        await supabase.functions.invoke('collect-daily-performance', {
          body: { campaignId: campaign.id },
        });

        // Trigger sentiment analysis
        supabase.functions.invoke('analyze-campaign-sentiment', {
          body: { campaignId: campaign.id },
        }).then(() => {
          console.log('Sentiment analysis triggered');
          queryClient.invalidateQueries({ queryKey: ['campaign-sentiment'] });
        }).catch(err => {
          console.error('Sentiment analysis error:', err);
        });
      }
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      await updateStatus.mutateAsync({ id: campaign.id, status: 'error' });
    } finally {
      // Wait longer for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Ensure we refetch campaigns to get the latest status from server
      console.log('Invalidating queries after refresh...');
      
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'accessible-campaigns'
        }),
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'campaign-url-analytics'
        })
      ]);
      
      // Wait a bit more for invalidation to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refetch all campaign-related queries
      await Promise.all([
        queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === 'accessible-campaigns'
        }),
        queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === 'campaign-url-analytics'
        }),
        queryClient.refetchQueries({ queryKey: ['campaigns'] })
      ]);
      
      console.log('Queries invalidated and refetched');
      setRefreshing(false);
    }
  };

  const handleEditSave = () => {
    // Refresh the campaigns data to show updated URLs
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0] === 'accessible-campaigns'
    });
  };

  const handleMasterCampaignSave = () => {
    // Refresh the campaigns data to show updated master campaign links
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0] === 'accessible-campaigns'
    });
  };

  const handleExportPDF = async () => {
    try {
      // Fetch sentiment data for this campaign
      const { data: sentimentData, error: sentimentError } = await supabase
        .from('campaign_sentiment_analysis')
        .select('*')
        .eq('campaign_id', campaign.id);

      if (sentimentError) {
        console.error('Error fetching sentiment data:', sentimentError);
      }

      // Organize sentiment data by campaign ID
      const sentimentMap = new Map<string, Array<any>>();
      if (sentimentData && sentimentData.length > 0) {
        sentimentMap.set(campaign.id, sentimentData);
      }

      const exporter = new EnhancedPDFExporter();
      await exporter.exportWithCharts([campaign], `${campaign.brand_name} Campaign Report`, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true,
        includeCharts: true,
        includeSentiment: true,
        sentimentData: sentimentMap
      });
      
      toast.success('Campaign PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export campaign PDF');
    }
  };

  const handleAnalyzeSentiment = async () => {
    setAnalyzingSentiment(true);
    try {
      console.log('Triggering sentiment analysis for campaign:', campaign.id);
      const { data, error } = await supabase.functions.invoke('analyze-campaign-sentiment', {
        body: { campaignId: campaign.id },
      });

      if (error) {
        console.error('Error analyzing sentiment:', error);
        toast.error('Failed to analyze sentiment');
      } else {
        console.log('Sentiment analysis result:', data);
        if (data?.analyzed > 0) {
          toast.success(`Analyzed ${data.analyzed} URLs successfully`);
          // Invalidate sentiment query to refresh data
          queryClient.invalidateQueries({ queryKey: ['campaign-sentiment', campaign.id] });
        } else {
          toast.info('No comments found to analyze');
        }
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast.error('Failed to analyze sentiment');
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const handleAnalyzeSingleVideo = async (videoUrl: string, platform: string) => {
    try {
      toast.info('Analyzing comments...', {
        description: 'This may take a few minutes',
      });

      const { data, error } = await supabase.functions.invoke('analyze-campaign-sentiment', {
        body: { 
          campaignId: campaign.id,
          specificUrl: videoUrl,
          specificPlatform: platform
        },
      });

      if (error) {
        console.error('Error analyzing video sentiment:', error);
        toast.error('Failed to analyze comments');
      } else {
        if (data?.analyzed > 0) {
          toast.success('Comments analyzed successfully!');
          queryClient.invalidateQueries({ queryKey: ['campaign-sentiment', campaign.id] });
        } else {
          toast.info('No comments found to analyze');
        }
      }
    } catch (error) {
      console.error('Error analyzing video sentiment:', error);
      toast.error('Failed to analyze comments');
    }
  };

  const handleAnalyzeScript = async (videoUrl: string, platform: string) => {
    setCurrentVideoUrl(videoUrl);
    setScriptAnalysisDialogOpen(true);
    try {
      const result = await analyzeScript({ videoUrl, platform });
      setCurrentAnalysis(result.analysis);
    } catch (error) {
      console.error('Script analysis error:', error);
      setCurrentAnalysis(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return Youtube;
      case 'instagram':
        return Instagram;
      case 'tiktok':
        // Using a generic icon for TikTok since lucide doesn't have a specific one
        return ExternalLink;
      default:
        return ExternalLink;
    }
  };

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

  const renderContentUrls = () => {
    // Get URLs from campaign creators instead of campaign.content_urls
    if (campaignCreators.length === 0) return null;

    const allUrls: Array<{ platform: string; url: string; creatorName: string; title?: string; metadata?: any }> = [];
    
    campaignCreators.forEach((campaignCreator) => {
      const contentUrls = campaignCreator.content_urls;
      if (contentUrls && typeof contentUrls === 'object') {
        Object.entries(contentUrls).forEach(([platform, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((url) => {
              if (url && url.trim()) {
                // Find matching analytics data for this URL
                const analyticsData = urlAnalytics.find(analytics => 
                  analytics.content_url === url.trim() && analytics.platform === platform
                );
                
                // Extract title from metadata for YouTube videos
                let title = url.trim();
                if (platform === 'youtube' && analyticsData?.analytics_metadata?.title) {
                  title = analyticsData.analytics_metadata.title;
                }
                
                allUrls.push({ 
                  platform, 
                  url: url.trim(),
                  creatorName: campaignCreator.creators?.name || 'Unknown Creator',
                  title,
                  metadata: analyticsData?.analytics_metadata
                });
              }
            });
          }
        });
      }
    });

    if (allUrls.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2 text-foreground">Content Links</h4>
        <div className="space-y-2">
          {allUrls.map((item, index) => {
            const IconComponent = getPlatformIcon(item.platform);
            const displayText = item.platform === 'youtube' && item.title !== item.url 
              ? item.title 
              : item.url.replace(/^https?:\/\//, '');
            const embedUrl = getEmbedUrl(item.url, item.platform);
            
            return (
              <div key={index} className="flex items-center gap-2">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors flex-1 group"
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <div className="flex items-center gap-1">
                        <span className="capitalize font-medium">{item.platform}:</span>
                        <span className="text-xs bg-muted px-1 py-0.5 rounded">
                          {item.creatorName}
                        </span>
                      </div>
                      <span className="truncate group-hover:underline flex-1" title={item.platform === 'youtube' ? item.title : item.url}>
                        {displayText}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  </HoverCardTrigger>
                  {embedUrl && (
                    <HoverCardContent side="right" className="w-96 p-2" sideOffset={10}>
                      <iframe
                        src={embedUrl}
                        className="w-full aspect-video rounded-md border-0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    </HoverCardContent>
                  )}
                </HoverCard>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAnalyzeScript(item.url, item.platform)}
                    title="Analyze Script"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Analyze Comments Sentiment"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Analyze Comments?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will analyze the comments sentiment for this video. It may take a few minutes depending on the number of comments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAnalyzeSingleVideo(item.url, item.platform)}
                        >
                          Analyze
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showCheckbox && onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
            )}
            {campaign.logo_url && (
              <img 
                src={campaign.logo_url} 
                alt={`${campaign.brand_name} logo`}
                className="w-10 h-10 object-contain rounded border bg-white p-1 flex-shrink-0"
              />
            )}
            <div>
              <CardTitle className="text-lg">{campaign.brand_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {campaignCreators.length > 0 ? (
                  campaignCreators.map((creator, index) => (
                    <span key={creator.id}>
                      {creator.creators?.name}
                      {index < campaignCreators.length - 1 && ', '}
                    </span>
                  ))
                ) : (
                  'No creators assigned'
                )}
              </p>
              {campaign.master_campaign_name && (
                <div className="flex items-center gap-1 mt-2">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Part of "{campaign.master_campaign_name}"
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            {campaign.master_campaign_name && (
              <Badge variant="outline" className="text-xs">
                Master Campaign
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {campaignTotals.totalViews.toLocaleString()} views
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {campaignTotals.totalEngagement.toLocaleString()} engagement
            </span>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Rate: {campaignTotals.engagementRate.toFixed(2)}%</p>
          <p>Month: {campaign.campaign_month || format(new Date(campaign.campaign_date), 'MMM yyyy')}</p>
          {showDealValue && (campaign.fixed_deal_value || campaign.variable_deal_value) && (
            <p>Deal Value: Fixed ${(campaign.fixed_deal_value || 0).toLocaleString()} + Variable ${(campaign.variable_deal_value || 0).toLocaleString()}</p>
          )}
          {campaign.clients && (
            <p>Client: {campaign.clients.name}</p>
          )}
          {campaign.airtable_id && (
            <p>Airtable ID: {campaign.airtable_id}</p>
          )}
        </div>

        {renderContentUrls()}

        {/* Sentiment Analysis Section */}
        {sentimentData && sentimentData.urlsAnalyzed > 0 ? (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comment Sentiment Analysis
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {sentimentData.overallLabel === 'positive' && <Smile className="h-5 w-5 text-success" />}
                {sentimentData.overallLabel === 'neutral' && <Meh className="h-5 w-5 text-muted-foreground" />}
                {sentimentData.overallLabel === 'negative' && <Frown className="h-5 w-5 text-destructive" />}
                <span className="text-sm capitalize font-medium">
                  {sentimentData.overallLabel} Sentiment
                </span>
                <span className="text-xs text-muted-foreground">
                  ({sentimentData.totalComments} comments analyzed)
                </span>
              </div>

              {sentimentData.blurb && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm text-foreground leading-relaxed">
                    {sentimentData.blurb}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Sentiment Analysis
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeSentiment}
                disabled={analyzingSentiment}
              >
                <Sparkles className={`h-4 w-4 mr-1 ${analyzingSentiment ? 'animate-pulse' : ''}`} />
                {analyzingSentiment ? 'Analyzing...' : 'Analyze Comments'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to analyze comments and extract sentiment, topics, and themes
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnalytics(campaign)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => setManagementDialogOpen(true)}
              >
                <Users className="h-4 w-4 mr-1" />
                Management
              </Button> */}
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    {campaign.master_campaign_name ? 'Unlink' : 'Link'}
                  </Button>
                </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{campaign.master_campaign_name ? 'Unlink from Master Campaign' : 'Link to Master Campaign'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {campaign.master_campaign_name ?
                      `Are you sure you want to unlink "${campaign.brand_name}" from "${campaign.master_campaign_name}"? You can relink later.` :
                      `Link "${campaign.brand_name}" to a master campaign.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setMasterCampaignDialogOpen(true)}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this campaign? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCampaign.mutate(campaign.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>

    {canEdit && (
      <EditCampaignDialog
        campaign={campaign}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditSave}
      />
    )}

    {canEdit && (
      <MasterCampaignDialog
        campaign={campaign}
        isOpen={masterCampaignDialogOpen}
        onClose={() => setMasterCampaignDialogOpen(false)}
        onSave={handleMasterCampaignSave}
      />
    )}

    <CampaignManagementDialog
      campaign={campaign}
      isOpen={managementDialogOpen}
      onClose={() => setManagementDialogOpen(false)}
    />
    
    <VideoScriptAnalysisDialog
      open={scriptAnalysisDialogOpen}
      onOpenChange={(open) => {
        setScriptAnalysisDialogOpen(open);
        if (!open) {
          setCurrentAnalysis(null);
          setCurrentVideoUrl('');
        }
      }}
      analysis={currentAnalysis}
      isLoading={isAnalyzingScript}
      videoUrl={currentVideoUrl}
    />
    </>
  );
}