import React, { useState, useMemo } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCreators } from '@/hooks/useCreators';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Eye, Users, TrendingUp, DollarSign, BarChart3, Search, Filter, Download, X, Play, Video } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { PDFExporter } from '@/utils/pdfExporter';
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AggregateMetrics {
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalDealValue: number;
  campaignCount: number;
}

interface PlatformBreakdown {
  [platform: string]: {
    views: number;
    engagement: number;
    campaigns: number;
  };
}

export default function Analytics() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: creators = [] } = useCreators();
  const { data: clients = [] } = useClients();
  const { data: masterCampaigns = [] } = useMasterCampaigns();
  
  console.log('Analytics - Campaigns:', campaigns);
  console.log('Analytics - Creators:', creators);
  
  // Get campaign creators for all campaigns
  const campaignCreatorsMap = useMemo(() => {
    const map: { [campaignId: string]: any[] } = {};
    // This will be populated by individual campaign creator queries
    return map;
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creatorFilters, setCreatorFilters] = useState<string[]>([]);
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [masterCampaignFilters, setMasterCampaignFilters] = useState<string[]>([]);
  const [campaignFilters, setCampaignFilters] = useState<string[]>([]);
  const [creatorViewMode, setCreatorViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Create a creator lookup map for better performance
  const creatorLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    creators.forEach(creator => {
      lookup.set(creator.id, creator.name);
    });
    return lookup;
  }, [creators]);

  // Helper function to resolve creator for a campaign
  const resolveCreatorForCampaign = (campaign: Campaign) => {
    // If campaign has a creator_id, use it
    if (campaign.creator_id && creatorLookup.has(campaign.creator_id)) {
      return {
        id: campaign.creator_id,
        name: creatorLookup.get(campaign.creator_id)!
      };
    }

    // If no creator_id, try to match by platform handles
    const analyticsData = campaign.analytics_data as any;
    if (analyticsData && creators) {
      for (const creator of creators) {
        const handles = creator.platform_handles as Record<string, string>;
        if (handles) {
          // Check if any platform content URLs match this creator's handles
          for (const [platform, urls] of Object.entries(analyticsData)) {
            if (Array.isArray(urls) && handles[platform]) {
              const handle = handles[platform].replace('@', '');
              const hasMatchingContent = urls.some((item: any) => 
                item.url && item.url.includes(handle)
              );
              if (hasMatchingContent) {
                return {
                  id: creator.id,
                  name: creator.name
                };
              }
            }
          }
        }
      }
    }

    // Default to Via Infinda for campaigns without creator_id (common case)
    const viaInfindaCreator = creators.find(c => c.name === "Via Infinda");
    if (viaInfindaCreator) {
      return {
        id: viaInfindaCreator.id,
        name: viaInfindaCreator.name
      };
    }

    // Fallback to first creator if available
    if (creators && creators.length > 0) {
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
      const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.creators?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.master_campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesCreator = creatorFilters.length === 0 || 
        // Check if any selected creator matches this campaign's creator_id
        creatorFilters.includes(campaign.creator_id);
      const matchesClient = clientFilters.length === 0 || (campaign.client_id && clientFilters.includes(campaign.client_id));
      const matchesMasterCampaign = masterCampaignFilters.length === 0 || 
        (campaign.master_campaign_name && masterCampaignFilters.includes(campaign.master_campaign_name));

      return matchesSearch && matchesStatus && matchesCreator && matchesClient && matchesMasterCampaign;
    });
  }, [campaigns, searchTerm, statusFilter, creatorFilters, clientFilters, masterCampaignFilters]);

  // Calculate aggregate metrics for selected campaigns
  const aggregateMetrics = useMemo((): AggregateMetrics => {
    // Use campaign filters instead of selectedCampaigns
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

    const totalViews = selectedCampaignData.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = selectedCampaignData.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const totalDealValue = selectedCampaignData.reduce((sum, c) => sum + (c.deal_value || 0), 0);
    const avgEngagementRate = selectedCampaignData.length > 0
      ? selectedCampaignData.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / selectedCampaignData.length
      : 0;

    return {
      totalViews,
      totalEngagement,
      avgEngagementRate,
      totalDealValue,
      campaignCount: selectedCampaignData.length
    };
  }, [campaigns, campaignFilters, filteredCampaigns]);

  // Calculate platform breakdown
  const platformBreakdown = useMemo((): PlatformBreakdown => {
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

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
  }, [campaigns, campaignFilters, filteredCampaigns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

    if (creatorViewMode) {
      // Group by creator
      const creatorData: { [creatorId: string]: { views: number; engagement: number; campaigns: number; creatorName: string } } = {};
      
      selectedCampaignData.forEach(campaign => {
        const resolvedCreator = resolveCreatorForCampaign(campaign);
        const creatorId = resolvedCreator.id;
        const creatorName = resolvedCreator.name;
        
        if (!creatorData[creatorId]) {
          creatorData[creatorId] = { views: 0, engagement: 0, campaigns: 0, creatorName };
        }
        
        creatorData[creatorId].views += campaign.total_views || 0;
        creatorData[creatorId].engagement += campaign.total_engagement || 0;
        creatorData[creatorId].campaigns += 1;
      });

      return Object.values(creatorData).map((data) => ({
        platform: data.creatorName,
        views: data.views,
        engagement: data.engagement,
        campaigns: data.campaigns,
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

      return platformData;
    }
  }, [platformBreakdown, campaignFilters, campaigns, filteredCampaigns, creatorViewMode, creatorLookup]);

  const pieData = useMemo(() => {
    const selectedCampaignData = campaignFilters.length > 0 
      ? campaigns.filter(c => campaignFilters.includes(c.id))
      : filteredCampaigns;

    if (creatorViewMode) {
      // Group by creator
      const creatorData: { [creatorId: string]: { views: number; creatorName: string } } = {};
      
      selectedCampaignData.forEach(campaign => {
        const resolvedCreator = resolveCreatorForCampaign(campaign);
        const creatorId = resolvedCreator.id;
        const creatorName = resolvedCreator.name;
        
        if (!creatorData[creatorId]) {
          creatorData[creatorId] = { views: 0, creatorName };
        }
        
        creatorData[creatorId].views += campaign.total_views || 0;
      });

      return Object.values(creatorData).map((data, index) => ({
        name: data.creatorName,
        value: data.views,
        fill: index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--brand-accent-green))'
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
      views: number;
      engagement: number;
      engagementRate: number;
      url: string;
    }> = [];

    selectedCampaignData.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            platformData.forEach((video: any, index: number) => {
              videos.push({
                id: `${campaign.id}-${platform}-${index}`,
                title: video.title || `${platform} Video ${index + 1}`,
                platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                campaign: campaign.brand_name,
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
  }, [campaigns, campaignFilters, filteredCampaigns]);

  const topVideosByPlatform = useMemo(() => {
    const platformGroups: { [platform: string]: typeof videoAnalytics } = {};
    
    videoAnalytics.forEach(video => {
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
  }, [videoAnalytics]);

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

  const handleExportPDF = async () => {
    try {
      const campaignsToExport = campaignFilters.length > 0 
        ? campaigns.filter(c => campaignFilters.includes(c.id))
        : filteredCampaigns;

      if (campaignsToExport.length === 0) {
        toast.error('No campaigns to export');
        return;
      }

      const exporter = new EnhancedPDFExporter();
      const exportTitle = 'Enhanced Campaign Analytics Report';
      
      await exporter.exportWithCharts(campaignsToExport, exportTitle, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true,
        includeCharts: true
      });
      
      toast.success(`Enhanced PDF report exported with ${campaignsToExport.length} campaigns`);
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
            <Button 
              onClick={handleExportPDF} 
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="creator">Creators</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleCreatorFilterChange}>
                    <SelectTrigger>
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
                    <div className="flex flex-wrap gap-1">
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

              <div className="space-y-2">
                <Label htmlFor="client">Clients</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleClientFilterChange}>
                    <SelectTrigger>
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
                    <div className="flex flex-wrap gap-1">
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

              <div className="space-y-2">
                <Label htmlFor="masterCampaign">Master Campaigns</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleMasterCampaignFilterChange}>
                    <SelectTrigger>
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
                    <div className="flex flex-wrap gap-1">
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

              <div className="space-y-2">
                <Label htmlFor="campaigns">Campaigns</Label>
                <div className="space-y-2">
                  <Select onValueChange={handleCampaignFilterChange}>
                    <SelectTrigger>
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
                    <div className="flex flex-wrap gap-1">
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
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.campaignCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalEngagement.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.avgEngagementRate.toFixed(2)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deal Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {aggregateMetrics.totalDealValue > 0 ? `$${aggregateMetrics.totalDealValue.toLocaleString()}` : 'N/A'}
              </div>
            </CardContent>
          </Card>
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
              <div data-chart="platform-performance">
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={videoAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="title" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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

            {/* Top Videos Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Videos</CardTitle>
                <CardDescription>Detailed breakdown of video performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Engagement</TableHead>
                        <TableHead className="text-right">Eng. Rate</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videoAnalytics.slice(0, 20).map((video) => (
                        <TableRow key={video.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {video.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{video.platform}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {video.campaign}
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
      </div>
    </div>
  );
}
