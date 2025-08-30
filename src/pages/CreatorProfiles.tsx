import React, { useState, useMemo, useEffect } from 'react';
import { useCreators } from '@/hooks/useCreators';
import { useUpdateCreator } from '@/hooks/useManageCreators';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { useUserAccessibleCampaigns } from '@/hooks/useCampaignAssignments';
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
import { Users, Eye, TrendingUp, Search, User, Calendar, Target, Award, MapPin, Phone, Mail, Edit, Share, Plus, X, Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  mediaKitUrl?: string;
  platform_metrics?: Record<string, any>;
}

export default function CreatorProfiles() {
  const { data: creators = [] } = useCreators();
  const { data: campaigns = [] } = useCampaigns();
  const { data: campaignCreators = [] } = useCampaignCreators();
  const { data: accessibleCampaignIds = [] } = useUserAccessibleCampaigns();
  const updateCreator = useUpdateCreator();
  const { canEdit, isAdmin } = useUserPermissions();
  
  // Debug logging
  console.log('CreatorProfiles - creators:', creators);
  console.log('CreatorProfiles - canEdit:', canEdit);
  console.log('CreatorProfiles - isAdmin:', isAdmin);
  console.log('CreatorProfiles - accessibleCampaignIds:', accessibleCampaignIds);
  
  // Both admin and client see all creators
  const filteredCreators = useMemo(() => {
    return creators;
  }, [creators]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [editingCreator, setEditingCreator] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [currentCollaborationPage, setCurrentCollaborationPage] = useState(1);
  const collaborationsPerPage = 6;

  // Helper function for creating URL-friendly slugs
  const slugify = (text: string) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Handle URL query parameter for shared links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedParam = urlParams.get('selected');
    if (selectedParam && creators?.some(c => c.id === selectedParam)) {
      setSelectedCreator(selectedParam);
    } else if (creators?.length > 0 && !selectedCreator) {
      // Auto-select first creator for clients
      setSelectedCreator(creators[0].id);
    }
  }, [creators, selectedCreator]);

  // Build creator profiles with analytics using the new data structure
  const creatorProfiles = useMemo((): CreatorProfile[] => {
    return filteredCreators.map(creator => {
      // Use the campaign data directly from the creator object
      const creatorCampaigns = creator.campaign_creators?.map(cc => cc.campaigns).filter(Boolean) || [];

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

      return {
        id: creator.id,
        name: creator.name,
        avatar_url: creator.avatar_url,
        platform_handles: creator.platform_handles,
        location: (creator as any).location || 'United States',
        email: (creator as any).email || 'creator@example.com',
        phone: (creator as any).phone || '+1 (555) 123-4567',
        bio: (creator as any).bio || 'Content Creator',
        totalViews,
        totalEngagement,
        engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
        followerCount: totalFollowers,
        demographics: { ...demographics, ...(((creator as any).demographics) || {}) },
        platformBreakdown,
        brandCollaborations: brandCollaborations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        topVideos: (creator as any).top_videos || topVideos,
        services: (creator as any).services || services,
        mediaKitUrl: `${window.location.origin}/m/${slugify(creator.name)}-${creator.id}`,
        platform_metrics: (creator as any).platform_metrics || {}
      };
    });
  }, [filteredCreators]);

  // Filter creators by search term
  const searchFilteredCreators = useMemo(() => {
    return creatorProfiles.filter(creator =>
      creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [creatorProfiles, searchTerm]);

  const selectedCreatorProfile = useMemo(() => {
    return searchFilteredCreators.find(creator => creator.id === selectedCreator);
  }, [searchFilteredCreators, selectedCreator]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getEmbedUrl = (url: string, platform: string) => {
    const platformLower = platform.toLowerCase();
    
    if (platformLower === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    
    if (platformLower === 'instagram') {
      // Handle Instagram reel/post URLs
      const instagramMatch = url.match(/(?:instagram\.com\/(?:p|reel)\/([^\/\?]+))/);
      if (instagramMatch) {
        return `https://www.instagram.com/p/${instagramMatch[1]}/embed/captioned/`;
      }
    }
    
    if (platformLower === 'tiktok') {
      // Handle TikTok URLs
      const tiktokMatch = url.match(/(?:tiktok\.com\/@[^\/]+\/video\/(\d+))/);
      if (tiktokMatch) {
        return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
      }
    }
    
    return null;
  };

  const handleCreatorUpdate = async (creatorId: string, updates: any) => {
    try {
      const payload = {
        id: creatorId,
        name: updates.name,
        platform_handles: updates.platform_handles,
        avatar_url: updates.avatar_url,
        platform_metrics: updates.platformMetrics,
        bio: updates.bio,
        email: updates.email,
        phone: updates.phone,
        location: updates.location,
        demographics: updates.demographics,
        services: updates.services,
        top_videos: updates.topVideos, // map UI field to DB column
      };

      await updateCreator.mutateAsync(payload as any);
      toast.success('Creator updated successfully');
      setEditingCreator(null);
    } catch (error) {
      toast.error('Failed to update creator');
    }
  };

  const generateMediaKit = async (creatorId: string) => {
    const creator = creators?.find(c => c.id === creatorId);
    if (!creator) return;

    try {
      // Publish the media kit to get the proper slug
      const { data: slug, error } = await supabase.rpc('publish_public_media_kit', {
        p_creator_id: creatorId
      });

      if (error) throw error;

      const mediaKitUrl = `${window.location.origin}/${slug}`;
      
      console.log('Generated media kit URL:', mediaKitUrl);
      console.log('Creator:', creator.name, 'ID:', creator.id);
      console.log('Slug:', slug);
      
      navigator.clipboard.writeText(mediaKitUrl);
      toast.success('Media kit link copied to clipboard!');
    } catch (error) {
      console.error('Error generating media kit:', error);
      toast.error('Failed to generate media kit link');
    }
  };

  const EditCreatorDialog = ({ creator }: { creator: CreatorProfile }) => {
    const [formData, setFormData] = useState({
      name: creator.name,
      avatar_url: creator.avatar_url || '',
      location: creator.location || '',
      email: creator.email || '',
      phone: creator.phone || '',
      bio: creator.bio || '',
      platform_handles: creator.platform_handles || {},
      demographics: creator.demographics || {
        youtube: {
          gender: { female: 50, male: 50 },
          age: { '18-24': 30, '25-34': 40, '35-44': 20, '45-54': 8, '55+': 2 },
          location: {}
        },
        instagram: {
          gender: { female: 50, male: 50 },
          age: { '18-24': 30, '25-34': 40, '35-44': 20, '45-54': 8, '55+': 2 },
          location: {}
        },
        tiktok: {
          gender: { female: 50, male: 50 },
          age: { '18-24': 30, '25-34': 40, '35-44': 20, '45-54': 8, '55+': 2 },
          location: {}
        }
      },
      services: creator.services || [],
      topVideos: creator.topVideos || [],
      totalFollowers: creator.followerCount || 0,
      avgViews: creator.totalViews || 0,
      engagementRate: creator.engagementRate || 0,
      platformMetrics: (creator as any).platform_metrics || {
        youtube: { followers: '', engagementRate: '', reach: '', avgViews: '' },
        instagram: { followers: '', engagementRate: '', reach: '', avgViews: '' },
        tiktok: { followers: '', engagementRate: '', reach: '', avgViews: '' }
      }
    });

    const [selectedDemoPlatform, setSelectedDemoPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');

    const addService = () => {
      setFormData({
        ...formData,
        services: [...formData.services, { name: '', price: 0 }]
      });
    };

    const removeService = (index: number) => {
      setFormData({
        ...formData,
        services: formData.services.filter((_, i) => i !== index)
      });
    };

    const updateService = (index: number, field: 'name' | 'price', value: any) => {
      const newServices = [...formData.services];
      newServices[index] = { ...newServices[index], [field]: value };
      setFormData({ ...formData, services: newServices });
    };

    const addTopVideo = () => {
      setFormData({
        ...formData,
        topVideos: [...formData.topVideos, { 
          title: '', 
          platform: 'youtube', 
          views: 0, 
          engagement: 0, 
          engagementRate: 0, 
          url: '' 
        }]
      });
    };

    const removeTopVideo = (index: number) => {
      setFormData({
        ...formData,
        topVideos: formData.topVideos.filter((_, i) => i !== index)
      });
    };

    const updateTopVideo = (index: number, field: string, value: any) => {
      const newVideos = [...formData.topVideos];
      newVideos[index] = { ...newVideos[index], [field]: value };
      setFormData({ ...formData, topVideos: newVideos });
    };

    const addLocationDemographic = () => {
      const country = prompt('Enter country name:');
      if (country) {
        setFormData({
          ...formData,
          demographics: {
            ...formData.demographics,
            [selectedDemoPlatform]: {
              ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
              location: {
                ...((formData.demographics?.[selectedDemoPlatform]?.location) || {}),
                [country]: 0
              }
            }
          }
        });
      }
    };

    return (
      <Dialog open={editingCreator === creator.id} onOpenChange={() => setEditingCreator(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Creator Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="border-2"
                />
              </div>
              
              <div className="space-y-2">
                <ImageUpload
                  value={formData.avatar_url}
                  onValueChange={(url) => setFormData({ ...formData, avatar_url: url })}
                  label="Profile Picture"
                  bucketName="avatars"
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFollowers" className="text-sm font-medium">Total Followers</Label>
                  <Input
                    id="totalFollowers"
                    type="number"
                    value={formData.totalFollowers}
                    onChange={(e) => setFormData({ ...formData, totalFollowers: Number(e.target.value) })}
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avgViews" className="text-sm font-medium">Average Views</Label>
                  <Input
                    id="avgViews"
                    type="number"
                    value={formData.avgViews}
                    onChange={(e) => setFormData({ ...formData, avgViews: Number(e.target.value) })}
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="engagementRate" className="text-sm font-medium">Engagement Rate (%)</Label>
                  <Input
                    id="engagementRate"
                    type="number"
                    step="0.1"
                    value={formData.engagementRate}
                    onChange={(e) => setFormData({ ...formData, engagementRate: Number(e.target.value) })}
                    className="border-2"
                  />
                </div>
              </div>
            </div>

            {/* Platform-Specific Metrics */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-lg font-semibold">Platform-Specific Metrics</h3>
                <div className="flex gap-2">
                  {(['youtube', 'instagram', 'tiktok'] as const).map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedDemoPlatform === platform ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDemoPlatform(platform)}
                      className="border-2"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Followers</Label>
                  <Input
                    type="text"
                    value={formData.platformMetrics?.[selectedDemoPlatform]?.followers || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      platformMetrics: {
                        ...formData.platformMetrics,
                        [selectedDemoPlatform]: {
                          ...formData.platformMetrics?.[selectedDemoPlatform],
                          followers: e.target.value
                        }
                      }
                    })}
                    className="border-2"
                    placeholder="e.g. 1.2M, 500K, 10,000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Engagement Rate</Label>
                  <Input
                    type="text"
                    value={formData.platformMetrics?.[selectedDemoPlatform]?.engagementRate || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      platformMetrics: {
                        ...formData.platformMetrics,
                        [selectedDemoPlatform]: {
                          ...formData.platformMetrics?.[selectedDemoPlatform],
                          engagementRate: e.target.value
                        }
                      }
                    })}
                    className="border-2"
                    placeholder="e.g. 4.2%, 3.8%, High"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reach</Label>
                  <Input
                    type="text"
                    value={formData.platformMetrics?.[selectedDemoPlatform]?.reach || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      platformMetrics: {
                        ...formData.platformMetrics,
                        [selectedDemoPlatform]: {
                          ...formData.platformMetrics?.[selectedDemoPlatform],
                          reach: e.target.value
                        }
                      }
                    })}
                    className="border-2"
                    placeholder="e.g. 100K, 50K per post, Wide"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Average Views</Label>
                  <Input
                    type="text"
                    value={formData.platformMetrics?.[selectedDemoPlatform]?.avgViews || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      platformMetrics: {
                        ...formData.platformMetrics,
                        [selectedDemoPlatform]: {
                          ...formData.platformMetrics?.[selectedDemoPlatform],
                          avgViews: e.target.value
                        }
                      }
                    })}
                    className="border-2"
                    placeholder="e.g. 250K, 1M per video, High"
                  />
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-lg font-semibold">Demographics</h3>
                <div className="flex gap-2">
                  {(['youtube', 'instagram', 'tiktok'] as const).map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedDemoPlatform === platform ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDemoPlatform(platform)}
                      className="border-2"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Gender */}
                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <Label className="text-sm font-medium">Gender Distribution (%)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Female</Label>
                      <Input
                        type="number"
                        value={formData.demographics?.[selectedDemoPlatform]?.gender?.female ?? 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
                              gender: { ...(formData.demographics?.[selectedDemoPlatform]?.gender || { female: 0, male: 0 }), female: Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Male</Label>
                      <Input
                        type="number"
                        value={formData.demographics?.[selectedDemoPlatform]?.gender?.male ?? 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
                              gender: { ...(formData.demographics?.[selectedDemoPlatform]?.gender || { female: 0, male: 0 }), male: Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <Label className="text-sm font-medium">Age Distribution (%)</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">18-24</Label>
                      <Input
                        type="number"
                        value={formData.demographics[selectedDemoPlatform].age['18-24']}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...formData.demographics[selectedDemoPlatform],
                              age: { ...formData.demographics[selectedDemoPlatform].age, '18-24': Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">25-34</Label>
                      <Input
                        type="number"
                        value={formData.demographics[selectedDemoPlatform].age['25-34']}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...formData.demographics[selectedDemoPlatform],
                              age: { ...formData.demographics[selectedDemoPlatform].age, '25-34': Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">35-44</Label>
                      <Input
                        type="number"
                        value={formData.demographics[selectedDemoPlatform].age['35-44']}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...formData.demographics[selectedDemoPlatform],
                              age: { ...formData.demographics[selectedDemoPlatform].age, '35-44': Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">45-54</Label>
                      <Input
                        type="number"
                        value={formData.demographics[selectedDemoPlatform].age['45-54']}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...formData.demographics[selectedDemoPlatform],
                              age: { ...formData.demographics[selectedDemoPlatform].age, '45-54': Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">55+</Label>
                      <Input
                        type="number"
                        value={formData.demographics[selectedDemoPlatform].age['55+']}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...formData.demographics[selectedDemoPlatform],
                              age: { ...formData.demographics[selectedDemoPlatform].age, '55+': Number(e.target.value) }
                            }
                          }
                        })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Location Distribution</Label>
                  <Button variant="outline" size="sm" onClick={addLocationDemographic} className="border-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Country
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(formData.demographics?.[selectedDemoPlatform]?.location || {}).map(([country, percentage]) => (
                    <div key={country} className="flex gap-2">
                      <Input
                        value={country}
                        onChange={(e) => {
                          const newLocation = { ...(formData.demographics?.[selectedDemoPlatform]?.location || {}) };
                          delete newLocation[country];
                          newLocation[e.target.value] = percentage;
                          setFormData({
                            ...formData,
                            demographics: {
                              ...formData.demographics,
                              [selectedDemoPlatform]: {
                                ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
                                location: newLocation
                              }
                            }
                          });
                        }}
                        placeholder="Country"
                        className="border-2"
                      />
                      <Input
                        type="number"
                        value={percentage}
                        onChange={(e) => setFormData({
                          ...formData,
                          demographics: {
                            ...formData.demographics,
                            [selectedDemoPlatform]: {
                              ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
                              location: {
                                ...((formData.demographics?.[selectedDemoPlatform]?.location) || {}),
                                [country]: Number(e.target.value)
                              }
                            }
                          }
                        })}
                        placeholder="%"
                        className="border-2 w-20"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newLocation = { ...(formData.demographics?.[selectedDemoPlatform]?.location || {}) };
                          delete newLocation[country];
                          setFormData({
                            ...formData,
                            demographics: {
                              ...formData.demographics,
                              [selectedDemoPlatform]: {
                                ...(formData.demographics?.[selectedDemoPlatform] || { gender: { female: 0, male: 0 }, age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }, location: {} }),
                                location: newLocation
                              }
                            }
                          });
                        }}
                        className="border-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-lg font-semibold">Services (USD)</h3>
                <Button variant="outline" size="sm" onClick={addService} className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex gap-3 p-3 border border-border rounded-lg">
                    <Input
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      placeholder="Service name"
                      className="flex-1 border-2"
                    />
                    <Input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', Number(e.target.value))}
                      placeholder="Price (USD)"
                      className="w-32 border-2"
                    />
                    <Button variant="outline" size="sm" onClick={() => removeService(index)} className="border-2">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Content */}
            <div className="space-y-4 p-6 border-2 border-border rounded-lg bg-card">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-lg font-semibold">Top Performing Content</h3>
                <Button variant="outline" size="sm" onClick={addTopVideo} className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.topVideos.map((video, index) => (
                  <div key={index} className="p-4 border-2 border-border rounded-lg space-y-3 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Content #{index + 1}</h4>
                      <Button variant="outline" size="sm" onClick={() => removeTopVideo(index)} className="border-2">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Content Title</Label>
                        <Input
                          value={video.title}
                          onChange={(e) => updateTopVideo(index, 'title', e.target.value)}
                          placeholder="Content title"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Content URL</Label>
                        <Input
                          value={video.url}
                          onChange={(e) => updateTopVideo(index, 'url', e.target.value)}
                          placeholder="Content URL"
                          className="border-2"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Platform</Label>
                        <Input
                          value={video.platform}
                          onChange={(e) => updateTopVideo(index, 'platform', e.target.value)}
                          placeholder="Platform"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Views</Label>
                        <Input
                          type="number"
                          value={video.views}
                          onChange={(e) => updateTopVideo(index, 'views', Number(e.target.value))}
                          placeholder="Views"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Engagement</Label>
                        <Input
                          type="number"
                          value={video.engagement}
                          onChange={(e) => updateTopVideo(index, 'engagement', Number(e.target.value))}
                          placeholder="Engagement"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Engagement Rate %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={video.engagementRate}
                          onChange={(e) => updateTopVideo(index, 'engagementRate', Number(e.target.value))}
                          placeholder="Rate %"
                          className="border-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-border">
              <Button variant="outline" onClick={() => setEditingCreator(null)} className="border-2">
                Cancel
              </Button>
              <Button onClick={() => handleCreatorUpdate(creator.id, formData)} className="border-2">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // For clients: show different layout with sidebar and public media kit style
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#4d4dd9]">
        <Navigation />
        
        {/* Header with gradient accent */}
        <div className="h-2 bg-gradient-to-r from-[#3333cc] via-[#F4D35E] to-[#F95738]"></div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar - Creator Thumbnails */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#3333cc]">
                      <Users className="h-5 w-5" />
                      Creator Profiles
                    </CardTitle>
                    <CardDescription>
                      {searchFilteredCreators.length} creators available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search creators..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-2"
                        />
                      </div>

                      {/* Creator List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {searchFilteredCreators.map((creator) => (
                          <div
                            key={creator.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                              selectedCreator === creator.id
                                ? 'border-[#3333cc] bg-gradient-to-br from-[#e6e6f7] to-[#ccccf0] shadow-lg'
                                : 'border-gray-200 hover:border-[#3333cc]/50 bg-white/70'
                            }`}
                            onClick={() => setSelectedCreator(creator.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                                <AvatarImage src={creator.avatar_url} alt={creator.name} />
                                <AvatarFallback className="bg-gradient-to-br from-[#3333cc] to-[#F4D35E] text-white font-bold">
                                  {creator.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate text-[#3333cc]">{creator.name}</p>
                                <p className="text-xs text-gray-600">
                                  {formatNumber(creator.totalViews)} total views
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Area - Public Media Kit Style */}
            <div className="lg:col-span-3">
              {selectedCreatorProfile ? (
                <div className="space-y-6">
                  {/* Creator Header */}
                  <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#e6e6f7]/50 to-[#ccccf0]/50 opacity-60"></div>
                      <div className="absolute top-4 right-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#3333cc] to-[#F4D35E] rounded-full opacity-20"></div>
                      </div>
                      
                      <div className="relative p-6">
                        <div className="flex items-center gap-6">
                          <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
                            <AvatarImage src={selectedCreatorProfile.avatar_url} alt={selectedCreatorProfile.name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#3333cc] to-[#F4D35E] text-white text-2xl font-bold">
                              {selectedCreatorProfile.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h1 className="text-4xl font-bold text-[#3333cc] mb-2">{selectedCreatorProfile.name}</h1>
                            <p className="text-gray-700 text-lg mb-3">{selectedCreatorProfile.bio}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{selectedCreatorProfile.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Platform Tabs */}
                  <div className="flex gap-2 mb-6">
                    {[
                      { key: 'youtube', label: 'YouTube', icon: '📺' },
                      { key: 'instagram', label: 'Instagram', icon: '📸' },
                      { key: 'tiktok', label: 'TikTok', icon: '🎵' }
                    ].map((platform) => (
                      <Button
                        key={platform.key}
                        variant={selectedPlatform === platform.key ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setSelectedPlatform(platform.key as any)}
                        className={`px-6 py-3 text-sm font-medium border-2 ${
                          selectedPlatform === platform.key
                            ? 'bg-[#3333cc] text-white border-[#3333cc] shadow-lg'
                            : 'bg-white/80 text-[#3333cc] border-gray-300 hover:border-[#3333cc]/50'
                        }`}
                      >
                        <span className="mr-2">{platform.icon}</span>
                        {platform.label}
                      </Button>
                    ))}
                  </div>

                  {/* Key Metrics */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#e6e6f7]/30 to-[#ccccf0]/30"></div>
                      <CardHeader className="relative">
                        <CardTitle className="flex items-center gap-2 text-[#3333cc]">
                          <TrendingUp className="h-6 w-6" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="text-center p-4 bg-white/50 rounded-xl border-2 border-white/60 shadow-sm">
                            <div className="text-3xl font-bold text-[#3333cc] mb-1">
                              {formatNumber(selectedCreatorProfile.followerCount)}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Followers</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-xl border-2 border-white/60 shadow-sm">
                            <div className="text-3xl font-bold text-[#3333cc] mb-1">
                              {selectedCreatorProfile.engagementRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Avg Engagement</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-xl border-2 border-white/60 shadow-sm">
                            <div className="text-3xl font-bold text-[#3333cc] mb-1">
                              {formatNumber(Math.round(selectedCreatorProfile.totalViews / 30))}+
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Monthly Reach</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-xl border-2 border-white/60 shadow-sm">
                            <div className="text-3xl font-bold text-[#3333cc] mb-1">
                              {formatNumber(Math.round(selectedCreatorProfile.totalViews / (selectedCreatorProfile.topVideos.length || 1)))}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Avg Views per Video</div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>

                  {/* Demographics */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#3333cc]">
                        <Users className="h-6 w-6" />
                        Audience Demographics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gender */}
                        <div>
                          <h4 className="font-semibold mb-4 text-[#3333cc]">Gender</h4>
                          <div className="space-y-3">
                            {Object.entries(selectedCreatorProfile.demographics[selectedPlatform]?.gender || {}).map(([gender, percentage]) => (
                              <div key={gender} className="flex items-center justify-between">
                                <span className="capitalize font-medium">{gender}</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#3333cc] to-[#F4D35E] rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-[#3333cc] min-w-[3rem]">{percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Age */}
                        <div>
                          <h4 className="font-semibold mb-4 text-[#3333cc]">Age Groups</h4>
                          <div className="space-y-3">
                            {Object.entries(selectedCreatorProfile.demographics[selectedPlatform]?.age || {}).map(([age, percentage]) => (
                              <div key={age} className="flex items-center justify-between">
                                <span className="font-medium">{age}</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#3333cc] to-[#F4D35E] rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-[#3333cc] min-w-[3rem]">{percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Collaborations */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#3333cc]">
                        <Award className="h-6 w-6" />
                        Past Collaborations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedCreatorProfile.brandCollaborations.slice(0, 6).map((brand, index) => (
                          <Card key={index} className="border-2 border-gray-200 bg-white/80 hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                {brand.logoUrl ? (
                                  <img 
                                    src={brand.logoUrl} 
                                    alt={brand.brandName}
                                    className="h-12 w-12 rounded object-cover border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded bg-gradient-to-br from-[#3333cc] to-[#F4D35E] flex items-center justify-center">
                                    <Award className="h-6 w-6 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-[#3333cc]">{brand.brandName}</h4>
                                  <p className="text-sm text-gray-600">
                                    {new Date(brand.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Views:</span>
                                  <div className="font-bold text-[#3333cc]">{formatNumber(brand.views)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Engagement:</span>
                                  <div className="font-bold text-[#F95738]">{brand.engagementRate.toFixed(1)}%</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Content */}
                  {selectedCreatorProfile.topVideos.length > 0 && (
                    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#3333cc]">
                          <Play className="h-6 w-6" />
                          Top Performing Content
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {selectedCreatorProfile.topVideos
                            .filter(video => video.platform.toLowerCase() === selectedPlatform.toLowerCase())
                            .slice(0, 3)
                            .map((video, index) => (
                            <Card key={index} className="border-2 border-gray-200 bg-white/80 hover:shadow-lg transition-all">
                              <CardContent className="p-4">
                                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden border-2 relative">
                                  {getEmbedUrl(video.url, video.platform) ? (
                                    <iframe
                                      src={getEmbedUrl(video.url, video.platform)!}
                                      title={video.title}
                                      className="absolute inset-0 w-full h-full"
                                      style={{ border: 'none' }}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      loading="lazy"
                                    />
                                  ) : video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e6e6f7] to-[#ccccf0]">
                                      <Play className="h-12 w-12 text-[#3333cc]" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm text-[#3333cc] line-clamp-2">{video.title}</h4>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600">Views:</span>
                                      <div className="font-bold text-[#3333cc]">{formatNumber(video.views)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Engagement:</span>
                                      <div className="font-bold text-[#F95738]">{video.engagementRate.toFixed(1)}%</div>
                                    </div>
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
              ) : (
                <Card className="h-96 flex items-center justify-center border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardContent>
                    <div className="text-center text-gray-600">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50 text-[#3333cc]" />
                      <p className="text-lg">Select a creator to view their media kit</p>
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

  // For admins: show original full admin layout
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
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setEditingCreator(selectedCreatorProfile.id)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              
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
                  Creators ({searchFilteredCreators.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {searchFilteredCreators.map(creator => (
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
                                <span className="text-2xl font-bold">{(selectedCreatorProfile?.demographics?.[selectedPlatform]?.gender?.female ?? 0)}%</span>
                                <span className="text-sm text-muted-foreground">Women</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4" />
                                <span className="text-2xl font-bold">{(selectedCreatorProfile?.demographics?.[selectedPlatform]?.gender?.male ?? 0)}%</span>
                                <span className="text-sm text-muted-foreground">Men</span>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-medium mb-2">Age</h4>
                            <div className="space-y-2">
                              {Object.entries((selectedCreatorProfile?.demographics?.[selectedPlatform]?.age) || {}).map(([range, percentage]) => (
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
                              {Object.entries((selectedCreatorProfile?.demographics?.[selectedPlatform]?.location) || {}).map(([country, percentage]) => (
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

                      {/* Services */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Services</h3>
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
                      <div className="text-3xl font-bold text-primary mb-2">
                        {(selectedCreatorProfile.platform_metrics?.[selectedPlatform]?.followers) || formatNumber(selectedCreatorProfile.followerCount)}
                      </div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-emerald-500 mb-2">
                        {(selectedCreatorProfile.platform_metrics?.[selectedPlatform]?.reach) || formatNumber(selectedCreatorProfile.totalViews)}
                      </div>
                      <div className="text-sm text-muted-foreground">Reach</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-amber-500 mb-2">
                        {(selectedCreatorProfile.platform_metrics?.[selectedPlatform]?.avgViews) || formatNumber(selectedCreatorProfile.totalViews)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Views</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-rose-500 mb-2">
                        {(selectedCreatorProfile.platform_metrics?.[selectedPlatform]?.engagementRate) || `${selectedCreatorProfile.engagementRate.toFixed(1)}%`}
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Brand Collaborations */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Brand Collaborations
                      </div>
                      {selectedCreatorProfile.brandCollaborations.length > collaborationsPerPage && (
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
                            Page {currentCollaborationPage} of {Math.ceil(selectedCreatorProfile.brandCollaborations.length / collaborationsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentCollaborationPage(prev => 
                              Math.min(Math.ceil(selectedCreatorProfile.brandCollaborations.length / collaborationsPerPage), prev + 1)
                            )}
                            disabled={currentCollaborationPage >= Math.ceil(selectedCreatorProfile.brandCollaborations.length / collaborationsPerPage)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCreatorProfile.brandCollaborations
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
                      {selectedCreatorProfile.topVideos
                        .filter(video => video.platform.toLowerCase() === selectedPlatform.toLowerCase())
                        .slice(0, 3)
                        .map((video, index) => (
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
                              ) : video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
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
        {selectedCreatorProfile && canEdit && <EditCreatorDialog creator={selectedCreatorProfile} />}
      </div>
    </div>
  );
}