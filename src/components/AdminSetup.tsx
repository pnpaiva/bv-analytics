import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

export function AdminSetup() {
  const [isCreating, setIsCreating] = useState(false);
  
  const createDedicatedAdmin = async () => {
    setIsCreating(true);
    try {
      console.log('Starting admin account creation...');
      
      // First, create the user account using regular signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'nordskogpedro@gmail.com',
        password: 'Nense123nense!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      console.log('SignUp response:', { authData, authError });
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('No user returned from signup');
        throw new Error('User creation failed - no user returned');
      }
      
      console.log('User created successfully:', authData.user.id);
      
      // Check if user exists before creating role
      const { data: userCheck, error: userCheckError } = await supabase.auth.admin.getUserById(authData.user.id);
      console.log('User check:', { userCheck, userCheckError });
      
      // Assign admin role to the new account
      console.log('Creating role for user:', authData.user.id);
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
      
      toast.success('Dedicated admin account created successfully!');
      toast.success('You can now log in with nordskogpedro@gmail.com to access admin features');
      
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      if (error.message?.includes('already been registered') || error.message?.includes('already registered')) {
        toast.error('Admin account already exists. You can log in with nordskogpedro@gmail.com');
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
        <CardTitle>Create Dedicated Admin Account</CardTitle>
        <CardDescription>
          Set up a separate admin account for user management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Email: nordskogpedro@gmail.com</span>
          </div>
          <p>This will create a dedicated admin account separate from your current account.</p>
        </div>
        
        <Button 
          onClick={createDedicatedAdmin} 
          className="w-full"
          disabled={isCreating}
        >
          {isCreating ? 'Creating Admin Account...' : 'Create Admin Account'}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          After creation, you can log out and sign in with the admin credentials to manage users.
        </div>
      </CardContent>
    </Card>
  );
}