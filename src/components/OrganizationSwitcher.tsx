import React, { useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/hooks/useOrganizationManagement';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/badge';

interface OrganizationSwitcherProps {
  onOrganizationChange?: (organizationId: string | null) => void;
}

export function OrganizationSwitcher({ onOrganizationChange }: OrganizationSwitcherProps) {
  const { isMasterAdmin, organization } = useUserPermissions();
  const { data: organizations = [] } = useOrganizations();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(organization?.id || null);

  const handleOrgChange = (orgId: string | null) => {
    setCurrentOrgId(orgId);
    onOrganizationChange?.(orgId);
  };

  if (!isMasterAdmin) {
    return null;
  }

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 min-w-[200px] justify-start"
        >
          <Building2 className="w-4 h-4" />
          <span className="truncate">
            {currentOrg?.name || 'All Organizations'}
          </span>
          <ChevronDown className="w-3 h-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleOrgChange(null)}>
          <div className="flex items-center justify-between w-full">
            <span>All Organizations</span>
            {!currentOrgId && <Check className="w-4 h-4" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem 
            key={org.id} 
            onClick={() => handleOrgChange(org.id)}
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{org.name}</span>
              {currentOrgId === org.id && <Check className="w-4 h-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}