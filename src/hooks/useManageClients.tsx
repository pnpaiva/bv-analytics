import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateClientData {
  name: string;
}

export interface UpdateClientData {
  id: string;
  name: string;
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: client, error } = await supabase
        .from('clients')
        .insert([{
          ...data,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create client');
      console.error(error);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClientData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: client, error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update client');
      console.error(error);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete client');
      console.error(error);
    },
  });
}