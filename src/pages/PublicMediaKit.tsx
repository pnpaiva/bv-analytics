import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  MapPin, 
  Eye, 
  Heart, 
  Play, 
  Camera, 
  Music, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Users,
  Youtube,
  Instagram,
  Globe
} from 'lucide-react';

// Use the EXACT same interface as CreatorProfiles.tsx
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

export default function PublicMediaKit() {
  const { slug } = useParams<{ slug: string }>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [currentCollaborationPage, setCurrentCollaborationPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collaborationsPerPage = 6;

  // Helper function to get embed URLs (exactly the same as CreatorProfiles)
  const getEmbedUrl = (url: string, platform: string) => {
    const platformLower = platform.toLowerCase();
    
    if (platformLower === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    
    if (platformLower === 'instagram') {
      const instagramMatch = url.match(/(?:instagram\.com\/(?:p|reel)\/([^\/\?]+))/);
      if (instagramMatch) {
        return `https://www.instagram.com/p/${instagramMatch[1]}/embed/captioned/`;
      }
    }
    
    if (platformLower === 'tiktok') {
      const tiktokMatch = url.match(/(?:tiktok\.com\/@[^\/]+\/video\/(\d+))/);
      if (tiktokMatch) {
        return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
      }
    }
    
    return null;
  };

  // Helper function to get social media links
  const getSocialLink = (platform: string, handle: string) => {
    const platformLower = platform.toLowerCase();
    // Remove @ prefix if it exists to avoid double @
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    switch (platformLower) {
      case 'youtube':
        return `https://www.youtube.com/@${cleanHandle}`;
      case 'instagram':
        return `https://www.instagram.com/${cleanHandle}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${cleanHandle}`;
      default:
        return '#';
    }
  };

  // EXACT SAME DATA BUILDING LOGIC AS CREATOR-PROFILES PAGE
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const urlSlug = slug || window.location.pathname.split('/').filter(Boolean).pop();

        if (!urlSlug) {
          throw new Error('No media kit slug found in URL');
        }

        const { data: mediaKit, error: mediaKitError } = await supabase
          .from('public_media_kits')
          .select('*')
          .eq('slug', urlSlug)
          .eq('published', true)
          .maybeSingle();

        if (mediaKitError) throw mediaKitError;
        if (!mediaKit) throw new Error(`Creator not found: ${urlSlug}`);

        const { data: collaborations, error: collabError } = await supabase
          .rpc('get_creator_collaborations', { p_creator_id: mediaKit.creator_id });

        if (collabError) throw collabError;

        let totalViews = 0;
        let totalEngagement = 0;
        const brandCollaborations: CreatorProfile['brandCollaborations'] = [];

        (collaborations || []).forEach((collab: any) => {
          const campaignViews = collab.total_views || 0;
          const campaignEngagement = collab.total_engagement || 0;

          brandCollaborations.push({
            brandName: collab.brand_name,
            logoUrl: collab.logo_url,
            views: campaignViews,
            engagement: campaignEngagement,
            engagementRate: collab.engagement_rate || 0,
            date: collab.campaign_date,
          });

          totalViews += campaignViews;
          totalEngagement += campaignEngagement;
        });

        const totalFollowers = Math.round(totalViews * 0.05);

        const defaultDemographics = {
          youtube: {
            gender: { female: 75, male: 25 },
            age: { '18-24': 40, '25-34': 35, '35-44': 15, '45-54': 8, '55+': 2 },
            location: { 'United States': 40, 'United Kingdom': 25, 'Canada': 20, 'Australia': 15 },
          },
          instagram: {
            gender: { female: 60, male: 40 },
            age: { '18-24': 30, '25-34': 40, '35-44': 20, '45-54': 8, '55+': 2 },
            location: { 'United States': 30, 'United Kingdom': 20, 'Canada': 25, 'Australia': 25 },
          },
          tiktok: {
            gender: { female: 80, male: 20 },
            age: { '18-24': 50, '25-34': 30, '35-44': 15, '45-54': 5, '55+': 0 },
            location: { 'United States': 50, 'United Kingdom': 20, 'Canada': 15, 'Australia': 15 },
          },
        } as CreatorProfile['demographics'];

        const profile: CreatorProfile = {
          id: (mediaKit as any).creator_id || (mediaKit as any).id,
          name: (mediaKit as any).name,
          avatar_url: (mediaKit as any).avatar_url,
          platform_handles: (mediaKit as any).platform_handles || {},
          location: (mediaKit as any).location || 'United States',
          bio: (mediaKit as any).bio || 'Content Creator',
          totalViews,
          totalEngagement,
          engagementRate: totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0,
          followerCount: totalFollowers,
          demographics: (mediaKit as any).demographics || (defaultDemographics as any),
          platformBreakdown: [],
          brandCollaborations: brandCollaborations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          topVideos: (mediaKit as any).top_videos || [],
          services: (mediaKit as any).services || [
            { name: 'Reel/Video Post', price: 450 },
            { name: 'Stories', price: 200 },
            { name: 'Product Reviews', price: 600 },
          ],
          mediaKitUrl: `${window.location.origin}/${urlSlug}`,
          platform_metrics: (mediaKit as any).platform_metrics || {},
        };

        setCreatorProfile(profile);
      } catch (error) {
        console.error('Error fetching creator data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [slug]);

  // Set document title and meta tags when creator profile is loaded
  useEffect(() => {
    if (creatorProfile) {
      document.title = `${creatorProfile.name} | Media Kit`;
      
      // Set meta tags for social media sharing
      const setMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      const setMetaName = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      // Open Graph tags
      setMetaTag('og:title', `${creatorProfile.name} | Media Kit`);
      setMetaTag('og:description', creatorProfile.bio || `Check out ${creatorProfile.name}'s media kit and collaboration opportunities`);
      setMetaTag('og:url', window.location.href);
      setMetaTag('og:type', 'profile');
      
      // Set the creator's profile picture as the preview image
      if (creatorProfile.avatar_url) {
        setMetaTag('og:image', creatorProfile.avatar_url);
        setMetaTag('og:image:alt', `${creatorProfile.name} profile picture`);
      }

      // Twitter Card tags
      setMetaName('twitter:card', 'summary_large_image');
      setMetaName('twitter:title', `${creatorProfile.name} | Media Kit`);
      setMetaName('twitter:description', creatorProfile.bio || `Check out ${creatorProfile.name}'s media kit and collaboration opportunities`);
      
      if (creatorProfile.avatar_url) {
        setMetaName('twitter:image', creatorProfile.avatar_url);
        setMetaName('twitter:image:alt', `${creatorProfile.name} profile picture`);
      }
    }
  }, [creatorProfile]);

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'tiktok':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  // Calculate stats for selected platform
  const selectedPlatformStats = useMemo(() => {
    if (!creatorProfile) return { followers: 0, engagement: 0, reach: 0, views: 0 };
    
    const platformData = creatorProfile.platformBreakdown.find(p => 
      p.platform.toLowerCase() === selectedPlatform.toLowerCase()
    );
    
    // Try to get from stored platform metrics first, then fallback to calculated data
    const storedMetrics = (creatorProfile as any).platform_metrics?.[selectedPlatform];
    
    return {
      followers: storedMetrics?.followers || platformData?.followerCount || 0,
      engagement: storedMetrics?.engagementRate || platformData?.engagementRate || 0,
      reach: storedMetrics?.reach || platformData?.views || 0,
      views: storedMetrics?.avgViews || platformData?.views || 0
    };
  }, [creatorProfile, selectedPlatform]);

  // Pagination for collaborations
  const totalCollaborationPages = Math.ceil((creatorProfile?.brandCollaborations?.length || 0) / collaborationsPerPage);
  const currentCollaborations = creatorProfile?.brandCollaborations?.slice(
    (currentCollaborationPage - 1) * collaborationsPerPage,
    currentCollaborationPage * collaborationsPerPage
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6f7] to-[#ccccf0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3333cc] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6f7] to-[#ccccf0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#3333cc] mb-2">Error: {error}</h1>
          <p className="text-gray-600">Could not load the creator profile.</p>
        </div>
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6e6f7] to-[#ccccf0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#3333cc] mb-2">Creator Not Found</h1>
          <p className="text-gray-600">The creator profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#4d4dd9]">
      {/* Header with gradient accent */}
      <div className="h-2 bg-gradient-to-r from-[#3333cc] via-[#F4D35E] to-[#F95738]"></div>
      
      {/* Mock Data Notice */}
      {creatorProfile?.id === 'fallback' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Design Preview Mode:</strong> This is showing mock data to demonstrate the new media kit design. In production, this would display real creator information.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Fixed/Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Creator Photo & Basic Info */}
              <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <div className="relative">
                  {/* Background pattern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e6e6f7]/50 to-[#ccccf0]/50 opacity-60"></div>
                  <div className="absolute top-4 right-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#3333cc] to-[#F4D35E] rounded-full opacity-20"></div>
                  </div>
                  
                  {/* Main photo */}
                  <div className="relative p-6">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl">
                      <Avatar className="w-full h-full rounded-2xl">
                         <AvatarImage 
                           src={creatorProfile?.avatar_url} 
                           alt={creatorProfile?.name}
                           className="object-cover"
                         />
                         <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-[#3333cc] to-[#F4D35E] text-white">
                           {creatorProfile?.name.split(' ').map(n => n[0]).join('')}
                         </AvatarFallback>
                       </Avatar>
                     </div>
                   </div>
                 </div>
                 
                 <CardContent className="p-6 pt-0">
                   {/* Creator Name & Handle */}
                   <div className="text-center mb-6">
                     <h1 className="text-3xl font-bold text-[#3333cc] mb-2">{creatorProfile?.name}</h1>
                     <p className="text-lg text-gray-600">@{creatorProfile?.name?.toLowerCase().replace(/\s+/g, '')}</p>
                   </div>

                   {/* Bio */}
                   <div className="mb-6">
                     <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sobre</h3>
                     <p className="text-gray-700 leading-relaxed">{creatorProfile?.bio}</p>
                   </div>

                  {/* Location */}
                  {creatorProfile?.location && (
                    <div className="flex items-center gap-3 mb-6 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{creatorProfile.location}</span>
                    </div>
                  )}

                  {/* Contact Information */}
                  {creatorProfile?.email && (
                    <div className="flex items-center gap-3 mb-6 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{creatorProfile.email}</span>
                    </div>
                  )}

                  {/* Social Platform Links */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Follow</h3>
                    <div className="flex gap-3">
                      {Object.entries(creatorProfile?.platform_handles || {}).map(([platform, handle]) => {
                        if (!handle) return null;
                        
                        return (
                          <a
                            key={platform}
                            href={getSocialLink(platform, handle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            {getPlatformIcon(platform)}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Content - Scrollable */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Platform Selector */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex gap-2 items-center">
                  {['youtube', 'instagram', 'tiktok'].map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedPlatform === platform ? "default" : "outline"}
                      onClick={() => setSelectedPlatform(platform as 'youtube' | 'instagram' | 'tiktok')}
                      className={`capitalize ${
                        selectedPlatform === platform 
                          ? 'bg-[#3333cc] border-0 hover:bg-[#2a2aa3]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {getPlatformIcon(platform)}
                      <span className="ml-2">{platform}</span>
                    </Button>
                  ))}
                  <span className="text-sm text-gray-500 ml-4">Selecione a plataforma para ver os dados</span>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5 text-[#3333cc]" />
                  Métricas Chave
                </CardTitle>
              </CardHeader>
              <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                     <div className="text-2xl font-bold text-black mb-1">
                       {selectedPlatformStats.followers || '0'}
                     </div>
                     <div className="text-sm text-gray-600">Seguidores</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                     <div className="text-2xl font-bold text-black mb-1">
                       {selectedPlatformStats.engagement || '0'}
                     </div>
                     <div className="text-sm text-gray-600">Engajamento Médio</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                     <div className="text-2xl font-bold text-black mb-1">
                       {selectedPlatformStats.reach || '0'}
                     </div>
                     <div className="text-sm text-gray-600">Alcance</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                     <div className="text-2xl font-bold text-black mb-1">
                       {selectedPlatformStats.views || '0'}
                     </div>
                     <div className="text-sm text-gray-600">Views</div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Demographics */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-[#3333cc]" />
                  Audiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gender Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Gênero</h4>
                  <div className="space-y-3">
                    {Object.entries(creatorProfile?.demographics[selectedPlatform]?.gender || {}).map(([gender, percentage]) => (
                      <div key={gender} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 capitalize w-16">{gender === 'male' ? 'Masculino' : gender === 'female' ? 'Feminino' : gender}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#3333cc] to-[#F4D35E] rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Idades</h4>
                  <div className="space-y-3">
                    {['18-24', '25-34', '35-44', '45-54', '55+'].map((age) => {
                      const percentage = creatorProfile?.demographics[selectedPlatform]?.age?.[age] || 0;
                      return (
                        <div key={age} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-16">{age}</span>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#3333cc] to-[#F4D35E] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Location Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Localização</h4>
                  <div className="space-y-3">
                    {Object.entries(creatorProfile?.demographics[selectedPlatform]?.location || {})
                      .sort(([, a], [, b]) => (b as number) - (a as number)) // Sort by percentage descending
                      .map(([location, percentage]) => (
                      <div key={location} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-20">{location}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#3333cc] to-[#F4D35E] rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

             {/* Brand Collaborations */}
             {creatorProfile?.brandCollaborations && creatorProfile.brandCollaborations.length > 0 && (
               <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Heart className="h-5 w-5 text-[#F95738]" />
                      Colaborações Passadas
                    </CardTitle>
                  </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     {currentCollaborations.map((collab, index) => (
                       <div key={index} className="p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                         <div className="flex items-center gap-3 mb-3">
                           {/* Company Logo */}
                           {collab.logoUrl ? (
                             <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                               <img 
                                 src={collab.logoUrl} 
                                 alt={collab.brandName}
                                 className="w-full h-full object-contain"
                                 onError={(e) => {
                                   // Fallback to initials if logo fails to load
                                   const target = e.currentTarget as HTMLImageElement;
                                   target.style.display = 'none';
                                   const fallback = target.nextElementSibling as HTMLDivElement;
                                   if (fallback) fallback.style.display = 'flex';
                                 }}
                               />
                               <div className="w-12 h-12 bg-gradient-to-br from-[#3333cc] to-[#F4D35E] rounded-lg flex items-center justify-center text-white font-bold text-lg hidden">
                                 {collab.brandName.split(' ').map(word => word[0]).join('').toUpperCase()}
                               </div>
                             </div>
                           ) : (
                             <div className="w-12 h-12 bg-gradient-to-br from-[#3333cc] to-[#F4D35E] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                               {collab.brandName.split(' ').map(word => word[0]).join('').toUpperCase()}
                             </div>
                           )}
                           <div className="flex-1">
                             <h4 className="font-semibold text-gray-800">{collab.brandName}</h4>
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                           <div className="text-center p-2 bg-[#e6e6f7] rounded-lg">
                             <div className="font-semibold text-[#3333cc]">{collab.views?.toLocaleString() || '0'}</div>
                             <div className="text-xs text-gray-600">Views</div>
                           </div>
                           <div className="text-center p-2 bg-[#e6e6f7] rounded-lg">
                             <div className="font-semibold text-[#F95738]">{collab.engagement?.toLocaleString() || '0'}</div>
                             <div className="text-xs text-gray-600">Engagement</div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                  
                  {/* Pagination */}
                  {totalCollaborationPages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentCollaborationPage(prev => Math.max(1, prev - 1))}
                        disabled={currentCollaborationPage === 1}
                        className="border-[#3333cc] text-[#3333cc] hover:bg-[#3333cc] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        Page {currentCollaborationPage} of {totalCollaborationPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentCollaborationPage(prev => Math.min(totalCollaborationPages, prev + 1))}
                        disabled={currentCollaborationPage >= totalCollaborationPages}
                        className="border-[#3333cc] text-[#3333cc] hover:bg-[#3333cc] hover:text-white"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top Performing Content */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 text-[#3333cc]" />
                  Conheça Nosso Conteúdo
                </CardTitle>
              </CardHeader>
               <CardContent>
                 {(() => {
                   const platformVideos = (creatorProfile?.topVideos || [])
                     .filter(video => video.platform.toLowerCase() === selectedPlatform.toLowerCase())
                     .slice(0, 3);
                   
                   return platformVideos && platformVideos.length > 0 ? (
                     <div className="space-y-8">
                       {platformVideos.map((video, index) => (
                         <div key={index} className="space-y-4">
                           <h4 className="font-medium text-gray-800 text-lg">{video.title}</h4>
                           
                            <div className={`bg-muted rounded-xl overflow-hidden border-2 relative mx-auto ${
                              video.platform.toLowerCase() === 'instagram' ? 'w-96 h-96' : // Larger square for Instagram (384x384px)
                              video.platform.toLowerCase() === 'tiktok' ? 'w-80 h-[480px]' : // Larger portrait for TikTok (320x480px)
                              'w-full h-80' // Larger landscape for YouTube
                            }`}>
                              {getEmbedUrl(video.url, video.platform) ? (
                                <iframe
                                  src={getEmbedUrl(video.url, video.platform)!}
                                  title={video.title}
                                  className="w-full h-full rounded-xl"
                                  style={{ 
                                    border: 'none'
                                  }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  loading="lazy"
                                  frameBorder="0"
                                />
                              ) : video.thumbnail ? (
                                <div className="relative w-full h-full">
                                  <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                                      video.platform.toLowerCase() === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                      video.platform.toLowerCase() === 'tiktok' ? 'bg-black' :
                                      'bg-red-600'
                                    }`}>
                                      <Play className="h-6 w-6 text-white fill-white ml-1" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
                                  <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto ${
                                      video.platform.toLowerCase() === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                      video.platform.toLowerCase() === 'tiktok' ? 'bg-black' :
                                      'bg-red-600'
                                    }`}>
                                      <Play className="h-6 w-6 text-white" />
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">{video.platform} Video</p>
                                  </div>
                                </div>
                              )}
                            </div>

                           <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                             <span className="capitalize font-medium flex items-center gap-2">
                               {getPlatformIcon(video.platform)}
                               {video.platform}
                             </span>
                             {video.views && (
                               <span className="font-semibold">{video.views.toLocaleString()} views</span>
                             )}
                           </div>
                         </div>
                        ))}
                      </div>
                    ) : (
                   <div className="text-center py-12">
                     <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                       <Eye className="h-8 w-8 text-gray-400" />
                     </div>
                      <p className="text-gray-500 mb-4">No top performing content available for {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</p>
                      <p className="text-sm text-gray-400">Content will appear here once analytics data is available for this platform</p>
                    </div>
                  );
                 })()}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};