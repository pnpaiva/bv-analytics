import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRoles';
import { useProfile, useUpdateProfile } from '@/hooks/useProfileManagement';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Shield, Calendar, Save, Upload } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const userRoleQuery = useUserRole();
  const userRole = userRoleQuery.data?.role;
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: ''
  });

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    updateProfile.mutate(formData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to update profile picture');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                    {user?.user_metadata?.avatar_url ? (
                      <AvatarImage 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile picture" 
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-subheading text-xl">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">
                    {formData.display_name || user?.email?.split('@')[0] || 'No display name set'}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">{userRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="Enter your display name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is how your name will appear to others
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A brief description about yourself (optional)
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}