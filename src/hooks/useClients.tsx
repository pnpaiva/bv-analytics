import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPermissions } from './useUserRoles';
import { useOrganizationContext } from './useOrganizationContext';

export interface Client {
  id: string;
  name: string;
  user_id: string;
}

export function useClients() {
  const { organization, isMasterAdmin } = useUserPermissions();
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['clients', selectedOrganizationId || organization?.id],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name');

      // For master admins, filter by selected organization if any
      if (isMasterAdmin && selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      } else if (organization?.id && !isMasterAdmin) {
        // For non-master admins, filter by their organization
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch clients');
        throw error;
      }

      return data as Client[];
    },
    enabled: !!organization || isMasterAdmin,
  });
}