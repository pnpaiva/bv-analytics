import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Campaign } from '@/hooks/useCampaigns';

interface CampaignPlatformComparisonProps {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
}

export function CampaignPlatformComparison({ campaigns, filteredCampaigns }: CampaignPlatformComparisonProps) {
  const platformComparison = useMemo(() => {
    const campaignPlatformData: { [campaignId: string]: { [platform: string]: { views: number; engagement: number } } } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        campaignPlatformData[campaign.brand_name] = {};
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            const views = platformData.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
            const engagement = platformData.reduce((sum: number, item: any) => sum + (item.engagement || 0), 0);
            campaignPlatformData[campaign.brand_name][platform] = { views, engagement };
          }
        });
      }
    });

    return campaignPlatformData;
  }, [filteredCampaigns]);

  const platformPerformanceInsights = useMemo(() => {
    const insights: Array<{
      campaign: string;
      bestPlatform: string;
      bestViews: number;
      bestEngagementRate: number;
      worstPlatform: string;
      worstViews: number;
      worstEngagementRate: number;
      platforms: Array<{ name: string; views: number; engagement: number; rate: number }>;
    }> = [];

    Object.entries(platformComparison).forEach(([campaign, platforms]) => {
      const platformMetrics = Object.entries(platforms).map(([platform, data]) => ({
        name: platform,
        views: data.views,
        engagement: data.engagement,
        rate: data.views > 0 ? (data.engagement / data.views) * 100 : 0
      }));

      if (platformMetrics.length > 1) {
        const bestByViews = platformMetrics.reduce((a, b) => a.views > b.views ? a : b);
        const worstByViews = platformMetrics.reduce((a, b) => a.views < b.views ? a : b);
        
        insights.push({
          campaign,
          bestPlatform: bestByViews.name,
          bestViews: bestByViews.views,
          bestEngagementRate: bestByViews.rate,
          worstPlatform: worstByViews.name,
          worstViews: worstByViews.views,
          worstEngagementRate: worstByViews.rate,
          platforms: platformMetrics
        });
      }
    });

    return insights.sort((a, b) => b.bestViews - a.bestViews);
  }, [platformComparison]);

  const chartData = useMemo(() => {
    const data: Array<{ campaign: string; [key: string]: any }> = [];
    
    Object.entries(platformComparison).forEach(([campaign, platforms]) => {
      const item: { campaign: string; [key: string]: any } = { campaign };
      Object.entries(platforms).forEach(([platform, data]) => {
        item[`${platform}_views`] = data.views;
        item[`${platform}_engagement`] = data.engagement;
      });
      data.push(item);
    });

    return data;
  }, [platformComparison]);

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'hsl(var(--primary))';
    if (p.includes('instagram')) return 'hsl(var(--brand-accent-green))';
    if (p.includes('tiktok')) return 'hsl(var(--teal))';
    return 'hsl(var(--secondary))';
  };

  const getTrendIcon = (best: number, worst: number) => {
    const ratio = best / (worst || 1);
    if (ratio > 2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (ratio < 0.5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign × Platform Performance</CardTitle>
          <CardDescription>
            Compare how different campaigns performed across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="campaign" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={(value) => {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                return value.toString();
              }} />
              <Tooltip formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                String(name).replace('_views', '').replace('_engagement', '') + (String(name).includes('views') ? ' Views' : ' Engagement')
              ]} />
              <Legend />
              {/* Dynamically create bars for each platform */}
              {Object.keys(platformComparison).length > 0 && 
                Object.keys(Object.values(platformComparison)[0] || {}).map(platform => (
                  <Bar 
                    key={`${platform}_views`}
                    dataKey={`${platform}_views`} 
                    fill={getPlatformColor(platform)}
                    name={`${platform.charAt(0).toUpperCase() + platform.slice(1)} Views`}
                  />
                ))
              }
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Insights</CardTitle>
          <CardDescription>
            Which platforms worked best for each campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformPerformanceInsights.map((insight, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{insight.campaign}</h4>
                  {getTrendIcon(insight.bestViews, insight.worstViews)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">
                      Best: {insight.bestPlatform.charAt(0).toUpperCase() + insight.bestPlatform.slice(1)}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      <div>Views: {insight.bestViews.toLocaleString()}</div>
                      <div>Engagement Rate: {insight.bestEngagementRate.toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      Lowest: {insight.worstPlatform.charAt(0).toUpperCase() + insight.worstPlatform.slice(1)}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      <div>Views: {insight.worstViews.toLocaleString()}</div>
                      <div>Engagement Rate: {insight.worstEngagementRate.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
                {insight.bestViews > insight.worstViews * 2 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    💡 <strong>Insight:</strong> {insight.bestPlatform.charAt(0).toUpperCase() + insight.bestPlatform.slice(1)} 
                    performed {(insight.bestViews / insight.worstViews).toFixed(1)}x better than {insight.worstPlatform} 
                    for this campaign. Consider focusing more budget on {insight.bestPlatform} for similar campaigns.
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}