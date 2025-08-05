import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, BarChart3, Link, Crown, ImageIcon, Filter } from 'lucide-react';

export interface AnalyticsExportOptions {
  includeLogo?: boolean;
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
  includeCharts?: boolean;
  customTitle?: string;
  dateRange?: 'all' | '30days' | '90days' | '1year';
  platformFilter?: 'all' | 'youtube' | 'instagram' | 'tiktok';
  includeCreatorBreakdown?: boolean;
  includePlatformBreakdown?: boolean;
  includeTopPerformers?: boolean;
}

interface AnalyticsExportCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: AnalyticsExportOptions) => void;
  defaultTitle?: string;
  campaignCount: number;
}

export function AnalyticsExportCustomizationDialog({ 
  open, 
  onOpenChange, 
  onExport, 
  defaultTitle = "Analytics Dashboard Report",
  campaignCount 
}: AnalyticsExportCustomizationDialogProps) {
  const [options, setOptions] = useState<AnalyticsExportOptions>({
    includeLogo: true,
    includeAnalytics: true,
    includeContentUrls: false,
    includeMasterCampaigns: true,
    includeCharts: true,
    customTitle: defaultTitle,
    dateRange: 'all',
    platformFilter: 'all',
    includeCreatorBreakdown: true,
    includePlatformBreakdown: true,
    includeTopPerformers: true
  });

  const handleOptionChange = (key: keyof AnalyticsExportOptions, value: boolean | string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customize Analytics Export
          </DialogTitle>
          <DialogDescription>
            Choose what to include in your analytics PDF report for {campaignCount} campaign{campaignCount !== 1 ? 's' : ''}.
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

          {/* Filtering Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Data Filters
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateRange" className="text-xs">Date Range</Label>
                <Select value={options.dateRange} onValueChange={(value) => handleOptionChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformFilter" className="text-xs">Platform</Label>
                <Select value={options.platformFilter} onValueChange={(value) => handleOptionChange('platformFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube Only</SelectItem>
                    <SelectItem value="instagram">Instagram Only</SelectItem>
                    <SelectItem value="tiktok">TikTok Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                  Summary Analytics
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
                  id="creatorBreakdown"
                  checked={options.includeCreatorBreakdown}
                  onCheckedChange={(checked) => handleOptionChange('includeCreatorBreakdown', checked as boolean)}
                />
                <Label htmlFor="creatorBreakdown" className="text-sm">
                  Creator Performance Breakdown
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="platformBreakdown"
                  checked={options.includePlatformBreakdown}
                  onCheckedChange={(checked) => handleOptionChange('includePlatformBreakdown', checked as boolean)}
                />
                <Label htmlFor="platformBreakdown" className="text-sm">
                  Platform Performance Breakdown
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="topPerformers"
                  checked={options.includeTopPerformers}
                  onCheckedChange={(checked) => handleOptionChange('includeTopPerformers', checked as boolean)}
                />
                <Label htmlFor="topPerformers" className="text-sm">
                  Top Performing Content
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
                  Individual Content URLs
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
                  Master Campaign Details
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