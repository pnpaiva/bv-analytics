import React, { useState, useMemo } from 'react';
import { useCreators } from '@/hooks/useCreators';
import { useUserAccessibleCampaigns } from '@/hooks/useCampaignAssignments';
import { useAccessibleCampaigns } from '@/hooks/useAccessibleCampaigns';
import { useClients } from '@/hooks/useClients';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
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
import { Eye, Users, TrendingUp, DollarSign, BarChart3, Search, Filter, Download, X, Play, Video, EyeOff } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter';
import { AnalyticsExportCustomizationDialog, AnalyticsExportOptions } from '@/components/analytics/ExportCustomizationDialog';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';
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
  const [showDealValue, setShowDealValue] = useState(true);
  const [bubbleCreatorFilter, setBubbleCreatorFilter] = useState<string[]>([]);
  const [bubbleCampaignFilter, setBubbleCampaignFilter] = useState<string[]>([]);
  const [bubblePlatformFilter, setBubblePlatformFilter] = useState<string[]>([]);
  const [bubbleNicheFilter, setBubbleNicheFilter] = useState<string[]>([]);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');

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
      u.hash = '';
      u.search = '';
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
          if (norm) inner.set(norm, cc.creator_id);
        });
      });
      map.set(cc.campaign_id, inner);
    });
    return map;
  }, [campaignCreators]);

  const getCreatorIdForUrl = (campaignId: string, url?: string) => {
    const inner = urlToCreatorByCampaign.get(campaignId);
    if (!inner || !url) return undefined;
    const norm = normalizeUrl(url);
    return inner.get(norm);
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
        const creator = filteredCreators.find(c => c.id === campaignCreatorData[0].creator_id);
        if (creator) {
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

        if (campaign.analytics_data) {
          Object.entries(campaign.analytics_data).forEach(([_, platformData]: [string, any]) => {
            if (Array.isArray(platformData)) {
              platformData.forEach((item: any) => {
                const cid = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                if (cid) {
                  addToCreator(cid, item.views || 0, item.engagement || 0);
                }
              });
            }
          });
        } else {
          // Fallback to resolved creator totals when no granular data
          const fallback = resolveCreatorForCampaign(campaign);
          addToCreator(fallback.id, campaign.total_views || 0, campaign.total_engagement || 0);
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
        if (campaign.analytics_data) {
          Object.entries(campaign.analytics_data).forEach(([_, platformData]: [string, any]) => {
            if (Array.isArray(platformData)) {
              platformData.forEach((item: any) => {
                const cid = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
                if (cid) {
                  const name = creatorLookup.get(cid) || 'Unknown Creator';
                  if (!creatorViews[cid]) creatorViews[cid] = { views: 0, creatorName: name };
                  creatorViews[cid].views += item.views || 0;
                }
              });
            }
          });
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
        'hsl(var(--teal))',          // TikTok
        'hsl(var(--orange))',        // Additional platforms
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
  }, [videoAnalytics, usePercentEngagement, bubblePlatformFilter, bubbleCampaignFilter, bubbleCreatorFilter, bubbleNicheFilter, masterCampaignFilters, campaigns, creators, campaignCreators]);

  const renderBubbleTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-md border bg-background p-2 text-xs">
        <div className="font-medium">{p.campaign}</div>
        <div className="text-muted-foreground">{p.platform} • {p.creator}</div>
        <div>Views: {p.y.toLocaleString()}</div>
        <div>{usePercentEngagement ? 'Engagement %' : 'Engagement'}: {usePercentEngagement ? `${(p.x as number).toFixed(1)}%` : (p.x as number).toLocaleString()}</div>
        <div>Eng. Rate: {p.size.toFixed(1)}%</div>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search field - full width */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 hover:border-primary/50 focus:border-primary transition-colors cursor-text"
                  />
                </div>
              </div>
              
              {/* Other filters - compact grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="status" className="text-xs font-medium text-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="creator" className="text-xs font-medium text-foreground">Creators</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleCreatorFilterChange}>
                    <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                      <SelectValue placeholder="Select creators..." />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {creatorFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {creatorFilters.map((creatorId) => {
                        const creator = creators.find(c => c.id === creatorId);
                        return creator ? (
                          <Badge key={creatorId} variant="secondary" className="text-xs">
                            {creator.name}
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
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="client" className="text-xs font-medium text-foreground">Clients</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleClientFilterChange}>
                    <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                      <SelectValue placeholder="Select clients..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientFilters.map((clientId) => {
                        const client = clients.find(c => c.id === clientId);
                        return client ? (
                          <Badge key={clientId} variant="secondary" className="text-xs">
                            {client.name}
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
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="masterCampaign" className="text-xs font-medium text-foreground">Master Campaigns</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleMasterCampaignFilterChange}>
                    <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                      <SelectValue placeholder="Select master campaigns..." />
                    </SelectTrigger>
                    <SelectContent>
                      {masterCampaigns.map((masterCampaign) => (
                        <SelectItem key={masterCampaign.name} value={masterCampaign.name}>
                          {masterCampaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {masterCampaignFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {masterCampaignFilters.map((masterCampaignName) => (
                        <Badge key={masterCampaignName} variant="secondary" className="text-xs">
                          {masterCampaignName}
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
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="campaigns" className="text-xs font-medium text-foreground">Campaigns</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleCampaignFilterChange}>
                    <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                      <SelectValue placeholder="Select campaigns..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCampaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {campaignFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {campaignFilters.map((campaignId) => {
                        const campaign = campaigns.find(c => c.id === campaignId);
                        return campaign ? (
                          <Badge key={campaignId} variant="secondary" className="text-xs">
                            {campaign.brand_name}
                            <button 
                              onClick={() => removeCampaignFilter(campaignId)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 p-2 border border-gray-200 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <Label htmlFor="niches" className="text-xs font-medium text-foreground">Creator Niches</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleNicheFilterChange}>
                    <SelectTrigger className="hover:border-primary/50 focus:border-primary transition-colors cursor-pointer bg-white">
                      <SelectValue placeholder="Select niches..." />
                    </SelectTrigger>
                      <SelectContent>
                        {NICHE_OPTIONS.map((niche) => (
                          <SelectItem key={niche} value={niche}>
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                  {nicheFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nicheFilters.map((niche) => (
                        <Badge key={niche} variant="secondary" className="text-xs">
                          {niche}
                          <button 
                            onClick={() => removeNicheFilter(niche)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Video Analytics</TabsTrigger>
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
                <div className="flex items-center space-x-2">
                  <Label htmlFor="creator-view-bar">Creator View</Label>
                  <Switch
                    id="creator-view-bar"
                    checked={creatorViewMode}
                    onCheckedChange={setCreatorViewMode}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div data-chart={creatorViewMode ? "creator-performance" : "platform-performance"}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis tickFormatter={(value) => {
                      if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                      if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                      return value.toString();
                    }} />
                    <Tooltip formatter={(value, name) => {
                      const formatNumber = (num: number) => {
                        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                        return num.toLocaleString();
                      };
                      return [
                        typeof value === 'number' ? formatNumber(value) : value,
                        name === 'views' ? 'Views' : name === 'engagement' ? 'Engagement' : name
                      ];
                    }} />
                    <Legend />
                    <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                    <Bar dataKey="engagement" fill="hsl(var(--brand-accent-green))" name="Engagement" />
                  </BarChart>
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
                <div className="flex items-center space-x-2">
                  <Label htmlFor="creator-view-pie">Creator View</Label>
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
