import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileText, BarChart3, Link, Crown, ImageIcon } from 'lucide-react';

export interface ExportCustomizationOptions {
  includeLogo?: boolean;
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
  includeCharts?: boolean;
  customTitle?: string;
}

interface ExportCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportCustomizationOptions) => void;
  defaultTitle?: string;
  campaignCount: number;
}

export function ExportCustomizationDialog({ 
  open, 
  onOpenChange, 
  onExport, 
  defaultTitle = "Campaign Analytics Report",
  campaignCount 
}: ExportCustomizationDialogProps) {
  const [options, setOptions] = useState<ExportCustomizationOptions>({
    includeLogo: true,
    includeAnalytics: true,
    includeContentUrls: true,
    includeMasterCampaigns: true,
    includeCharts: true,
    customTitle: defaultTitle
  });

  const handleOptionChange = (key: keyof ExportCustomizationOptions, value: boolean | string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customize PDF Export
          </DialogTitle>
          <DialogDescription>
            Choose what to include in your PDF report for {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={options.customTitle || ''}
              onChange={(e) => handleOptionChange('customTitle', e.target.value)}
              placeholder="Enter custom report title"
            />
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Include in Report</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analytics"
                  checked={options.includeAnalytics}
                  onCheckedChange={(checked) => handleOptionChange('includeAnalytics', checked as boolean)}
                />
                <Label htmlFor="analytics" className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Analytics Data (views, engagement, rates)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => handleOptionChange('includeCharts', checked as boolean)}
                />
                <Label htmlFor="charts" className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Charts and Visualizations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urls"
                  checked={options.includeContentUrls}
                  onCheckedChange={(checked) => handleOptionChange('includeContentUrls', checked as boolean)}
                />
                <Label htmlFor="urls" className="flex items-center gap-2 text-sm">
                  <Link className="h-4 w-4" />
                  Content URLs
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="master"
                  checked={options.includeMasterCampaigns}
                  onCheckedChange={(checked) => handleOptionChange('includeMasterCampaigns', checked as boolean)}
                />
                <Label htmlFor="master" className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4" />
                  Master Campaign Information
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="logo"
                  checked={options.includeLogo}
                  onCheckedChange={(checked) => handleOptionChange('includeLogo', checked as boolean)}
                />
                <Label htmlFor="logo" className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  Campaign Logos
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}