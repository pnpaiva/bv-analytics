
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Creator {
  id: string;
  name: string;
  platform_handles?: Record<string, string>;
  avatar_url?: string;
  user_id: string;
}

export function useCreators() {
  return useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      console.log('Fetching creators...');
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching creators:', error);
        toast.error('Failed to fetch creators');
        throw error;
      }

      console.log('Creators fetched:', data);
      return data as Creator[];
    },
  });
}
