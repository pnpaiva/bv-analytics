import React, { useState } from 'react';
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
import { Campaign } from '@/hooks/useCampaigns';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';
import { useUpdateCampaignCreators } from '@/hooks/useUpdateCampaignCreators';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { ImageUpload } from '@/components/ui/image-upload';
import { CampaignCreatorManager } from './CampaignCreatorManager';

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  campaign_date: z.string().min(1, 'Campaign date is required'),
  campaign_month: z.string().optional(),
  deal_value: z.string().optional(),
  client_id: z.string().optional(),
  logo_url: z.string().optional(),
  masterCampaignName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreatorWithUrls {
  creator_id: string;
  content_urls: {
    youtube: string[];
    instagram: string[];
    tiktok: string[];
  };
}

export function EditCampaignDialog({ campaign, isOpen, onClose, onSave }: EditCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [creators, setCreators] = useState<CreatorWithUrls[]>([]);

  const { data: campaignCreators = [] } = useCampaignCreators(campaign?.id);
  const { data: masterCampaigns = [] } = useMasterCampaigns();
  const updateCampaignCreators = useUpdateCampaignCreators();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: '',
      campaign_date: '',
      campaign_month: '',
      deal_value: '',
      client_id: '',
      logo_url: '',
      masterCampaignName: '',
    },
  });

  // Update form values when campaign changes
  React.useEffect(() => {
    if (campaign) {
      form.reset({
        brand_name: campaign.brand_name,
        campaign_date: campaign.campaign_date,
        campaign_month: campaign.campaign_month || '',
        deal_value: campaign.deal_value?.toString() || '',
        client_id: campaign.client_id || '',
        logo_url: campaign.logo_url || '',
        masterCampaignName: campaign.master_campaign_name || '__no_master__',
      });
    }
  }, [campaign?.id]); // Only depend on campaign.id to prevent infinite rerenders

  // Update creators when campaign creators change
  React.useEffect(() => {
    if (campaignCreators.length > 0) {
      const mappedCreators = campaignCreators.map(cc => ({
        creator_id: cc.creator_id,
        content_urls: cc.content_urls as {
          youtube: string[];
          instagram: string[];
          tiktok: string[];
        } || {
          youtube: [''],
          instagram: [''],
          tiktok: [''],
        },
      }));
      setCreators(mappedCreators);
    } else if (campaign) {
      // If no creators but campaign exists, initialize with empty creator
      setCreators([{
        creator_id: '',
        content_urls: {
          youtube: [''],
          instagram: [''],
          tiktok: [''],
        },
      }]);
    }
  }, [campaignCreators, campaign]);

  const onSubmit = async (data: FormData) => {
    if (!campaign) return;

    setIsLoading(true);
    try {
      // Update basic campaign data
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          brand_name: data.brand_name,
          campaign_date: data.campaign_date,
          campaign_month: data.campaign_month || null,
          deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
          client_id: data.client_id || null,
          logo_url: data.logo_url || null,
          master_campaign_name: data.masterCampaignName === '__no_master__' ? null : data.masterCampaignName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (campaignError) throw campaignError;

      // Update campaign creators
      const validCreators = creators.filter(creator => creator.creator_id);
      if (validCreators.length > 0) {
        await updateCampaignCreators.mutateAsync({
          campaign_id: campaign.id,
          creators: validCreators,
        });
      }

      toast.success('Campaign updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Campaign
          </DialogTitle>
          <DialogDescription>
            Update all campaign details for "{campaign.brand_name}".
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            {campaign.clients && (
              <Badge variant="outline">Client: {campaign.clients.name}</Badge>
            )}
            <Badge variant="outline">
              {campaignCreators.length} Creator{campaignCreators.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Campaign Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="campaign_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Month and Deal Value */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="campaign_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Month</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., January 2024, Q1 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deal_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client and Master Campaign */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <ClientCombobox
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Select or create client..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="masterCampaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Master Campaign</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select master campaign (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__no_master__">No Master Campaign</SelectItem>
                        {masterCampaigns.map((masterCampaign: any) => (
                          <SelectItem key={masterCampaign.name} value={masterCampaign.name}>
                            {masterCampaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Logo */}
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <ImageUpload
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    label="Campaign Logo"
                    placeholder="Upload company logo"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campaign Creators Management */}
            <div className="space-y-4">
              <CampaignCreatorManager
                creators={creators}
                onChange={setCreators}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || updateCampaignCreators.isPending}>
                {isLoading || updateCampaignCreators.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}