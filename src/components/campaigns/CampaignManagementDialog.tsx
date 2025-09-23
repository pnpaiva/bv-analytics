import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, Clock, AlertCircle, MessageSquare, Users, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Campaign } from '@/hooks/useCampaigns';
import { useCampaignCreatorsProject, useProjectStages, useUpdateCampaignCreatorProject, useProjectNotes, useCreateProjectNote } from '@/hooks/useProjectManagement';
import { useAuth } from '@/hooks/useAuth';
import { useCreators } from '@/hooks/useCreators';
import { useCampaignCreators, useCreateCampaignCreator } from '@/hooks/useCampaignCreators';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignManagementDialogProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignManagementDialog({ campaign, isOpen, onClose }: CampaignManagementDialogProps) {
  const { user } = useAuth();
  const { data: creators = [], refetch: refetchCreators } = useCampaignCreatorsProject(campaign.id);
  const { data: allCreators = [] } = useCreators();
  const { data: stages = [] } = useProjectStages();
  const { data: notes = [] } = useProjectNotes(campaign.id);
  const updateCreatorProject = useUpdateCampaignCreatorProject();
  const createNote = useCreateProjectNote();
  const assignCreatorMutation = useCreateCampaignCreator();
  
  const [selectedCreator, setSelectedCreator] = useState<string>('general');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'payment' | 'content' | 'contact'>('general');
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [selectedCreatorToAdd, setSelectedCreatorToAdd] = useState<string>('');

  const selectedCreatorData = creators.find(c => c.id === selectedCreator);

  const getStageColor = (stageName: string) => {
    const stage = stages.find(s => s.name.toLowerCase() === stageName.toLowerCase());
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

  const handleUpdateCreator = async (creatorId: string, updates: any) => {
    try {
      await updateCreatorProject.mutateAsync({ id: creatorId, ...updates });
      refetchCreators();
    } catch (error) {
      console.error('Error updating creator:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !user) return;

    try {
      await createNote.mutateAsync({
        campaign_id: campaign.id,
        creator_id: selectedCreator === 'general' ? undefined : selectedCreator || undefined,
        note_type: noteType,
        content: noteContent,
        created_by: user.id,
      });
      setNoteContent('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleAddCreator = async () => {
    if (!selectedCreatorToAdd || !campaign) return;
    
    // Check if creator is already assigned to prevent duplicate constraint error
    const isAlreadyAssigned = creators.some(c => c.creator_id === selectedCreatorToAdd);
    if (isAlreadyAssigned) {
      toast.error('Creator is already assigned to this campaign');
      return;
    }
    
    try {
      // Get campaign organization_id
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', campaign.id)
        .single();
      
      if (!campaignData?.organization_id) {
        throw new Error('Campaign organization not found');
      }
      
      await assignCreatorMutation.mutateAsync({
        campaign_id: campaign.id,
        creator_id: selectedCreatorToAdd,
        content_urls: {},
        organization_id: campaignData.organization_id,
      });
      
      setSelectedCreatorToAdd('');
      setShowAddCreator(false);
      refetchCreators();
      toast.success('Creator added to campaign successfully');
    } catch (error) {
      console.error('Error adding creator:', error);
      // Handle specific duplicate key error
      if (error.code === '23505') {
        toast.error('Creator is already assigned to this campaign');
      } else {
        toast.error('Failed to add creator to campaign');
      }
    }
  };

  // Filter out creators already assigned to this campaign
  const availableCreators = allCreators.filter(
    creator => !creators.some(c => c.creator_id === creator.id)
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Project Management: {campaign.brand_name}
            </DialogTitle>
            <DialogDescription>
              Manage creators, track progress, payments, and project details for this campaign.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{creators.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${creators.reduce((sum, c) => sum + (c.payment_amount || 0), 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creators.length > 0 
                        ? Math.round((creators.filter(c => c.stage === 'completed').length / creators.length) * 100)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stages.map(stage => {
                        const count = creators.filter(c => c.stage === stage.name.toLowerCase().replace(/\s+/g, '_')).length;
                        return (
                          <div key={stage.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="text-sm">{stage.name}</span>
                            </div>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['pending', 'paid', 'overdue'].map(status => {
                        const count = creators.filter(c => c.payment_status === status).length;
                        const amount = creators
                          .filter(c => c.payment_status === status)
                          .reduce((sum, c) => sum + (c.payment_amount || 0), 0);
                        
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getPaymentStatusColor(status)}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              {count} creators • ${amount.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="creators" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Campaign Creators</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {creators.length} creator{creators.length !== 1 ? 's' : ''} assigned
                  </span>
                  {availableCreators.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCreator(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Creator
                    </Button>
                  )}
                </div>
              </div>

              {creators.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Creators Assigned</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Start managing your campaign by adding creators. You can assign them stages, 
                      set payment details, track deadlines, and add notes.
                    </p>
                    {availableCreators.length > 0 ? (
                      <Button onClick={() => setShowAddCreator(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Creator
                      </Button>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <p>No creators available to add.</p>
                        <p>Create creators first in the Creator Profiles section.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {creators.map((creator) => (
                    <Card key={creator.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {creator.creators?.avatar_url && (
                              <img 
                                src={creator.creators.avatar_url} 
                                alt={creator.creators.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <CardTitle className="text-lg">{creator.creators?.name}</CardTitle>
                              <CardDescription>{creator.creators?.email}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={getPriorityColor(creator.priority)}
                            >
                              {creator.priority?.charAt(0).toUpperCase() + creator.priority?.slice(1)} Priority
                            </Badge>
                            <Badge 
                              style={{ backgroundColor: getStageColor(creator.stage) }}
                              className="text-white"
                            >
                              {creator.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Stage</Label>
                            <Select 
                              value={creator.stage} 
                              onValueChange={(value) => handleUpdateCreator(creator.id, { stage: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map(stage => (
                                  <SelectItem 
                                    key={stage.id} 
                                    value={stage.name.toLowerCase().replace(/\s+/g, '_')}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                      />
                                      {stage.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select 
                              value={creator.priority} 
                              onValueChange={(value) => handleUpdateCreator(creator.id, { priority: value })}
                            >
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
                            <Label>Payment Amount</Label>
                            <Input
                              type="number"
                              value={creator.payment_amount || 0}
                              onChange={(e) => handleUpdateCreator(creator.id, { 
                                payment_amount: parseFloat(e.target.value) || 0 
                              })}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Payment Status</Label>
                            <Select 
                              value={creator.payment_status} 
                              onValueChange={(value) => handleUpdateCreator(creator.id, { payment_status: value })}
                            >
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

                          <div className="space-y-2">
                            <Label>Contact Status</Label>
                            <Select 
                              value={creator.contact_status} 
                              onValueChange={(value) => handleUpdateCreator(creator.id, { contact_status: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_contacted">Not Contacted</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="responded">Responded</SelectItem>
                                <SelectItem value="no_response">No Response</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Deadline</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !creator.deadline && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {creator.deadline ? format(parseISO(creator.deadline), "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={creator.deadline ? parseISO(creator.deadline) : undefined}
                                  onSelect={(date) => 
                                    handleUpdateCreator(creator.id, { 
                                      deadline: date ? format(date, 'yyyy-MM-dd') : null 
                                    })
                                  }
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={creator.notes || ''}
                            onChange={(e) => handleUpdateCreator(creator.id, { notes: e.target.value })}
                            placeholder="Add notes about this creator's progress, requirements, etc."
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Track key milestones and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {creators
                      .filter(c => c.deadline)
                      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                      .map((creator) => (
                        <div key={creator.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(parseISO(creator.deadline!), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{creator.creators?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Current stage: {creator.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </div>
                          <Badge className={getPriorityColor(creator.priority)}>
                            {creator.priority?.charAt(0).toUpperCase() + creator.priority?.slice(1)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Note Type</Label>
                      <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="contact">Contact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Creator (Optional)</Label>
                      <Select value={selectedCreator || 'general'} onValueChange={setSelectedCreator}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select creator or leave blank for general" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General note</SelectItem>
                          {creators.map(creator => (
                            <SelectItem key={creator.id} value={creator.id}>
                              {creator.creators?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Note Content</Label>
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={4}
                    />
                  </div>
                  
                  <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{note.note_type}</Badge>
                          {note.creator_id && (
                            <Badge variant="secondary">
                              {creators.find(c => c.creator_id === note.creator_id)?.creators?.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(note.created_at), "MMM dd, yyyy 'at' HH:mm")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Add Creator Dialog */}
      <Dialog open={showAddCreator} onOpenChange={setShowAddCreator}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Creator to Campaign</DialogTitle>
            <DialogDescription>
              Select a creator to add to the "{campaign.brand_name}" campaign project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Select Creator</Label>
              <Select value={selectedCreatorToAdd} onValueChange={setSelectedCreatorToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a creator..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCreators.map(creator => (
                    <SelectItem key={creator.id} value={creator.id}>
                      <div className="flex items-center gap-2">
                        {creator.avatar_url && (
                          <img 
                            src={creator.avatar_url} 
                            alt={creator.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{creator.name}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCreators.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  All available creators have already been assigned to this campaign.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddCreator(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCreator}
              disabled={!selectedCreatorToAdd || assignCreatorMutation?.isPending}
            >
              {assignCreatorMutation?.isPending ? 'Adding...' : 'Add Creator'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}