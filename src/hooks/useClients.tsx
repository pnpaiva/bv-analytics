import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  user_id: string;
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // RLS policies handle organization-based filtering automatically
      // The policies check user's organization and role to determine access
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        toast.error('Failed to fetch clients');
        throw error;
      }

      return data as Client[];
    },
  });
}