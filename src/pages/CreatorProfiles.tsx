import React, { useState, useMemo } from 'react';
import { useCreators } from '@/hooks/useCreators';
import { useUpdateCreator } from '@/hooks/useManageCreators';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Users, Eye, TrendingUp, Search, User, Calendar, Target, Award, MapPin, Phone, Mail, Edit, Share, Plus, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
    platform: 'youtube' | 'instagram' | 'tiktok';
    gender: { female: number; male: number };
    age: { '15-24': number; '25-35': number; '36-45': number };
    location: { [country: string]: number };
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
  mediaKitUrl?: string;
}

export default function CreatorProfiles() {
  const { data: creators = [] } = useCreators();
  const { data: campaigns = [] } = useCampaigns();
  const { data: campaignCreators = [] } = useCampaignCreators();
  const updateCreator = useUpdateCreator();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [editingCreator, setEditingCreator] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');

  // Build creator profiles with analytics
  const creatorProfiles = useMemo((): CreatorProfile[] => {
    return creators.map(creator => {
      const creatorCampaigns = campaignCreators
        .filter(cc => cc.creator_id === creator.id)
        .map(cc => campaigns.find(c => c.id === cc.campaign_id))
        .filter(Boolean);

      let totalViews = 0;
      let totalEngagement = 0;
      let totalFollowers = 0;
      const platformMetrics: Record<string, { views: number; engagement: number; followers: number }> = {};
      const brandCollaborations: CreatorProfile['brandCollaborations'] = [];
      const allVideos: CreatorProfile['topVideos'] = [];

      creatorCampaigns.forEach(campaign => {
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
        platform: 'youtube' as const,
        gender: { female: 75, male: 25 },
        age: { '15-24': 45, '25-35': 35, '36-45': 20 },
        location: { 'United States': 40, 'United Kingdom': 25, 'Canada': 20, 'Australia': 15 }
      };

      // Mock services data
      const services = [
        { name: 'Reel/Video Post', price: 450 },
        { name: 'Stories', price: 200 },
        { name: 'Product Reviews', price: 600 }
      ];

      return {
        id: creator.id,
        name: creator.name,
        avatar_url: creator.avatar_url,
        platform_handles: creator.platform_handles,
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
        services,
        mediaKitUrl: `${window.location.origin}/media-kit/${creator.id}`
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

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform.toLowerCase() === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  };

  const handleCreatorUpdate = async (creatorId: string, updates: any) => {
    try {
      await updateCreator.mutateAsync({
        id: creatorId,
        ...updates
      });
      toast.success('Creator updated successfully');
      setEditingCreator(null);
    } catch (error) {
      toast.error('Failed to update creator');
    }
  };

  const generateMediaKit = (creatorId: string) => {
    const mediaKitUrl = `${window.location.origin}/media-kit/${creatorId}`;
    navigator.clipboard.writeText(mediaKitUrl);
    toast.success('Media kit link copied to clipboard!');
  };

  const EditCreatorDialog = ({ creator }: { creator: CreatorProfile }) => {
    const [formData, setFormData] = useState({
      name: creator.name,
      avatar_url: creator.avatar_url || '',
      location: creator.location || '',
      email: creator.email || '',
      phone: creator.phone || '',
      bio: creator.bio || '',
      platform_handles: creator.platform_handles || {}
    });

    return (
      <Dialog open={editingCreator === creator.id} onOpenChange={() => setEditingCreator(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Creator Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>
            
            <div>
              <ImageUpload
                value={formData.avatar_url}
                onValueChange={(url) => setFormData({ ...formData, avatar_url: url })}
                label="Profile Picture"
                bucketName="avatars"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCreator(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreatorUpdate(creator.id, formData)}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
          
          {selectedCreatorProfile && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingCreator(selectedCreatorProfile.id)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              
              <Button
                onClick={() => generateMediaKit(selectedCreatorProfile.id)}
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Share Media Kit
              </Button>
            </div>
          )}
          
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Creator List */}
          <div className="lg:col-span-1">
            <Card className="border-2">
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedCreator === creator.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCreator(creator.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback className="bg-muted">
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
          <div className="lg:col-span-3">
            {selectedCreatorProfile ? (
              <div className="space-y-6">
                {/* Creator Header - Matching Reference Layout */}
                <Card className="border-2">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Section */}
                      <div className="flex flex-col items-center lg:items-start">
                        <div className="relative mb-6">
                          <Avatar className="h-32 w-32 border-4 border-primary/20">
                            <AvatarImage src={selectedCreatorProfile.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-2xl bg-muted">
                              {selectedCreatorProfile.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="text-center lg:text-left">
                          <h1 className="text-3xl font-bold text-foreground mb-2">{selectedCreatorProfile.name}</h1>
                          <p className="text-lg text-muted-foreground mb-4">Content Creator</p>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                              <MapPin className="h-4 w-4" />
                              <span>{selectedCreatorProfile.location}</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                              <Mail className="h-4 w-4" />
                              <span>{selectedCreatorProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                              <Phone className="h-4 w-4" />
                              <span>{selectedCreatorProfile.phone}</span>
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
                                <span className="text-2xl font-bold">{selectedCreatorProfile.demographics.gender.female}%</span>
                                <span className="text-sm text-muted-foreground">Women</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4" />
                                <span className="text-2xl font-bold">{selectedCreatorProfile.demographics.gender.male}%</span>
                                <span className="text-sm text-muted-foreground">Men</span>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-medium mb-2">Age</h4>
                            <div className="space-y-2">
                              {Object.entries(selectedCreatorProfile.demographics.age).map(([range, percentage]) => (
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
                              {Object.entries(selectedCreatorProfile.demographics.location).map(([country, percentage]) => (
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
                          {selectedCreatorProfile.services.map((service, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border-2 rounded-lg">
                              <span className="font-medium">{service.name}</span>
                              <span className="font-bold text-primary">${service.price}</span>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-4" />

                        <h4 className="font-medium mb-3">Previous Collaborations</h4>
                        <div className="space-y-2">
                          {selectedCreatorProfile.brandCollaborations.slice(0, 4).map((brand, index) => (
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{formatNumber(selectedCreatorProfile.followerCount)}</div>
                      <div className="text-sm text-muted-foreground">Total Followers</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-emerald-500 mb-2">{formatNumber(selectedCreatorProfile.totalViews)}</div>
                      <div className="text-sm text-muted-foreground">Average Views</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-amber-500 mb-2">{formatNumber(selectedCreatorProfile.totalViews)}</div>
                      <div className="text-sm text-muted-foreground">Average Views</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-rose-500 mb-2">{selectedCreatorProfile.engagementRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Brand Collaborations */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Brand Collaborations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCreatorProfile.brandCollaborations.map((brand, index) => (
                        <Card key={index} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              {brand.logoUrl ? (
                                <img src={brand.logoUrl} alt={brand.brandName} className="h-12 w-12 rounded object-cover border-2" />
                              ) : (
                                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center border-2">
                                  <Award className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{brand.brandName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(brand.date).toLocaleDateString()}
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

                {/* Top Content */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Performing Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {selectedCreatorProfile.topVideos.map((video, index) => (
                        <Card key={index} className="border-2">
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded mb-3 overflow-hidden border-2">
                              {getEmbedUrl(video.url, video.platform) ? (
                                <iframe
                                  src={getEmbedUrl(video.url, video.platform)!}
                                  title={video.title}
                                  className="w-full h-full"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
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
            ) : (
              <Card className="h-96 flex items-center justify-center border-2">
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
        
        {/* Render EditCreatorDialog */}
        {selectedCreatorProfile && <EditCreatorDialog creator={selectedCreatorProfile} />}
      </div>
    </div>
  );
}