import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Agency {
  id: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgencyData {
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  notes?: string;
}

export interface UpdateAgencyData extends CreateAgencyData {
  id: string;
}

export function useAgencies() {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');

      if (error) {
        toast.error('Failed to fetch agencies');
        throw error;
      }

      return data;
    },
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgencyData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's organization
      const { data: userOrg, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError && orgError.code !== 'PGRST116') throw orgError;

      const organizationId = userOrg?.organization_id || 'default-org-id'; // Fallback

      const { data: agency, error } = await supabase
        .from('agencies')
        .insert([{
          ...data,
          user_id: user.id,
          organization_id: organizationId,
        }])
        .select()
        .single();

      if (error) throw error;
      return agency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agency created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create agency');
      console.error(error);
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAgencyData) => {
      const { id, ...updateData } = data;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: agency, error } = await supabase
        .from('agencies')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return agency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agency updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update agency');
      console.error(error);
    },
  });
}

export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agency deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete agency');
      console.error(error);
    },
  });
}