import React, { useState, useMemo } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Eye, Users, TrendingUp, Calendar, Search, Download, Settings, UserPlus, Building } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';
import { PremiumPDFExporter, MasterCampaignData } from '@/utils/premiumPdfExporter';
import { toast } from 'sonner';
import { MasterCampaignManagement } from '@/components/campaigns/MasterCampaignManagement';
import { CreatorManagement } from '@/components/campaigns/CreatorManagement';
import { ClientManagement } from '@/components/campaigns/ClientManagement';

interface MasterCampaign {
  name: string;
  campaigns: Campaign[];
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  startDate?: string;
  endDate?: string;
  dateRange: string;
}

export default function MasterCampaigns() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState('');

  // Group campaigns by master campaign name
  const masterCampaigns = useMemo(() => {
    const grouped = new Map<string, MasterCampaign>();

    campaigns.forEach(campaign => {
      if (campaign.master_campaign_name) {
        const name = campaign.master_campaign_name;
        
        if (!grouped.has(name)) {
          grouped.set(name, {
            name,
            campaigns: [],
            totalViews: 0,
            totalEngagement: 0,
            avgEngagementRate: 0,
            startDate: campaign.master_campaign_start_date || undefined,
            endDate: campaign.master_campaign_end_date || undefined,
            dateRange: ''
          });
        }

        const masterCampaign = grouped.get(name)!;
        masterCampaign.campaigns.push(campaign);
        masterCampaign.totalViews += campaign.total_views || 0;
        masterCampaign.totalEngagement += campaign.total_engagement || 0;
      }
    });

    // Calculate average engagement rate and format date range for each master campaign
    Array.from(grouped.values()).forEach(masterCampaign => {
      const campaignsWithRate = masterCampaign.campaigns.filter(c => c.engagement_rate > 0);
      masterCampaign.avgEngagementRate = campaignsWithRate.length > 0
        ? campaignsWithRate.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaignsWithRate.length
        : 0;

      // Format date range
      if (masterCampaign.startDate && masterCampaign.endDate) {
        masterCampaign.dateRange = `${format(new Date(masterCampaign.startDate), 'MMM d, yyyy')} - ${format(new Date(masterCampaign.endDate), 'MMM d, yyyy')}`;
      } else if (masterCampaign.startDate) {
        masterCampaign.dateRange = `Started ${format(new Date(masterCampaign.startDate), 'MMM d, yyyy')}`;
      } else {
        // Use campaign date range as fallback
        const dates = masterCampaign.campaigns.map(c => new Date(c.campaign_date)).sort();
        if (dates.length > 0) {
          const start = format(dates[0], 'MMM d, yyyy');
          const end = dates.length > 1 ? format(dates[dates.length - 1], 'MMM d, yyyy') : start;
          masterCampaign.dateRange = start === end ? start : `${start} - ${end}`;
        }
      }
    });

    return Array.from(grouped.values());
  }, [campaigns]);

  // Filter master campaigns based on search
  const filteredMasterCampaigns = useMemo(() => {
    return masterCampaigns.filter(masterCampaign =>
      masterCampaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      masterCampaign.campaigns.some(campaign =>
        campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [masterCampaigns, searchTerm]);

  const orphanedCampaigns = useMemo(() => {
    return campaigns.filter(campaign => !campaign.master_campaign_name);
  }, [campaigns]);

  const handleExportPDF = () => {
    try {
      if (filteredMasterCampaigns.length === 0) {
        toast.error('No master campaigns to export');
        return;
      }

      const exporter = new PremiumPDFExporter();
      const masterCampaignData: MasterCampaignData[] = filteredMasterCampaigns.map(mc => ({
        name: mc.name,
        campaigns: mc.campaigns,
        totalViews: mc.totalViews,
        totalEngagement: mc.totalEngagement,
        avgEngagementRate: mc.avgEngagementRate,
        dateRange: mc.dateRange
      }));
      
      exporter.exportMasterCampaigns(masterCampaignData, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true
      });
      
      toast.success(`PDF report exported with ${filteredMasterCampaigns.length} master campaigns`);
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
              <p className="text-muted-foreground">Loading master campaigns...</p>
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
            <h1 className="text-3xl font-bold">Master Campaigns</h1>
            <p className="text-muted-foreground">
              Group and manage related campaigns together
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleExportPDF} 
              disabled={filteredMasterCampaigns.length === 0}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Badge variant="outline" className="text-sm">
              {filteredMasterCampaigns.length} master campaigns
            </Badge>
            <Badge variant="outline" className="text-sm">
              {orphanedCampaigns.length} unlinked campaigns
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Campaign Overview</TabsTrigger>
            <TabsTrigger value="master-campaigns">
              <Settings className="w-4 h-4 mr-2" />
              Master Campaigns
            </TabsTrigger>
            <TabsTrigger value="creators">
              <UserPlus className="w-4 h-4 mr-2" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Building className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Master Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="search">Search by master campaign name, brand, creator, or client</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search master campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Master Campaigns */}
            <div className="space-y-6">
              {filteredMasterCampaigns.length > 0 ? (
                filteredMasterCampaigns.map((masterCampaign) => (
                  <Card key={masterCampaign.name} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-primary" />
                            {masterCampaign.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {masterCampaign.campaigns.length} campaigns • {masterCampaign.dateRange}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {masterCampaign.campaigns.length} campaigns
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Aggregate Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Total Views</p>
                            <p className="text-2xl font-bold">{masterCampaign.totalViews.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Total Engagement</p>
                            <p className="text-2xl font-bold">{masterCampaign.totalEngagement.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Avg Engagement Rate</p>
                            <p className="text-2xl font-bold">{masterCampaign.avgEngagementRate.toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Individual Campaigns */}
                      <div>
                        <h4 className="font-medium mb-3">Individual Campaigns</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {masterCampaign.campaigns.map((campaign) => (
                            <div
                              key={campaign.id}
                              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                          <h5 className="font-medium text-sm">{campaign.brand_name}</h5>
                                </div>
                                <Badge variant={
                                  campaign.status === 'completed' ? 'default' :
                                  campaign.status === 'analyzing' ? 'secondary' :
                                  campaign.status === 'error' ? 'destructive' : 'outline'
                                } className="text-xs">
                                  {campaign.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                  <span>Views:</span>
                                  <span>{campaign.total_views?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Engagement:</span>
                                  <span>{campaign.total_engagement?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rate:</span>
                                  <span>{campaign.engagement_rate?.toFixed(2) || 0}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Date:</span>
                                  <span>{format(new Date(campaign.campaign_date), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : searchTerm ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No master campaigns found</h3>
                    <p className="text-muted-foreground">
                      No master campaigns match your search criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No master campaigns yet</h3>
                    <p className="text-muted-foreground">
                      Start by linking campaigns together to create master campaigns.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Unlinked Campaigns Section */}
              {orphanedCampaigns.length > 0 && (
                <Card className="border-l-4 border-l-muted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      Unlinked Campaigns
                    </CardTitle>
                    <CardDescription>
                      {orphanedCampaigns.length} campaigns not linked to any master campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {orphanedCampaigns.slice(0, 9).map((campaign) => (
                        <div
                          key={campaign.id}
                          className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-sm">{campaign.brand_name}</h5>
                            </div>
                            <Badge variant={
                              campaign.status === 'completed' ? 'default' :
                              campaign.status === 'analyzing' ? 'secondary' :
                              campaign.status === 'error' ? 'destructive' : 'outline'
                            } className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>{format(new Date(campaign.campaign_date), 'MMM d, yyyy')}</p>
                            <p>{campaign.clients?.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {orphanedCampaigns.length > 9 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        And {orphanedCampaigns.length - 9} more unlinked campaigns...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="master-campaigns">
            <MasterCampaignManagement />
          </TabsContent>

          <TabsContent value="creators">
            <CreatorManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}