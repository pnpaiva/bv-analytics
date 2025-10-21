import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface VideoScriptAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: string | null;
  isLoading: boolean;
  videoUrl: string;
}

export const VideoScriptAnalysisDialog = ({
  open,
  onOpenChange,
  analysis,
  isLoading,
  videoUrl,
}: VideoScriptAnalysisDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Script Analysis</DialogTitle>
          <p className="text-sm text-muted-foreground">{videoUrl}</p>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Analyzing video script...
              </span>
            </div>
          ) : analysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {analysis.split('\n').map((paragraph, index) => {
                // Check if it's a header (starts with # or numbers followed by .)
                const isHeader = paragraph.match(/^#+\s/) || paragraph.match(/^\d+\.\s\*\*/);
                const isBold = paragraph.includes('**');
                
                if (paragraph.trim() === '') {
                  return <br key={index} />;
                }
                
                if (isHeader || isBold) {
                  return (
                    <p key={index} className="font-semibold text-foreground my-3">
                      {paragraph.replace(/[#*]/g, '')}
                    </p>
                  );
                }
                
                return (
                  <p key={index} className="text-muted-foreground my-2">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No analysis available
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
