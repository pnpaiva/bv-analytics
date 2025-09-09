import React from 'react';
import { Campaign } from '@/hooks/useCampaigns';
import { useMasterCampaignAnalytics } from '@/hooks/useMasterCampaignAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ContentUrlDropdown } from './ContentUrlDropdown';

export type SortField = 'brand_name' | 'status' | 'total_views' | 'total_engagement' | 'engagement_rate' | 'deal_value' | 'created_at';
export type SortOrder = 'asc' | 'desc';

interface CampaignTableProps {
  campaigns: Campaign[];
  onViewAnalytics: (campaign: Campaign) => void;
  selectedCampaignIds: string[];
  onCampaignSelect: (campaignId: string, isSelected: boolean) => void;
  showDealValue: boolean;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort: (field: SortField) => void;
}

// Hook to get correct analytics for both regular and master campaigns
function useCampaignAnalytics(campaign: Campaign) {
  const masterAnalytics = useMasterCampaignAnalytics(
    campaign.is_master_campaign_template ? campaign.master_campaign_name : null
  );

  if (campaign.is_master_campaign_template) {
    return {
      views: masterAnalytics.totalViews,
      engagement: masterAnalytics.totalEngagement,
      rate: masterAnalytics.engagementRate
    };
  }

  return {
    views: campaign.total_views || 0,
    engagement: campaign.total_engagement || 0,
    rate: campaign.engagement_rate || 0
  };
}

export function CampaignTable({
  campaigns,
  onViewAnalytics,
  selectedCampaignIds,
  onCampaignSelect,
  showDealValue,
  sortField,
  sortOrder,
  onSort
}: CampaignTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(field)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        {children}
        {getSortIcon(field)}
      </Button>
    </TableHead>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <SortableHeader field="brand_name">Campaign</SortableHeader>
            <TableHead>Client</TableHead>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="total_views">Views</SortableHeader>
            <SortableHeader field="total_engagement">Engagement</SortableHeader>
            {showDealValue && <SortableHeader field="deal_value">Deal Value</SortableHeader>}
            <SortableHeader field="created_at">Created</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const analytics = useCampaignAnalytics(campaign);
            return (
            <TableRow key={campaign.id}>
              <TableCell>
                {campaign.status !== 'draft' && (
                  <Checkbox
                    checked={selectedCampaignIds.includes(campaign.id)}
                    onCheckedChange={(checked) => 
                      onCampaignSelect(campaign.id, checked as boolean)
                    }
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{campaign.brand_name}</div>
                {campaign.creators?.name && (
                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                    {campaign.creators.name}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{campaign.clients?.name || 'No Client'}</span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatNumber(analytics.views)}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Rate:</span> {analytics.rate.toFixed(2)}%
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total:</span> {formatNumber(analytics.engagement)}
                  </div>
                </div>
              </TableCell>
              {showDealValue && (
                <TableCell>
                  <span className="font-medium">
                    {campaign.deal_value ? formatCurrency(campaign.deal_value) : '-'}
                  </span>
                </TableCell>
              )}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAnalytics(campaign)}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  {campaign.content_urls && Object.keys(campaign.content_urls).length > 0 && (
                    <ContentUrlDropdown contentUrls={campaign.content_urls} />
                  )}
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}