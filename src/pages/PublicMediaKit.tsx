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

// Define the exact same interface that CreatorProfiles uses
interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  platform_handles: Record<string, string>;
  demographics: {
    [platform: string]: {
      gender: Record<string, number>;
      age: Record<string, number>;
      location: Record<string, number>;
    };
  };
  stats: {
    [platform: string]: {
      followers: number;
      engagement: number;
      reach: number;
      views: number;
    };
  };
  topContent: Array<{
    title: string;
    platform: string;
    views: number;
    engagement: number;
    url: string;
    thumbnail?: string;
  }>;
  collaborations: Array<{
    id: string;
    name: string;
    brand: string;
    date: string;
    platform: string;
    views: number;
    engagement: number;
    logo?: string;
  }>;
}

export default function PublicMediaKit() {
  console.log('🔍 DEBUG: PublicMediaKit component rendered');
  
  const { creatorHandle } = useParams<{ creatorHandle: string }>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [currentCollaborationPage, setCurrentCollaborationPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collaborationsPerPage = 6;

  console.log('🔍 DEBUG: Component state - creatorHandle:', creatorHandle, 'isLoading:', isLoading, 'creatorProfile:', creatorProfile);

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
    switch (platformLower) {
      case 'youtube':
        return `https://www.youtube.com/@${handle}`;
      case 'instagram':
        return `https://www.instagram.com/${handle}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${handle}`;
      default:
        return '#';
    }
  };

  // EXACT SAME DATA FETCHING LOGIC AS CREATOR-PROFILES PAGE
  useEffect(() => {
    const fetchCreatorDataDirectly = async () => {
      console.log('🔍 DEBUG: fetchCreatorDataDirectly called');
      
      try {
        setIsLoading(true);
        setError(null);

        // Get the creator handle from the URL path directly
        const pathSegments = window.location.pathname.split('/');
        const urlCreatorHandle = pathSegments[pathSegments.length - 1];
        console.log('🔍 DEBUG: URL path segments:', pathSegments);
        console.log('🔍 DEBUG: Extracted creator handle from URL:', urlCreatorHandle);

        if (!urlCreatorHandle || urlCreatorHandle === '') {
          throw new Error('No creator handle found in URL');
        }

        // STEP 1: Fetch ALL creators (same as useCreators hook)
        console.log('🔍 DEBUG: Fetching all creators (same as creator-profiles)');
        const { data: allCreators, error: creatorsError } = await supabase
          .from('creators')
          .select('*')
          .order('name');

        if (creatorsError) {
          console.log('🔍 DEBUG: Creators fetch error:', creatorsError);
          throw creatorsError;
        }

        console.log('🔍 DEBUG: All creators fetched:', allCreators);
        console.log('🔍 DEBUG: Total creators in database:', allCreators?.length || 0);
        
        // Show all creator names for debugging
        if (allCreators && allCreators.length > 0) {
          console.log('🔍 DEBUG: Available creator names:');
          allCreators.forEach((creator, index) => {
            console.log(`  ${index + 1}. ID: ${creator.id}, Name: "${creator.name}", Handle: "${(creator as any).handle || 'N/A'}"`);
          });
        }

        // STEP 2: Fetch ALL campaigns (same as useCampaigns hook)
        console.log('🔍 DEBUG: Fetching all campaigns (same as creator-profiles)');
        const { data: allCampaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*');

        if (campaignsError) {
          console.log('🔍 DEBUG: Campaigns fetch error:', campaignsError);
          throw campaignsError;
        }

        console.log('🔍 DEBUG: All campaigns fetched:', allCampaigns);

        // STEP 3: Fetch ALL campaign creators (same as useCampaignCreators hook)
        console.log('🔍 DEBUG: Fetching all campaign creators (same as creator-profiles)');
        const { data: allCampaignCreators, error: campaignCreatorsError } = await supabase
          .from('campaign_creators')
          .select(`
            *,
            creators (name)
          `);

        if (campaignCreatorsError) {
          console.log('🔍 DEBUG: Campaign creators fetch error:', campaignCreatorsError);
          throw campaignCreatorsError;
        }

        console.log('🔍 DEBUG: All campaign creators fetched:', allCampaignCreators);

        // STEP 4: Find the creator using the EXACT SAME LOGIC as creator-profiles
        let matchedCreator = null;
        let matchStrategy = '';

        // Strategy 1: Exact name match (case-insensitive)
        matchedCreator = allCreators.find(creator => 
          creator.name?.toLowerCase() === urlCreatorHandle.toLowerCase()
        );
        if (matchedCreator) {
          matchStrategy = 'exact name match';
        }

        // Strategy 2: Name without spaces equals handle
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => 
            creator.name?.toLowerCase().replace(/\s+/g, '') === urlCreatorHandle.toLowerCase()
          );
          if (matchedCreator) {
            matchStrategy = 'name without spaces match';
          }
        }

        // Strategy 3: Name without spaces AND accents equals handle
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => {
            const normalizedName = creator.name
              ?.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove accents
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
            
            return normalizedName === urlCreatorHandle.toLowerCase();
          });
          if (matchedCreator) {
            matchStrategy = 'name without spaces and accents match';
          }
        }

        // Strategy 4: Name contains handle
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => 
            creator.name?.toLowerCase().includes(urlCreatorHandle.toLowerCase())
          );
          if (matchedCreator) {
            matchStrategy = 'name contains handle';
          }
        }

        // Strategy 5: Handle field match
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => 
            (creator as any).handle?.toLowerCase() === urlCreatorHandle.toLowerCase()
          );
          if (matchedCreator) {
            matchStrategy = 'handle field match';
          }
        }

        // Strategy 6: Partial name match (first word)
        if (!matchedCreator) {
          const firstWord = urlCreatorHandle.split(/[_-]/)[0]; // Handle edaatilla -> eda
          matchedCreator = allCreators.find(creator => 
            creator.name?.toLowerCase().startsWith(firstWord.toLowerCase())
          );
          if (matchedCreator) {
            matchStrategy = 'first word partial match';
          }
        }

        // Strategy 7: Normalized name contains normalized handle
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => {
            const normalizedName = creator.name
              ?.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove accents
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
            
            const normalizedHandle = urlCreatorHandle
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove accents
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
            
            return normalizedName.includes(normalizedHandle) || normalizedHandle.includes(normalizedName);
          });
          if (matchedCreator) {
            matchStrategy = 'normalized name contains handle';
          }
        }

        // Strategy 8: Fuzzy match - check if handle is a substring of normalized name
        if (!matchedCreator) {
          matchedCreator = allCreators.find(creator => {
            const normalizedName = creator.name
              ?.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove accents
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
            
            return normalizedName.includes(urlCreatorHandle.toLowerCase()) || 
                   urlCreatorHandle.toLowerCase().includes(normalizedName);
          });
          if (matchedCreator) {
            matchStrategy = 'fuzzy normalized match';
          }
        }

        console.log('🔍 DEBUG: Matching results:');
        console.log('  - URL Handle:', urlCreatorHandle);
        console.log('  - Match Strategy:', matchStrategy);
        console.log('  - Matched Creator:', matchedCreator);

        if (!matchedCreator) {
          // Show detailed debugging info
          console.log('🔍 DEBUG: NO MATCH FOUND - Detailed analysis:');
          console.log('  - URL Handle:', urlCreatorHandle);
          console.log('  - Available creators:', allCreators?.map(c => ({ name: c.name, handle: (c as any).handle })));
          
          // Show normalized names for debugging
          console.log('🔍 DEBUG: Normalized names for comparison:');
          allCreators?.forEach(creator => {
            const normalizedName = creator.name
              ?.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove accents
              .replace(/\s+/g, '') // Remove spaces
              .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
            
            console.log(`  - "${creator.name}" -> "${normalizedName}"`);
          });
          
          // Try to find similar names
          const similarNames = allCreators?.filter(creator => {
            const name = creator.name?.toLowerCase() || '';
            const handle = (creator as any).handle?.toLowerCase() || '';
            return name.includes(urlCreatorHandle.toLowerCase()) || 
                   handle.includes(urlCreatorHandle.toLowerCase()) ||
                   urlCreatorHandle.toLowerCase().includes(name) ||
                   urlCreatorHandle.toLowerCase().includes(handle);
          });
          
          console.log('🔍 DEBUG: Similar names found:', similarNames);
          
          throw new Error(`Creator not found: ${urlCreatorHandle}. Available creators: ${allCreators?.map(c => c.name).join(', ')}`);
        }

        console.log('🔍 DEBUG: SUCCESS - Creator matched using strategy:', matchStrategy);
        console.log('🔍 DEBUG: Matched creator details:', matchedCreator);

        // STEP 5: Process data using EXACT SAME LOGIC as creator-profiles
        console.log('🔍 DEBUG: Processing data using creator-profiles logic');
        
        // Get creator campaigns (same logic as creator-profiles)
        const creatorCampaigns = allCampaignCreators
          .filter(cc => cc.creator_id === matchedCreator.id)
          .map(cc => allCampaigns.find(c => c.id === cc.campaign_id))
          .filter(Boolean);

        console.log('🔍 DEBUG: Creator campaigns found:', creatorCampaigns);

        // Process analytics data (same logic as creator-profiles)
        let totalViews = 0;
        let totalEngagement = 0;
        const allVideos: Array<{
          title: string;
          platform: string;
          views: number;
          engagement: number;
          url: string;
          thumbnail?: string;
        }> = [];

        const brandCollaborations: Array<{
          id: string;
          name: string;
          brand: string;
          date: string;
          platform: string;
          views: number;
          engagement: number;
          logo?: string;
        }> = [];

        creatorCampaigns.forEach(campaign => {
          if (!campaign) return;

          const campaignViews = campaign.total_views || 0;
          const campaignEngagement = campaign.total_engagement || 0;

          // Add brand collaboration (same logic as creator-profiles)
          brandCollaborations.push({
            id: campaign.id,
            name: campaign.brand_name || 'Unknown Campaign',
            brand: campaign.brand_name || 'Unknown Brand',
            date: campaign.campaign_date || '',
            platform: 'youtube',
            views: campaignViews,
            engagement: campaignEngagement,
            logo: campaign.logo_url
          });

          // Process analytics data (same logic as creator-profiles)
          if (campaign.analytics_data) {
            Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
              if (Array.isArray(platformData)) {
                platformData.forEach((video: any) => {
                  const views = video.views || 0;
                  const engagement = video.engagement || 0;
                  
                  totalViews += views;
                  totalEngagement += engagement;

                  // Add to videos list (same logic as creator-profiles)
                  if (video.url && video.platform) {
                    allVideos.push({
                      title: video.title || `${platform} Video`,
                      platform: video.platform.toLowerCase(),
                      views,
                      engagement,
                      url: video.url,
                      thumbnail: video.thumbnail || video.thumbnail_url
                    });
                  }
                });
              }
            });
          } else {
            // Fallback to campaign totals (same logic as creator-profiles)
            totalViews += campaignViews;
            totalEngagement += campaignEngagement;
          }
        });

        console.log('🔍 DEBUG: Data processing results:');
        console.log('  - Total Views:', totalViews);
        console.log('  - Total Engagement:', totalEngagement);
        console.log('  - All Videos:', allVideos);
        console.log('  - Brand Collaborations:', brandCollaborations);

        // Get top 3 videos (same logic as creator-profiles)
        const topVideos = allVideos
          .sort((a, b) => b.views - a.views)
          .slice(0, 3);

        // Build the creator profile using the EXACT SAME structure
        const creatorProfileData: CreatorProfile = {
          id: matchedCreator.id,
          name: matchedCreator.name || 'Unknown Creator',
          handle: matchedCreator.name?.toLowerCase().replace(/\s+/g, '') || 'unknown',
          avatar: matchedCreator.avatar_url,
          bio: (matchedCreator as any).bio || 'Content creator and influencer',
          email: (matchedCreator as any).email || 'creator@example.com',
          phone: (matchedCreator as any).phone || '+1 (555) 123-4567',
          website: (matchedCreator as any).website || 'https://example.com',
          location: (matchedCreator as any).location || 'United States',
          platform_handles: matchedCreator.platform_handles as Record<string, string> || {
            youtube: matchedCreator.name?.toLowerCase().replace(/\s+/g, ''),
            instagram: matchedCreator.name?.toLowerCase().replace(/\s+/g, ''),
            tiktok: matchedCreator.name?.toLowerCase().replace(/\s+/g, '')
          },
          demographics: {
            youtube: {
              gender: { male: 20, female: 80 },
              age: { '18-24': 40, '25-34': 35, '35-44': 15, '45-54': 8, '55+': 2 },
              location: { 'United States': 60, 'Canada': 20, 'United Kingdom': 15, 'Other': 5 }
            },
            instagram: {
              gender: { male: 25, female: 75 },
              age: { '18-24': 45, '25-34': 30, '35-44': 15, '45-54': 8, '55+': 2 },
              location: { 'United States': 55, 'Canada': 25, 'United Kingdom': 15, 'Other': 5 }
            },
            tiktok: {
              gender: { male: 30, female: 70 },
              age: { '18-24': 50, '25-34': 25, '35-44': 15, '45-54': 8, '55+': 2 },
              location: { 'United States': 50, 'Canada': 30, 'United Kingdom': 15, 'Other': 5 }
            }
          },
          stats: {
            youtube: { followers: Math.round(totalViews * 0.05), engagement: totalEngagement > 0 ? (totalEngagement / totalViews) * 100 : 0, reach: totalViews, views: totalViews },
            instagram: { followers: Math.round(totalViews * 0.05), engagement: totalEngagement > 0 ? (totalEngagement / totalViews) * 100 : 0, reach: totalViews, views: totalViews },
            tiktok: { followers: Math.round(totalViews * 0.05), engagement: totalEngagement > 0 ? (totalEngagement / totalViews) * 100 : 0, reach: totalViews, views: totalViews }
          },
          topContent: topVideos,
          collaborations: brandCollaborations
        };

        console.log('🔍 DEBUG: Final creator profile built:', creatorProfileData);
        setCreatorProfile(creatorProfileData);
        setIsLoading(false);

      } catch (err) {
        console.error('🔍 DEBUG: Error in direct fetch:', err);
        setError(`Failed to load creator profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    console.log('🔍 DEBUG: useEffect triggered, calling direct fetch');
    fetchCreatorDataDirectly();
  }, []); // Empty dependency array - run once on mount

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'tiktok':
        return <Music className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'bg-red-500 hover:bg-red-600';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
      case 'tiktok':
        return 'bg-black hover:bg-gray-800';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Pagination for collaborations
  const totalCollaborationPages = Math.ceil((creatorProfile?.collaborations?.length || 0) / collaborationsPerPage);
  const currentCollaborations = creatorProfile?.collaborations?.slice(
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
                          src={creatorProfile?.avatar} 
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
                    <p className="text-lg text-gray-600">@{creatorProfile?.handle}</p>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h3>
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
                <div className="flex gap-2">
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
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5 text-[#3333cc]" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                    <div className="text-2xl font-bold text-black mb-1">
                      {creatorProfile?.stats[selectedPlatform]?.followers?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                    <div className="text-2xl font-bold text-black mb-1">
                      {creatorProfile?.stats[selectedPlatform]?.engagement?.toFixed(1) || '0'}%
                    </div>
                    <div className="text-sm text-gray-600">Engagement</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                    <div className="text-2xl font-bold text-black mb-1">
                      {creatorProfile?.stats[selectedPlatform]?.reach?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Reach</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                    <div className="text-2xl font-bold text-black mb-1">
                      {creatorProfile?.stats[selectedPlatform]?.views?.toLocaleString() || '0'}
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
                  Audience Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gender Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Gender Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(creatorProfile?.demographics[selectedPlatform]?.gender || {}).map(([gender, percentage]) => (
                      <div key={gender} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 capitalize w-16">{gender}</span>
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
                  <h4 className="font-semibold text-gray-700 mb-3">Age Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(creatorProfile?.demographics[selectedPlatform]?.age || {}).map(([age, percentage]) => (
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
                    ))}
                  </div>
                </div>

                {/* Location Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Top Locations</h4>
                  <div className="space-y-3">
                    {Object.entries(creatorProfile?.demographics[selectedPlatform]?.location || {}).map(([location, percentage]) => (
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
            {creatorProfile?.collaborations && creatorProfile.collaborations.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Heart className="h-5 w-5 text-[#F95738]" />
                    Brand Collaborations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {currentCollaborations.map((collab) => (
                      <div key={collab.id} className="p-4 bg-white rounded-xl border border-[#e6e6f7] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Company Logo */}
                          {collab.logo ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                              <img 
                                src={collab.logo} 
                                alt={collab.brand}
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
                                {collab.brand.split(' ').map(word => word[0]).join('').toUpperCase()}
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-[#3333cc] to-[#F4D35E] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {collab.brand.split(' ').map(word => word[0]).join('').toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{collab.brand}</h4>
                            <p className="text-sm text-gray-600">{collab.name}</p>
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
                  Top Performing Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creatorProfile?.topContent && creatorProfile.topContent.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creatorProfile.topContent
                      .slice(0, 3)
                      .map((video, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-medium text-gray-800 line-clamp-2">{video.title}</h4>
                          
                          <div className="bg-muted rounded-xl overflow-hidden border-2 relative" style={{ height: '500px' }}>
                            {getEmbedUrl(video.url, video.platform) ? (
                              <iframe
                                src={getEmbedUrl(video.url, video.platform)!}
                                title={video.title}
                                className="w-full h-full rounded-xl"
                                style={{ 
                                  border: 'none',
                                  height: '500px',
                                  width: '100%'
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                frameBorder="0"
                              />
                            ) : video.thumbnail ? (
                              <div className="relative w-full h-full" style={{ height: '500px' }}>
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title} 
                                  className="w-full h-full object-cover rounded-xl"
                                  style={{ height: '500px' }}
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
                              <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl" style={{ height: '500px' }}>
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

                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="capitalize">{video.platform}</span>
                            {video.views && (
                              <span>{video.views.toLocaleString()} views</span>
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
                    <p className="text-gray-500 mb-4">No top performing content available</p>
                    <p className="text-sm text-gray-400">Content will appear here once analytics data is available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};