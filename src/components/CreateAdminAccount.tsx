import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export function CreateAdminAccount() {
  const [isCreating, setIsCreating] = useState(false);
  
  const createAdminAccount = async () => {
    setIsCreating(true);
    try {
      console.log('Creating admin account...');
      
      // Create the user account using regular signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@beyond-views.com',
        password: 'Nense123nense!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('User creation failed - no user returned');
      }
      
      console.log('User created successfully:', authData.user.id);
      
      // Assign admin role to the new account
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (roleError) {
        console.error('Role creation error:', roleError);
        throw roleError;
      }
      
      toast.success('Admin account created successfully!');
      toast.success('You can now log in with admin@beyond-views.com');
      
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      if (error.message?.includes('already been registered') || error.message?.includes('already registered')) {
        toast.error('Admin account already exists. You can log in with admin@beyond-views.com');
      } else {
        toast.error(`Failed to create admin account: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Create Admin Account</CardTitle>
        <CardDescription>
          Create admin@beyond-views.com account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Email: admin@beyond-views.com</p>
          <p>This will create the admin account with the specified credentials.</p>
        </div>
        
        <Button 
          onClick={createAdminAccount} 
          className="w-full"
          disabled={isCreating}
        >
          {isCreating ? 'Creating Admin Account...' : 'Create Admin Account'}
        </Button>
      </CardContent>
    </Card>
  );
}