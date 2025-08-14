import React, { useState, useMemo } from 'react';
import { useCreators } from '@/hooks/useCreators';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Eye, TrendingUp, Play, Search, ExternalLink } from 'lucide-react';

interface CreatorProfile {
  id: string;
  name: string;
  avatar_url?: string;
  platform_handles?: Record<string, string>;
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  platformBreakdown: {
    platform: string;
    views: number;
    engagement: number;
    engagementRate: number;
  }[];
  brandCollaborations: {
    brandName: string;
    logoUrl?: string;
    views: number;
    engagement: number;
    date: string;
  }[];
  topVideos: {
    title: string;
    platform: string;
    views: number;
    engagement: number;
    url: string;
    thumbnail?: string;
  }[];
}

export default function CreatorProfiles() {
  const { data: creators = [] } = useCreators();
  const { data: campaigns = [] } = useCampaigns();
  const { data: campaignCreators = [] } = useCampaignCreators();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  // Build creator profiles with analytics
  const creatorProfiles = useMemo((): CreatorProfile[] => {
    return creators.map(creator => {
      const creatorCampaigns = campaignCreators
        .filter(cc => cc.creator_id === creator.id)
        .map(cc => campaigns.find(c => c.id === cc.campaign_id))
        .filter(Boolean);

      let totalViews = 0;
      let totalEngagement = 0;
      const platformMetrics: Record<string, { views: number; engagement: number }> = {};
      const brandCollaborations: CreatorProfile['brandCollaborations'] = [];
      const allVideos: CreatorProfile['topVideos'] = [];

      creatorCampaigns.forEach(campaign => {
        if (!campaign) return;

        // Add brand collaboration
        brandCollaborations.push({
          brandName: campaign.brand_name,
          logoUrl: campaign.logo_url,
          views: campaign.total_views || 0,
          engagement: campaign.total_engagement || 0,
          date: campaign.campaign_date
        });

        // Process analytics data
        if (campaign.analytics_data) {
          Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
            if (!platformMetrics[platform]) {
              platformMetrics[platform] = { views: 0, engagement: 0 };
            }

            if (Array.isArray(platformData)) {
              platformData.forEach((video: any) => {
                const views = video.views || 0;
                const engagement = video.engagement || 0;
                
                totalViews += views;
                totalEngagement += engagement;
                platformMetrics[platform].views += views;
                platformMetrics[platform].engagement += engagement;

                // Add to videos list
                allVideos.push({
                  title: video.title || `${platform} Video`,
                  platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                  views,
                  engagement,
                  url: video.url || '',
                  thumbnail: video.thumbnail
                });
              });
            }
          });
        } else {
          // Fallback to campaign totals
          totalViews += campaign.total_views || 0;
          totalEngagement += campaign.total_engagement || 0;
        }
      });

      const platformBreakdown = Object.entries(platformMetrics).map(([platform, metrics]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        views: metrics.views,
        engagement: metrics.engagement,
        engagementRate: metrics.views > 0 ? (metrics.engagement / metrics.views) * 100 : 0
      }));

      const topVideos = allVideos
        .sort((a, b) => b.views - a.views)
        .slice(0, 3);

      return {
        id: creator.id,
        name: creator.name,
        avatar_url: creator.avatar_url,
        platform_handles: creator.platform_handles,
        totalViews,
        totalEngagement,
        engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
        platformBreakdown,
        brandCollaborations: brandCollaborations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        topVideos
      };
    });
  }, [creators, campaigns, campaignCreators]);

  // Filter creators
  const filteredCreators = useMemo(() => {
    return creatorProfiles.filter(creator =>
      creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [creatorProfiles, searchTerm]);

  const selectedCreatorProfile = useMemo(() => {
    return filteredCreators.find(creator => creator.id === selectedCreator);
  }, [filteredCreators, selectedCreator]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Creator Profiles</h1>
            <p className="text-muted-foreground mt-2">Comprehensive performance overview of your creators</p>
          </div>
          
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creators ({filteredCreators.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredCreators.map(creator => (
                  <div
                    key={creator.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCreator === creator.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCreator(creator.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback>
                          {creator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{creator.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(creator.totalViews)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {creator.engagementRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Creator Details */}
          <div className="lg:col-span-2">
            {selectedCreatorProfile ? (
              <div className="space-y-6">
                {/* Creator Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={selectedCreatorProfile.avatar_url} />
                        <AvatarFallback className="text-xl">
                          {selectedCreatorProfile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-foreground">{selectedCreatorProfile.name}</h2>
                        <div className="flex gap-4 mt-2">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{formatNumber(selectedCreatorProfile.totalViews)}</div>
                            <div className="text-sm text-muted-foreground">Total Views</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-brand-accent-green">{formatNumber(selectedCreatorProfile.totalEngagement)}</div>
                            <div className="text-sm text-muted-foreground">Total Engagement</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-teal">{selectedCreatorProfile.engagementRate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Engagement Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Platform Handles */}
                    {selectedCreatorProfile.platform_handles && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(selectedCreatorProfile.platform_handles).map(([platform, handle]) => (
                          <Badge key={platform} variant="secondary" className="gap-1">
                            {platform}: {handle}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="performance" className="w-full">
                  <TabsList>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="brands">Brand Collaborations</TabsTrigger>
                    <TabsTrigger value="content">Top Content</TabsTrigger>
                  </TabsList>

                  <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCreatorProfile.platformBreakdown.map(platform => (
                        <Card key={platform.platform}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{platform.platform}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Views</span>
                                <span className="font-semibold">{formatNumber(platform.views)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Engagement</span>
                                <span className="font-semibold">{formatNumber(platform.engagement)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Rate</span>
                                <span className="font-semibold text-primary">{platform.engagementRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="brands" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCreatorProfile.brandCollaborations.map((brand, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-3">
                              {brand.logoUrl && (
                                <img src={brand.logoUrl} alt={brand.brandName} className="h-10 w-10 rounded object-cover" />
                              )}
                              <div>
                                <h4 className="font-semibold text-foreground">{brand.brandName}</h4>
                                <p className="text-sm text-muted-foreground">{new Date(brand.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Views: </span>
                                <span className="font-semibold">{formatNumber(brand.views)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Engagement: </span>
                                <span className="font-semibold">{formatNumber(brand.engagement)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {selectedCreatorProfile.topVideos.map((video, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-28 bg-muted rounded flex items-center justify-center">
                                {video.thumbnail ? (
                                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover rounded" />
                                ) : (
                                  <Play className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground truncate">{video.title}</h4>
                                  <Badge variant="outline">{video.platform}</Badge>
                                </div>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                  <span>{formatNumber(video.views)} views</span>
                                  <span>{formatNumber(video.engagement)} engagement</span>
                                  <span>{video.views > 0 ? ((video.engagement / video.views) * 100).toFixed(1) : 0}% rate</span>
                                </div>
                              </div>
                              
                              {video.url && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent>
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a creator to view their profile</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}