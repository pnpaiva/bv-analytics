import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Clock, 
  DollarSign,
  User,
  Building2,
  Edit3,
  Check,
  X,
  Upload,
  Save,
  Plus
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTimeline } from './ProjectTimeline';
import { FileUploadSection } from './FileUploadSection';

interface ProjectManagementRowProps {
  campaign: {
    id: string;
    brand_name: string;
    campaign_date: string;
    status: string;
    total_views?: number;
    total_engagement?: number;
    engagement_rate?: number;
    fixed_deal_value?: number;
    logo_url?: string;
    clients?: { name: string };
  };
  creator: {
    id: string;
    name: string;
    avatar_url?: string;
    platform_handles?: any;
  };
  campaignCreator: {
    id: string;
    campaign_id: string;
    creator_id: string;
    stage: string;
    priority: string;
    contract_status: string;
    brief_status: string;
    video_approval_status: string;
    payment_status: string;
    payment_amount?: number;
    deadline?: string;
    notes?: string;
    final_video_url?: string;
  };
}

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

const stageColors = {
  not_started: 'secondary',
  in_progress: 'default',
  review: 'outline',
  completed: 'default',
  cancelled: 'destructive',
} as const;

export function ProjectManagementRow({ campaign, creator, campaignCreator }: ProjectManagementRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    stage: campaignCreator.stage,
    priority: campaignCreator.priority,
    payment_amount: campaignCreator.payment_amount || 0,
    deadline: campaignCreator.deadline || '',
    notes: campaignCreator.notes || ''
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log('Saving:', editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      stage: campaignCreator.stage,
      priority: campaignCreator.priority,
      payment_amount: campaignCreator.payment_amount || 0,
      deadline: campaignCreator.deadline || '',
      notes: campaignCreator.notes || ''
    });
    setIsEditing(false);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-3">
            {campaign.logo_url && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={campaign.logo_url} alt={campaign.brand_name} />
                <AvatarFallback>{campaign.brand_name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-medium">{campaign.brand_name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {campaign.clients?.name || 'No client'}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creator.avatar_url} alt={creator.name} />
              <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{creator.name}</div>
              <div className="text-sm text-muted-foreground">
                {creator.platform_handles?.youtube || 
                 creator.platform_handles?.instagram || 
                 creator.platform_handles?.tiktok || 'No handle'}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          {isEditing ? (
            <Select value={editData.stage} onValueChange={(value) => setEditData({ ...editData, stage: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={stageColors[campaignCreator.stage as keyof typeof stageColors] || 'default'}>
              {campaignCreator.stage.replace('_', ' ')}
            </Badge>
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value })}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={priorityColors[campaignCreator.priority as keyof typeof priorityColors] || 'default'}>
              {campaignCreator.priority}
            </Badge>
          )}
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(campaign.campaign_date).toLocaleDateString()}
            </div>
            {campaignCreator.deadline && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(campaignCreator.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div>{formatNumber(campaign.total_views)} views</div>
            <div className="text-muted-foreground">
              {campaign.engagement_rate?.toFixed(1)}% engagement
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.payment_amount}
                  onChange={(e) => setEditData({ ...editData, payment_amount: Number(e.target.value) })}
                  className="w-20 h-6 text-xs"
                />
              ) : (
                formatCurrency(campaignCreator.payment_amount || campaign.fixed_deal_value)
              )}
            </div>
            <Badge variant="outline" className="mt-1">
              {campaignCreator.payment_status}
            </Badge>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  <Upload className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSave}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={9} className="p-0">
            <div className="border-t bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Details</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Quick Action
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Campaign Details</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div><strong>Status:</strong> {campaign.status}</div>
                        <div><strong>Campaign Date:</strong> {new Date(campaign.campaign_date).toLocaleDateString()}</div>
                        <div><strong>Total Views:</strong> {formatNumber(campaign.total_views)}</div>
                        <div><strong>Total Engagement:</strong> {formatNumber(campaign.total_engagement)}</div>
                        <div><strong>Engagement Rate:</strong> {campaign.engagement_rate?.toFixed(1)}%</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Creator Assignment</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div><strong>Stage:</strong> {campaignCreator.stage.replace('_', ' ')}</div>
                        <div><strong>Priority:</strong> {campaignCreator.priority}</div>
                        <div><strong>Contract:</strong> {campaignCreator.contract_status}</div>
                        <div><strong>Brief:</strong> {campaignCreator.brief_status}</div>
                        <div><strong>Video Approval:</strong> {campaignCreator.video_approval_status}</div>
                        <div><strong>Payment:</strong> {campaignCreator.payment_status}</div>
                        {campaignCreator.final_video_url && (
                          <div>
                            <strong>Final Video:</strong> 
                            <a href={campaignCreator.final_video_url} target="_blank" rel="noopener noreferrer" className="text-primary ml-1">
                              View Video
                            </a>
                          </div>
                        )}
                        {campaignCreator.notes && (
                          <div><strong>Notes:</strong> {campaignCreator.notes}</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <ProjectTimeline campaignId={campaign.id} creatorId={creator.id} />
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Project Files</h4>
                      <Button size="sm" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                    <FileUploadSection 
                      campaignId={campaign.id} 
                      creatorId={creator.id}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Project Notes</h4>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Notes
                      </Button>
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editData.notes}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          placeholder="Add project notes..."
                          className="min-h-[120px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Notes
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg min-h-[120px]">
                        {campaignCreator.notes || (
                          <span className="text-muted-foreground italic">No notes added yet</span>
                        )}
                      </div>
                    )}

                    {campaignCreator.deadline && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Deadline</h5>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editData.deadline}
                              onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                              className="w-40"
                            />
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {new Date(campaignCreator.deadline).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}