import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Campaign } from '@/hooks/useCampaigns';
import { useCampaignTimeline } from '@/hooks/useCampaignTimeline';
import { useCampaignUrlAnalytics } from '@/hooks/useCampaignUrlAnalytics';
import { useDailyCampaignPerformance } from '@/hooks/useDailyCampaignPerformance';
import { Eye, Heart, Share2, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CampaignAnalyticsModalProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate timeline data from campaign_url_analytics table (most recent data per day)
const generateTimelineDataFromUrlAnalytics = (urlAnalytics: any[]) => {
  if (!urlAnalytics || urlAnalytics.length === 0) return [];
  
  // Group by date and get the most recent data for each URL on each date
  const dailyData = new Map();
  
  urlAnalytics.forEach(entry => {
    if (!entry || !entry.date_recorded) return;
    
    const date = entry.date_recorded;
    const key = `${entry.content_url}-${entry.platform}`;
    
    if (!dailyData.has(date)) {
      dailyData.set(date, new Map());
    }
    
    const dayData = dailyData.get(date);
    const existing = dayData.get(key);
    
    // Keep only the most recent entry for each URL on this date
    if (!existing || new Date(entry.fetched_at || entry.created_at) > new Date(existing.fetched_at || existing.created_at)) {
      dayData.set(key, entry);
    }
  });
  
  // Convert to array and calculate totals for each day
  return Array.from(dailyData.entries())
    .map(([date, urlData]) => {
      const entries = Array.from(urlData.values());
      const totalViews = entries.reduce((sum: number, entry: any) => sum + (Number(entry?.views) || 0), 0);
      const totalEngagement = entries.reduce((sum: number, entry: any) => sum + (Number(entry?.engagement) || 0), 0);
      const engagementRate = Number(totalViews) > 0 ? (Number(totalEngagement) / Number(totalViews)) * 100 : 0;
      
      return {
        date,
        views: totalViews,
        engagement: totalEngagement,
        engagementRate: Number(engagementRate.toFixed(2)),
        platformBreakdown: {}
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Generate timeline data from daily_campaign_performance table (fallback)
const generateTimelineData = (dailyData: any[]) => {
  if (!dailyData || dailyData.length === 0) return [];
  
  // Use actual daily campaign performance data
  return dailyData.map((day: any) => ({
    date: day.date_recorded,
    views: day.total_views || 0,
    engagement: day.total_engagement || 0,
    engagementRate: Number((day.engagement_rate || 0).toFixed(2)),
    platformBreakdown: day.platform_breakdown || {}
  }));
};

// Helper function to get platform data with all videos
const getPlatformDataStatic = (campaign: Campaign) => {
  if (!campaign.analytics_data) return [];
  
  const platforms = [];
  const analyticsData = campaign.analytics_data as any;
  
  // YouTube - aggregate all videos
  if (analyticsData.youtube?.length > 0) {
    const totalViews = analyticsData.youtube.reduce((sum: number, video: any) => sum + (Number(video?.views) || 0), 0);
    const totalEngagement = analyticsData.youtube.reduce((sum: number, video: any) => sum + (Number(video?.engagement) || 0), 0);
    const avgRate = totalViews > 0 ? Number(((Number(totalEngagement) / Number(totalViews)) * 100).toFixed(2)) : 0;
    
    platforms.push({
      platform: 'YouTube',
      views: totalViews,
      engagement: totalEngagement,
      rate: avgRate,
      videoCount: analyticsData.youtube.length,
      urls: analyticsData.youtube.map((v: any) => v.url)
    });
  }
  
  // Instagram - aggregate all videos
  if (analyticsData.instagram?.length > 0) {
    const totalViews = analyticsData.instagram.reduce((sum: number, video: any) => sum + (Number(video?.views) || 0), 0);
    const totalEngagement = analyticsData.instagram.reduce((sum: number, video: any) => sum + (Number(video?.engagement) || 0), 0);
    const avgRate = totalViews > 0 ? Number(((Number(totalEngagement) / Number(totalViews)) * 100).toFixed(2)) : 0;
    
    platforms.push({
      platform: 'Instagram',
      views: totalViews,
      engagement: totalEngagement,
      rate: avgRate,
      videoCount: analyticsData.instagram.length,
      urls: analyticsData.instagram.map((v: any) => v.url)
    });
  }
  
  // TikTok - aggregate all videos
  if (analyticsData.tiktok?.length > 0) {
    const totalViews = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (Number(video?.views) || 0), 0);
    const totalEngagement = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (Number(video?.engagement) || 0), 0);
    const avgRate = totalViews > 0 ? Number(((Number(totalEngagement) / Number(totalViews)) * 100).toFixed(2)) : 0;
    
    platforms.push({
      platform: 'TikTok',
      views: totalViews,
      engagement: totalEngagement,
      rate: avgRate,
      videoCount: analyticsData.tiktok.length,
      urls: analyticsData.tiktok.map((v: any) => v.url)
    });
  }
  
  return platforms;
};

export function CampaignAnalyticsModal({ campaign, open, onOpenChange }: CampaignAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real historical data from daily_campaign_performance table
  const { data: dailyPerformanceData = [] } = useDailyCampaignPerformance(campaign?.id || '', 30);
  const { data: timelineData = [] } = useCampaignTimeline(campaign?.id || '', 30);
  const { data: urlAnalytics = [] } = useCampaignUrlAnalytics(campaign?.id || '');

  // Use campaign totals as the single source of truth
  // URL analytics are only used for individual URL breakdowns, not totals
  const campaignTotals = useMemo(() => {
    if (!campaign) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        engagementRate: 0
      };
    }

    return {
      totalViews: campaign.total_views || 0,
      totalEngagement: campaign.total_engagement || 0,
      engagementRate: campaign.engagement_rate || 0
    };
  }, [campaign]);

  // Early return after all hooks
  if (!campaign) return null;

  // Debug logging
  console.log('CampaignAnalyticsModal rendered for:', campaign.brand_name, {
    urlAnalytics: urlAnalytics?.length || 0,
    campaign: {
      total_views: campaign.total_views,
      total_engagement: campaign.total_engagement,
      engagement_rate: campaign.engagement_rate
    }
  });

  // Extract platform data from campaign_url_analytics table (same as campaign card)
  const getPlatformData = () => {
    try {
      if (!urlAnalytics || urlAnalytics.length === 0) return [];
      
      // Get the most recent data for each unique URL (latest date_recorded)
      const latestDataByUrl = new Map();
      
      urlAnalytics.forEach(entry => {
        if (!entry || !entry.content_url || !entry.platform) return;
        
        const key = `${entry.content_url}-${entry.platform}`;
        const existing = latestDataByUrl.get(key);
        
        if (!existing || new Date(entry.date_recorded) > new Date(existing.date_recorded)) {
          latestDataByUrl.set(key, entry);
        }
      });

      // Group by platform and aggregate
      const platformData = new Map();
      
      Array.from(latestDataByUrl.values()).forEach(entry => {
        if (!entry || !entry.platform) return;
        
        const platform = entry.platform.charAt(0).toUpperCase() + entry.platform.slice(1);
        
        if (!platformData.has(platform)) {
          platformData.set(platform, {
            platform,
            views: 0,
            engagement: 0,
            videoCount: 0,
            urls: []
          });
        }
        
        const data = platformData.get(platform);
        data.views += entry.views || 0;
        data.engagement += entry.engagement || 0;
        data.videoCount += 1;
        data.urls.push(entry.content_url);
      });

      // Calculate engagement rates and return as array
      return Array.from(platformData.values()).map(data => ({
        ...data,
        rate: data.views > 0 ? Number(((data.engagement / data.views) * 100).toFixed(2)) : 0
      }));
    } catch (error) {
      console.error('Error calculating platform data:', error);
      return [];
    }
  };

  const platformData = getPlatformData();
  
  // Use URL analytics data for timeline if available, otherwise fallback to daily performance data
  const finalTimelineData = urlAnalytics && urlAnalytics.length > 0 
    ? generateTimelineDataFromUrlAnalytics(urlAnalytics)
    : generateTimelineData(dailyPerformanceData);

  const handleExport = () => {
    const data = {
      campaign: campaign.brand_name,
      totalViews: campaign.total_views,
      totalEngagement: campaign.total_engagement,
      engagementRate: campaign.engagement_rate,
      platforms: platformData,
      timeline: finalTimelineData,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.brand_name}-analytics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{campaign.brand_name} Analytics</DialogTitle>
              <DialogDescription>
                Detailed performance metrics for {campaign.creators?.name || 'Unknown Creator'}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {format(new Date(campaign.campaign_date), 'MMM d, yyyy')}
              </Badge>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignTotals.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignTotals.totalEngagement.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignTotals.engagementRate.toFixed(2)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deal Value</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${campaign.deal_value?.toLocaleString() || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">Campaign value</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Views and engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={finalTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="engagement" stroke="hsl(var(--success))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platformData.map((platform) => (
                <Card key={platform.platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {platform.platform}
                      {platform.url && (
                        <a href={platform.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Views:</span>
                        <span className="font-medium">{platform.views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Engagement:</span>
                        <span className="font-medium">{platform.engagement.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rate:</span>
                        <span className="font-medium">{platform.rate}%</span>
                      </div>
                      {platform.videoCount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Videos:</span>
                          <span className="font-medium">{platform.videoCount}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Comparison</CardTitle>
                <CardDescription>Views and engagement by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" />
                    <Bar dataKey="engagement" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate Timeline</CardTitle>
                <CardDescription>How engagement rate has changed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={finalTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="engagementRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
                <CardDescription>Detailed day-by-day breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {finalTimelineData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{format(new Date(day.date), 'MMMM d, yyyy')}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.views.toLocaleString()} views • {day.engagement.toLocaleString()} engagement
                        </p>
                      </div>
                      <Badge variant="outline">{day.engagementRate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}