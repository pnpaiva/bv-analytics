import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreators } from '@/hooks/useCreators';
import { useClients } from '@/hooks/useClients';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatorAssignment {
  creator_id: string;
  stage: string;
  priority: string;
  deadline?: string;
  payment_amount?: number;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [campaignDate, setCampaignDate] = useState<Date>();
  const [selectedCreators, setSelectedCreators] = useState<CreatorAssignment[]>([]);
  
  const [formData, setFormData] = useState({
    brand_name: '',
    client_id: '',
    fixed_deal_value: '',
    campaign_month: '',
    notes: ''
  });

  const { data: creators = [] } = useCreators();
  const { data: clients = [] } = useClients();
  const { organization, isMasterAdmin } = useUserPermissions();
  const { selectedOrganizationId } = useOrganizationContext();

  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;

  const handleAddCreator = () => {
    setSelectedCreators([...selectedCreators, {
      creator_id: '',
      stage: 'not_started',
      priority: 'medium'
    }]);
  };

  const handleRemoveCreator = (index: number) => {
    setSelectedCreators(selectedCreators.filter((_, i) => i !== index));
  };

  const handleCreatorChange = (index: number, field: keyof CreatorAssignment, value: string | number) => {
    const updated = [...selectedCreators];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedCreators(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand_name?.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    if (!campaignDate) {
      toast.error('Please select a campaign date');
      return;
    }

    if (selectedCreators.length === 0) {
      toast.error('Please assign at least one creator');
      return;
    }

    if (selectedCreators.some(c => !c.creator_id)) {
      toast.error('Please select creators for all assignments');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentOrgId) throw new Error('User not authenticated');

      // Create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          brand_name: formData.brand_name?.trim() || '',
          client_id: formData.client_id || null,
          user_id: user.id,
          organization_id: currentOrgId,
          campaign_date: campaignDate.toISOString().split('T')[0],
          campaign_month: formData.campaign_month || format(campaignDate, 'MMMM yyyy'),
          fixed_deal_value: formData.fixed_deal_value ? Number(formData.fixed_deal_value) : 0,
          status: 'draft', // Start as draft for project management
          total_views: 0,
          total_engagement: 0,
          engagement_rate: 0
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create creator assignments
      const creatorAssignments = selectedCreators.map(assignment => ({
        campaign_id: campaign.id,
        creator_id: assignment.creator_id,
        organization_id: currentOrgId,
        stage: assignment.stage,
        priority: assignment.priority,
        deadline: assignment.deadline || null,
        payment_amount: assignment.payment_amount || 0,
        contact_status: 'not_contacted',
        contract_status: 'not_sent',
        brief_status: 'not_sent',
        video_approval_status: 'not_submitted',
        payment_status: 'pending'
      }));

      const { error: assignmentError } = await supabase
        .from('campaign_creators')
        .insert(creatorAssignments);

      if (assignmentError) throw assignmentError;

      // Log timeline activity
      await supabase.rpc('log_project_activity', {
        p_campaign_id: campaign.id,
        p_activity_type: 'project_created',
        p_title: `Project created: ${formData.brand_name}`,
        p_description: `New project created with ${selectedCreators.length} creator(s) assigned`,
        p_organization_id: currentOrgId
      });

      toast.success('Project created successfully');
      
      // Reset form
      setFormData({
        brand_name: '',
        client_id: '',
        fixed_deal_value: '',
        campaign_month: '',
        notes: ''
      });
      setCampaignDate(undefined);
      setSelectedCreators([]);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to be managed in development before becoming a live campaign
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand Name *</Label>
              <Input
                id="brand_name"
                placeholder="Enter brand name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !campaignDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {campaignDate ? format(campaignDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={campaignDate}
                    onSelect={setCampaignDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixed_deal_value">Deal Value ($)</Label>
              <Input
                id="fixed_deal_value"
                type="number"
                placeholder="0"
                value={formData.fixed_deal_value}
                onChange={(e) => setFormData({ ...formData, fixed_deal_value: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_month">Campaign Month</Label>
            <Input
              id="campaign_month"
              placeholder="e.g., January 2024"
              value={formData.campaign_month}
              onChange={(e) => setFormData({ ...formData, campaign_month: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Creator Assignments *</Label>
              <Button type="button" size="sm" onClick={handleAddCreator} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Creator
              </Button>
            </div>

            {selectedCreators.map((assignment, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Creator {index + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCreator(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Creator *</Label>
                    <Select 
                      value={assignment.creator_id} 
                      onValueChange={(value) => handleCreatorChange(index, 'creator_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Initial Stage</Label>
                    <Select 
                      value={assignment.stage} 
                      onValueChange={(value) => handleCreatorChange(index, 'stage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={assignment.priority} 
                      onValueChange={(value) => handleCreatorChange(index, 'priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={assignment.payment_amount || ''}
                      onChange={(e) => handleCreatorChange(index, 'payment_amount', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}

            {selectedCreators.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No creators assigned yet</p>
                <Button type="button" size="sm" onClick={handleAddCreator} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Creator
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}