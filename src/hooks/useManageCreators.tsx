import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateCreatorData {
  name: string;
  platform_handles?: Record<string, string>;
  avatar_url?: string;
  niche?: string[];
}

export interface UpdateCreatorData {
  id: string;
  name: string;
  platform_handles?: Record<string, string>;
  avatar_url?: string;
  platform_metrics?: Record<string, any>;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  demographics?: Record<string, any>;
  services?: Array<{ name: string; price: number }>;
  top_videos?: Array<any>;
  niche?: string[];
}

export function useCreateCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCreatorData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: creator, error } = await supabase
        .from('creators')
        .insert([{
          ...data,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return creator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      toast.success('Creator created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create creator');
      console.error(error);
    },
  });
}

export function useUpdateCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCreatorData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: creator, error } = await supabase
        .from('creators')
        .update({
          name: data.name,
          platform_handles: data.platform_handles,
          avatar_url: data.avatar_url,
          platform_metrics: data.platform_metrics,
          bio: data.bio,
          email: data.email,
          phone: data.phone,
          location: data.location,
          demographics: data.demographics,
          services: data.services,
          top_videos: data.top_videos,
          niche: data.niche,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return creator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      toast.success('Creator updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update creator');
      console.error(error);
    },
  });
}

export function useDeleteCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      toast.success('Creator deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete creator');
      console.error(error);
    },
  });
}