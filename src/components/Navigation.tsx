import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, LogOut, User, Folder, TrendingUp, Link2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      href: '/campaigns',
      label: 'Campaigns',
      icon: Folder,
      active: location.pathname === '/campaigns'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      active: location.pathname === '/analytics'
    },
    {
      href: '/master-campaigns',
      label: 'Master Campaigns',
      icon: Link2,
      active: location.pathname === '/master-campaigns'
    }
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-6">
          <Link to="/campaigns" className="flex items-center space-x-2">
            <img src="/lovable-uploads/d23c0fe1-e18a-4726-8a81-0b6231400b44.png" alt="BV Analytics" className="h-6 w-6" />
            <span className="font-bold text-lg">BV Analytics</span>
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}