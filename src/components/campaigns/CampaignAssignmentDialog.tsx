import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClientCampaignAssignments, useAssignCampaign, useUnassignCampaign } from '@/hooks/useCampaignAssignments';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { Plus, X, Users, Calendar, Building } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignAssignmentDialogProps {
  clientId: string;
  clientEmail: string;
}

export function CampaignAssignmentDialog({ clientId, clientEmail }: CampaignAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canEdit } = useUserPermissions();
  const { data: campaigns = [] } = useCampaigns();
  const { data: assignments = [] } = useClientCampaignAssignments(clientId);
  const assignCampaign = useAssignCampaign();
  const unassignCampaign = useUnassignCampaign();

  // Get assigned campaign IDs for this client
  const assignedCampaignIds = assignments.map(a => a.campaign_id);
  
  // Filter campaigns to show only unassigned ones
  const unassignedCampaigns = campaigns.filter(c => !assignedCampaignIds.includes(c.id));

  const handleAssignCampaign = async (campaignId: string) => {
    try {
      await assignCampaign.mutateAsync({ clientId, campaignId });
    } catch (error) {
      console.error('Error assigning campaign:', error);
    }
  };

  const handleUnassignCampaign = async (campaignId: string) => {
    try {
      await unassignCampaign.mutateAsync({ clientId, campaignId });
    } catch (error) {
      console.error('Error unassigning campaign:', error);
    }
  };

  if (!canEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Campaigns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Campaign Assignments for {clientEmail}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Campaigns */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {assignments.length} Assigned
              </Badge>
              Assigned Campaigns
            </h3>
            
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No campaigns assigned yet</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const campaign = campaigns.find(c => c.id === assignment.campaign_id);
                    if (!campaign) return null;
                    
                    return (
                      <div key={assignment.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{campaign.brand_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(campaign.campaign_date).toLocaleDateString()}
                              </span>
                              {campaign.status && (
                                <Badge variant="outline" className="text-xs">
                                  {campaign.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignCampaign(campaign.id)}
                            disabled={unassignCampaign.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Available Campaigns */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {unassignedCampaigns.length} Available
              </Badge>
              Available Campaigns
            </h3>
            
            {unassignedCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All campaigns are already assigned</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {unassignedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{campaign.brand_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(campaign.campaign_date).toLocaleDateString()}
                            </span>
                            {campaign.status && (
                              <Badge variant="outline" className="text-xs">
                                {campaign.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignCampaign(campaign.id)}
                          disabled={assignCampaign.isPending}
                          className="text-primary hover:text-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
