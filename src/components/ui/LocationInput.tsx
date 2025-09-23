import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LocationInputProps {
  country: string;
  percentage: number;
  onCountryChange: (newCountry: string) => void;
  onPercentageChange: (newPercentage: number) => void;
  onRemove: () => void;
}

export function LocationInput({ 
  country, 
  percentage, 
  onCountryChange, 
  onPercentageChange, 
  onRemove 
}: LocationInputProps) {
  const [localCountry, setLocalCountry] = useState(country);

  const handleCountryBlur = () => {
    if (localCountry !== country) {
      onCountryChange(localCountry);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={localCountry}
        onChange={(e) => setLocalCountry(e.target.value)}
        onBlur={handleCountryBlur}
        placeholder="Country"
        className="border-2"
      />
      <Input
        type="number"
        value={percentage}
        onChange={(e) => onPercentageChange(Number(e.target.value))}
        placeholder="%"
        className="border-2 w-20"
      />
      <Button 
        variant="outline" 
        size="sm"
        onClick={onRemove}
        className="border-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}