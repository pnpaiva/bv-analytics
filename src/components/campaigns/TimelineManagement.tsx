import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Edit3,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { format, addDays, startOfDay, parseISO, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCampaignCreatorsProject, useProjectStages } from '@/hooks/useProjectManagement';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'milestone' | 'deadline' | 'meeting' | 'deliverable' | 'payment';
  status: 'pending' | 'completed' | 'overdue';
  creatorId?: string;
  campaignId: string;
}

interface TimelineManagementProps {
  campaignId?: string;
}

export function TimelineManagement({ campaignId }: TimelineManagementProps) {
  const { data: creators = [] } = useCampaignCreatorsProject();
  const { data: stages = [] } = useProjectStages();
  
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: '1',
      title: 'Campaign Kickoff',
      description: 'Initial meeting with all stakeholders',
      date: new Date(),
      type: 'milestone',
      status: 'completed',
      campaignId: campaignId || 'all'
    },
    {
      id: '2',
      title: 'Content Brief Due',
      description: 'Creators must submit their content briefs',
      date: addDays(new Date(), 3),
      type: 'deadline',
      status: 'pending',
      campaignId: campaignId || 'all'
    },
    {
      id: '3',
      title: 'First Draft Review',
      date: addDays(new Date(), 7),
      type: 'deliverable',
      status: 'pending',
      campaignId: campaignId || 'all'
    }
  ]);

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    type: 'milestone' as TimelineEvent['type'],
    creatorId: '',
    campaignId: campaignId || 'all'
  });

  const filteredEvents = campaignId 
    ? events.filter(event => event.campaignId === campaignId || event.campaignId === 'all')
    : events;

  const sortedEvents = filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Please fill in required fields');
      return;
    }

    const event: TimelineEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      type: newEvent.type,
      status: isBefore(newEvent.date, new Date()) ? 'overdue' : 'pending',
      creatorId: newEvent.creatorId || undefined,
      campaignId: newEvent.campaignId
    };

    setEvents(prev => [...prev, event]);
    setIsAddingEvent(false);
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      type: 'milestone',
      creatorId: '',
      campaignId: campaignId || 'all'
    });
    toast.success('Timeline event added successfully');
  };

  const handleStatusChange = (eventId: string, newStatus: TimelineEvent['status']) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, status: newStatus } : event
    ));
    toast.success('Event status updated');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    toast.success('Event deleted');
  };

  const getEventTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone': return <CheckCircle2 className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'meeting': return <Calendar />;
      case 'deliverable': return <AlertCircle className="h-4 w-4" />;
      case 'payment': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone': return 'bg-blue-500';
      case 'deadline': return 'bg-red-500';
      case 'meeting': return 'bg-green-500';
      case 'deliverable': return 'bg-yellow-500';
      case 'payment': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Campaign Timeline</CardTitle>
        <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timeline Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Title *</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select 
                    value={newEvent.type} 
                    onValueChange={(value: TimelineEvent['type']) => 
                      setNewEvent(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="deliverable">Deliverable</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign to Creator</Label>
                  <Select 
                    value={newEvent.creatorId} 
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, creatorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All creators</SelectItem>
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
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.date ? format(newEvent.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEvent.date}
                      onSelect={(date) => date && setNewEvent(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEvent}>
                  Add Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No timeline events</h3>
              <p className="text-muted-foreground">Add your first timeline event to get started.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {sortedEvents.map((event, index) => {
                const creator = creators.find(c => c.id === event.creatorId);
                const isOverdue = event.status === 'pending' && isBefore(event.date, new Date());
                
                return (
                  <div key={event.id} className="relative flex items-start gap-4 pb-6">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background ${getEventTypeColor(event.type)} text-white`}>
                      {getEventTypeIcon(event.type)}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium">{event.title}</h4>
                            <Badge className={getStatusColor(isOverdue && event.status === 'pending' ? 'overdue' : event.status)}>
                              {isOverdue && event.status === 'pending' ? 'Overdue' : event.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(event.date, "PPP")} • {format(event.date, "p")}
                          </p>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.description}
                            </p>
                          )}
                          
                          {creator && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Assigned to:</span>
                              <Badge variant="outline">{creator.creators?.name}</Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          {event.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStatusChange(event.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}