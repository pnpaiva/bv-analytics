import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Users, Eye, ThumbsUp, MessageSquare, ExternalLink, Share2, MapPin, Mail, Phone, User, Award, Play } from 'lucide-react';
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

  const getVideoThumbnail = (url: string, platform: string) => {
    if (platform.toLowerCase() === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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

        {/* Creator Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Creator Info & Demographics */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mediaKit.avatar_url} />
                    <AvatarFallback className="text-2xl font-bold">
                      {mediaKit.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{mediaKit.name}</h2>
                    <p className="text-muted-foreground mb-2">Content Creator</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        United States
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        creator@example.com
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        +1 (555) 123-4567
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demographics Audience */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Tabs */}
                <div className="flex gap-2">
                  <Button variant="default" size="sm">Youtube</Button>
                  <Button variant="outline" size="sm">Instagram</Button>
                  <Button variant="outline" size="sm">Tiktok</Button>
                </div>

                {/* Gender */}
                <div>
                  <h4 className="font-semibold mb-3">Gender</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">75% Women</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">25% Men</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <h4 className="font-semibold mb-3">Age</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">15-24</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">25-35</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">36-45</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="font-semibold mb-3">Location</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">United States</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">United Kingdom</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Canada</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Australia</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services & Previous Collabs */}
          <div className="space-y-6">
            {/* Services & Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Services & Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Reel/Video Post</span>
                    <span className="text-2xl font-bold text-primary">$450</span>
                  </div>
                </div>
                <div className="p-4 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Stories</span>
                    <span className="text-2xl font-bold text-primary">$200</span>
                  </div>
                </div>
                <div className="p-4 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Product Reviews</span>
                    <span className="text-2xl font-bold text-primary">$600</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Collaborations */}
            <Card>
              <CardHeader>
                <CardTitle>Previous Collaborations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">O</span>
                    </div>
                    <span className="font-medium">Opera (Eda-Julho)</span>
                  </div>
                  <div className="text-sm text-muted-foreground">7/28/2025</div>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Views: </span>
                      <span className="font-medium">37.9K</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement: </span>
                      <span className="font-medium">10.9%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-2 border-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">O</span>
                    </div>
                    <span className="font-medium">Opera (Eda-Junho)</span>
                  </div>
                  <div className="text-sm text-muted-foreground">6/26/2025</div>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Views: </span>
                      <span className="font-medium">89.5K</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement: </span>
                      <span className="font-medium">9.9%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Performance Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">108.3K</div>
              <div className="text-sm text-muted-foreground">Total Followers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">2.2M</div>
              <div className="text-sm text-muted-foreground">Average Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">2.2M</div>
              <div className="text-sm text-muted-foreground">Average Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">6.4%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Collaborations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Brand Collaborations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample brand collaborations */}
              <div className="p-4 border-2 border-muted rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">O</span>
                  </div>
                  <div>
                    <div className="font-medium">Opera (Eda-Julho)</div>
                    <div className="text-sm text-muted-foreground">7/28/2025</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <div className="font-medium">37.9K</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagement:</span>
                    <div className="font-medium">10.9%</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-muted rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">O</span>
                  </div>
                  <div>
                    <div className="font-medium">Opera (Eda-Junho)</div>
                    <div className="text-sm text-muted-foreground">6/26/2025</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <div className="font-medium">89.5K</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagement:</span>
                    <div className="font-medium">9.9%</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-muted rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <div className="font-medium">Saily (Eda Atilla)</div>
                    <div className="text-sm text-muted-foreground">1/11/2025</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <div className="font-medium">139.9K</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagement:</span>
                    <div className="font-medium">8.5%</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                       <div className="aspect-video bg-muted rounded mb-3 overflow-hidden border-2 relative group cursor-pointer">
                         {getVideoThumbnail(video.url, video.platform) ? (
                           <>
                             <img
                               src={getVideoThumbnail(video.url, video.platform)!}
                               alt={video.title}
                               className="absolute inset-0 w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTUgNjVMMTc1IDgwTDE1NSA5NVY2NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                               }}
                             />
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                               <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                 <Play className="h-6 w-6 text-white fill-white ml-1" />
                               </div>
                             </div>
                           </>
                         ) : (
                           <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
                             <div className="text-center">
                               <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                 <Play className="h-6 w-6 text-primary" />
                               </div>
                               <p className="text-sm text-muted-foreground">{video.platform} Video</p>
                             </div>
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