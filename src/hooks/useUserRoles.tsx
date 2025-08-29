import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'client';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  is_view_only?: boolean; // New field for view-only mode
  created_at: string;
  created_by?: string;
}

export function useUserRole() {
  const { user } = useAuth();
  
  // Debug logging reduced for cleaner console
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('useUserRole queryFn:', {
        userId: user.id,
        userEmail: user.email
      });
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('useUserRole result:', { data, error });
      
      if (error) {
        console.error('useUserRole error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }
      
      console.log('useUserRole returning:', data);
      return data;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: userRole } = useUserRole();
  const isAdmin = userRole?.role === 'admin';
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
  
  // Now that the database migration is applied, use the actual is_view_only field
  const isViewOnly = userRole?.is_view_only ?? false;
  
  return {
    isAdmin: userRole?.role === 'admin',
    isClient: userRole?.role === 'client',
    isViewOnly,
    canCreate: userRole?.role === 'admin' || (userRole?.role === 'client' && !isViewOnly),
    canEdit: userRole?.role === 'admin', // Only admins can edit
    canDelete: userRole?.role === 'admin',
  };
}

export function useCreateUserAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password, role, isViewOnly }: { email: string; password: string; role: AppRole; isViewOnly?: boolean }) => {
      try {
        // Try the new admin function first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://hepscjgcjnlofdpoewqx.supabase.co'}/functions/v1/admin-create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email, password, role, isViewOnly }),
          });

          if (response.ok) {
            const result = await response.json();
            return result.user;
          }
          
          // If admin function returns an error response, fall back to old method
          console.warn('Admin function returned error, falling back to old method for testing');
        } catch (fetchError) {
          // If fetch itself fails (network error, function doesn't exist), fall back to old method
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
        
        // Then assign the role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });
        
        if (roleError) throw roleError;
        
        console.log('Role assigned successfully');
        return { user: authData.user, role };
        
      } catch (error) {
        console.error('Error in user creation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accounts'] });
      toast.success('User account created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating user account:', error);
      toast.error(`Failed to create user account: ${error.message}`);
    },
  });
}

export function useClientAccounts() {
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['client-accounts'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      console.log('useClientAccounts: Fetching user roles...');
      
      // First, get all user roles
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('useClientAccounts - user roles:', { userRoles, roleError });
      
      if (roleError) throw roleError;
      
      // Then, get user details for each role using a separate query
      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map(role => role.user_id);
        console.log('useClientAccounts - fetching user details for:', userIds);
        
        // Get user details from profiles table instead of auth.users
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, created_at')
          .in('id', userIds);
        
        console.log('useClientAccounts - profiles:', { profiles, profileError });
        
        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        }
        
        // Merge the data
        const accountsWithDetails = userRoles.map(role => {
          const profile = profiles?.find(p => p.id === role.user_id);
          return {
            ...role,
            user: profile ? {
              email: role.user_id, // Use user_id as placeholder for now
              last_sign_in_at: null, // We don't have this in profiles
              created_at: profile.created_at || role.created_at
            } : null
          };
        });
        
        console.log('useClientAccounts - final result:', accountsWithDetails);
        return accountsWithDetails;
      }
      
      return userRoles || [];
    },
    enabled: isAdmin,
  });
}