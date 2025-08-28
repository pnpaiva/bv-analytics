import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Campaign } from '@/hooks/useCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link2, CalendarIcon, Plus, Unlink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MasterCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formSchema = z.object({
  masterCampaignName: z.string().min(1, 'Master campaign name is required').optional().or(z.literal('')),
  masterCampaignStartDate: z.date().optional(),
  masterCampaignEndDate: z.date().optional(),
  linkAction: z.enum(['create', 'link', 'unlink']),
  existingMasterCampaign: z.string().optional(),
}).refine((data) => {
  if (data.linkAction === 'create' && !data.masterCampaignName) {
    return false;
  }
  if (data.linkAction === 'link' && !data.existingMasterCampaign) {
    return false;
  }
  return true;
}, {
  message: "Please fill in required fields for the selected action",
  path: ["masterCampaignName"]
});

type FormData = z.infer<typeof formSchema>;

interface MasterCampaign {
  name: string;
  campaignCount: number;
  campaigns: Campaign[];
}

export function MasterCampaignDialog({ campaign, isOpen, onClose, onSave }: MasterCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [existingMasterCampaigns, setExistingMasterCampaigns] = useState<MasterCampaign[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      masterCampaignName: '',
      linkAction: 'create',
      existingMasterCampaign: '',
    },
  });

  const watchedAction = form.watch('linkAction');

  // Load existing master campaigns
  useEffect(() => {
    if (isOpen) {
      loadExistingMasterCampaigns();
    }
  }, [isOpen]);

  // Update form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        masterCampaignName: campaign.master_campaign_name || '',
        masterCampaignStartDate: campaign.master_campaign_start_date ? new Date(campaign.master_campaign_start_date) : undefined,
        masterCampaignEndDate: campaign.master_campaign_end_date ? new Date(campaign.master_campaign_end_date) : undefined,
        linkAction: campaign.master_campaign_name ? 'unlink' : 'create',
        existingMasterCampaign: '',
      });
    }
  }, [campaign, form]);

  const loadExistingMasterCampaigns = async () => {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('master_campaign_name, brand_name, creators(name), clients(name)')
        .not('master_campaign_name', 'is', null);

      if (error) throw error;

      // Group campaigns by master campaign name
      const masterCampaignsMap = new Map<string, MasterCampaign>();
      
      campaigns?.forEach((camp: any) => {
        const masterName = camp.master_campaign_name;
        if (!masterCampaignsMap.has(masterName)) {
          masterCampaignsMap.set(masterName, {
            name: masterName,
            campaignCount: 0,
            campaigns: []
          });
        }
        const masterCampaign = masterCampaignsMap.get(masterName)!;
        masterCampaign.campaignCount += 1;
        masterCampaign.campaigns.push(camp);
      });

      setExistingMasterCampaigns(Array.from(masterCampaignsMap.values()));
    } catch (error) {
      console.error('Error loading master campaigns:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!campaign) return;
    setIsLoading(true);
    try {
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      switch (data.linkAction) {
        case 'create':
          updateData = {
            ...updateData,
            master_campaign_name: data.masterCampaignName,
            master_campaign_start_date: data.masterCampaignStartDate?.toISOString().split('T')[0],
            master_campaign_end_date: data.masterCampaignEndDate?.toISOString().split('T')[0],
          };
          break;
        
        case 'link':
          updateData = {
            ...updateData,
            master_campaign_name: data.existingMasterCampaign,
            master_campaign_start_date: null,
            master_campaign_end_date: null,
          };
          break;
        
        case 'unlink':
          updateData = {
            ...updateData,
            master_campaign_name: null,
            master_campaign_start_date: null,
            master_campaign_end_date: null,
          };
          break;
      }

      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaign.id);

      if (error) throw error;

      const actionMessages = {
        create: 'Master campaign created and linked successfully',
        link: 'Campaign linked to master campaign successfully',
        unlink: 'Campaign unlinked from master campaign successfully'
      };

      toast.success(actionMessages[data.linkAction]);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating master campaign:', error);
      toast.error('Failed to update master campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Manage Master Campaign
          </DialogTitle>
          <DialogDescription>
            Link "{campaign.brand_name}" to a master campaign to group related campaigns together.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">Creator: {campaign.creators?.name}</Badge>
            {campaign.clients && (
              <Badge variant="outline">Client: {campaign.clients.name}</Badge>
            )}
            {campaign.master_campaign_name && (
              <Badge variant="secondary">
                Currently in: {campaign.master_campaign_name}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="linkAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="create">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Create new master campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="link">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Link to existing master campaign
                        </div>
                      </SelectItem>
                      {campaign.master_campaign_name && (
                        <SelectItem value="unlink">
                          <div className="flex items-center gap-2">
                            <Unlink className="w-4 h-4" />
                            Unlink from master campaign
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedAction === 'create' && (
              <>
                <FormField
                  control={form.control}
                  name="masterCampaignName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Master Campaign Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter master campaign name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="masterCampaignStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="masterCampaignEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {watchedAction === 'link' && (
              <FormField
                control={form.control}
                name="existingMasterCampaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Master Campaign</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select master campaign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingMasterCampaigns.map((masterCampaign) => (
                          <SelectItem key={masterCampaign.name} value={masterCampaign.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{masterCampaign.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {masterCampaign.campaignCount} campaigns
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedAction === 'unlink' && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will remove "{campaign.brand_name}" from the "{campaign.master_campaign_name}" master campaign.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}