import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'client' | 'master_admin' | 'local_admin' | 'local_client';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  is_view_only?: boolean; // New field for view-only mode
  created_at: string;
  created_by?: string;
  organization_id?: string; // For organization-based roles
  organization?: Organization; // For populated organization data
}

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
  role: AppRole;
  permissions?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('useUserRole queryFn:', {
        userId: user.id,
        userEmail: user.email
      });
      
      // First check for legacy user_roles (for backwards compatibility)
      const { data: legacyRole, error: legacyError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (legacyRole && !legacyError) {
      console.log('useUserRole legacy role found:', legacyRole);
        return legacyRole as UserRole;
      }
      
      // Check organization membership for new role system
      const { data: orgMembership, error: orgError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', user.id)
        .single();
      
      console.log('useUserRole org membership:', { orgMembership, orgError });
      
      if (orgError) {
        console.error('useUserRole error details:', {
          code: orgError.code,
          message: orgError.message,
          details: orgError.details,
          hint: orgError.hint
        });
        
        if (orgError.code !== 'PGRST116') {
          throw orgError;
        }
        return null;
      }
      
        // Transform organization membership to legacy format for compatibility
        if (orgMembership) {
          const transformedRole: UserRole = {
            id: orgMembership.id,
            user_id: orgMembership.user_id,
            role: orgMembership.role,
            is_view_only: false, // Organization roles don't have view-only mode
            created_at: orgMembership.created_at,
            created_by: orgMembership.created_by,
            organization_id: orgMembership.organization_id,
            organization: orgMembership.organization
          };
          console.log('useUserRole returning transformed role:', transformedRole);
          return transformedRole;
        }
      
      return null;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: userRole } = useUserRole();
  const isAdmin = userRole?.role === 'admin' || userRole?.role === 'master_admin' || userRole?.role === 'local_admin';
  console.log('useIsAdmin:', { userRole, isAdmin });
  return isAdmin;
}

export function useIsViewOnly() {
  const { data: userRole } = useUserRole();
  // Temporary fallback: if the field doesn't exist yet, return false
  // This will be updated once the database migration is applied
  return userRole?.is_view_only ?? false;
}

export function useUserPermissions() {
  const { data: userRole } = useUserRole();
  
  const role = userRole?.role;
  const isViewOnly = userRole?.is_view_only ?? false;
  
  return {
    isMasterAdmin: role === 'master_admin',
    isLocalAdmin: role === 'local_admin',
    isLocalClient: role === 'local_client',
    isAdmin: role === 'admin' || role === 'master_admin' || role === 'local_admin',
    isClient: role === 'client' || role === 'local_client',
    isViewOnly,
    canCreate: role === 'master_admin' || role === 'local_admin' || (role === 'local_client' && !isViewOnly) || (role === 'admin') || (role === 'client' && !isViewOnly),
    canEdit: role === 'master_admin' || role === 'local_admin' || role === 'admin',
    canDelete: role === 'master_admin' || role === 'local_admin' || role === 'admin',
    canManageUsers: role === 'master_admin' || role === 'local_admin' || role === 'admin',
    canManageOrganizations: role === 'master_admin',
    organizationId: (userRole as UserRole)?.organization_id,
    organization: (userRole as UserRole)?.organization,
  };
}

export function useCreateUserAccount() {
  const queryClient = useQueryClient();
  const { data: currentUserRole } = useUserRole();
  
  return useMutation({
    mutationFn: async ({ email, password, role, isViewOnly, organizationId }: { 
      email: string; 
      password: string; 
      role: AppRole; 
      isViewOnly?: boolean;
      organizationId?: string;
    }) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        // Use current user's organization if not specified
        const targetOrgId = organizationId || (currentUserRole as UserRole)?.organization_id;

        try {
          const response = await fetch(`https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/admin-create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email, password, role, isViewOnly, organizationId: targetOrgId }),
          });

          if (response.ok) {
            const result = await response.json();
            return result.user;
          }
          
          console.warn('Admin function returned error, falling back to old method for testing');
        } catch (fetchError) {
          console.warn('Admin function fetch failed, falling back to old method for testing:', fetchError);
        }
        
        // Fallback: Create user using regular signup (for testing purposes)
        console.log('Using fallback method to create user account...');
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');
        
        console.log('User created successfully, now assigning role...');
        
        // For new role system, add to organization_members if using new roles
        if (['master_admin', 'local_admin', 'local_client'].includes(role)) {
          const { error: orgMemberError } = await supabase
            .from('organization_members')
            .insert({
              user_id: authData.user.id,
              organization_id: targetOrgId,
              role,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            });
          
          if (orgMemberError) throw orgMemberError;
        } else {
          // For legacy roles, use user_roles table
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role,
              is_view_only: isViewOnly,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            });
          
          if (roleError) throw roleError;
        }
        
        console.log('Role assigned successfully');
        return { user: authData.user, role };
        
      } catch (error) {
        console.error('Error in user creation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('User account created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating user account:', error);
      toast.error(`Failed to create user account: ${error.message}`);
    },
  });
}

export function useClientAccounts() {
  const { canManageUsers, isLocalAdmin, isMasterAdmin } = useUserPermissions();
  const { data: currentUserRole } = useUserRole();
  
  return useQuery({
    queryKey: ['client-accounts'],
    queryFn: async () => {
      if (!canManageUsers) return [];
      
      console.log('useClientAccounts: Fetching accounts...');
      
      // Get legacy user roles
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Get organization members (only for current user's organization unless master admin)
      let orgMembersQuery = supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `);
      
      // If not master admin, filter by organization
      if (!isMasterAdmin && (currentUserRole as UserRole)?.organization_id) {
        orgMembersQuery = orgMembersQuery.eq('organization_id', (currentUserRole as UserRole).organization_id);
      }
      
      const { data: orgMembers, error: orgError } = await orgMembersQuery
        .order('created_at', { ascending: false });
      
      console.log('useClientAccounts - data:', { userRoles, orgMembers, roleError, orgError });
      
      if (roleError) throw roleError;
      if (orgError) throw orgError;
      
      // Combine both data sources
      let allAccounts = [];
      
      // Add legacy user roles
      if (userRoles) {
        for (const role of userRoles) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, created_at')
            .eq('id', role.user_id)
            .single();
          
          allAccounts.push({
            ...role,
            source: 'legacy',
            user: profile ? {
              email: role.user_id,
              last_sign_in_at: null,
              created_at: profile.created_at || role.created_at
            } : null
          });
        }
      }
      
      // Add organization members
      if (orgMembers) {
        for (const member of orgMembers) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, created_at')
            .eq('id', member.user_id)
            .single();
          
          allAccounts.push({
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            is_view_only: false,
            created_at: member.created_at,
            created_by: member.created_by,
            organization_id: member.organization_id,
            organization: member.organization,
            source: 'organization',
            user: profile ? {
              email: member.user_id,
              last_sign_in_at: null,
              created_at: profile.created_at || member.created_at
            } : null
          });
        }
      }
      
      // Filter out master admins for local admins
      if (isLocalAdmin) {
        allAccounts = allAccounts.filter(account => account.role !== 'master_admin');
      }
      
      // Fetch real email addresses for all users
      if (allAccounts.length > 0) {
        const userIds = allAccounts.map(account => account.user_id);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await fetch('https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/get-user-emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ userIds }),
            });

            if (response.ok) {
              const data = await response.json();
              const userEmails = data.userEmails as Record<string, string>;
              
              // Update accounts with real email addresses
              allAccounts = allAccounts.map(account => ({
                ...account,
                user: account.user ? {
                  ...account.user,
                  email: userEmails[account.user_id] || account.user_id
                } : {
                  email: userEmails[account.user_id] || account.user_id,
                  last_sign_in_at: null,
                  created_at: account.created_at
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching user emails:', error);
        }
      }
      
      console.log('useClientAccounts - final result:', allAccounts);
      return allAccounts;
    },
    enabled: canManageUsers,
  });
}

// New hook for organization members
export function useOrganizationMembers() {
  const { data: currentUserRole } = useUserRole();
  const { canManageUsers } = useUserPermissions();
  
  return useQuery({
    queryKey: ['organization-members', (currentUserRole as UserRole)?.organization_id],
    queryFn: async () => {
      const typedCurrentUserRole = currentUserRole as UserRole;
      if (!canManageUsers || !typedCurrentUserRole?.organization_id) return [];
      
      let query = supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `);
      
      // If not master admin, filter by organization
      if (typedCurrentUserRole.role !== 'master_admin') {
        query = query.eq('organization_id', typedCurrentUserRole.organization_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: canManageUsers && !!(currentUserRole as UserRole)?.organization_id,
  });
}