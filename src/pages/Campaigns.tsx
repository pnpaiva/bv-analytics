import React, { useState, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CampaignTable, SortField, SortOrder } from '@/components/campaigns/CampaignTable';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';
import { CampaignAnalyticsModal } from '@/components/campaigns/CampaignAnalyticsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { useUserAccessibleCampaigns } from '@/hooks/useCampaignAssignments';
import { useAccessibleCampaigns } from '@/hooks/useAccessibleCampaigns';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, EyeOff, Grid3X3, List } from 'lucide-react';
import { Loader2 } from 'lucide-react';

import { PremiumPDFExporter } from '@/utils/premiumPdfExporter';
import { ExportCustomizationDialog, ExportCustomizationOptions } from '@/components/campaigns/ExportCustomizationDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshProgressDialog } from '@/components/campaigns/RefreshProgressDialog';

export default function Campaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [refreshAllDialogOpen, setRefreshAllDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [refreshProgressOpen, setRefreshProgressOpen] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDealValue, setShowDealValue] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { data: campaigns = [], isLoading, refetch } = useAccessibleCampaigns();
  const { canCreate, canEdit, canDelete } = useUserPermissions();
  const { data: accessibleCampaignIds = [] } = useUserAccessibleCampaigns();
  const queryClient = useQueryClient();
  
  // Debug logging
  console.log('Campaigns - canCreate:', canCreate);
  console.log('Campaigns - canEdit:', canEdit);
  console.log('Campaigns - accessibleCampaignIds:', accessibleCampaignIds);
  console.log('Campaigns - campaigns:', campaigns);

  const handleViewAnalytics = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAnalyticsOpen(true);
  };

  const handleExportPDF = async (options: ExportCustomizationOptions) => {
    try {
      const exporter = new PremiumPDFExporter();
      const exportTitle = options.customTitle || (searchTerm 
        ? `Filtered Campaigns Report` 
        : 'All Campaigns Report');
      
      await exporter.exportPremiumReport(sortedCampaigns, exportTitle, {
        includeAnalytics: options.includeAnalytics,
        includeContentUrls: options.includeContentUrls,
        includeMasterCampaigns: options.includeMasterCampaigns,
        includeCharts: options.includeCharts,
        includeLogo: options.includeLogo
      });
      
      toast.success('Premium PDF report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshing) {
      toast.warning('Refresh already in progress. Please wait for it to complete.');
      return;
    }

    setRefreshAllDialogOpen(false);
    
    const campaignsToRefresh = campaigns.filter(c => c.status !== 'draft');
    if (campaignsToRefresh.length === 0) {
      toast.error('No campaigns to refresh');
      return;
    }

    // For Apify starter subscription ($200 limit), process in smaller batches
    const BATCH_SIZE = 5; // Process 5 campaigns at a time to respect resource limits
    const campaignBatches = [];
    
    for (let i = 0; i < campaignsToRefresh.length; i += BATCH_SIZE) {
      campaignBatches.push(campaignsToRefresh.slice(i, i + BATCH_SIZE));
    }

    if (campaignBatches.length > 1) {
      toast.info(`Processing ${campaignsToRefresh.length} campaigns in ${campaignBatches.length} batches to respect Apify limits`);
    }

    // Set refreshing state and open progress dialog
    setIsRefreshing(true);
    setRefreshProgressOpen(true);
  };

  const handleRefreshSelected = () => {
    if (isRefreshing) {
      toast.warning('Refresh already in progress. Please wait for it to complete.');
      return;
    }

    if (selectedCampaignIds.length === 0) {
      toast.error('No campaigns selected');
      return;
    }
    
    setIsRefreshing(true);
    setRefreshProgressOpen(true);
  };

  const handleCampaignSelect = (campaignId: string, isSelected: boolean) => {
    setSelectedCampaignIds(prev => 
      isSelected 
        ? [...prev, campaignId]
        : prev.filter(id => id !== campaignId)
    );
  };

  const handleSelectAll = () => {
    const filteredIds = sortedCampaigns.filter(c => c.status !== 'draft').map(c => c.id);
    setSelectedCampaignIds(prev => 
      prev.length === filteredIds.length ? [] : filteredIds
    );
  };

  const handleRefreshComplete = useCallback(async () => {
    console.log('Starting refresh completion process...');
    
    // Reset refreshing state first
    setIsRefreshing(false);
    
    // Gentle invalidation - only invalidate specific queries, don't refetch everything
    queryClient.invalidateQueries({ queryKey: ['accessible-campaigns'] });
    queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0] === 'campaign-url-analytics'
    });
    
    // Wait a moment for invalidation to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Refresh completion process finished');
    toast.success('Campaign refresh completed - numbers should now be updated');
  }, [queryClient]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedCampaigns = React.useMemo(() => {
    const filtered = campaigns.filter(campaign => {
      // First check if user has access to this campaign
      const hasAccess = accessibleCampaignIds.length === 0 || accessibleCampaignIds.includes(campaign.id);
      if (!hasAccess) return false;
      
      // Only show completed campaigns with content URLs (finished campaigns)
      const isCompleted = campaign.status === 'completed';
      const hasContentUrls = campaign.content_urls && 
        Object.keys(campaign.content_urls).length > 0 &&
        Object.values(campaign.content_urls).some(urls => urls.length > 0);
      
      if (!isCompleted || !hasContentUrls) return false;
      
      // Then check search filter
      const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'brand_name':
          aValue = a.brand_name.toLowerCase();
          bValue = b.brand_name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'total_views':
          aValue = a.total_views || 0;
          bValue = b.total_views || 0;
          break;
        case 'total_engagement':
          aValue = a.total_engagement || 0;
          bValue = b.total_engagement || 0;
          break;
        case 'engagement_rate':
          aValue = a.engagement_rate || 0;
          bValue = b.engagement_rate || 0;
          break;
        case 'deal_value':
          aValue = a.deal_value || 0;
          bValue = b.deal_value || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [campaigns, accessibleCampaignIds, searchTerm, sortField, sortOrder]);


  const computedCampaignIds = useMemo(() => {
    if (selectedCampaignIds.length > 0) return [...selectedCampaignIds].sort();
    const ids = campaigns.filter(c => c.status !== 'draft').map(c => c.id);
    ids.sort();
    return ids;
  }, [selectedCampaignIds, campaigns]);

  // Pagination logic
  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = sortedCampaigns.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">
              Manage and analyze your influencer marketing campaigns
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              >
                {viewMode === 'cards' ? (
                  <>
                    <List className="h-4 w-4 mr-2" />
                    Table View
                  </>
                ) : (
                  <>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Card View
                  </>
                )}
              </Button>
            </div>
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
            {selectedCampaignIds.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleRefreshSelected}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : `Refresh Selected (${selectedCampaignIds.length})`}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setExportDialogOpen(true)} 
              disabled={sortedCampaigns.length === 0 || isRefreshing}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setRefreshAllDialogOpen(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh All'}
            </Button>

          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center space-x-4">
            {sortedCampaigns.filter(c => c.status !== 'draft').length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleSelectAll}
                className="whitespace-nowrap"
              >
                {selectedCampaignIds.length === sortedCampaigns.filter(c => c.status !== 'draft').length 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </Button>
            )}
            {viewMode === 'table' && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="items-per-page" className="text-sm text-muted-foreground">
                  Show:
                </Label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            )}
          </div>
        </div>

        {sortedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-6">
                {campaigns.length === 0 
                  ? "Get started by creating your first campaign."
                  : "Try adjusting your search or filter criteria."
                }
              </p>

            </div>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onViewAnalytics={handleViewAnalytics}
                    isSelected={selectedCampaignIds.includes(campaign.id)}
                    onSelect={(isSelected) => handleCampaignSelect(campaign.id, isSelected)}
                    showCheckbox={campaign.status !== 'draft'}
                    showDealValue={showDealValue}
                  />
                ))}
              </div>
            ) : (
              <CampaignTable
                campaigns={paginatedCampaigns}
                onViewAnalytics={handleViewAnalytics}
                selectedCampaignIds={selectedCampaignIds}
                onCampaignSelect={handleCampaignSelect}
                showDealValue={showDealValue}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedCampaigns.length)} of {sortedCampaigns.length} campaigns
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <CampaignAnalyticsModal
          campaign={selectedCampaign}
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
        />

        <ExportCustomizationDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExportPDF}
          campaignCount={sortedCampaigns.length}
          defaultTitle={searchTerm 
            ? `Filtered Campaigns Report` 
            : 'All Campaigns Report'}
        />

        <RefreshProgressDialog
          open={refreshProgressOpen}
          onOpenChange={(open) => {
            setRefreshProgressOpen(open);
            if (!open) {
              setIsRefreshing(false);
            }
          }}
          campaignIds={computedCampaignIds}
          onComplete={handleRefreshComplete}
        />

        <AlertDialog open={refreshAllDialogOpen} onOpenChange={setRefreshAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Refresh All</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to refresh all campaigns? This action will update analytics for all campaigns and will incur higher costs compared to refreshing individual campaigns.
                <br /><br />
                <strong>Recommendation:</strong> For better reliability, consider refreshing campaigns in smaller batches, especially if you have many campaigns with Instagram or TikTok content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRefreshAll}>
                Yes, Refresh All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
