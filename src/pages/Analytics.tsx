import React, { useState, useMemo } from 'react';
import { useCreators } from '@/hooks/useCreators';
import { useUserAccessibleCampaigns } from '@/hooks/useCampaignAssignments';
import { useAccessibleCampaigns } from '@/hooks/useAccessibleCampaigns';
import { useClients } from '@/hooks/useClients';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { useDealValueVisibility } from '@/hooks/useDealValueVisibility';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Eye, Users, TrendingUp, DollarSign, BarChart3, Search, Filter, Download, X, Play, Video, EyeOff, FileText, Link, Tag } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter';
import { AnalyticsExportCustomizationDialog, AnalyticsExportOptions } from '@/components/analytics/ExportCustomizationDialog';
import { CampaignTimelineChart } from '@/components/analytics/CampaignTimelineChart';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, ComposedChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AggregateMetrics {
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  campaignCount: number;
  avgCPV: number;
  totalPiecesOfContent: number;
}

interface PlatformBreakdown {
  [platform: string]: {
    views: number;
    engagement: number;
    campaigns: number;
  };
}

export default function Analytics() {
  const { data: campaigns = [], isLoading } = useAccessibleCampaigns();
  const { data: creators = [] } = useCreators();
  const { data: accessibleCampaignIds = [] } = useUserAccessibleCampaigns();
  const { data: clients = [] } = useClients();
  const { data: masterCampaigns = [] } = useMasterCampaigns();
  const { data: campaignCreators = [] } = useCampaignCreators();
  
  console.log('Analytics - Campaigns:', campaigns);
  console.log('Analytics - Creators:', creators);
  console.log('Analytics - Campaign Creators:', campaignCreators);
  console.log('Analytics - Accessible Campaign IDs:', accessibleCampaignIds);
  
  // Debug creator niches from campaign creators
  console.log('Analytics - Campaign Creators with niches:', campaignCreators.map(cc => ({
    campaignId: cc.campaign_id,
    creatorId: cc.creator_id,
    creatorName: cc.creators?.name,
    creatorNiche: cc.creators?.niche
  })).filter(cc => cc.creatorNiche && cc.creatorNiche.length > 0));
  
  // Debug creator niches from creators
  console.log('Analytics - Creators with niches:', creators.map(c => ({
    id: c.id,
    name: c.name,
    niche: c.niche
  })).filter(c => c.niche && c.niche.length > 0));
  
  // Get campaign creators for accessible campaigns only
  const campaignCreatorsMap = useMemo(() => {
    const map: { [campaignId: string]: any[] } = {};
    // This will be populated by individual campaign creator queries
    return map;
  }, []);
  
  // Filter creators based on accessible campaigns
  const filteredCreators = useMemo(() => {
    if (accessibleCampaignIds.length === 0) {
      // Admin sees all creators
      return creators;
    }
    // Client sees only creators from accessible campaigns
    const accessibleCreatorIds = new Set();
    campaignCreators.forEach(cc => {
      if (accessibleCampaignIds.includes(cc.campaign_id)) {
        accessibleCreatorIds.add(cc.creator_id);
      }
    });
    const filtered = creators.filter(creator => accessibleCreatorIds.has(creator.id));
    
    console.log('Filtered creators for niche filtering:', filtered.map(c => ({
      id: c.id,
      name: c.name,
      niche: c.niche
    })));
    
    return filtered;
  }, [creators, campaignCreators, accessibleCampaignIds]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creatorFilters, setCreatorFilters] = useState<string[]>([]);
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [masterCampaignFilters, setMasterCampaignFilters] = useState<string[]>([]);
  const [campaignFilters, setCampaignFilters] = useState<string[]>([]);
  const [nicheFilters, setNicheFilters] = useState<string[]>([]);
  const [creatorViewMode, setCreatorViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [videoPlatformFilter, setVideoPlatformFilter] = useState<string>('all');
  const [usePercentEngagement, setUsePercentEngagement] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { showDealValue, setShowDealValue } = useDealValueVisibility();
  const [bubbleCreatorFilter, setBubbleCreatorFilter] = useState<string[]>([]);

  // Comparison tab state
  const [comparisonItems, setComparisonItems] = useState<Array<{
    id: string;
    type: 'creator' | 'campaign';
    name: string;
    data: any;
  }>>([]);
  const [bubbleCampaignFilter, setBubbleCampaignFilter] = useState<string[]>([]);
  const [bubblePlatformFilter, setBubblePlatformFilter] = useState<string[]>([]);
  const [bubbleNicheFilter, setBubbleNicheFilter] = useState<string[]>([]);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [excludedVideos, setExcludedVideos] = useState<Set<string>>(new Set());

  // Create a creator lookup map for better performance
  const creatorLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    filteredCreators.forEach(creator => {
      lookup.set(creator.id, creator.name);
    });
    return lookup;
  }, [filteredCreators]);

  // Use the same niche options as in CreatorManagement
const NICHE_OPTIONS = [
  'Technology & Digital',
  'Gaming',
  'Education & Learning',
  'Lifestyle & Vlogging',
  'Health & Fitness',
  'Food & Cooking',
  'Business & Finance',
  'Arts & Creativity',
  'Entertainment & Commentary',
  'Music',
  'Travel & Adventure',
  'Beauty & Fashion',
  'Automotive',
  'Home & Living',
  'Film, TV & Media',
  'Science & Curiosity',
  'Politics & Society',
  'Animals & Pets',
  'ASMR & Relaxation',
  'Other'
].sort();

  // Get unique niches from filtered creators (for validation)
  const uniqueNiches = useMemo(() => {
    const niches = new Set<string>();
    filteredCreators.forEach(creator => {
      if (creator.niche && Array.isArray(creator.niche)) {
        creator.niche.forEach(niche => {
          if (niche && niche.trim()) {
            niches.add(niche.trim());
          }
        });
      }
    });
    return Array.from(niches).sort();
  }, [filteredCreators]);

  // Get campaign creators data using the hook (already defined above)

  // Build URL -> creator mapping per campaign
  const normalizeUrl = (url?: string) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      
      // Special handling for YouTube URLs - preserve video ID
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        if (u.hostname.includes('youtu.be')) {
          // Convert youtu.be/VIDEO_ID to youtube.com/watch?v=VIDEO_ID format
          const videoId = u.pathname.slice(1); // Remove leading slash
          return `https://www.youtube.com/watch?v=${videoId}`;
        } else if (u.pathname === '/watch' && u.searchParams.get('v')) {
          // Keep the video ID parameter for /watch URLs
          const videoId = u.searchParams.get('v');
          return `https://www.youtube.com/watch?v=${videoId}`;
        } else if (u.pathname.startsWith('/shorts/')) {
          // Convert /shorts/VIDEO_ID to standard watch format
          const videoId = u.pathname.replace('/shorts/', '');
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      
      // For other URLs, normalize by removing hash and most search params
      u.hash = '';
      // Keep essential parameters but remove tracking ones
      const paramsToKeep = ['v', 'p']; // YouTube video ID, Instagram post ID
      const newParams = new URLSearchParams();
      paramsToKeep.forEach(param => {
        const value = u.searchParams.get(param);
        if (value) newParams.set(param, value);
      });
      u.search = newParams.toString();
      
      return u.toString().replace(/\/$/, '');
    } catch {
      return url.trim().replace(/\/$/, '');
    }
  };

  const urlToCreatorByCampaign = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    (campaignCreators || []).forEach(cc => {
      const inner = map.get(cc.campaign_id) ?? new Map<string, string>();
      const content = cc.content_urls || {} as Record<string, string[]>;
      Object.values(content).forEach((arr) => {
        (arr || []).forEach((raw) => {
          const norm = normalizeUrl(raw);
          if (norm) {
            inner.set(norm, cc.creator_id);
            
            // Debug logging for specific Revolut URLs
            if (raw.includes('odZoOB29poE') || raw.includes('9H88OV98tao') || raw.includes('DhWWy4c2t84')) {
              console.log('🔍 URL MAPPING DEBUG:', {
                originalUrl: raw,
                normalizedUrl: norm,
                campaignId: cc.campaign_id,
                creatorId: cc.creator_id,
                creatorName: filteredCreators?.find(c => c.id === cc.creator_id)?.name || 'Unknown'
              });
            }
          }
        });
      });
      map.set(cc.campaign_id, inner);
    });
    return map;
  }, [campaignCreators, filteredCreators]);

  const getCreatorIdForUrl = (campaignId: string, url?: string) => {
    const inner = urlToCreatorByCampaign.get(campaignId);
    if (!inner || !url) return undefined;
    const norm = normalizeUrl(url);
    const creatorId = inner.get(norm);
    
    // Debug logging for Revolut campaign URLs
    if (url && (url.includes('odZoOB29poE') || url.includes('9H88OV98tao') || url.includes('DhWWy4c2t84'))) {
      console.log('🔍 DEBUG URL Attribution:', {
        originalUrl: url,
        normalizedUrl: norm,
        campaignId,
        foundCreatorId: creatorId,
        creatorName: creatorId ? creatorLookup.get(creatorId) : 'Not found',
        allMappingsForCampaign: inner ? Array.from(inner.entries()).slice(0, 5) : 'No mappings'
      });
    }
    
    return creatorId;
  };

  // Helper function to resolve creator for a campaign using campaign_creators
  const resolveCreatorForCampaign = (campaign: Campaign) => {
    if (!campaignCreators || !filteredCreators) {
      return { id: 'unknown', name: 'Unknown Creator' };
    }

    // Find all creators associated with this campaign
    const campaignCreatorData = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
    
    if (campaignCreatorData.length > 0) {
      // Use the first creator if multiple (most campaigns have one main creator)
      // IMPORTANT: This should only be used as fallback when URL-specific attribution fails
      const creator = filteredCreators.find(c => c.id === campaignCreatorData[0].creator_id);
      if (creator) {
        // Debug logging for multi-creator campaigns
        if (campaignCreatorData.length > 1) {
          console.warn(`⚠️ FALLBACK: Using first creator for multi-creator campaign "${campaign.brand_name}":`, {
            selectedCreator: creator.name,
            allCreators: campaignCreatorData.map(cc => {
              const c = filteredCreators.find(cr => cr.id === cc.creator_id);
              return c ? c.name : 'Unknown';
            })
          });
        }
        
        return {
          id: creator.id,
          name: creator.name
        };
      }
    }

    // Fallback logic using campaign.creator_id if no campaign_creators association
    if (campaign.creator_id && creatorLookup.has(campaign.creator_id)) {
      return {
        id: campaign.creator_id,
        name: creatorLookup.get(campaign.creator_id)!
      };
    }

    // Fallback to Via Infinda for campaigns without associated creators
    const viaInfindaCreator = creators.find(c => c.name === "Via Infinda");
    if (viaInfindaCreator) {
      return {
        id: viaInfindaCreator.id,
        name: viaInfindaCreator.name
      };
    }

    // Final fallback
    if (creators.length > 0) {
      return {
        id: creators[0].id,
        name: creators[0].name
      };
    }

    return {
      id: 'unknown',
      name: 'Unknown Creator'
    };
  };

  // Filter campaigns based on search and filters
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // First check if user has access to this campaign
      const hasAccess = accessibleCampaignIds.length === 0 || accessibleCampaignIds.includes(campaign.id);
      if (!hasAccess) return false;
      
      const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resolveCreatorForCampaign(campaign).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.master_campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesCreator = creatorFilters.length === 0 || 
        // Check if any selected creator has URLs within this campaign's analytics
        (() => {
          const creatorIdsInCampaign = new Set<string>();

          if (campaign.analytics_data) {
            Object.values(campaign.analytics_data).forEach((platformData: any) => {
              if (Array.isArray(platformData)) {
                platformData.forEach((item: any) => {
                  const cid = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                  if (cid) creatorIdsInCampaign.add(cid);
                });
              }
            });
          }

          // Fallback: include linked creators even if analytics_data is missing
          if (creatorIdsInCampaign.size === 0) {
            (campaignCreators || [])
              .filter(cc => cc.campaign_id === campaign.id)
              .forEach(cc => creatorIdsInCampaign.add(cc.creator_id));
          }

          return [...creatorIdsInCampaign].some(id => creatorFilters.includes(id));
        })();
      const matchesClient = clientFilters.length === 0 || (campaign.client_id && clientFilters.includes(campaign.client_id));
      const matchesMasterCampaign = masterCampaignFilters.length === 0 || 
        (campaign.master_campaign_name && masterCampaignFilters.includes(campaign.master_campaign_name));
      
      const matchesNiche = nicheFilters.length === 0 || 
        (() => {
          // Get creator data for this campaign from campaign_creators
          const campaignCreatorData = (campaignCreators || [])
            .filter(cc => cc.campaign_id === campaign.id);

          console.log(`Niche filter check for campaign ${campaign.brand_name}:`, {
            campaignId: campaign.id,
            campaignCreatorData: campaignCreatorData.map(cc => ({
              creatorId: cc.creator_id,
              creatorName: cc.creators?.name,
              creatorNiche: cc.creators?.niche,
              contentUrls: cc.content_urls
            })),
            nicheFilters
          });

          // Check if any creator in this campaign has a matching niche
          const hasMatchingNiche = campaignCreatorData.some(cc => {
            const creatorNiche = cc.creators?.niche;
            const matches = creatorNiche && Array.isArray(creatorNiche) && 
                   creatorNiche.some(niche => nicheFilters.includes(niche));
            
            console.log(`Creator ${cc.creators?.name} (${cc.creator_id}):`, { 
              niche: creatorNiche, 
              matches,
              contentUrls: cc.content_urls
            });
            
            return matches;
          });

          console.log(`Campaign ${campaign.brand_name} niche match:`, hasMatchingNiche);
          return hasMatchingNiche;
        })();

      return matchesSearch && matchesStatus && matchesCreator && matchesClient && matchesMasterCampaign && matchesNiche;
    });
  }, [campaigns, accessibleCampaignIds, searchTerm, statusFilter, creatorFilters, clientFilters, masterCampaignFilters, nicheFilters, campaignCreators]);
  
  console.log('Analytics - Filtered Campaigns:', filteredCampaigns);

  // Calculate aggregate metrics for selected campaigns
  const aggregateMetrics = useMemo((): AggregateMetrics => {
    // Use filtered campaigns that match current filters
    const selectedCampaignData = filteredCampaigns;

    const totalViews = selectedCampaignData.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = selectedCampaignData.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    
    const totalDealValue = selectedCampaignData.reduce((sum, c) => {
      const fixed = c.fixed_deal_value || 0;
      const variable = c.variable_deal_value || 0;
      return sum + fixed + variable;
    }, 0);
    const avgCPV = totalViews > 0 ? totalDealValue / totalViews : 0;

    // Calculate total pieces of content
    const totalPiecesOfContent = selectedCampaignData.reduce((sum, campaign) => {
      let contentCount = 0;
      
      // Count URLs from campaign creators
      const campaignCreatorData = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
      campaignCreatorData.forEach(cc => {
        const contentUrls = cc.content_urls || {};
        Object.values(contentUrls).forEach((urls: any) => {
          if (Array.isArray(urls)) {
            contentCount += urls.filter(url => url && url.trim()).length;
          }
        });
      });
      
      return sum + contentCount;
    }, 0);

    console.log('Analytics - Aggregate calculation:', {
      campaignCount: selectedCampaignData.length,
      totalViews,
      totalEngagement,
      avgEngagementRate,
      campaigns: selectedCampaignData.map(c => ({
        name: c.brand_name,
        views: c.total_views,
        engagement: c.total_engagement,
        analytics_data: c.analytics_data
      }))
    });

    return {
      totalViews,
      totalEngagement,
      avgEngagementRate,
      campaignCount: selectedCampaignData.length,
      avgCPV,
      totalPiecesOfContent
    };
  }, [filteredCampaigns, campaignCreators]);

  // Calculate platform breakdown
  const platformBreakdown = useMemo((): PlatformBreakdown => {
    const selectedCampaignData = filteredCampaigns;
    const breakdown: PlatformBreakdown = {};

    selectedCampaignData.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.keys(campaign.analytics_data).forEach(platform => {
          if (!breakdown[platform]) {
            breakdown[platform] = { views: 0, engagement: 0, campaigns: 0 };
          }
          
          const platformData = campaign.analytics_data[platform];
          if (Array.isArray(platformData)) {
            platformData.forEach((item: any) => {
              breakdown[platform].views += item.views || 0;
              breakdown[platform].engagement += item.engagement || 0;
            });
          }
          breakdown[platform].campaigns += 1;
        });
      }
    });

    return breakdown;
  }, [filteredCampaigns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const selectedCampaignData = filteredCampaigns;

    if (creatorViewMode) {
      // Build by creator using URL-level attribution
      const creatorData: { [creatorId: string]: { views: number; engagement: number; campaigns: Set<string>; creatorName: string } } = {};

      selectedCampaignData.forEach(campaign => {
        const addToCreator = (creatorId?: string, views: number = 0, engagement: number = 0) => {
          if (!creatorId) return;
          const creatorName = creatorLookup.get(creatorId) || 'Unknown Creator';
          if (!creatorData[creatorId]) {
            creatorData[creatorId] = { views: 0, engagement: 0, campaigns: new Set<string>(), creatorName };
          }
          creatorData[creatorId].views += views;
          creatorData[creatorId].engagement += engagement;
          creatorData[creatorId].campaigns.add(campaign.id);
        };

        // First try to use URL analytics (most accurate for multi-creator campaigns)
        // Note: Individual campaign URL analytics would need to be fetched per campaign
        let hasAttributedViews = false;

        // Try analytics_data with proper creator attribution
        if (campaign.analytics_data && !hasAttributedViews) {
          Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
            if (Array.isArray(platformData)) {
              platformData.forEach((item: any) => {
                const cid = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                if (cid) {
                  addToCreator(cid, item.views || 0, item.engagement || 0);
                  hasAttributedViews = true;
                } else {
                  // Debug when URL attribution fails
                  if (campaign.brand_name.includes('Revolut') && campaign.brand_name.includes('Via')) {
                    console.warn(`❌ Failed to attribute URL in ${campaign.brand_name}:`, {
                      url: item.url || item.content_url,
                      views: item.views,
                      platform,
                      availableCreators: campaignCreators.filter(cc => cc.campaign_id === campaign.id).map(cc => ({
                        creatorId: cc.creator_id,
                        creatorName: filteredCreators?.find(c => c.id === cc.creator_id)?.name,
                        urls: cc.content_urls
                      }))
                    });
                  }
                }
              });
            }
          });
        }

        // Only use campaign totals as last resort and handle multi-creator campaigns properly
        if (!hasAttributedViews) {
          const campaignCreatorData = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
          
          if (campaignCreatorData.length === 1) {
            // Single creator - safe to attribute all views
            const creatorId = campaignCreatorData[0].creator_id;
            addToCreator(creatorId, campaign.total_views || 0, campaign.total_engagement || 0);
          } else if (campaignCreatorData.length > 1) {
            // Multi-creator campaign with no granular data - distribute evenly as a fallback
            const viewsPerCreator = Math.floor((campaign.total_views || 0) / campaignCreatorData.length);
            const engagementPerCreator = Math.floor((campaign.total_engagement || 0) / campaignCreatorData.length);
            
            campaignCreatorData.forEach(cc => {
              addToCreator(cc.creator_id, viewsPerCreator, engagementPerCreator);
            });

            console.warn(`⚠️ Multi-creator campaign "${campaign.brand_name}" has no granular analytics data. Views distributed evenly among ${campaignCreatorData.length} creators.`);
          } else {
            // No creators found - use fallback
            const fallback = resolveCreatorForCampaign(campaign);
            addToCreator(fallback.id, campaign.total_views || 0, campaign.total_engagement || 0);
          }
        }
      });

      // Sort by views descending to show most active creators first
      return Object.values(creatorData)
        .filter(data => data.views > 0 || data.campaigns.size > 0)
        .sort((a, b) => b.views - a.views)
        .map((data) => ({
          platform: data.creatorName,
          views: data.views,
          engagement: data.engagement,
          campaigns: data.campaigns.size,
          engagementRate: data.views > 0 ? ((data.engagement / data.views) * 100) : 0
        }));
    } else {
      // Group by platform
      const platformData = Object.entries(platformBreakdown).map(([platform, data]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        views: data.views,
        engagement: data.engagement,
        campaigns: data.campaigns,
        engagementRate: data.views > 0 ? ((data.engagement / data.views) * 100) : 0
      }));

      return platformData.filter(data => data.views > 0 || data.campaigns > 0);
    }
  }, [platformBreakdown, filteredCampaigns, creatorViewMode, resolveCreatorForCampaign]);

  const pieData = useMemo(() => {
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

  if (creatorViewMode) {
      // Group by creator using URL-level attribution
      const creatorViews: { [creatorId: string]: { views: number; creatorName: string } } = {};
      
      selectedCampaignData.forEach(campaign => {
        // First try analytics_data with proper creator attribution
        let hasAttributedViews = false;

        if (campaign.analytics_data) {
          Object.entries(campaign.analytics_data).forEach(([_, platformData]: [string, any]) => {
            if (Array.isArray(platformData)) {
              platformData.forEach((item: any) => {
                const cid = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                if (cid) {
                  const name = creatorLookup.get(cid) || 'Unknown Creator';
                  if (!creatorViews[cid]) creatorViews[cid] = { views: 0, creatorName: name };
                  creatorViews[cid].views += item.views || 0;
                  hasAttributedViews = true;
                } else {
                  // Debug when URL attribution fails for pie chart
                  if (campaign.brand_name.includes('Revolut') && campaign.brand_name.includes('Via')) {
                    console.warn(`❌ PIE CHART: Failed to attribute URL in ${campaign.brand_name}:`, {
                      url: item.url || item.content_url,
                      views: item.views
                    });
                  }
                }
              });
            }
          });
        }

        // Handle campaigns without granular data
        if (!hasAttributedViews) {
          const campaignCreatorData = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
          
          if (campaignCreatorData.length === 1) {
            // Single creator - safe to attribute all views
            const creatorId = campaignCreatorData[0].creator_id;
            const name = creatorLookup.get(creatorId) || 'Unknown Creator';
            if (!creatorViews[creatorId]) creatorViews[creatorId] = { views: 0, creatorName: name };
            creatorViews[creatorId].views += campaign.total_views || 0;
          } else if (campaignCreatorData.length > 1) {
            // Multi-creator campaign - distribute evenly
            const viewsPerCreator = Math.floor((campaign.total_views || 0) / campaignCreatorData.length);
            
            campaignCreatorData.forEach(cc => {
              const name = creatorLookup.get(cc.creator_id) || 'Unknown Creator';
              if (!creatorViews[cc.creator_id]) creatorViews[cc.creator_id] = { views: 0, creatorName: name };
              creatorViews[cc.creator_id].views += viewsPerCreator;
            });
          } else {
            // Fallback to resolved creator
            const fallback = resolveCreatorForCampaign(campaign);
            if (!creatorViews[fallback.id]) creatorViews[fallback.id] = { views: 0, creatorName: fallback.name };
            creatorViews[fallback.id].views += campaign.total_views || 0;
          }
        }
      });

      const creatorColors = [
        'hsl(var(--primary))',
        'hsl(var(--brand-accent-green))',
        'hsl(var(--teal))',
        'hsl(var(--orange))',
        'hsl(var(--secondary))',
        'hsl(var(--destructive))',
        'hsl(var(--muted-foreground))',
        'hsl(var(--accent))',
      ];
      
      return Object.values(creatorViews).map((data, index) => ({
        name: data.creatorName,
        value: data.views,
        fill: creatorColors[index % creatorColors.length]
      }));
    } else {
      // Group by platform - match bar chart colors
      const platformColors = [
        'hsl(var(--primary))',        // YouTube
        'hsl(var(--brand-accent-green))', // Instagram  
        'hsl(var(--chart-3))',       // TikTok - back to chart-3
        'hsl(var(--chart-4))',       // Additional platforms
        'hsl(var(--secondary))',     // Additional platforms
      ];
      
      return Object.entries(platformBreakdown).map(([platform, data], index) => ({
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        value: data.views,
        fill: platformColors[index % platformColors.length]
      }));
    }
  }, [platformBreakdown, campaignFilters, campaigns, filteredCampaigns, creatorViewMode, creatorLookup]);

  // Video analytics data
  const videoAnalytics = useMemo(() => {
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

    const videos: Array<{
      id: string;
      title: string;
      platform: string;
      campaign: string;
      creator: string;
      views: number;
      engagement: number;
      engagementRate: number;
      url: string;
    }> = [];

    selectedCampaignData.forEach(campaign => {
      const resolvedCreator = resolveCreatorForCampaign(campaign);
      
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            platformData.forEach((video: any, index: number) => {
              videos.push({
                id: `${campaign.id}-${platform}-${index}`,
                title: video.title || campaign.brand_name,
                platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                campaign: campaign.brand_name,
                creator: (() => {
                  const cid = getCreatorIdForUrl(campaign.id, video.url || video.content_url);
                  if (cid) return creatorLookup.get(cid) || 'Unknown Creator';
                  return resolvedCreator.name;
                })(),
                views: video.views || 0,
                engagement: video.engagement || 0,
                engagementRate: video.views > 0 ? ((video.engagement / video.views) * 100) : 0,
                url: video.url || ''
              });
            });
          }
        });
      }
    });

    return videos.sort((a, b) => b.views - a.views);
  }, [campaigns, campaignFilters, filteredCampaigns, creatorLookup]);

  // Filtered video analytics based on platform filter
  const filteredVideoAnalytics = useMemo(() => {
    if (videoPlatformFilter === 'all') {
      return videoAnalytics;
    }
    return videoAnalytics.filter(video => 
      video.platform.toLowerCase() === videoPlatformFilter.toLowerCase()
    );
  }, [videoAnalytics, videoPlatformFilter]);

  const topVideosByPlatform = useMemo(() => {
    const platformGroups: { [platform: string]: typeof filteredVideoAnalytics } = {};
    
    filteredVideoAnalytics.forEach(video => {
      if (!platformGroups[video.platform]) {
        platformGroups[video.platform] = [];
      }
      platformGroups[video.platform].push(video);
    });

    return Object.entries(platformGroups).map(([platform, videos]) => ({
      platform,
      videos: videos.slice(0, 5), // Top 5 videos per platform
      totalViews: videos.reduce((sum, v) => sum + v.views, 0),
      totalEngagement: videos.reduce((sum, v) => sum + v.engagement, 0)
    }));
  }, [filteredVideoAnalytics]);

  // Bubble distribution helpers and data
  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'hsl(var(--primary))';
    if (p.includes('instagram')) return 'hsl(var(--brand-accent-green))';
    if (p.includes('tiktok')) return 'hsl(var(--teal))';
    return 'hsl(var(--secondary))';
  };

  const numberCompact = (value: number) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toString();
  };

  const bubbleSeries = useMemo(() => {
    // Start with raw video analytics data, not the pre-filtered version
    let bubbleVideoData = videoAnalytics;
    
    // Apply excluded videos filter first
    bubbleVideoData = bubbleVideoData.filter(v => 
      !excludedVideos.has(`${v.campaign}-${v.url}`)
    );
    
    // Apply bubble chart specific platform filter
    if (bubblePlatformFilter.length > 0) {
      bubbleVideoData = bubbleVideoData.filter(v => 
        bubblePlatformFilter.includes(v.platform.toLowerCase())
      );
    }
    
    // Apply bubble chart specific campaign filter
    if (bubbleCampaignFilter.length > 0) {
      bubbleVideoData = bubbleVideoData.filter(v => 
        campaigns.some(c => c.id && bubbleCampaignFilter.includes(c.id) && c.brand_name === v.campaign)
      );
    }
    
    // Apply bubble chart specific creator filter
    if (bubbleCreatorFilter.length > 0) {
      const selectedCreatorNames = bubbleCreatorFilter.map(creatorId => 
        creators.find(c => c.id === creatorId)?.name
      ).filter(Boolean);
      
      bubbleVideoData = bubbleVideoData.filter(v => 
        selectedCreatorNames.includes(v.creator)
      );
    }
    
    // Apply bubble chart specific niche filter
    if (bubbleNicheFilter.length > 0) {
      bubbleVideoData = bubbleVideoData.filter(v => {
        // Find the campaign for this video
        const campaign = campaigns.find(c => c.brand_name === v.campaign);
        if (!campaign) return false;
        
        // Get creators associated with this campaign
        const campaignCreatorData = (campaignCreators || [])
          .filter(cc => cc.campaign_id === campaign.id);
        
        // Check if any creator in this campaign has a matching niche
        return campaignCreatorData.some(cc => {
          const creatorNiche = cc.creators?.niche;
          return creatorNiche && Array.isArray(creatorNiche) && 
                 creatorNiche.some(niche => bubbleNicheFilter.includes(niche));
        });
      });
    }
    
    // Apply master campaign filter (keep existing)
    if (masterCampaignFilters.length > 0) {
      bubbleVideoData = bubbleVideoData.filter(v => 
        campaigns.some(c => 
          c.brand_name === v.campaign && 
          c.master_campaign_name && 
          masterCampaignFilters.includes(c.master_campaign_name)
        )
      );
    }
    
    const groups: Record<string, Array<{ x: number; y: number; size: number; url: string; title: string; campaign: string; creator: string; platform: string }>> = {};
    bubbleVideoData.forEach(v => {
      const rate = v.engagementRate || (v.views ? (v.engagement / v.views) * 100 : 0);
      const size = Math.max(5, Math.min(25, rate));
      const item = {
        x: usePercentEngagement ? rate : v.engagement,
        y: v.views,
        size,
        url: v.url,
        title: v.title,
        campaign: v.campaign,
        creator: v.creator,
        platform: v.platform,
      };
      (groups[v.platform] ||= []).push(item);
    });
    
    console.log('Bubble series data:', { 
      bubblePlatformFilter, 
      bubbleVideoDataLength: bubbleVideoData.length, 
      groupsKeys: Object.keys(groups),
      groups 
    });
    
    return groups;
  }, [videoAnalytics, excludedVideos, usePercentEngagement, bubblePlatformFilter, bubbleCampaignFilter, bubbleCreatorFilter, bubbleNicheFilter, masterCampaignFilters, campaigns, creators, campaignCreators]);

  const renderBubbleTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    const videoKey = `${p.campaign}-${p.url}`;
    const isExcluded = excludedVideos.has(videoKey);
    
    return (
      <div 
        className="rounded-md border bg-background p-3 text-xs shadow-lg min-w-[200px] pointer-events-auto"
        onMouseEnter={(e) => e.preventDefault()}
        onMouseLeave={(e) => e.preventDefault()}
      >
        <div className="font-medium text-foreground">{p.campaign}</div>
        <div className="text-muted-foreground mb-2">{p.platform} • {p.creator}</div>
        <div className="space-y-1">
          <div>Views: {p.y.toLocaleString()}</div>
          <div>{usePercentEngagement ? 'Engagement %' : 'Engagement'}: {usePercentEngagement ? `${(p.x as number).toFixed(1)}%` : (p.x as number).toLocaleString()}</div>
          <div>Eng. Rate: {p.size.toFixed(1)}%</div>
        </div>
        <div className="mt-2 pt-2 border-t border-border flex gap-2">
          <button
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isExcluded 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExcludedVideos(prev => {
                const newSet = new Set(prev);
                if (isExcluded) {
                  newSet.delete(videoKey);
                } else {
                  newSet.add(videoKey);
                }
                return newSet;
              });
            }}
          >
            {isExcluded ? 'Include' : 'Exclude'}
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (p.url) window.open(p.url, '_blank', 'noopener,noreferrer');
            }}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  const handleCreatorFilterChange = (creatorId: string) => {
    setCreatorFilters(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleClientFilterChange = (clientId: string) => {
    setClientFilters(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const removeCreatorFilter = (creatorId: string) => {
    setCreatorFilters(prev => prev.filter(id => id !== creatorId));
  };

  const removeClientFilter = (clientId: string) => {
    setClientFilters(prev => prev.filter(id => id !== clientId));
  };

  const handleCampaignFilterChange = (campaignId: string) => {
    setCampaignFilters(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const removeCampaignFilter = (campaignId: string) => {
    setCampaignFilters(prev => prev.filter(id => id !== campaignId));
  };

  const handleNicheFilterChange = (niche: string) => {
    setNicheFilters(prev => 
      prev.includes(niche) 
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    );
  };

  const removeNicheFilter = (niche: string) => {
    setNicheFilters(prev => prev.filter(n => n !== niche));
  };

  const handleMasterCampaignFilterChange = (masterCampaignName: string) => {
    setMasterCampaignFilters(prev => 
      prev.includes(masterCampaignName) 
        ? prev.filter(name => name !== masterCampaignName)
        : [...prev, masterCampaignName]
    );
  };

  const removeMasterCampaignFilter = (masterCampaignName: string) => {
    setMasterCampaignFilters(prev => prev.filter(name => name !== masterCampaignName));
  };

  const handleExportPDF = async (options: AnalyticsExportOptions) => {
    try {
      const campaignsToExport = campaignFilters.length > 0 
        ? campaigns.filter(c => campaignFilters.includes(c.id))
        : filteredCampaigns;

      if (campaignsToExport.length === 0) {
        toast.error('No campaigns to export');
        return;
      }

      // Enrich campaigns with resolved creator names for accurate reporting
      const enrichedCampaigns = campaignsToExport.map((c) => ({
        ...c,
        creators: { name: resolveCreatorForCampaign(c).name },
      }));

      // Use the enhanced text-first PDF exporter (with optional chart capture from the current view)
      const exporter = new EnhancedPDFExporter();
      const exportTitle = options.customTitle || 'Campaign Analytics Report';

      // If charts requested, temporarily switch to the Videos tab so charts are visible for capture
      const prevTab = activeTab;
      if (options.includeCharts) {
        setActiveTab('videos');
        await new Promise((r) => setTimeout(r, 350));
      }

      await exporter.exportWithCharts(enrichedCampaigns, exportTitle, {
        includeAnalytics: options.includeAnalytics,
        includeContentUrls: options.includeContentUrls,
        includeCharts: options.includeCharts,
        includeLogo: true,
        getCreatorNameForUrl: (campaignId: string, url: string) => {
          const cid = getCreatorIdForUrl(campaignId, url);
          if (!cid) return undefined;
          return creatorLookup.get(cid) || undefined;
        },
        topVideos: filteredVideoAnalytics.slice(0, 10).map(v => ({
          title: v.title,
          url: v.url,
          platform: v.platform,
          views: v.views,
          engagement: v.engagement,
          engagementRate: v.engagementRate,
        })),
      });

      // Restore previous tab
      if (options.includeCharts) {
        setActiveTab(prevTab);
      }

      toast.success(`PDF report exported with ${campaignsToExport.length} campaigns`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">BV Analytics</h1>
            <p className="text-muted-foreground">
              Aggregate view of all campaigns with filtering capabilities
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="deal-value-toggle"
                checked={showDealValue}
                onCheckedChange={setShowDealValue}
              />
              <Label htmlFor="deal-value-toggle" className="text-sm">
                {showDealValue ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Label>
              <span className="text-sm text-muted-foreground">Deal Value</span>
            </div>
            <Button 
              onClick={() => setExportDialogOpen(true)} 
              disabled={filteredCampaigns.length === 0}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Badge variant="outline" className="text-sm">
              {campaignFilters.length > 0 ? `${campaignFilters.length} campaigns selected` : `${filteredCampaigns.length} campaigns`}
            </Badge>
          </div>
        </div>

        {/* Compact Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Campaigns"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Creators Filter */}
              <Select onValueChange={handleCreatorFilterChange}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Creators" />
                </SelectTrigger>
                <SelectContent>
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clients Filter */}
              <Select onValueChange={handleClientFilterChange}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Clients" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Campaigns Filter */}
              <Select onValueChange={handleCampaignFilterChange}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCampaigns
                    .sort((a, b) => a.brand_name.localeCompare(b.brand_name))
                    .map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.brand_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Master Campaigns Filter */}
              <Select onValueChange={handleMasterCampaignFilterChange}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Master Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  {masterCampaigns.map((masterCampaign) => (
                    <SelectItem key={masterCampaign.name} value={masterCampaign.name}>
                      {masterCampaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Niches Filter */}
              <Select onValueChange={handleNicheFilterChange}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Niches" />
                </SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Hide Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-9 px-3"
              >
                <Filter className="h-4 w-4 mr-1" />
                Hide filters
              </Button>
            </div>

            {/* Active Filter Tags */}
            {(creatorFilters.length > 0 || clientFilters.length > 0 || campaignFilters.length > 0 || masterCampaignFilters.length > 0 || nicheFilters.length > 0) && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-2">
                  {creatorFilters.map((creatorId) => {
                    const creator = creators.find(c => c.id === creatorId);
                    return creator ? (
                      <Badge key={creatorId} variant="secondary" className="text-xs">
                        Creator: {creator.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeCreatorFilter(creatorId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                  {clientFilters.map((clientId) => {
                    const client = clients.find(c => c.id === clientId);
                    return client ? (
                      <Badge key={clientId} variant="secondary" className="text-xs">
                        Client: {client.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeClientFilter(clientId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                  {campaignFilters.map((campaignId) => {
                    const campaign = campaigns.find(c => c.id === campaignId);
                    return campaign ? (
                      <Badge key={campaignId} variant="secondary" className="text-xs">
                        Campaign: {campaign.brand_name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeCampaignFilter(campaignId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                  {masterCampaignFilters.map((masterCampaignName) => (
                    <Badge key={masterCampaignName} variant="secondary" className="text-xs">
                      Master: {masterCampaignName}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeMasterCampaignFilter(masterCampaignName)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {nicheFilters.map((niche) => (
                    <Badge key={niche} variant="secondary" className="text-xs">
                      Niche: {niche}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeNicheFilter(niche)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show Filters Button (when hidden) */}
        {!showFilters && (
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="h-9 px-3"
            >
              <Filter className="h-4 w-4 mr-2" />
              Show filters
            </Button>
          </div>
        )}

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium leading-tight">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.campaignCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium leading-tight">Total Content</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalPiecesOfContent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium leading-tight">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium leading-tight">Total Engagement</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalEngagement.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
              <CardTitle className="text-sm font-medium leading-tight">Avg Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.avgEngagementRate.toFixed(2)}%</div>
            </CardContent>
          </Card>

          {showDealValue && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 h-16">
                <CardTitle className="text-sm font-medium leading-tight">Average CPV</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${aggregateMetrics.avgCPV.toFixed(4)}</div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Video Analytics</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Platform Views & Engagement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{creatorViewMode ? 'Creator Performance' : 'Platform Performance'}</CardTitle>
                  <CardDescription>{creatorViewMode ? 'Views and engagement by creator' : 'Views and engagement by platform'}</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <Label 
                      htmlFor="percent-engagement" 
                      className="text-sm font-medium text-foreground cursor-pointer select-none"
                    >
                      % Engagement
                    </Label>
                    <Switch
                      id="percent-engagement"
                      checked={usePercentEngagement}
                      onCheckedChange={setUsePercentEngagement}
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <Label 
                      htmlFor="creator-view-bar" 
                      className="text-sm font-medium text-foreground cursor-pointer select-none"
                    >
                      Creator View
                    </Label>
                    <Switch
                      id="creator-view-bar"
                      checked={creatorViewMode}
                      onCheckedChange={setCreatorViewMode}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div data-chart={creatorViewMode ? "creator-performance" : "platform-performance"}>
                <ResponsiveContainer width="100%" height={300}>
                  {usePercentEngagement ? (
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => {
                          if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                          if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                          return value.toString();
                        }} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'engagementRate') {
                          return [`${Number(value).toFixed(2)}%`, 'Engagement Rate'];
                        }
                        const formatNumber = (num: number) => {
                          if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                          if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                          return num.toLocaleString();
                        };
                        return [
                          typeof value === 'number' ? formatNumber(value) : value,
                          name === 'views' ? 'Views' : 'Engagement Rate'
                        ];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="views" fill="hsl(var(--primary))" name="Views" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="engagementRate" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                        name="Engagement Rate (%)" 
                      />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => {
                          if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                          if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                          return value.toString();
                        }} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tickFormatter={(value) => {
                          if (value >= 100000) return (value / 1000).toFixed(0) + 'K';
                          if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                          return value.toString();
                        }}
                      />
                      <Tooltip formatter={(value, name, props) => {
                        if (name === 'Engagement') {
                          // When toggle is OFF, show total engagement numbers
                          const formatNumber = (num: number) => {
                            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                            return num.toLocaleString();
                          };
                          return [formatNumber(Number(value)), 'Total Engagement'];
                        }
                        const formatNumber = (num: number) => {
                          if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                          if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                          return num.toLocaleString();
                        };
                        return [
                          typeof value === 'number' ? formatNumber(value) : value,
                          name === 'views' ? 'Views' : name
                        ];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="views" fill="hsl(var(--primary))" name="Views" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                        name="Engagement" 
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Platform Views Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Views Distribution</CardTitle>
                  <CardDescription>{creatorViewMode ? 'Share of total views by creator' : 'Share of total views by platform'}</CardDescription>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Label 
                    htmlFor="creator-view-pie" 
                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                  >
                    Creator View
                  </Label>
                  <Switch
                    id="creator-view-pie"
                    checked={creatorViewMode}
                    onCheckedChange={setCreatorViewMode}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div data-chart="view-distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Views']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Performance metrics by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div data-chart="platform-breakdown" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(platformBreakdown).map(([platform, data]) => (
                <div key={platform} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{platform}</h4>
                    <Badge variant="secondary">{data.campaigns} campaigns</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span className="font-medium">{data.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement:</span>
                      <span className="font-medium">{data.engagement.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eng. Rate:</span>
                      <span className="font-medium">
                        {data.views > 0 ? ((data.engagement / data.views) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Timeline Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Campaign Timeline</CardTitle>
            <CardDescription>Number of campaigns launched by month</CardDescription>
          </CardHeader>
          <CardContent>
            <CampaignTimelineChart campaigns={filteredCampaigns} />
          </CardContent>
        </Card>

        {/* Views Per Month Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Views Performance by Month</CardTitle>
            <CardDescription>Total views generated by campaigns each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(() => {
                // Group campaigns by month and sum views
                const monthlyViews: Record<string, number> = {};
                
                filteredCampaigns.forEach(campaign => {
                  if (campaign.campaign_date && campaign.total_views) {
                    try {
                      const date = new Date(campaign.campaign_date);
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthName = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short' 
                      });
                      
                      if (!monthlyViews[monthName]) {
                        monthlyViews[monthName] = 0;
                      }
                      monthlyViews[monthName] += campaign.total_views;
                    } catch (error) {
                      console.warn('Invalid campaign date:', campaign.campaign_date);
                    }
                  }
                });
                
                // Convert to array and sort by date
                return Object.entries(monthlyViews)
                  .map(([month, views]) => ({
                    month,
                    views,
                    formattedViews: views.toLocaleString()
                  }))
                  .sort((a, b) => {
                    const dateA = new Date(a.month + ' 1');
                    const dateB = new Date(b.month + ' 1');
                    return dateA.getTime() - dateB.getTime();
                  });
              })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value) => [Number(value).toLocaleString(), 'Views']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar 
                  dataKey="views" 
                  fill="hsl(var(--primary))" 
                  name="Total Views"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            {/* Platform Filter for Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Filter by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={videoPlatformFilter} onValueChange={setVideoPlatformFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setUsePercentEngagement((p) => !p)}>
                    {usePercentEngagement ? 'X: Engagement %' : 'X: Total Engagement'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Video Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Videos Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Top Performing Videos
                  </CardTitle>
                  <CardDescription>Videos ranked by view count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div data-chart="top-videos-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={filteredVideoAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="title" 
                        tick={{ fontSize: 10, cursor: 'pointer' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        onClick={(data) => {
                          if (data && data.payload && data.payload.url) {
                            window.open(data.payload.url, '_blank');
                          }
                        }}
                      />
                      <YAxis tickFormatter={(value) => {
                        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                        return value.toString();
                      }} />
                      <Tooltip formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                        name === 'views' ? 'Views' : 'Engagement'
                      ]} />
                      <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Video Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Video Performance</CardTitle>
                  <CardDescription>Total views and engagement by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topVideosByPlatform}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis tickFormatter={(value) => {
                        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                        return value.toString();
                      }} />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Total']} />
                      <Bar dataKey="totalViews" fill="hsl(var(--primary))" name="Total Views" />
                      <Bar dataKey="totalEngagement" fill="hsl(var(--brand-accent-green))" name="Total Engagement" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Video Performance Distribution (Bubble Chart) */}
            <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Video Performance Distribution</CardTitle>
                  <CardDescription>Y: Views, X: {usePercentEngagement ? 'Engagement %' : 'Engagement total'}. Click on Any Bubble to Open the Video.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Platform Multi-Select Filter for Bubble Chart */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-32 justify-between">
                        {bubblePlatformFilter.length === 0 
                          ? "All Platforms" 
                          : bubblePlatformFilter.length === 1 
                          ? bubblePlatformFilter[0].charAt(0).toUpperCase() + bubblePlatformFilter[0].slice(1)
                          : `${bubblePlatformFilter.length} Platforms`
                        }
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all-platforms"
                            checked={bubblePlatformFilter.length === 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBubblePlatformFilter([]);
                              }
                            }}
                          />
                          <Label htmlFor="all-platforms" className="text-sm font-medium">
                            All Platforms
                          </Label>
                        </div>
                        <Separator />
                        {['youtube', 'instagram', 'tiktok'].map(platform => {
                          const isSelected = bubblePlatformFilter.includes(platform);
                          const displayName = platform.charAt(0).toUpperCase() + platform.slice(1);
                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`platform-${platform}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setBubblePlatformFilter(prev => [...prev, platform]);
                                  } else {
                                    setBubblePlatformFilter(prev => prev.filter(p => p !== platform));
                                  }
                                }}
                              />
                              <Label htmlFor={`platform-${platform}`} className="text-sm">
                                {displayName}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Creator Multi-Select Filter for Bubble Chart */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-36 justify-between">
                        {bubbleCreatorFilter.length === 0 
                          ? "All Creators" 
                          : bubbleCreatorFilter.length === 1 
                          ? creators.find(c => c.id === bubbleCreatorFilter[0])?.name || "All Creators"
                          : `${bubbleCreatorFilter.length} Creators`
                        }
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all-creators"
                            checked={bubbleCreatorFilter.length === 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBubbleCreatorFilter([]);
                              }
                            }}
                          />
                          <Label htmlFor="all-creators" className="text-sm font-medium">
                            All Creators
                          </Label>
                        </div>
                        <Separator />
                        {creators.map(creator => {
                          const isSelected = bubbleCreatorFilter.includes(creator.id);
                          return (
                            <div key={creator.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`creator-${creator.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setBubbleCreatorFilter(prev => [...prev, creator.id]);
                                  } else {
                                    setBubbleCreatorFilter(prev => prev.filter(id => id !== creator.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`creator-${creator.id}`} className="text-sm">
                                {creator.name}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Campaign Multi-Select Filter for Bubble Chart */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-36 justify-between">
                        {bubbleCampaignFilter.length === 0 
                          ? "All Campaigns" 
                          : bubbleCampaignFilter.length === 1 
                          ? campaigns.find(c => c.id === bubbleCampaignFilter[0])?.brand_name || "All Campaigns"
                          : `${bubbleCampaignFilter.length} Campaigns`
                        }
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all-campaigns"
                            checked={bubbleCampaignFilter.length === 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBubbleCampaignFilter([]);
                              }
                            }}
                          />
                          <Label htmlFor="all-campaigns" className="text-sm font-medium">
                            All Campaigns
                          </Label>
                        </div>
                        <div className="px-2 py-1">
                          <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={campaignSearchTerm}
                            onChange={(e) => setCampaignSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <Separator />
                        <div className="max-h-48 overflow-y-auto">
                          {campaigns
                            .filter(campaign => 
                              campaign.brand_name.toLowerCase().includes(campaignSearchTerm.toLowerCase())
                            )
                            .sort((a, b) => a.brand_name.localeCompare(b.brand_name))
                            .map(campaign => {
                            const isSelected = bubbleCampaignFilter.includes(campaign.id);
                            return (
                              <div key={campaign.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`campaign-${campaign.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setBubbleCampaignFilter(prev => [...prev, campaign.id]);
                                    } else {
                                      setBubbleCampaignFilter(prev => prev.filter(id => id !== campaign.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`campaign-${campaign.id}`} className="text-sm">
                                  {campaign.brand_name}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Niche Multi-Select Filter for Bubble Chart */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-32 justify-between">
                        {bubbleNicheFilter.length === 0 
                          ? "All Niches" 
                          : bubbleNicheFilter.length === 1 
                          ? bubbleNicheFilter[0]
                          : `${bubbleNicheFilter.length} Niches`
                        }
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all-niches"
                            checked={bubbleNicheFilter.length === 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBubbleNicheFilter([]);
                              }
                            }}
                          />
                          <Label htmlFor="all-niches" className="text-sm font-medium">
                            All Niches
                          </Label>
                        </div>
                        <Separator />
                        {NICHE_OPTIONS.map(niche => {
                          const isSelected = bubbleNicheFilter.includes(niche);
                          return (
                            <div key={niche} className="flex items-center space-x-2">
                              <Checkbox
                                id={`niche-${niche}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setBubbleNicheFilter(prev => [...prev, niche]);
                                  } else {
                                    setBubbleNicheFilter(prev => prev.filter(n => n !== niche));
                                  }
                                }}
                              />
                              <Label htmlFor={`niche-${niche}`} className="text-sm">
                                {niche}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Clear Filters Button */}
                  {(bubbleCreatorFilter.length > 0 || bubbleCampaignFilter.length > 0 || bubblePlatformFilter.length > 0 || bubbleNicheFilter.length > 0) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setBubbleCreatorFilter([]);
                        setBubbleCampaignFilter([]);
                        setBubblePlatformFilter([]);
                        setBubbleNicheFilter([]);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={() => setUsePercentEngagement((p) => !p)}>
                    {usePercentEngagement ? 'X: Engagement %' : 'X: Total Engagement'}
                  </Button>
                  
                  {/* Excluded Videos Management */}
                  {excludedVideos.size > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-muted-foreground">
                          {excludedVideos.size} Excluded
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Excluded Videos</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExcludedVideos(new Set())}
                              className="h-6 px-2 text-xs"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {Array.from(excludedVideos).map((videoKey) => {
                              const [campaign, url] = videoKey.split('-', 2);
                              const video = videoAnalytics.find(v => 
                                v.campaign === campaign && v.url === url
                              );
                              return (
                                <div key={videoKey} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{campaign}</div>
                                    <div className="text-muted-foreground">
                                      {video?.platform} • {video?.creator}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                                    onClick={() => {
                                      setExcludedVideos(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(videoKey);
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </CardHeader>
              <CardContent>
                <div data-chart="video-performance-distribution">
                <ResponsiveContainer width="100%" height={360}>
                  <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name={usePercentEngagement ? 'Engagement %' : 'Engagement'} tickFormatter={usePercentEngagement ? ((v: number) => `${v.toFixed(1)}%`) : numberCompact} />
                    <YAxis type="number" dataKey="y" name="Views" tickFormatter={numberCompact} />
                    <ZAxis type="number" dataKey="size" range={[60, 300]} name="Eng. Rate" />
                    <Tooltip content={renderBubbleTooltip as any} />
                    <Legend />
                    {Object.entries(bubbleSeries).map(([platform, data]) => (
                      <Scatter
                        key={platform}
                        name={platform}
                        data={data as any[]}
                        fill={getPlatformColor(platform)}
                        onClick={(e: any) => {
                          const p = (e && (e as any).node && (e as any).node.payload) || (e as any).payload;
                          const url = p?.url;
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Videos Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Videos</CardTitle>
                <CardDescription>Detailed breakdown of video performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border" data-chart="top-videos-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Engagement</TableHead>
                        <TableHead className="text-right">Eng. Rate</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVideoAnalytics.slice(0, 20).map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            <Badge variant="outline">{video.platform}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {video.campaign}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {video.creator}
                          </TableCell>
                          <TableCell className="text-right">
                            {video.views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {video.engagement.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {video.engagementRate.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            {video.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={video.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Watch
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {/* Comparison Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Items to Compare</CardTitle>
                <CardDescription>Choose creators, campaigns, or specific content URLs to compare their analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creator Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Add Creator</Label>
                    <Select onValueChange={(creatorId) => {
                      const creatorName = creatorLookup.get(creatorId);
                      if (creatorName && !comparisonItems.find(item => item.id === creatorId && item.type === 'creator')) {
                        const creatorCampaigns = campaigns.filter(c => resolveCreatorForCampaign(c).id === creatorId);
                        const totalViews = creatorCampaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
                        const totalEngagement = creatorCampaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
                        const avgEngagementRate = creatorCampaigns.length > 0 
                          ? creatorCampaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / creatorCampaigns.length 
                          : 0;
                        
                        // Get platform breakdown for this creator
                        const platformBreakdown: Record<string, number> = {};
                        creatorCampaigns.forEach(campaign => {
                          if (campaign.analytics_data) {
                            Object.entries(campaign.analytics_data).forEach(([platform, data]: [string, any]) => {
                              if (Array.isArray(data)) {
                                data.forEach((item: any) => {
                                  const itemCreatorId = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                                  if (itemCreatorId === creatorId) {
                                    platformBreakdown[platform] = (platformBreakdown[platform] || 0) + (item.views || 0);
                                  }
                                });
                              }
                            });
                          }
                        });
                        
                        setComparisonItems(prev => [...prev, {
                          id: creatorId,
                          type: 'creator',
                          name: creatorName,
                          data: {
                            totalViews,
                            totalEngagement,
                            avgEngagementRate: Number(avgEngagementRate.toFixed(2)),
                            campaignCount: creatorCampaigns.length,
                            platformBreakdown,
                            campaigns: creatorCampaigns.map(c => ({
                              name: c.brand_name,
                              date: c.campaign_date,
                              views: c.total_views || 0,
                              engagement: c.total_engagement || 0
                            }))
                          }
                        }]);
                      }
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCreators.map(creator => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campaign Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Add Campaign</Label>
                    <Select onValueChange={(campaignId) => {
                      const campaign = campaigns.find(c => c.id === campaignId);
                      if (campaign && !comparisonItems.find(item => item.id === campaignId && item.type === 'campaign')) {
                        // Get platform breakdown and URL details for this campaign
                        const platformBreakdown: Record<string, { views: number; urlCount: number }> = {};
                        const urlDetails: Array<{ url: string; platform: string; views: number; engagement: number }> = [];
                        
                        if (campaign.analytics_data) {
                          Object.entries(campaign.analytics_data).forEach(([platform, data]: [string, any]) => {
                            if (Array.isArray(data)) {
                              const platformViews = data.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
                              if (platformViews > 0) {
                                platformBreakdown[platform] = {
                                  views: platformViews,
                                  urlCount: data.length
                                };
                              }
                              // Collect URL details
                              data.forEach((item: any) => {
                                urlDetails.push({
                                  url: item.url || '',
                                  platform,
                                  views: item.views || 0,
                                  engagement: item.engagement || 0
                                });
                              });
                            }
                          });
                        }
                        
                        // Count total URLs from content_urls structure
                        const totalUrls = campaign.content_urls 
                          ? Object.values(campaign.content_urls).flat().filter(url => url).length 
                          : 0;
                        
                        // Calculate URL-based metrics
                        const actualUrlsWithData = urlDetails.length;
                        const avgViewsPerUrl = actualUrlsWithData > 0 
                          ? Math.round((campaign.total_views || 0) / actualUrlsWithData) 
                          : 0;
                        const avgEngagementPerUrl = actualUrlsWithData > 0 
                          ? Math.round((campaign.total_engagement || 0) / actualUrlsWithData) 
                          : 0;
                        
                        setComparisonItems(prev => [...prev, {
                          id: campaignId,
                          type: 'campaign',
                          name: `${campaign.brand_name} - ${new Date(campaign.campaign_date).toLocaleDateString()}`,
                          data: {
                            totalViews: campaign.total_views || 0,
                            totalEngagement: campaign.total_engagement || 0,
                            avgEngagementRate: Number((campaign.engagement_rate || 0).toFixed(2)),
                            contentUrlCount: totalUrls,
                            actualUrlsWithData,
                            avgViewsPerUrl,
                            avgEngagementPerUrl,
                            platformBreakdown,
                            urlDetails,
                            creator: resolveCreatorForCampaign(campaign).name,
                            brandName: campaign.brand_name,
                            campaignDate: campaign.campaign_date,
                            status: campaign.status
                          }
                        }]);
                      }
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.brand_name} - {new Date(campaign.campaign_date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected Items */}
                {comparisonItems.length > 0 && (
                  <div className="mt-6">
                    <Label className="text-sm font-medium mb-2 block">Selected for Comparison ({comparisonItems.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {comparisonItems.map((item) => (
                        <Badge key={`${item.type}-${item.id}`} variant="secondary" className="flex items-center gap-2">
                          {item.type === 'creator' && <Users className="w-3 h-3" />}
                          {item.type === 'campaign' && <FileText className="w-3 h-3" />}
                          {item.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setComparisonItems(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparisonItems.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Results</CardTitle>
                  <CardDescription>Analytics comparison between selected items</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Total Views</TableHead>
                          <TableHead className="text-right">Total Engagement</TableHead>
                          <TableHead className="text-right">Avg Engagement Rate</TableHead>
                          <TableHead className="text-right">Content URLs</TableHead>
                          <TableHead className="text-right">Efficiency</TableHead>
                          <TableHead className="text-right">Top Platform</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonItems.map((item) => {
                          const topPlatform = item.data.platformBreakdown 
                            ? Object.entries(item.data.platformBreakdown)
                                .sort(([,a], [,b]) => {
                                  const aVal = typeof a === 'object' && a && 'views' in a 
                                    ? (a as { views: number }).views 
                                    : Number(a);
                                  const bVal = typeof b === 'object' && b && 'views' in b 
                                    ? (b as { views: number }).views 
                                    : Number(b);
                                  return bVal - aVal;
                                })[0] 
                            : null;
                          
                          return (
                            <TableRow key={`${item.type}-${item.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.type === 'campaign' && (
                                    <div className="text-xs text-muted-foreground">
                                      by {item.data.creator} • {item.data.status}
                                    </div>
                                  )}
                                  {item.type === 'creator' && item.data.campaigns && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.data.campaignCount} campaigns
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                <div className="font-medium">{item.data.totalViews.toLocaleString()}</div>
                                {item.type === 'creator' && item.data.campaignCount > 1 && (
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round(item.data.totalViews / item.data.campaignCount).toLocaleString()}/campaign
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                <div className="font-medium">{item.data.totalEngagement.toLocaleString()}</div>
                                {item.type === 'creator' && item.data.campaignCount > 1 && (
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round(item.data.totalEngagement / item.data.campaignCount).toLocaleString()}/campaign
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                <div className="font-medium">{item.data.avgEngagementRate}%</div>
                                {item.data.totalViews > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {((item.data.totalEngagement / item.data.totalViews) * 100).toFixed(2)}% actual
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.type === 'campaign' ? (
                                  <div>
                                    <div className="font-medium">{item.data.contentUrlCount} URLs</div>
                                    {item.data.actualUrlsWithData && item.data.actualUrlsWithData !== item.data.contentUrlCount && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.data.actualUrlsWithData} with data
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">{item.data.campaignCount} campaigns</div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.type === 'campaign' && item.data.actualUrlsWithData > 0 ? (
                                  <div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Views/URL:</span> {item.data.avgViewsPerUrl.toLocaleString()}
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Eng/URL:</span> {item.data.avgEngagementPerUrl.toLocaleString()}
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">CPV:</span> ₹
                                      {item.data.totalViews > 0 
                                        ? (1000 / item.data.totalViews).toFixed(3)
                                        : '0.000'
                                      }
                                    </div>
                                  </div>
                                ) : item.type === 'creator' ? (
                                  <div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Avg Views:</span> {Math.round(item.data.totalViews / item.data.campaignCount).toLocaleString()}
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">CPV:</span> ₹
                                      {item.data.totalViews > 0 
                                        ? (1000 / item.data.totalViews).toFixed(3)
                                        : '0.000'
                                      }
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {topPlatform ? (
                                  <div>
                                    <div className="font-medium capitalize">{topPlatform[0]}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {typeof topPlatform[1] === 'object' && topPlatform[1] && 'views' in topPlatform[1]
                                        ? `${(topPlatform[1] as { views: number; urlCount: number }).views.toLocaleString()} views (${(topPlatform[1] as { views: number; urlCount: number }).urlCount} URLs)`
                                        : `${Number(topPlatform[1]).toLocaleString()} views`
                                      }
                                      {item.data.totalViews > 0 && (
                                        <div>
                                          {Math.round((
                                            (typeof topPlatform[1] === 'object' && topPlatform[1] && 'views' in topPlatform[1]
                                              ? (topPlatform[1] as { views: number }).views
                                              : Number(topPlatform[1])
                                            ) / Number(item.data.totalViews)) * 100)}% of total
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No data</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Enhanced Insights */}
                  {comparisonItems.length >= 2 && (
                    <div className="mt-6 space-y-4">
                      {/* Key Performance Metrics */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Performance Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {(() => {
                            const sortedByViews = [...comparisonItems].sort((a, b) => b.data.totalViews - a.data.totalViews);
                            const sortedByEngagement = [...comparisonItems].sort((a, b) => b.data.avgEngagementRate - a.data.avgEngagementRate);
                            const bestViews = sortedByViews[0];
                            const bestEngagement = sortedByEngagement[0];
                            
                            return (
                              <>
                                <div className="flex items-start gap-2">
                                  <span className="text-xl">🏆</span>
                                  <div>
                                    <div className="font-medium">Highest Total Views</div>
                                    <div className="text-muted-foreground">{bestViews.name}</div>
                                    <div className="font-mono text-xs">{bestViews.data.totalViews.toLocaleString()} views</div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xl">📈</span>
                                  <div>
                                    <div className="font-medium">Best Engagement Rate</div>
                                    <div className="text-muted-foreground">{bestEngagement.name}</div>
                                    <div className="font-mono text-xs">{bestEngagement.data.avgEngagementRate}%</div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Content Strategy Analysis */}
                      {comparisonItems.some(item => item.type === 'campaign') && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Content Strategy Analysis
                          </h4>
                          <div className="space-y-3 text-sm">
                            {(() => {
                              const campaigns = comparisonItems.filter(item => item.type === 'campaign');
                              const sortedByEfficiency = [...campaigns].sort((a, b) => 
                                (b.data.avgViewsPerUrl || 0) - (a.data.avgViewsPerUrl || 0)
                              );
                              const mostEfficient = sortedByEfficiency[0];
                              
                              const sortedByUrlCount = [...campaigns].sort((a, b) => 
                                b.data.contentUrlCount - a.data.contentUrlCount
                              );
                              const mostUrls = sortedByUrlCount[0];
                              const leastUrls = sortedByUrlCount[sortedByUrlCount.length - 1];
                              
                              return (
                                <>
                                  {mostEfficient && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xl">⚡</span>
                                      <div>
                                        <div className="font-medium">Most Efficient Campaign</div>
                                        <div className="text-muted-foreground">{mostEfficient.name}</div>
                                        <div className="font-mono text-xs">
                                          {mostEfficient.data.avgViewsPerUrl.toLocaleString()} avg views/URL 
                                          ({mostEfficient.data.contentUrlCount} URLs)
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {campaigns.length > 1 && mostUrls !== leastUrls && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xl">🎯</span>
                                      <div>
                                        <div className="font-medium">Content Volume Comparison</div>
                                        <div className="text-muted-foreground">
                                          {mostUrls.name} used {mostUrls.data.contentUrlCount} URLs vs {leastUrls.name} with {leastUrls.data.contentUrlCount} URLs
                                        </div>
                                        {mostUrls.data.totalViews > 0 && leastUrls.data.totalViews > 0 && (
                                          <div className="font-mono text-xs">
                                            Despite {Math.abs(mostUrls.data.contentUrlCount - leastUrls.data.contentUrlCount)}x difference in URLs, 
                                            {mostUrls.data.totalViews > leastUrls.data.totalViews 
                                              ? ` ${mostUrls.data.brandName} achieved ${Math.round((mostUrls.data.totalViews / leastUrls.data.totalViews) * 100) - 100}% more views`
                                              : ` ${leastUrls.data.brandName} achieved ${Math.round((leastUrls.data.totalViews / mostUrls.data.totalViews) * 100) - 100}% more views with fewer URLs`
                                            }
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {campaigns.some(c => c.data.avgViewsPerUrl > 0) && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xl">💡</span>
                                      <div>
                                        <div className="font-medium">Strategy Insight</div>
                                        <div className="text-muted-foreground">
                                          {sortedByEfficiency[0].data.avgViewsPerUrl > 100000 
                                            ? "High-performing single URLs can be more effective than distributing content across many URLs"
                                            : "Multi-URL strategies help reach wider audiences but may dilute per-URL performance"
                                          }
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Platform Distribution Analysis */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Platform Distribution
                        </h4>
                        <div className="space-y-2 text-sm">
                          {(() => {
                            const platformStats: Record<string, { items: string[]; totalViews: number }> = {};
                            
                            comparisonItems.forEach(item => {
                              if (item.data.platformBreakdown) {
                                Object.entries(item.data.platformBreakdown).forEach(([platform, data]) => {
                                  if (!platformStats[platform]) {
                                    platformStats[platform] = { items: [], totalViews: 0 };
                                  }
                                  platformStats[platform].items.push(item.name);
                                  const views = typeof data === 'object' && data && 'views' in data
                                    ? (data as { views: number }).views
                                    : Number(data);
                                  platformStats[platform].totalViews += views;
                                });
                              }
                            });
                            
                            const sortedPlatforms = Object.entries(platformStats)
                              .sort(([,a], [,b]) => b.totalViews - a.totalViews);
                            
                            return sortedPlatforms.length > 0 ? (
                              sortedPlatforms.map(([platform, stats]) => (
                                <div key={platform} className="flex justify-between items-center">
                                  <div>
                                    <span className="font-medium capitalize">{platform}</span>
                                    <span className="text-muted-foreground ml-2">
                                      ({stats.items.length} {stats.items.length === 1 ? 'item' : 'items'})
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs">{stats.totalViews.toLocaleString()} views</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted-foreground">No platform data available</div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {comparisonItems.length === 1 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add at least one more item to start comparing</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisonItems.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select creators, campaigns, or content URLs above to begin comparison</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <AnalyticsExportCustomizationDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExportPDF}
          campaignCount={filteredCampaigns.length}
          defaultTitle="Analytics Dashboard Report"
        />
      </div>
    </div>
  );
}
