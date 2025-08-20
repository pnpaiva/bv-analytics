import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Users, Eye, ThumbsUp, MessageSquare, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PublicMediaKit {
  id: string;
  slug: string;
  name: string;  
  avatar_url?: string;
  platform_handles?: any;
}

interface CreatorStats {
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  campaignCount: number;
  topVideos: Array<{
    title: string;
    url: string;
    platform: string;
    views: number;
    engagement: number;
    thumbnail?: string;
  }>;
}

const PublicMediaKit = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaKit, setMediaKit] = useState<PublicMediaKit | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMediaKitData = async () => {
      if (!slug) return;

      try {
        // Get public media kit by slug
        const { data: mediaKitData, error: mediaKitError } = await supabase
          .from('public_media_kits')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (mediaKitError) throw mediaKitError;
        if (!mediaKitData) throw new Error('Media kit not found');

        setMediaKit(mediaKitData);

        // Get stats if creator_id exists
        if (mediaKitData.creator_id) {
          // Get campaign data for this creator
          const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('creator_id', mediaKitData.creator_id);

          if (campaignsError) {
            console.warn('Failed to load campaign stats:', campaignsError);
          }

          // Calculate stats from campaigns
          let totalViews = 0;
          let totalEngagement = 0;
          let campaignCount = campaigns?.length || 0;
          const topVideos: CreatorStats['topVideos'] = [];

          campaigns?.forEach(campaign => {
            totalViews += campaign.total_views || 0;
            totalEngagement += campaign.total_engagement || 0;

            // Extract videos from analytics_data
            if (campaign.analytics_data) {
              Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
                if (Array.isArray(platformData)) {
                  platformData.forEach((video: any) => {
                    if (video.url) {
                      topVideos.push({
                        title: video.title || `${platform} Content`,
                        url: video.url,
                        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                        views: video.views || 0,
                        engagement: video.engagement || 0,
                        thumbnail: video.thumbnail
                      });
                    }
                  });
                }
              });
            }
          });

          // Sort and limit top videos
          const sortedVideos = topVideos
            .sort((a, b) => b.views - a.views)
            .slice(0, 6);

          setStats({
            totalViews,
            totalEngagement,
            avgEngagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
            campaignCount,
            topVideos: sortedVideos
          });
        } else {
          // No creator_id, show empty stats
          setStats({
            totalViews: 0,
            totalEngagement: 0,
            avgEngagementRate: 0,
            campaignCount: 0,
            topVideos: []
          });
        }

      } catch (error) {
        console.error('Error fetching media kit data:', error);
        toast.error('Media kit not found');
      } finally {
        setLoading(false);
      }
    };

    fetchMediaKitData();
  }, [slug]);

  const getEmbedUrl = (url: string, platform: string) => {
    if (!url) return null;
    
    if (platform === 'youtube') {
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
    }
    
    if (platform === 'instagram') {
      const instagramMatch = url.match(/(?:instagram\.com\/(?:p|reel)\/([^\/\?]+))/);
      if (instagramMatch) {
        return `https://www.instagram.com/p/${instagramMatch[1]}/embed/captioned/`;
      }
    }
    
    if (platform === 'tiktok') {
      const tiktokMatch = url.match(/(?:tiktok\.com\/.*\/video\/(\d+))/);
      if (tiktokMatch) {
        return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
      }
    }
    
    return null;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Media kit link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!mediaKit || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Creator Not Found</h1>
          <p className="text-muted-foreground">The requested creator profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={mediaKit.avatar_url} />
                <AvatarFallback className="text-xl font-bold">
                  {mediaKit.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{mediaKit.name}</h1>
                <p className="text-muted-foreground">Content Creator Media Kit</p>
              </div>
            </div>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ThumbsUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                  <p className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg Engagement Rate</p>
                  <p className="text-2xl font-bold">{stats.avgEngagementRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{stats.campaignCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Handles */}
        {mediaKit.platform_handles && Object.keys(mediaKit.platform_handles).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Social Media Handles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(mediaKit.platform_handles).map(([platform, handle]) => (
                  <Badge key={platform} variant="secondary" className="text-sm">
                    {platform}: {String(handle)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Content */}
        {stats.topVideos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.topVideos.map((video, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-3 overflow-hidden border-2 relative">
                        {getEmbedUrl(video.url, video.platform) ? (
                          <iframe
                            src={getEmbedUrl(video.url, video.platform)!}
                            title={video.title}
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                              border: 'none',
                              minHeight: '250px'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {video.platform}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {video.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {video.engagement.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicMediaKit;