import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Users, Building, LogOut, User, Settings, UserCircle, ChevronDown, Building2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserRole, useUserPermissions } from '@/hooks/useUserRoles';
import { useProfile } from '@/hooks/useProfileManagement';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Navigation() {
  const { user } = useAuth();
  const userRoleQuery = useUserRole();
  const userRole = userRoleQuery.data?.role;
  const { isMasterAdmin, isLocalAdmin, isLocalClient, canManageUsers, canManageOrganizations, organization } = useUserPermissions();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging reduced for cleaner console

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error logging out');
    }
  };

  // Base navigation items for all users
  const baseNavItems = [
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/campaigns', icon: FileText, label: 'Campaigns' },
    // { to: '/project-management', icon: Users, label: 'Project Management' }, // Hidden for now
    { to: '/creator-profiles', icon: UserCircle, label: 'Creator Profiles' },
  ];

  // Admin-specific navigation items for dropdown
  const adminMenuItems = [];
  
  if (userRole === 'admin') {
    // Legacy admin items
    adminMenuItems.push(
      { to: '/master-campaigns', icon: Building, label: 'Master Campaigns' },
      { to: '/admin', icon: Settings, label: 'Admin Dashboard' },
      { to: '/admin/blog', icon: FileText, label: 'Blog Management' }
    );
  }

  // Organization management items based on role
  if (isMasterAdmin) {
    adminMenuItems.push(
      { to: '/organizations', icon: Building2, label: 'Organization Management' },
      { to: '/master-campaigns', icon: Building, label: 'Master Campaigns' },
      { to: '/admin/blog', icon: FileText, label: 'Blog Management' }
    );
  } else if (isLocalAdmin) {
    adminMenuItems.push(
      { to: '/organization-users', icon: UserPlus, label: 'Manage Users' },
      { to: '/master-campaigns', icon: Building, label: 'Master Campaigns' }
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="relative border-b border-border bg-card/50 backdrop-blur-sm supports-[backdrop-filter]:bg-card/50">
      {/* Brand flowing line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 brand-gradient"></div>
      
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/f09b0589-e884-4eae-8a49-fe79fd9c060a.png" 
                alt="Beyond Views Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <h1 className="font-heading font-black text-xl text-foreground">Beyond Views</h1>
                <p className="text-xs text-muted-foreground font-body">Analytics Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {baseNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2.5 rounded-lg font-subheading text-sm transition-brand ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            
            {/* Admin Menu Dropdown - Show for all admin roles */}
            {(userRole === 'admin' || isMasterAdmin || isLocalAdmin) && adminMenuItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-subheading text-sm transition-brand text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Settings className="w-4 h-4" strokeWidth={2} />
                    <span>{isMasterAdmin ? 'Master Admin' : isLocalAdmin ? 'Admin' : 'Admin'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isMasterAdmin ? 'Master Admin Tools' : isLocalAdmin ? 'Organization Admin' : 'Admin Tools'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <DropdownMenuItem 
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        className={`flex items-center space-x-3 cursor-pointer ${
                          isActive ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isMasterAdmin && <OrganizationSwitcher />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-brand"
                >
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    {user?.user_metadata?.avatar_url ? (
                      <AvatarImage 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile"
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-subheading text-sm">
                      {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-subheading text-foreground">
                      {profile?.display_name || user?.email}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="capitalize">{userRole}</span>
                      {organization && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-24">{organization.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-popover border border-border shadow-lg"
              >
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || user?.email}
                    </p>
                    <div className="flex items-center gap-1 text-xs leading-none text-muted-foreground">
                      <span className="capitalize">{userRole}</span>
                      {organization && (
                        <>
                          <span>•</span>
                          <span className="truncate">{organization.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50"
                >
                  <User className="w-4 h-4" />
                  <span className="font-body">Profile</span>
                </DropdownMenuItem>
                <ThemeToggle />
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-destructive/10 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-body">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}