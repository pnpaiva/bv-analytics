import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPermissions } from './useUserRoles';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'master_admin' | 'local_admin' | 'local_client';
  permissions?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  settings?: any;
}

export interface CreateOrganizationMemberData {
  email: string;
  password: string;
  role: 'local_admin' | 'local_client';
  organizationId?: string;
}

export function useOrganizations() {
  const { isMasterAdmin } = useUserPermissions();
  
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Organization[];
    },
    enabled: isMasterAdmin,
  });
}

export function useOrganizationMembers(organizationId?: string) {
  const { canManageUsers } = useUserPermissions();
  
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: canManageUsers && !!organizationId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const { data: organization, error } = await supabase
        .from('organizations')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create organization: ${error.message}`);
    },
  });
}

export function useCreateOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationMemberData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization member');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Organization member created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create organization member: ${error.message}`);
    },
  });
}

export function useDeleteOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/admin-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization member');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Organization member deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete organization member: ${error.message}`);
    },
  });
}