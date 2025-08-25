import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Campaign } from '@/hooks/useCampaigns';
import { Creator } from '@/hooks/useCreators';

interface PlatformCreatorComparisonProps {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  creators: Creator[];
  getCreatorIdForUrl: (campaignId: string, url?: string) => string | undefined;
  creatorLookup: Map<string, string>;
}

export function PlatformCreatorComparison({ 
  filteredCampaigns, 
  creators, 
  getCreatorIdForUrl,
  creatorLookup 
}: PlatformCreatorComparisonProps) {
  const creatorPlatformPerformance = useMemo(() => {
    const performance: { [creatorId: string]: { [platform: string]: { views: number; engagement: number; contentCount: number } } } = {};
    
    filteredCampaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, platformData]: [string, any]) => {
          if (Array.isArray(platformData)) {
            platformData.forEach((item: any) => {
              const creatorId = getCreatorIdForUrl(campaign.id, item.url || item.content_url);
              if (creatorId) {
                if (!performance[creatorId]) {
                  performance[creatorId] = {};
                }
                if (!performance[creatorId][platform]) {
                  performance[creatorId][platform] = { views: 0, engagement: 0, contentCount: 0 };
                }
                performance[creatorId][platform].views += item.views || 0;
                performance[creatorId][platform].engagement += item.engagement || 0;
                performance[creatorId][platform].contentCount += 1;
              }
            });
          }
        });
      }
    });

    return performance;
  }, [filteredCampaigns, getCreatorIdForUrl]);

  const platformStrengthsWeaknesses = useMemo(() => {
    const analysis: Array<{
      creator: string;
      creatorId: string;
      platforms: Array<{
        name: string;
        views: number;
        engagement: number;
        engagementRate: number;
        contentCount: number;
        avgViewsPerContent: number;
        strength: 'strong' | 'weak' | 'neutral';
      }>;
      strongestPlatform: string;
      weakestPlatform: string;
      platformDiversity: number;
    }> = [];

    Object.entries(creatorPlatformPerformance).forEach(([creatorId, platforms]) => {
      const creatorName = creatorLookup.get(creatorId) || 'Unknown Creator';
      
      const platformMetrics = Object.entries(platforms).map(([platform, data]) => ({
        name: platform,
        views: data.views,
        engagement: data.engagement,
        engagementRate: data.views > 0 ? (data.engagement / data.views) * 100 : 0,
        contentCount: data.contentCount,
        avgViewsPerContent: data.contentCount > 0 ? data.views / data.contentCount : 0,
        strength: 'neutral' as 'strong' | 'weak' | 'neutral'
      }));

      if (platformMetrics.length > 1) {
        const avgViews = platformMetrics.reduce((sum, p) => sum + p.avgViewsPerContent, 0) / platformMetrics.length;
        const avgEngRate = platformMetrics.reduce((sum, p) => sum + p.engagementRate, 0) / platformMetrics.length;

        // Classify platform strength
        platformMetrics.forEach(platform => {
          if (platform.avgViewsPerContent > avgViews * 1.5 && platform.engagementRate > avgEngRate * 1.2) {
            platform.strength = 'strong';
          } else if (platform.avgViewsPerContent < avgViews * 0.6 || platform.engagementRate < avgEngRate * 0.7) {
            platform.strength = 'weak';
          }
        });

        const strongest = platformMetrics.reduce((a, b) => a.avgViewsPerContent > b.avgViewsPerContent ? a : b);
        const weakest = platformMetrics.reduce((a, b) => a.avgViewsPerContent < b.avgViewsPerContent ? a : b);
        
        // Calculate platform diversity (coefficient of variation)
        const viewsArray = platformMetrics.map(p => p.avgViewsPerContent);
        const mean = viewsArray.reduce((a, b) => a + b, 0) / viewsArray.length;
        const variance = viewsArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / viewsArray.length;
        const stdDev = Math.sqrt(variance);
        const diversity = mean > 0 ? (stdDev / mean) * 100 : 0;

        analysis.push({
          creator: creatorName,
          creatorId,
          platforms: platformMetrics.sort((a, b) => b.avgViewsPerContent - a.avgViewsPerContent),
          strongestPlatform: strongest.name,
          weakestPlatform: weakest.name,
          platformDiversity: diversity
        });
      }
    });

    return analysis.sort((a, b) => {
      const aMax = Math.max(...a.platforms.map(p => p.avgViewsPerContent));
      const bMax = Math.max(...b.platforms.map(p => p.avgViewsPerContent));
      return bMax - aMax;
    });
  }, [creatorPlatformPerformance, creatorLookup]);

  const radarChartData = useMemo(() => {
    return platformStrengthsWeaknesses.slice(0, 5).map(creator => {
      const data = creator.platforms.map(platform => ({
        platform: platform.name.charAt(0).toUpperCase() + platform.name.slice(1),
        [creator.creator]: Math.min(platform.avgViewsPerContent / 1000, 100) // Normalize for radar chart
      }));
      
      return {
        creator: creator.creator,
        data: data.reduce((acc, curr) => {
          acc[curr.platform] = curr[creator.creator];
          return acc;
        }, {} as any)
      };
    });
  }, [platformStrengthsWeaknesses]);

  const barChartData = useMemo(() => {
    const data: Array<{ creator: string; [key: string]: any }> = [];
    
    platformStrengthsWeaknesses.forEach(creator => {
      const item: { creator: string; [key: string]: any } = { 
        creator: creator.creator.length > 15 ? creator.creator.substring(0, 15) + '...' : creator.creator 
      };
      creator.platforms.forEach(platform => {
        item[platform.name] = platform.avgViewsPerContent;
      });
      data.push(item);
    });

    return data.slice(0, 10);
  }, [platformStrengthsWeaknesses]);

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return 'hsl(var(--primary))';
    if (p.includes('instagram')) return 'hsl(var(--brand-accent-green))';
    if (p.includes('tiktok')) return 'hsl(var(--teal))';
    return 'hsl(var(--secondary))';
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'strong':
        return <Badge className="bg-green-100 text-green-800"><Award className="w-3 h-3 mr-1" />Strong</Badge>;
      case 'weak':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><Target className="w-3 h-3 mr-1" />Opportunity</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  const getDiversityInsight = (diversity: number) => {
    if (diversity > 80) return { text: "Very specialized (focused on one platform)", color: "text-blue-600" };
    if (diversity > 50) return { text: "Moderately diversified", color: "text-green-600" };
    if (diversity > 20) return { text: "Well diversified across platforms", color: "text-purple-600" };
    return { text: "Evenly balanced across all platforms", color: "text-orange-600" };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Platform Strengths</CardTitle>
          <CardDescription>
            Average views per content piece by platform for each creator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
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
              {barChartData.length > 0 &&
                Object.keys(barChartData[0])
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
          <CardTitle>Platform Specialization Analysis</CardTitle>
          <CardDescription>
            Understand each creator's platform strengths and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {platformStrengthsWeaknesses.map((creator, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{creator.creator}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getDiversityInsight(creator.platformDiversity).color}`}>
                      {getDiversityInsight(creator.platformDiversity).text}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {creator.platforms.map((platform, platformIndex) => (
                    <div key={platformIndex} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{platform.name}</span>
                        {getStrengthBadge(platform.strength)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Total Views: {platform.views.toLocaleString()}</div>
                        <div>Avg per Content: {platform.avgViewsPerContent.toFixed(0).toLocaleString()}</div>
                        <div>Engagement Rate: {platform.engagementRate.toFixed(2)}%</div>
                        <div>Content Count: {platform.contentCount}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span>
                        <strong>Strongest:</strong> {creator.strongestPlatform.charAt(0).toUpperCase() + creator.strongestPlatform.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span>
                        <strong>Growth Opportunity:</strong> {creator.weakestPlatform.charAt(0).toUpperCase() + creator.weakestPlatform.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {creator.platforms.find(p => p.strength === 'strong') && creator.platforms.find(p => p.strength === 'weak') && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      💡 <strong>Recommendation:</strong> Consider applying successful strategies from {creator.strongestPlatform} to improve performance on {creator.weakestPlatform}.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}