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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, Edit3 } from 'lucide-react';

interface EditCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formSchema = z.object({
  youtube: z.array(z.string().url().optional().or(z.literal(''))).default([]),
  instagram: z.array(z.string().url().optional().or(z.literal(''))).default([]),
  tiktok: z.array(z.string().url().optional().or(z.literal(''))).default([]),
});

type FormData = z.infer<typeof formSchema>;

export function EditCampaignDialog({ campaign, isOpen, onClose, onSave }: EditCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtube: [],
      instagram: [],
      tiktok: [],
    },
  });

  // Update form values when campaign changes
  React.useEffect(() => {
    if (campaign) {
      const contentUrls = campaign.content_urls || {};
      form.reset({
        youtube: contentUrls.youtube || [''],
        instagram: contentUrls.instagram || [''],
        tiktok: contentUrls.tiktok || [''],
      });
    }
  }, [campaign, form]);

  const addUrlField = (platform: keyof FormData) => {
    const currentUrls = form.getValues(platform) || [];
    form.setValue(platform, [...currentUrls, '']);
  };

  const removeUrlField = (platform: keyof FormData, index: number) => {
    const currentUrls = form.getValues(platform) || [];
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
          content_urls: cleanedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success('Campaign URLs updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign URLs');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUrlFields = (platform: keyof FormData, label: string) => {
    const urls = form.watch(platform) || [''];
    
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Campaign URLs
          </DialogTitle>
          <DialogDescription>
            Update the content URLs for "{campaign.brand_name}" campaign. 
            You can add multiple URLs for each platform.
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