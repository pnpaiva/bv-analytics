import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Paperclip, 
  Edit3, 
  Trash2,
  Upload,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCampaignCreatorsProject, useProjectStages, useUpdateCampaignCreatorProject } from '@/hooks/useProjectManagement';
import { useCreators } from '@/hooks/useCreators';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCreateCampaignCreator } from '@/hooks/useCampaignCreators';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { CampaignCreatorEnhanced } from '@/hooks/useEnhancedProjectManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectManagementTableProps {
  campaignId?: string;
}

export function ProjectManagementTable({ campaignId }: ProjectManagementTableProps) {
  const { data: allCreators = [] } = useCampaignCreatorsProject();
  const { data: stages = [] } = useProjectStages();
  const { data: creators = [] } = useCreators();
  const { data: campaigns = [] } = useCampaigns();
  const updateCreatorProject = useUpdateCampaignCreatorProject();
  const createCampaignCreator = useCreateCampaignCreator();

  const [isAddingCreator, setIsAddingCreator] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId || '');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCreatorForDetail, setSelectedCreatorForDetail] = useState<CampaignCreatorEnhanced | null>(null);
  const [newCreatorData, setNewCreatorData] = useState({
    stage: 'not_started',
    priority: 'medium',
    payment_status: 'pending',
    payment_amount: 0,
    deadline: undefined as Date | undefined,
    notes: ''
  });

  // Filter creators based on campaign if specified
  const filteredCreators = campaignId 
    ? allCreators.filter(c => c.campaign_id === campaignId)
    : allCreators;

  const availableCreators = creators.filter(creator => 
    !filteredCreators.some(fc => fc.creator_id === creator.id)
  );

  const handleStageChange = async (creatorId: string, newStage: string) => {
    try {
      await updateCreatorProject.mutateAsync({
        id: creatorId,
        stage: newStage
      });
      toast.success('Stage updated successfully');
    } catch (error) {
      toast.error('Failed to update stage');
    }
  };

  const handlePriorityChange = async (creatorId: string, newPriority: string) => {
    try {
      await updateCreatorProject.mutateAsync({
        id: creatorId,
        priority: newPriority
      });
      toast.success('Priority updated successfully');
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handlePaymentStatusChange = async (creatorId: string, newStatus: string) => {
    try {
      await updateCreatorProject.mutateAsync({
        id: creatorId,
        payment_status: newStatus
      });
      toast.success('Payment status updated successfully');
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handlePaymentAmountChange = async (creatorId: string, newAmount: number) => {
    try {
      await updateCreatorProject.mutateAsync({
        id: creatorId,
        payment_amount: newAmount
      });
      toast.success('Payment amount updated successfully');
    } catch (error) {
      toast.error('Failed to update payment amount');
    }
  };

  const handleDeadlineChange = async (creatorId: string, newDeadline: Date | undefined) => {
    try {
      await updateCreatorProject.mutateAsync({
        id: creatorId,
        deadline: newDeadline?.toISOString().split('T')[0]
      });
      toast.success('Deadline updated successfully');
    } catch (error) {
      toast.error('Failed to update deadline');
    }
  };

  const handleAddCreator = async () => {
    if (!selectedCampaign || !selectedCreator) {
      toast.error('Please select both campaign and creator');
      return;
    }

    try {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      if (!campaign) {
        toast.error('Campaign not found');
        return;
      }

      // Get organization_id from the campaign's organization context
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', selectedCampaign)
        .single();
      
      if (!campaignData?.organization_id) {
        toast.error('Campaign organization not found');
        return;
      }

      await createCampaignCreator.mutateAsync({
        campaign_id: selectedCampaign,
        creator_id: selectedCreator,
        content_urls: {},
        organization_id: campaignData.organization_id,
      });

      // Update the new creator with project data
      const newCampaignCreator = allCreators.find(
        cc => cc.campaign_id === selectedCampaign && cc.creator_id === selectedCreator
      );

      if (newCampaignCreator) {
        await updateCreatorProject.mutateAsync({
          id: newCampaignCreator.id,
          stage: newCreatorData.stage,
          priority: newCreatorData.priority,
          payment_status: newCreatorData.payment_status,
          payment_amount: newCreatorData.payment_amount,
          deadline: newCreatorData.deadline?.toISOString().split('T')[0],
          notes: newCreatorData.notes
        });
      }

      toast.success('Creator added to campaign successfully');
      setIsAddingCreator(false);
      setSelectedCreator('');
      setNewCreatorData({
        stage: 'not_started',
        priority: 'medium',
        payment_status: 'pending',
        payment_amount: 0,
        deadline: undefined,
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to add creator to campaign');
    }
  };

  const getStageColor = (stageName: string) => {
    const stage = stages.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === stageName?.toLowerCase());
    return stage?.color || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white'; 
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Management</CardTitle>
        <Dialog open={isAddingCreator} onOpenChange={setIsAddingCreator}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Creator to Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Creator to Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.filter(campaign => campaign.id && campaign.id.trim()).map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Creator</Label>
                  <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select creator" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCreators.filter(creator => creator.id && creator.id.trim()).map(creator => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Initial Stage</Label>
                  <Select value={newCreatorData.stage} onValueChange={(value) => 
                    setNewCreatorData(prev => ({ ...prev, stage: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.filter(stage => stage.name && stage.name.trim()).map(stage => {
                        const value = stage.name.toLowerCase().replace(/\s+/g, '_');
                        return value ? (
                          <SelectItem key={stage.id} value={value}>
                            {stage.name}
                          </SelectItem>
                        ) : null;
                      }).filter(Boolean)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newCreatorData.priority} onValueChange={(value) => 
                    setNewCreatorData(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={newCreatorData.payment_status} onValueChange={(value) => 
                    setNewCreatorData(prev => ({ ...prev, payment_status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    value={newCreatorData.payment_amount}
                    onChange={(e) => setNewCreatorData(prev => ({ 
                      ...prev, 
                      payment_amount: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newCreatorData.deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newCreatorData.deadline ? format(newCreatorData.deadline, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCreatorData.deadline}
                        onSelect={(date) => setNewCreatorData(prev => ({ ...prev, deadline: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Initial Notes</Label>
                <Textarea
                  value={newCreatorData.notes}
                  onChange={(e) => setNewCreatorData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any initial notes or instructions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingCreator(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCreator} disabled={createCampaignCreator.isPending}>
                  {createCampaignCreator.isPending ? 'Adding...' : 'Add Creator'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {creator.creators?.avatar_url && (
                        <img 
                          src={creator.creators.avatar_url} 
                          alt={creator.creators.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{creator.creators?.name}</div>
                        <div className="text-sm text-muted-foreground">{creator.creators?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{creator.campaigns?.brand_name}</div>
                    <div className="text-sm text-muted-foreground">{creator.campaigns?.status}</div>
                  </TableCell>

                  <TableCell>
                    <Select 
                      value={creator.stage || 'not_started'} 
                      onValueChange={(value) => handleStageChange(creator.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.filter(stage => stage.name && stage.name.trim()).map(stage => {
                          const value = stage.name.toLowerCase().replace(/\s+/g, '_');
                          return value ? (
                            <SelectItem 
                              key={stage.id} 
                              value={value}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                />
                                {stage.name}
                              </div>
                            </SelectItem>
                          ) : null;
                        }).filter(Boolean)}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select 
                      value={creator.priority || 'medium'} 
                      onValueChange={(value) => handlePriorityChange(creator.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select 
                      value={creator.payment_status || 'pending'} 
                      onValueChange={(value) => handlePaymentStatusChange(creator.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      value={creator.payment_amount || 0}
                      onChange={(e) => handlePaymentAmountChange(creator.id, parseFloat(e.target.value) || 0)}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>

                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-32 justify-start text-left font-normal",
                            !creator.deadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {creator.deadline ? format(new Date(creator.deadline), "MMM dd") : "Set date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={creator.deadline ? new Date(creator.deadline) : undefined}
                          onSelect={(date) => handleDeadlineChange(creator.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-3 w-3" />
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        0 files
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      
      <ProjectDetailDialog 
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        campaignCreator={selectedCreatorForDetail}
      />
    </div>
      </CardContent>
    </Card>
  );
}