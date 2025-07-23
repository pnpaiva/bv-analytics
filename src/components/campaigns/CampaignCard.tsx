import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Campaign, useDeleteCampaign, useUpdateCampaignStatus } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Heart, Trash2, BarChart3, RefreshCw, Edit3, ExternalLink, Youtube, Instagram, Link2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { EditCampaignDialog } from './EditCampaignDialog';
import { MasterCampaignDialog } from './MasterCampaignDialog';
import { PDFExporter } from '@/utils/pdfExporter';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CampaignCardProps {
  campaign: Campaign;
  onViewAnalytics: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, onViewAnalytics }: CampaignCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [masterCampaignDialogOpen, setMasterCampaignDialogOpen] = useState(false);
  const deleteCampaign = useDeleteCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'analyzing':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Update status to analyzing first
      await updateStatus.mutateAsync({ id: campaign.id, status: 'analyzing' });
      
      // Call the refresh analytics edge function
      const { data, error } = await supabase.functions.invoke('refresh-campaign-analytics', {
        body: { campaignId: campaign.id },
      });

      if (error) {
        console.error('Error refreshing analytics:', error);
        await updateStatus.mutateAsync({ id: campaign.id, status: 'error' });
      }
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      await updateStatus.mutateAsync({ id: campaign.id, status: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditSave = () => {
    // Refresh the campaigns data to show updated URLs
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const handleMasterCampaignSave = () => {
    // Refresh the campaigns data to show updated master campaign links
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const handleExportPDF = () => {
    try {
      const exporter = new PDFExporter();
      exporter.exportSingleCampaign(campaign, {
        includeAnalytics: true,
        includeContentUrls: true,
        includeMasterCampaigns: true
      });
      
      toast.success('Campaign PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export campaign PDF');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return Youtube;
      case 'instagram':
        return Instagram;
      case 'tiktok':
        // Using a generic icon for TikTok since lucide doesn't have a specific one
        return ExternalLink;
      default:
        return ExternalLink;
    }
  };

  const renderContentUrls = () => {
    const contentUrls = campaign.content_urls;
    if (!contentUrls || typeof contentUrls !== 'object') return null;

    const allUrls: Array<{ platform: string; url: string }> = [];
    
    Object.entries(contentUrls).forEach(([platform, urls]) => {
      if (Array.isArray(urls)) {
        urls.forEach((url) => {
          if (url && url.trim()) {
            allUrls.push({ platform, url: url.trim() });
          }
        });
      }
    });

    if (allUrls.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2 text-foreground">Content Links</h4>
        <div className="space-y-2">
          {allUrls.map((item, index) => {
            const IconComponent = getPlatformIcon(item.platform);
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span className="capitalize font-medium">{item.platform}:</span>
                <span className="truncate group-hover:underline flex-1">
                  {item.url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{campaign.brand_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {campaign.creators?.name || 'Unknown Creator'}
            </p>
            {campaign.master_campaign_name && (
              <div className="flex items-center gap-1 mt-2">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Part of "{campaign.master_campaign_name}"
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            {campaign.master_campaign_name && (
              <Badge variant="outline" className="text-xs">
                Master Campaign
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {campaign.total_views.toLocaleString()} views
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {campaign.total_engagement.toLocaleString()} engagement
            </span>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Rate: {campaign.engagement_rate.toFixed(2)}%</p>
          <p>Created: {format(new Date(campaign.created_at), 'MMM d, yyyy')}</p>
          {campaign.clients && (
            <p>Client: {campaign.clients.name}</p>
          )}
        </div>

        {renderContentUrls()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAnalytics(campaign)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMasterCampaignDialogOpen(true)}
            className="whitespace-nowrap"
          >
            <Link2 className="h-4 w-4 mr-1" />
            {campaign.master_campaign_name ? 'Unlink' : 'Link'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCampaign.mutate(campaign.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>

    <EditCampaignDialog
      campaign={campaign}
      isOpen={editDialogOpen}
      onClose={() => setEditDialogOpen(false)}
      onSave={handleEditSave}
    />

    <MasterCampaignDialog
      campaign={campaign}
      isOpen={masterCampaignDialogOpen}
      onClose={() => setMasterCampaignDialogOpen(false)}
      onSave={handleMasterCampaignSave}
    />
  </>
  );
}