import React, { useState, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
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
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
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
  const [itemsPerPage] = useState(12);
  const [refreshProgressOpen, setRefreshProgressOpen] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [showDealValue, setShowDealValue] = useState(true);
  
  const { data: campaigns = [], isLoading, refetch } = useAccessibleCampaigns();
  const { canCreate, canEdit, canDelete } = useUserPermissions();
  const { data: accessibleCampaignIds = [] } = useUserAccessibleCampaigns();
  
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
      
      await exporter.exportPremiumReport(filteredCampaigns, exportTitle, {
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
    setRefreshAllDialogOpen(false);
    
    const campaignsToRefresh = campaigns.filter(c => c.status !== 'draft');
    if (campaignsToRefresh.length === 0) {
      toast.error('No campaigns to refresh');
      return;
    }

    // Open the progress dialog instead of running the refresh directly
    setRefreshProgressOpen(true);
  };

  const handleRefreshSelected = () => {
    if (selectedCampaignIds.length === 0) {
      toast.error('No campaigns selected');
      return;
    }
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
    const filteredIds = filteredCampaigns.filter(c => c.status !== 'draft').map(c => c.id);
    setSelectedCampaignIds(prev => 
      prev.length === filteredIds.length ? [] : filteredIds
    );
  };

  const handleRefreshComplete = useCallback(() => {
    // Add a delay to ensure backend has fully committed status changes
    setTimeout(() => {
      refetch();
      toast.success('Campaign refresh completed');
    }, 2000);
  }, [refetch]);

  const filteredCampaigns = campaigns.filter(campaign => {
    // First check if user has access to this campaign
    const hasAccess = accessibleCampaignIds.length === 0 || accessibleCampaignIds.includes(campaign.id);
    if (!hasAccess) return false;
    
    // Then check search filter
    const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const computedCampaignIds = useMemo(() => {
    if (selectedCampaignIds.length > 0) return [...selectedCampaignIds].sort();
    const ids = campaigns.filter(c => c.status !== 'draft').map(c => c.id);
    ids.sort();
    return ids;
  }, [selectedCampaignIds, campaigns]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

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
              <Button variant="outline" onClick={handleRefreshSelected}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Selected ({selectedCampaignIds.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={filteredCampaigns.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => setRefreshAllDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
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
          {filteredCampaigns.filter(c => c.status !== 'draft').length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleSelectAll}
              className="whitespace-nowrap"
            >
              {selectedCampaignIds.length === filteredCampaigns.filter(c => c.status !== 'draft').length 
                ? 'Deselect All' 
                : 'Select All'
              }
            </Button>
          )}
        </div>

        {filteredCampaigns.length === 0 ? (
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
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
          campaignCount={filteredCampaigns.length}
          defaultTitle={searchTerm 
            ? `Filtered Campaigns Report` 
            : 'All Campaigns Report'}
        />

        <RefreshProgressDialog
          open={refreshProgressOpen}
          onOpenChange={setRefreshProgressOpen}
          campaignIds={computedCampaignIds}
          onComplete={handleRefreshComplete}
        />

        <AlertDialog open={refreshAllDialogOpen} onOpenChange={setRefreshAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Refresh All</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to refresh all campaigns? This action will update analytics for all campaigns and will incur higher costs compared to refreshing individual campaigns.
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
