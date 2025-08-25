import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, Users } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Campaign } from '@/hooks/useCampaigns';
import { Creator } from '@/hooks/useCreators';

interface CampaignCreatorComparisonProps {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  creators: Creator[];
  campaignCreators: any[];
  getCreatorIdForUrl: (campaignId: string, url?: string) => string | undefined;
  creatorLookup: Map<string, string>;
}

export function CampaignCreatorComparison({ 
  campaigns, 
  filteredCampaigns, 
  creators, 
  campaignCreators,
  getCreatorIdForUrl,
  creatorLookup 
}: CampaignCreatorComparisonProps) {
  const creatorPerformanceInCampaigns = useMemo(() => {
    const performanceData: { [campaignId: string]: { [creatorId: string]: { views: number; engagement: number; urls: number } } } = {};
    
    filteredCampaigns.forEach(campaign => {
      performanceData[campaign.id] = {};
      
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            platformData.forEach((item: any) => {
              const creatorId = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
              if (creatorId) {
                if (!performanceData[campaign.id][creatorId]) {
                  performanceData[campaign.id][creatorId] = { views: 0, engagement: 0, urls: 0 };
                }
                performanceData[campaign.id][creatorId].views += item.views || 0;
                performanceData[campaign.id][creatorId].engagement += item.engagement || 0;
                performanceData[campaign.id][creatorId].urls += 1;
              }
            });
          }
        });
      }
    });

    return performanceData;
  }, [filteredCampaigns, getCreatorIdForUrl]);

  const creatorComparisons = useMemo(() => {
    const comparisons: Array<{
      campaign: Campaign;
      creators: Array<{
        id: string;
        name: string;
        views: number;
        engagement: number;
        engagementRate: number;
        urls: number;
        performance: 'overperformer' | 'underperformer' | 'average';
      }>;
      avgViews: number;
      avgEngagement: number;
      avgEngagementRate: number;
    }> = [];

    Object.entries(creatorPerformanceInCampaigns).forEach(([campaignId, creatorsData]) => {
      const campaign = filteredCampaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const creatorMetrics = Object.entries(creatorsData).map(([creatorId, data]) => {
        const name = creatorLookup.get(creatorId) || 'Unknown Creator';
        const engagementRate = data.views > 0 ? (data.engagement / data.views) * 100 : 0;
        
        return {
          id: creatorId,
          name,
          views: data.views,
          engagement: data.engagement,
          engagementRate,
          urls: data.urls,
          performance: 'average' as 'overperformer' | 'underperformer' | 'average'
        };
      });

      if (creatorMetrics.length > 1) {
        const avgViews = creatorMetrics.reduce((sum, c) => sum + c.views, 0) / creatorMetrics.length;
        const avgEngagement = creatorMetrics.reduce((sum, c) => sum + c.engagement, 0) / creatorMetrics.length;
        const avgEngagementRate = creatorMetrics.reduce((sum, c) => sum + c.engagementRate, 0) / creatorMetrics.length;

        // Classify performance
        creatorMetrics.forEach(creator => {
          if (creator.views > avgViews * 1.3 && creator.engagementRate > avgEngagementRate * 1.2) {
            creator.performance = 'overperformer';
          } else if (creator.views < avgViews * 0.7 || creator.engagementRate < avgEngagementRate * 0.8) {
            creator.performance = 'underperformer';
          }
        });

        comparisons.push({
          campaign,
          creators: creatorMetrics.sort((a, b) => b.views - a.views),
          avgViews,
          avgEngagement,
          avgEngagementRate
        });
      }
    });

    return comparisons.sort((a, b) => b.avgViews - a.avgViews);
  }, [creatorPerformanceInCampaigns, filteredCampaigns, creatorLookup]);

  const scatterData = useMemo(() => {
    const data: Array<{
      x: number;
      y: number;
      size: number;
      creator: string;
      campaign: string;
      performance: string;
      fill: string;
      views: number;
      engagement: number;
      engagementRate: number;
    }> = [];

    creatorComparisons.forEach(comparison => {
      comparison.creators.forEach(creator => {
        data.push({
          x: creator.views,
          y: creator.engagementRate,
          size: creator.engagement,
          creator: creator.name,
          campaign: comparison.campaign.brand_name,
          performance: creator.performance,
          fill: creator.performance === 'overperformer' ? 'hsl(var(--brand-accent-green))' : 
                creator.performance === 'underperformer' ? 'hsl(var(--destructive))' : 
                'hsl(var(--primary))',
          views: creator.views,
          engagement: creator.engagement,
          engagementRate: creator.engagementRate
        });
      });
    });

    return data;
  }, [creatorComparisons]);

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'overperformer':
        return <Badge className="bg-green-100 text-green-800"><Star className="w-3 h-3 mr-1" />Overperformer</Badge>;
      case 'underperformer':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Underperformer</Badge>;
      default:
        return <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />Average</Badge>;
    }
  };

  const renderTooltip = (props: any) => {
    if (!props.active || !props.payload || !props.payload[0]) return null;
    
    const data = props.payload[0].payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-semibold">{data.creator}</p>
        <p className="text-sm text-muted-foreground">{data.campaign}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p>Views: {data.views.toLocaleString()}</p>
          <p>Engagement: {data.engagement.toLocaleString()}</p>
          <p>Engagement Rate: {data.engagementRate.toFixed(2)}%</p>
          <p>Performance: {data.performance}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Performance Comparison</CardTitle>
          <CardDescription>
            Compare how creators performed within the same campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Views"
                tickFormatter={(value) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                  return value.toString();
                }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Engagement Rate (%)"
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <ZAxis type="number" dataKey="size" range={[50, 200]} name="Engagement" />
              <Tooltip content={renderTooltip} />
              <Scatter 
                name="Creator Performance" 
                data={scatterData}
                fill="hsl(var(--primary))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Creator Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of creator performance within campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {creatorComparisons.map((comparison, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{comparison.campaign.brand_name}</h4>
                  <div className="text-sm text-muted-foreground">
                    Avg Views: {comparison.avgViews.toFixed(0).toLocaleString()} | 
                    Avg Eng Rate: {comparison.avgEngagementRate.toFixed(2)}%
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparison.creators.map((creator, creatorIndex) => (
                    <div key={creatorIndex} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium truncate">{creator.name}</span>
                        {getPerformanceBadge(creator.performance)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Views: {creator.views.toLocaleString()}</div>
                        <div>Engagement: {creator.engagement.toLocaleString()}</div>
                        <div>Eng Rate: {creator.engagementRate.toFixed(2)}%</div>
                        <div>Content URLs: {creator.urls}</div>
                      </div>
                      
                      {creator.performance === 'overperformer' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                          💡 This creator exceeded campaign averages significantly
                        </div>
                      )}
                      
                      {creator.performance === 'underperformer' && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                          ⚠️ This creator performed below campaign averages
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}