import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Campaign, useDeleteCampaign, useUpdateCampaignStatus } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Heart, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
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
  const deleteCampaign = useDeleteCampaign();
  const updateStatus = useUpdateCampaignStatus();

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{campaign.brand_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {campaign.creators?.name || 'Unknown Creator'}
            </p>
          </div>
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
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
        </div>
        
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
      </CardFooter>
    </Card>
  );
}