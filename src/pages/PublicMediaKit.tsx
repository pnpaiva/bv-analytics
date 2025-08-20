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

interface CreatorProfile {
  id: string;
  name: string;
  avatar_url?: string;
  platform_handles?: Record<string, string>;
  location?: string;
  email?: string;
  phone?: string;
  bio?: string;
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  followerCount: number;
  demographics: {
    [platform: string]: {
      gender: { female: number; male: number };
      age: { '18-24': number; '25-34': number; '35-44': number; '45-54': number; '55+': number };
      location: { [country: string]: number };
    };
  };
  platformBreakdown: {
    platform: string;
    views: number;
    engagement: number;
    engagementRate: number;
    followerCount: number;
  }[];
  brandCollaborations: {
    brandName: string;
    logoUrl?: string;
    views: number;
    engagement: number;
    engagementRate: number;
    date: string;
  }[];
  topVideos: {
    title: string;
    platform: string;
    views: number;
    engagement: number;
    engagementRate: number;
    url: string;
    thumbnail?: string;
    description?: string;
  }[];
  services: {
    name: string;
    price: number;
  }[];
}

const PublicMediaKit = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaKit, setMediaKit] = useState<PublicMediaKit | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [currentCollaborationPage, setCurrentCollaborationPage] = useState(1);
  const collaborationsPerPage = 6;

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

        // Get creator data if creator_id exists
        if (mediaKitData.creator_id) {
          // Get creator details
          const { data: creator, error: creatorError } = await supabase
            .from('creators')
            .select('*')
            .eq('id', mediaKitData.creator_id)
            .single();

          if (creatorError) throw creatorError;

          // Get campaign data for this creator through campaign_creators
          const { data: campaignCreators, error: campaignCreatorsError } = await supabase
            .from('campaign_creators')
            .select(`
              campaign_id,
              campaigns (
                id,
                brand_name,
                logo_url,
                campaign_date,
                total_views,
                total_engagement,
                analytics_data
              )
            `)
            .eq('creator_id', mediaKitData.creator_id);

          if (campaignCreatorsError) throw campaignCreatorsError;

          // Process creator data similar to CreatorProfiles
          let totalViews = 0;
          let totalEngagement = 0;
          let totalFollowers = 0;
          const platformMetrics: Record<string, { views: number; engagement: number; followers: number }> = {};
          const brandCollaborations: CreatorProfile['brandCollaborations'] = [];
          const allVideos: CreatorProfile['topVideos'] = [];

          campaignCreators?.forEach(cc => {
            const campaign = cc.campaigns;
            if (!campaign) return;

            const campaignViews = campaign.total_views || 0;
            const campaignEngagement = campaign.total_engagement || 0;
            const campaignEngagementRate = campaignViews > 0 ? (campaignEngagement / campaignViews) * 100 : 0;

            // Add brand collaboration
            brandCollaborations.push({
              brandName: campaign.brand_name,
              logoUrl: campaign.logo_url,
              views: campaignViews,
              engagement: campaignEngagement,
              engagementRate: campaignEngagementRate,
              date: campaign.campaign_date
            });

            // Process analytics data
            if (campaign.analytics_data) {
              Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
                if (!platformMetrics[platform]) {
                  platformMetrics[platform] = { views: 0, engagement: 0, followers: 0 };
                }

                if (Array.isArray(platformData)) {
                  platformData.forEach((video: any) => {
                    const views = video.views || 0;
                    const engagement = video.engagement || 0;
                    const engagementRate = views > 0 ? (engagement / views) * 100 : 0;
                    
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
                      engagementRate,
                      url: video.url || '',
                      thumbnail: video.thumbnail,
                      description: video.description || ''
                    });
                  });
                }
              });
            } else {
              // Fallback to campaign totals
              totalViews += campaignViews;
              totalEngagement += campaignEngagement;
            }
          });

          // Estimate follower count based on performance (simplified calculation)
          totalFollowers = Math.round(totalViews * 0.05); // Estimate 5% of views as followers

          const platformBreakdown = Object.entries(platformMetrics).map(([platform, metrics]) => ({
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            views: metrics.views,
            engagement: metrics.engagement,
            engagementRate: metrics.views > 0 ? (metrics.engagement / metrics.views) * 100 : 0,
            followerCount: Math.round(metrics.views * 0.05)
          }));

          const topVideos = allVideos
            .sort((a, b) => b.views - a.views)
            .slice(0, 3);

          // Mock demographics data (in real app would come from analytics)
          const demographics = {
            youtube: {
              gender: { female: 75, male: 25 },
              age: { '18-24': 40, '25-34': 35, '35-44': 15, '45-54': 8, '55+': 2 },
              location: { 'United States': 40, 'United Kingdom': 25, 'Canada': 20, 'Australia': 15 }
            },
            instagram: {
              gender: { female: 60, male: 40 },
              age: { '18-24': 30, '25-34': 40, '35-44': 20, '45-54': 8, '55+': 2 },
              location: { 'United States': 30, 'United Kingdom': 20, 'Canada': 25, 'Australia': 25 }
            },
            tiktok: {
              gender: { female: 80, male: 20 },
              age: { '18-24': 50, '25-34': 30, '35-44': 15, '45-54': 5, '55+': 0 },
              location: { 'United States': 50, 'United Kingdom': 20, 'Canada': 15, 'Australia': 15 }
            }
          };

          // Mock services data
          const services = [
            { name: 'Reel/Video Post', price: 450 },
            { name: 'Stories', price: 200 },
            { name: 'Product Reviews', price: 600 }
          ];

          const creatorProfileData: CreatorProfile = {
            id: creator.id,
            name: creator.name,
            avatar_url: creator.avatar_url,
            platform_handles: creator.platform_handles as Record<string, string> || {},
            location: 'United States',
            email: 'creator@example.com',
            phone: '+1 (555) 123-4567',
            bio: 'Content Creator',
            totalViews,
            totalEngagement,
            engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
            followerCount: totalFollowers,
            demographics,
            platformBreakdown,
            brandCollaborations: brandCollaborations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            topVideos,
            services
          };

          setCreatorProfile(creatorProfileData);
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

  const getEmbedUrl = (url: string, platform: string) => {
    if (!url || url.trim() === '') return null;
    
    const platformLower = platform.toLowerCase();
    
    if (platformLower === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
      }
    }
    
    if (platformLower === 'instagram') {
      // Handle Instagram reel/post URLs
      const instagramMatch = url.match(/(?:instagram\.com\/(?:p|reel)\/([^\/\?]+))/);
      if (instagramMatch) {
        return `https://www.instagram.com/p/${instagramMatch[1]}/embed/captioned/?cr=1&v=14&wp=540&rd=https://app.beyond-views.com`;
      }
    }
    
    if (platformLower === 'tiktok') {
      // Handle TikTok URLs - try multiple patterns
      let tiktokId = null;
      
      // Pattern 1: tiktok.com/@username/video/1234567890
      const tiktokMatch1 = url.match(/(?:tiktok\.com\/@[^\/]+\/video\/(\d+))/);
      if (tiktokMatch1) {
        tiktokId = tiktokMatch1[1];
      }
      
      // Pattern 2: vm.tiktok.com/1234567890
      if (!tiktokId) {
        const tiktokMatch2 = url.match(/(?:vm\.tiktok\.com\/(\w+))/);
        if (tiktokMatch2) {
          tiktokId = tiktokMatch2[1];
        }
      }
      
      if (tiktokId) {
        return `https://www.tiktok.com/embed/v2/${tiktokId}`;
      }
    }
    
    return null;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Media kit link copied to clipboard!');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  if (!mediaKit || !creatorProfile) {
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
      {/* Creator Header - Matching Reference Layout */}
      <Card className="border-2 m-8">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative mb-6">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={creatorProfile.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-muted">
                    {creatorProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">{creatorProfile.name}</h1>
                <p className="text-lg text-muted-foreground mb-4">Content Creator Media Kit</p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <MapPin className="h-4 w-4" />
                    <span>{creatorProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <Mail className="h-4 w-4" />
                    <span>{creatorProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <Phone className="h-4 w-4" />
                    <span>{creatorProfile.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Demographics & Audience */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Demographics Audience</h3>
              
              {/* Platform Selection */}
              <div className="flex gap-2 mb-4">
                {(['youtube', 'instagram', 'tiktok'] as const).map((platform) => (
                  <Button
                    key={platform}
                    variant={selectedPlatform === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatform(platform)}
                    className="capitalize"
                  >
                    {platform}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Gender</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      <span className="text-2xl font-bold">{creatorProfile.demographics[selectedPlatform]?.gender.female}%</span>
                      <span className="text-sm text-muted-foreground">Women</span>
                    </div>
                                          <div className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <span className="text-2xl font-bold">{creatorProfile.demographics[selectedPlatform]?.gender.male}%</span>
                        <span className="text-sm text-muted-foreground">Men</span>
                      </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Age</h4>
                  <div className="space-y-2">
                    {Object.entries(creatorProfile.demographics[selectedPlatform]?.age).map(([range, percentage]) => (
                      <div key={range} className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">{range}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="space-y-2">
                    {Object.entries(creatorProfile.demographics[selectedPlatform]?.location).map(([country, percentage]) => (
                      <div key={country} className="flex items-center gap-3">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">{country}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Services & Rates */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services & Rates</h3>
              <div className="space-y-3">
                {creatorProfile.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border-2 rounded-lg">
                    <span className="font-medium">{service.name}</span>
                    <span className="font-bold text-primary">${service.price}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <h4 className="font-medium mb-3">Previous Collaborations</h4>
              <div className="space-y-2">
                {creatorProfile.brandCollaborations.slice(0, 4).map((brand, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border-2 rounded">
                    {brand.logoUrl ? (
                      <div className="h-8 w-8 rounded overflow-hidden bg-white p-1">
                        <img 
                          src={brand.logoUrl} 
                          alt={brand.brandName} 
                          className="h-full w-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{brand.brandName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="container mx-auto px-8 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{formatNumber(creatorProfile.followerCount)}</div>
              <div className="text-sm text-muted-foreground">Total Followers</div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-emerald-500 mb-2">{formatNumber(creatorProfile.totalViews)}</div>
              <div className="text-sm text-muted-foreground">Average Views</div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-amber-500 mb-2">{formatNumber(creatorProfile.totalViews)}</div>
              <div className="text-sm text-muted-foreground">Average Views</div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-rose-500 mb-2">{creatorProfile.engagementRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brand Collaborations */}
      <div className="container mx-auto px-8 mb-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Brand Collaborations
              </div>
              {creatorProfile.brandCollaborations.length > collaborationsPerPage && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCollaborationPage(prev => Math.max(1, prev - 1))}
                    disabled={currentCollaborationPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentCollaborationPage} of {Math.ceil(creatorProfile.brandCollaborations.length / collaborationsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCollaborationPage(prev => 
                      Math.min(Math.ceil(creatorProfile.brandCollaborations.length / collaborationsPerPage), prev + 1)
                    )}
                    disabled={currentCollaborationPage >= Math.ceil(creatorProfile.brandCollaborations.length / collaborationsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatorProfile.brandCollaborations
                .slice((currentCollaborationPage - 1) * collaborationsPerPage, currentCollaborationPage * collaborationsPerPage)
                .map((brand, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {brand.logoUrl ? (
                        <div className="h-12 w-12 rounded bg-white border-2 p-1 flex items-center justify-center overflow-hidden">
                          <img 
                            src={brand.logoUrl} 
                            alt={brand.brandName} 
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center border-2">
                          <Award className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{brand.brandName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {brand.date}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Views:</span>
                        <div className="font-semibold">{formatNumber(brand.views)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement:</span>
                        <div className="font-semibold text-primary">{brand.engagementRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Content */}
      <div className="container mx-auto px-8 mb-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {creatorProfile.topVideos.map((video, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-4 pb-6">
                    <div className="bg-muted rounded mb-3 overflow-hidden border-2 relative group" style={{ minHeight: '400px' }}>
                      {getEmbedUrl(video.url, video.platform) ? (
                        <div className="w-full h-full">
                          <iframe
                            src={getEmbedUrl(video.url, video.platform)!}
                            title={video.title}
                            className="w-full h-full rounded"
                            style={{ 
                              border: 'none',
                              minHeight: '400px',
                              width: '100%'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            frameBorder="0"
                          />
                        </div>
                      ) : video.thumbnail ? (
                        <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-full h-full object-cover rounded"
                            style={{ minHeight: '400px' }}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTUgNjVMMTc1IDgwTDE1NSA5NVY2NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="h-6 w-6 text-white fill-white ml-1" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded" style={{ minHeight: '400px' }}>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">{video.title}</h4>
                        <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Views:</span>
                          <div className="font-semibold">{formatNumber(video.views)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Engagement:</span>
                          <div className="font-semibold text-primary">{video.engagementRate.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicMediaKit;