import React, { useState, useMemo } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCreators } from '@/hooks/useCreators';
import { useClients } from '@/hooks/useClients';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, Users, TrendingUp, DollarSign, BarChart3, Search, Filter, Download, X } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { PDFExporter } from '@/utils/pdfExporter';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creatorFilters, setCreatorFilters] = useState<string[]>([]);
  const [clientFilters, setClientFilters] = useState<string[]>([]);

  // Filter campaigns based on search and filters
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.creators?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesCreator = creatorFilters.length === 0 || creatorFilters.includes(campaign.creator_id);
      const matchesClient = clientFilters.length === 0 || (campaign.client_id && clientFilters.includes(campaign.client_id));

      return matchesSearch && matchesStatus && matchesCreator && matchesClient;
    });
  }, [campaigns, searchTerm, statusFilter, creatorFilters, clientFilters]);

  // Calculate aggregate metrics for selected campaigns
  const aggregateMetrics = useMemo((): AggregateMetrics => {
    const selectedCampaignData = selectedCampaigns.length > 0 
      ? campaigns.filter(c => selectedCampaigns.includes(c.id))
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
  }, [campaigns, selectedCampaigns, filteredCampaigns]);

  // Calculate platform breakdown
  const platformBreakdown = useMemo((): PlatformBreakdown => {
    const selectedCampaignData = selectedCampaigns.length > 0 
      ? campaigns.filter(c => selectedCampaigns.includes(c.id))
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
  }, [campaigns, selectedCampaigns, filteredCampaigns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const platformData = Object.entries(platformBreakdown).map(([platform, data]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      views: data.views,
      engagement: data.engagement,
      campaigns: data.campaigns,
      engagementRate: data.views > 0 ? ((data.engagement / data.views) * 100) : 0
    }));

    return platformData;
  }, [platformBreakdown]);

  const pieData = useMemo(() => {
    return Object.entries(platformBreakdown).map(([platform, data], index) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: data.views,
      fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));
  }, [platformBreakdown]);

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

  const handleCampaignSelection = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  };

  const handleExportPDF = () => {
    try {
      const campaignsToExport = selectedCampaigns.length > 0 
        ? campaigns.filter(c => selectedCampaigns.includes(c.id))
        : filteredCampaigns;

      if (campaignsToExport.length === 0) {
        toast.error('No campaigns to export');
        return;
      }

      const exporter = new PDFExporter();
      const exportTitle = 'Campaign Analytics Report';
      
      exporter.exportMultipleCampaigns(campaignsToExport, exportTitle, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true
      });
      
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
            <Button 
              onClick={handleExportPDF} 
              disabled={filteredCampaigns.length === 0}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Badge variant="outline" className="text-sm">
              {selectedCampaigns.length > 0 ? `${selectedCampaigns.length} selected` : `${filteredCampaigns.length} campaigns`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedCampaigns.length === filteredCampaigns.length ? 'Deselect All' : 'Select All'}
                </Button>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Platform Views & Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>Views and engagement by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'views' ? 'Views' : name === 'engagement' ? 'Engagement' : name
                  ]} />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                  <Bar dataKey="engagement" fill="hsl(var(--secondary))" name="Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Platform Views Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Views Distribution</CardTitle>
              <CardDescription>Share of total views by platform</CardDescription>
            </CardHeader>
            <CardContent>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Campaign Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Selection</CardTitle>
            <CardDescription>Select campaigns to include in the aggregate analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Checkbox
                    checked={selectedCampaigns.includes(campaign.id)}
                    onCheckedChange={(checked) => handleCampaignSelection(campaign.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.brand_name}</h4>
                      <Badge variant={
                        campaign.status === 'completed' ? 'default' :
                        campaign.status === 'analyzing' ? 'secondary' :
                        campaign.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.creators?.name} • {campaign.clients?.name} • {new Date(campaign.campaign_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{campaign.total_views?.toLocaleString() || 0} views</div>
                    <div className="text-muted-foreground">{campaign.engagement_rate?.toFixed(2) || 0}% engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}