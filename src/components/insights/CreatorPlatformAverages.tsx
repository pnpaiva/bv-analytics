import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Eye, Heart } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { Creator } from '@/hooks/useCreators';

interface CreatorPlatformAveragesProps {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  creators: Creator[];
  getCreatorIdForUrl: (campaignId: string, url?: string) => string | undefined;
  creatorLookup: Map<string, string>;
}

export function CreatorPlatformAverages({ 
  filteredCampaigns, 
  creators, 
  getCreatorIdForUrl,
  creatorLookup 
}: CreatorPlatformAveragesProps) {
  const creatorPlatformAverages = useMemo(() => {
    const averages: { 
      [creatorId: string]: { 
        [platform: string]: { 
          totalViews: number; 
          totalEngagement: number; 
          contentCount: number;
          campaigns: Set<string>;
          avgViewsPerContent: number;
          avgEngagementPerContent: number;
          avgEngagementRate: number;
        } 
      } 
    } = {};
    
    // Collect data across all campaigns
    filteredCampaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            platformData.forEach((item: any) => {
              const creatorId = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
              if (creatorId) {
                if (!averages[creatorId]) {
                  averages[creatorId] = {};
                }
                if (!averages[creatorId][platform]) {
                  averages[creatorId][platform] = { 
                    totalViews: 0, 
                    totalEngagement: 0, 
                    contentCount: 0,
                    campaigns: new Set(),
                    avgViewsPerContent: 0,
                    avgEngagementPerContent: 0,
                    avgEngagementRate: 0
                  };
                }
                averages[creatorId][platform].totalViews += item.views || 0;
                averages[creatorId][platform].totalEngagement += item.engagement || 0;
                averages[creatorId][platform].contentCount += 1;
                averages[creatorId][platform].campaigns.add(campaign.id);
              }
            });
          }
        });
      }
    });

    // Calculate averages
    Object.entries(averages).forEach(([creatorId, platforms]) => {
      Object.entries(platforms).forEach(([platform, data]) => {
        data.avgViewsPerContent = data.contentCount > 0 ? data.totalViews / data.contentCount : 0;
        data.avgEngagementPerContent = data.contentCount > 0 ? data.totalEngagement / data.contentCount : 0;
        data.avgEngagementRate = data.totalViews > 0 ? (data.totalEngagement / data.totalViews) * 100 : 0;
      });
    });

    return averages;
  }, [filteredCampaigns, getCreatorIdForUrl]);

  const summaryStats = useMemo(() => {
    const stats: Array<{
      creator: string;
      creatorId: string;
      platforms: Array<{
        platform: string;
        avgViews: number;
        avgEngagement: number;
        avgEngagementRate: number;
        contentCount: number;
        campaignCount: number;
        consistency: number; // coefficient of variation
      }>;
      totalContent: number;
      totalCampaigns: number;
      overallAvgViews: number;
      overallAvgEngagement: number;
      bestPlatform: string;
      mostConsistent: string;
    }> = [];

    Object.entries(creatorPlatformAverages).forEach(([creatorId, platforms]) => {
      const creatorName = creatorLookup.get(creatorId) || 'Unknown Creator';
      
      const platformStats = Object.entries(platforms).map(([platform, data]) => {
        // Calculate consistency (lower is more consistent)
        const consistency = data.avgViewsPerContent > 0 ? 
          (Math.sqrt(data.totalViews / data.contentCount) / data.avgViewsPerContent) * 100 : 100;

        return {
          platform,
          avgViews: data.avgViewsPerContent,
          avgEngagement: data.avgEngagementPerContent,
          avgEngagementRate: data.avgEngagementRate,
          contentCount: data.contentCount,
          campaignCount: data.campaigns.size,
          consistency
        };
      });

      const totalContent = platformStats.reduce((sum, p) => sum + p.contentCount, 0);
      const totalCampaigns = Math.max(...platformStats.map(p => p.campaignCount));
      const overallAvgViews = platformStats.reduce((sum, p) => sum + p.avgViews, 0) / platformStats.length;
      const overallAvgEngagement = platformStats.reduce((sum, p) => sum + p.avgEngagement, 0) / platformStats.length;
      
      const bestPlatform = platformStats.reduce((a, b) => a.avgViews > b.avgViews ? a : b).platform;
      const mostConsistent = platformStats.reduce((a, b) => a.consistency < b.consistency ? a : b).platform;

      stats.push({
        creator: creatorName,
        creatorId,
        platforms: platformStats.sort((a, b) => b.avgViews - a.avgViews),
        totalContent,
        totalCampaigns,
        overallAvgViews,
        overallAvgEngagement,
        bestPlatform,
        mostConsistent
      });
    });

    return stats.sort((a, b) => b.overallAvgViews - a.overallAvgViews);
  }, [creatorPlatformAverages, creatorLookup]);

  const chartData = useMemo(() => {
    return summaryStats.slice(0, 10).map(creator => {
      const data: { creator: string; [key: string]: any } = { 
        creator: creator.creator.length > 12 ? creator.creator.substring(0, 12) + '...' : creator.creator 
      };
      creator.platforms.forEach(platform => {
        data[platform.platform] = platform.avgViews;
      });
      return data;
    });
  }, [summaryStats]);

  const distributionData = useMemo(() => {
    const platformAverages: { [platform: string]: { totalViews: number; totalEngagement: number; creatorCount: number } } = {};
    
    summaryStats.forEach(creator => {
      creator.platforms.forEach(platform => {
        if (!platformAverages[platform.platform]) {
          platformAverages[platform.platform] = { totalViews: 0, totalEngagement: 0, creatorCount: 0 };
        }
        platformAverages[platform.platform].totalViews += platform.avgViews;
        platformAverages[platform.platform].totalEngagement += platform.avgEngagement;
        platformAverages[platform.platform].creatorCount += 1;
      });
    });

    return Object.entries(platformAverages).map(([platform, data]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      avgViews: data.totalViews / data.creatorCount,
      avgEngagement: data.totalEngagement / data.creatorCount,
      creatorCount: data.creatorCount
    }));
  }, [summaryStats]);

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'hsl(var(--primary))';
    if (p.includes('instagram')) return 'hsl(var(--brand-accent-green))';
    if (p.includes('tiktok')) return 'hsl(var(--teal))';
    return 'hsl(var(--secondary))';
  };

  const getConsistencyBadge = (consistency: number) => {
    if (consistency < 30) return <Badge className="bg-green-100 text-green-800">Consistent</Badge>;
    if (consistency < 60) return <Badge variant="secondary">Moderate</Badge>;
    return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Variable</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/Content</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.length > 0 ? 
                (summaryStats.reduce((sum, c) => sum + c.overallAvgViews, 0) / summaryStats.length).toFixed(0).toLocaleString() : 
                '0'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement/Content</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.length > 0 ? 
                (summaryStats.reduce((sum, c) => sum + c.overallAvgEngagement, 0) / summaryStats.length).toFixed(0).toLocaleString() : 
                '0'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content Pieces</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.reduce((sum, c) => sum + c.totalContent, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Performance by Platform</CardTitle>
          <CardDescription>
            Average views per content piece for each creator across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="creator" 
                tick={{ fontSize: 11 }}
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
                `${String(name).charAt(0).toUpperCase() + String(name).slice(1)} Avg Views`
              ]} />
              <Legend />
              {chartData.length > 0 &&
                Object.keys(chartData[0])
                  .filter(key => key !== 'creator')
                  .map(platform => (
                    <Bar 
                      key={platform}
                      dataKey={platform} 
                      fill={getPlatformColor(platform)}
                      name={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    />
                  ))
              }
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Averages Across All Creators</CardTitle>
          <CardDescription>
            How different platforms perform on average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis tickFormatter={(value) => {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                return value.toString();
              }} />
              <Tooltip formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'avgViews' ? 'Avg Views' : 'Avg Engagement'
              ]} />
              <Legend />
              <Bar dataKey="avgViews" fill="hsl(var(--primary))" name="Avg Views" />
              <Bar dataKey="avgEngagement" fill="hsl(var(--brand-accent-green))" name="Avg Engagement" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Creator Platform Statistics</CardTitle>
          <CardDescription>
            Comprehensive breakdown of creator performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Best Platform</TableHead>
                  <TableHead>Most Consistent</TableHead>
                  <TableHead className="text-right">Total Content</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-right">Overall Avg Views</TableHead>
                  <TableHead className="text-right">Overall Avg Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryStats.slice(0, 15).map((creator, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{creator.creator}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getPlatformColor(creator.bestPlatform), color: 'white' }}>
                        {creator.bestPlatform.charAt(0).toUpperCase() + creator.bestPlatform.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getConsistencyBadge(creator.platforms.find(p => p.platform === creator.mostConsistent)?.consistency || 100)}
                    </TableCell>
                    <TableCell className="text-right">{creator.totalContent}</TableCell>
                    <TableCell className="text-right">{creator.totalCampaigns}</TableCell>
                    <TableCell className="text-right">{creator.overallAvgViews.toFixed(0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{creator.overallAvgEngagement.toFixed(0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}