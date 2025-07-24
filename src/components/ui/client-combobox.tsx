import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClients } from '@/hooks/useClients';
import { useCreateClient } from '@/hooks/useManageClients';

interface ClientComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ClientCombobox({ value, onValueChange, placeholder = "Select client..." }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { data: clients = [] } = useClients();
  const createClient = useCreateClient();

  const selectedClient = clients.find((client) => client.id === value);

  const handleCreateClient = async () => {
    if (!searchValue.trim()) return;
    
    try {
      const newClient = await createClient.mutateAsync({ name: searchValue.trim() });
      onValueChange(newClient.id);
      setSearchValue('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const exactMatch = filteredClients.find(
    (client) => client.name.toLowerCase() === searchValue.toLowerCase()
  );

  const showCreateOption = searchValue.trim() && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? selectedClient.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search clients..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue ? 'No clients found.' : 'No clients available.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onValueChange(client.id);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  onSelect={handleCreateClient}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}