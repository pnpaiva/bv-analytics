import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
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
  const { canManageUsers, isMasterAdmin } = useUserPermissions();
  
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      console.log('Fetching organization members for:', organizationId, 'isMasterAdmin:', isMasterAdmin, 'canManageUsers:', canManageUsers);
      
      // Get organization members
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      console.log('Raw query result:', { orgMembers, orgError });

      if (orgError) {
        console.error('Organization members query error:', orgError);
        throw orgError;
      }

      // For now, just show user IDs as display names
      // The email fetching will be handled by a separate API call in the component
      const data = orgMembers?.map(member => ({
        ...member,
        email: `User ${member.user_id.slice(0, 8)}...` // Temporary display
      })) || [];

      console.log('Processed organization members:', data);
      
      return data as OrganizationMember[];
    },
    enabled: !!organizationId, // Temporarily remove permission check for debugging
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

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; slug: string }) => {
      const { data: organization, error } = await supabase
        .from('organizations')
        .update({ 
          name: data.name, 
          slug: data.slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update organization: ${error.message}`);
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

export function useUserEmails(userIds: string[]) {
  return useQuery({
    queryKey: ['user-emails', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/get-user-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user emails');
      }

      const data = await response.json();
      return data.userEmails as Record<string, string>;
    },
    enabled: userIds.length > 0,
  });
}