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
      // Create the dedicated admin account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@beyond-views.com',
        password: 'Nense123nense!',
        email_confirm: true,
      });
      
      if (authError) throw authError;
      
      // Assign admin role to the new account
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (roleError) throw roleError;
      
      toast.success('Dedicated admin account created successfully!');
      
      // Show login instructions
      toast.success('You can now log in with admin@beyond-views.com to access admin features');
      
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      if (error.message?.includes('already been registered')) {
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
        <CardTitle>Create Dedicated Admin Account</CardTitle>
        <CardDescription>
          Set up a separate admin account for user management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Email: admin@beyond-views.com</span>
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