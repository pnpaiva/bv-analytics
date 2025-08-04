import { useState } from 'react';
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
import { Eye, Heart, Share2, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CampaignAnalyticsModalProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate realistic timeline data from campaign based on actual video data
const generateTimelineData = (campaign: Campaign) => {
  if (!campaign.analytics_data) return [];
  
  const analyticsData = campaign.analytics_data as any;
  const allVideos: Array<{url: string, views: number, engagement: number, platform: string}> = [];
  
  // Collect all videos from all platforms
  if (analyticsData.youtube?.length > 0) {
    analyticsData.youtube.forEach((video: any) => {
      allVideos.push({
        url: video.url,
        views: video.views || 0,
        engagement: video.engagement || 0,
        platform: 'YouTube'
      });
    });
  }
  
  if (analyticsData.instagram?.length > 0) {
    analyticsData.instagram.forEach((video: any) => {
      allVideos.push({
        url: video.url,
        views: video.views || 0,
        engagement: video.engagement || 0,
        platform: 'Instagram'
      });
    });
  }
  
  if (analyticsData.tiktok?.length > 0) {
    analyticsData.tiktok.forEach((video: any) => {
      allVideos.push({
        url: video.url,
        views: video.views || 0,
        engagement: video.engagement || 0,
        platform: 'TikTok'
      });
    });
  }
  
  if (allVideos.length === 0) return [];
  
  // Create timeline based on video release simulation
  const baseDate = new Date(campaign.campaign_date);
  const timelineData = [];
  
  // Simulate videos being released over time
  const totalVideos = allVideos.length;
  const daysToSpread = Math.min(totalVideos, 7); // Spread over up to 7 days
  
  for (let i = 0; i < daysToSpread; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    // Calculate how many videos would be "released" by this day
    const videosReleased = Math.ceil((i + 1) * totalVideos / daysToSpread);
    const videosToInclude = allVideos.slice(0, videosReleased);
    
    const views = videosToInclude.reduce((sum, v) => sum + v.views, 0);
    const engagement = videosToInclude.reduce((sum, v) => sum + v.engagement, 0);
    const engagementRate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;
    
    timelineData.push({
      date: date.toISOString().split('T')[0],
      views,
      engagement,
      engagementRate,
      videosCount: videosReleased
    });
  }
  
  return timelineData;
};

// Helper function to get platform data with all videos
const getPlatformDataStatic = (campaign: Campaign) => {
  if (!campaign.analytics_data) return [];
  
  const platforms = [];
  const analyticsData = campaign.analytics_data as any;
  
  // YouTube - aggregate all videos
  if (analyticsData.youtube?.length > 0) {
    const totalViews = analyticsData.youtube.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
    const totalEngagement = analyticsData.youtube.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
    const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
    
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
    const totalViews = analyticsData.instagram.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
    const totalEngagement = analyticsData.instagram.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
    const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
    
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
    const totalViews = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
    const totalEngagement = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
    const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
    
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

  if (!campaign) return null;

  // Extract real platform data from campaign analytics (aggregating all videos)
  const getPlatformData = () => {
    if (!campaign.analytics_data) return [];
    
    const platforms = [];
    const analyticsData = campaign.analytics_data as any;
    
    // YouTube - aggregate all videos
    if (analyticsData.youtube?.length > 0) {
      const totalViews = analyticsData.youtube.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
      const totalEngagement = analyticsData.youtube.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
      const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
      
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
      const totalViews = analyticsData.instagram.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
      const totalEngagement = analyticsData.instagram.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
      const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
      
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
      const totalViews = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
      const totalEngagement = analyticsData.tiktok.reduce((sum: number, video: any) => sum + (video.engagement || 0), 0);
      const avgRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
      
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

  const platformData = getPlatformData();
  const timelineData = generateTimelineData(campaign);

  const handleExport = () => {
    const data = {
      campaign: campaign.brand_name,
      totalViews: campaign.total_views,
      totalEngagement: campaign.total_engagement,
      engagementRate: campaign.engagement_rate,
      platforms: platformData,
      timeline: timelineData,
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
                  <div className="text-2xl font-bold">{campaign.total_views.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.total_engagement.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+8% from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.engagement_rate.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">+0.5% from last week</p>
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
                  <LineChart data={timelineData}>
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
                  <LineChart data={timelineData}>
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
                  {timelineData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{format(new Date(day.date), 'MMMM d, yyyy')}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.views.toLocaleString()} views • {day.engagement.toLocaleString()} engagement
                          {day.videosCount && ` • ${day.videosCount} videos`}
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