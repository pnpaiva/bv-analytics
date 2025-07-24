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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Campaign } from '@/hooks/useCampaigns';
import { useCreators } from '@/hooks/useCreators';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, Edit3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { ImageUpload } from '@/components/ui/image-upload';

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  creator_id: z.string().min(1, 'Creator is required'),
  campaign_date: z.string().min(1, 'Campaign date is required'),
  campaign_month: z.string().optional(),
  deal_value: z.string().optional(),
  client_id: z.string().optional(),
  logo_url: z.string().optional(),
  youtube: z.array(z.string().url().optional().or(z.literal(''))).default([]),
  instagram: z.array(z.string().url().optional().or(z.literal(''))).default([]),
  tiktok: z.array(z.string().url().optional().or(z.literal(''))).default([]),
  masterCampaignName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditCampaignDialog({ campaign, isOpen, onClose, onSave }: EditCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [existingMasterCampaigns, setExistingMasterCampaigns] = useState<string[]>([]);

  const { data: creators = [] } = useCreators();
  const { data: masterCampaigns = [] } = useMasterCampaigns();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand_name: '',
      creator_id: '',
      campaign_date: '',
      campaign_month: '',
      deal_value: '',
      client_id: '',
      logo_url: '',
      youtube: [],
      instagram: [],
      tiktok: [],
      masterCampaignName: '',
    },
  });

  // Load existing master campaigns
  React.useEffect(() => {
    const loadMasterCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('master_campaign_name')
          .not('master_campaign_name', 'is', null);

        if (error) throw error;

        const uniqueNames = [...new Set(data.map(c => c.master_campaign_name))];
        setExistingMasterCampaigns(uniqueNames);
      } catch (error) {
        console.error('Error loading master campaigns:', error);
      }
    };

    if (isOpen) {
      loadMasterCampaigns();
    }
  }, [isOpen]);

  // Update form values when campaign changes
  React.useEffect(() => {
    if (campaign) {
      const contentUrls = campaign.content_urls || {};
      form.reset({
        brand_name: campaign.brand_name,
        creator_id: campaign.creator_id,
        campaign_date: campaign.campaign_date,
        campaign_month: campaign.campaign_month || '',
        deal_value: campaign.deal_value?.toString() || '',
        client_id: campaign.client_id || '',
        logo_url: campaign.logo_url || '',
        youtube: contentUrls.youtube || [''],
        instagram: contentUrls.instagram || [''],
        tiktok: contentUrls.tiktok || [''],
        masterCampaignName: campaign.master_campaign_name || '__no_master__',
      });
    }
  }, [campaign, form]);

  const addUrlField = (platform: keyof FormData) => {
    const currentUrls = form.getValues(platform) || [];
    form.setValue(platform, [...currentUrls, '']);
  };

  const removeUrlField = (platform: keyof FormData, index: number) => {
    if (platform === 'masterCampaignName') return; // Skip for non-array fields
    const currentUrls = form.getValues(platform) as string[] || [];
    const newUrls = currentUrls.filter((_, i) => i !== index);
    form.setValue(platform, newUrls.length === 0 ? [''] : newUrls);
  };

  const onSubmit = async (data: FormData) => {
    if (!campaign) return;

    setIsLoading(true);
    try {
      // Clean up empty URLs
      const cleanedData = {
        youtube: data.youtube.filter(url => url.trim() !== ''),
        instagram: data.instagram.filter(url => url.trim() !== ''),
        tiktok: data.tiktok.filter(url => url.trim() !== ''),
      };

      const { error } = await supabase
        .from('campaigns')
        .update({
          brand_name: data.brand_name,
          creator_id: data.creator_id,
          campaign_date: data.campaign_date,
          campaign_month: data.campaign_month || null,
          deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
          client_id: data.client_id || null,
          logo_url: data.logo_url || null,
          content_urls: cleanedData,
          master_campaign_name: data.masterCampaignName === '__no_master__' ? null : data.masterCampaignName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

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

  const renderUrlFields = (platform: keyof FormData, label: string) => {
    if (platform === 'masterCampaignName') return null; // Skip for non-array fields
    const urls = form.watch(platform) as string[] || [''];
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">{label} URLs</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addUrlField(platform)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add URL
          </Button>
        </div>
        {urls.map((_, index) => (
          <FormField
            key={`${platform}-${index}`}
            control={form.control}
            name={`${platform}.${index}` as any}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Input
                      placeholder={`Enter ${label} URL`}
                      {...field}
                      className="flex-1"
                    />
                  </FormControl>
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrlField(platform, index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    );
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Campaign
          </DialogTitle>
          <DialogDescription>
            Update all campaign details for "{campaign.brand_name}".
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">Creator: {campaign.creators?.name}</Badge>
            {campaign.clients && (
              <Badge variant="outline">Client: {campaign.clients.name}</Badge>
            )}
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
                name="creator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select creator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Campaign Month */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Deal Value and Master Campaign */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Client */}
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

            {/* Master Campaign Selection */}
            {/* Removed duplicate master campaign field */}

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

            {renderUrlFields('youtube', 'YouTube')}
            {renderUrlFields('instagram', 'Instagram')}
            {renderUrlFields('tiktok', 'TikTok')}

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