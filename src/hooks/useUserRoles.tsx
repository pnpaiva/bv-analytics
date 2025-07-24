import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'client';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by?: string;
}

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: userRole } = useUserRole();
  return userRole?.role === 'admin';
}

export function useCreateUserAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: AppRole }) => {
      // First create the user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for admin-created accounts
      });
      
      if (authError) throw authError;
      
      // Then assign the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (roleError) throw roleError;
      
      return { user: authData.user, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accounts'] });
      toast.success('User account created successfully');
    },
    onError: (error: any) => {
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
      
      // Get user roles first
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });
      
      if (roleError) throw roleError;
      
      // Get user details from auth.users for each role
      const usersWithDetails = await Promise.all(
        userRoles.map(async (role) => {
          const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
          return {
            ...role,
            user: userData.user
          };
        })
      );
      
      return usersWithDetails;
    },
    enabled: isAdmin,
  });
}