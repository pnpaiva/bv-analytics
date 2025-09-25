import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Campaign } from '@/hooks/useCampaigns';
import { format, parseISO } from 'date-fns';

interface CampaignTimelineChartProps {
  campaigns: Campaign[];
}

interface MonthlyData {
  month: string;
  campaigns: number;
  totalViews: number;
  totalEngagement: number;
}

export const CampaignTimelineChart: React.FC<CampaignTimelineChartProps> = ({ campaigns }) => {
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, MonthlyData>();

    campaigns.forEach(campaign => {
      if (campaign.campaign_date) {
        try {
          const date = parseISO(campaign.campaign_date);
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMM yyyy');

          const existing = monthlyMap.get(monthKey) || {
            month: monthLabel,
            campaigns: 0,
            totalViews: 0,
            totalEngagement: 0
          };

          monthlyMap.set(monthKey, {
            month: monthLabel,
            campaigns: existing.campaigns + 1,
            totalViews: existing.totalViews + (campaign.total_views || 0),
            totalEngagement: existing.totalEngagement + (campaign.total_engagement || 0)
          });
        } catch (error) {
          console.warn('Invalid date format for campaign:', campaign.id, campaign.campaign_date);
        }
      }
    });

    // Sort by month
    const sortedData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);

    return sortedData;
  }, [campaigns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'campaigns' ? 'Campaigns' : 
                entry.dataKey === 'totalViews' ? 'Total Views' : 'Total Engagement'}: ${
                entry.dataKey === 'totalViews' || entry.dataKey === 'totalEngagement' 
                  ? entry.value.toLocaleString() 
                  : entry.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs fill-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="campaigns" 
            fill="hsl(var(--primary))" 
            name="Campaigns"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};