import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';
import { CampaignAnalyticsModal } from '@/components/campaigns/CampaignAnalyticsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { PDFExporter } from '@/utils/pdfExporter';
import { EnhancedPDFExporter } from '@/utils/enhancedPdfExporter';
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

export default function Campaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshAllDialogOpen, setRefreshAllDialogOpen] = useState(false);
  
  const { data: campaigns = [], isLoading, refetch } = useCampaigns();

  const handleViewAnalytics = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAnalyticsOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      const exporter = new EnhancedPDFExporter();
      const exportTitle = searchTerm || statusFilter !== 'all' 
        ? `Filtered Campaigns Report` 
        : 'All Campaigns Report';
      
      await exporter.exportWithCharts(filteredCampaigns, exportTitle, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true,
        includeCharts: true
      });
      
      toast.success('Enhanced PDF report exported successfully');
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

    toast.info(`Refreshing ${campaignsToRefresh.length} campaigns...`);
    
    try {
      // Refresh all campaigns in parallel
      const refreshPromises = campaignsToRefresh.map(async (campaign) => {
        try {
          const response = await supabase.functions.invoke('refresh-campaign-analytics', {
            body: { campaignId: campaign.id }
          });
          
          if (response.error) {
            console.error(`Failed to refresh campaign ${campaign.brand_name}:`, response.error);
            return false;
          }
          return true;
        } catch (error) {
          console.error(`Error refreshing campaign ${campaign.brand_name}:`, error);
          return false;
        }
      });

      const results = await Promise.all(refreshPromises);
      const successCount = results.filter(Boolean).length;
      
      // Refetch campaigns data
      refetch();
      
      if (successCount === campaignsToRefresh.length) {
        toast.success(`All ${successCount} campaigns refreshed successfully`);
      } else {
        toast.warning(`${successCount} of ${campaignsToRefresh.length} campaigns refreshed successfully`);
      }
    } catch (error) {
      console.error('Error during refresh all:', error);
      toast.error('Failed to refresh campaigns');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.creators?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = campaigns.reduce((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
            <Button variant="outline" onClick={handleExportPDF} disabled={filteredCampaigns.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => setRefreshAllDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <CreateCampaignDialog />
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
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex space-x-2">
              <Badge
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                All ({campaigns.length})
              </Badge>
              <Badge
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('completed')}
              >
                Completed ({statusCounts.completed || 0})
              </Badge>
              <Badge
                variant={statusFilter === 'analyzing' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('analyzing')}
              >
                Analyzing ({statusCounts.analyzing || 0})
              </Badge>
              <Badge
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('draft')}
              >
                Draft ({statusCounts.draft || 0})
              </Badge>
            </div>
          </div>
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
              {campaigns.length === 0 && <CreateCampaignDialog />}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        )}

        <CampaignAnalyticsModal
          campaign={selectedCampaign}
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
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