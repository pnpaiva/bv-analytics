import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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
  
  const handleDownloadPDF = () => {
    if (!analysis) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Video Script Analysis', margin, yPosition);
      yPosition += 10;

      // Video URL
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const urlLines = doc.splitTextToSize(videoUrl, maxWidth);
      doc.text(urlLines, margin, yPosition);
      yPosition += (urlLines.length * 5) + 10;

      // Analysis content
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const lines = analysis.split('\n');
      
      lines.forEach(line => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        if (line.trim() === '') {
          yPosition += 5;
          return;
        }

        // Check if it's a header
        const isHeader = line.match(/^#+\s/) || line.match(/^\d+\.\s\*\*/) || line.includes('**');
        
        if (isHeader) {
          doc.setFont('helvetica', 'bold');
          const cleanLine = line.replace(/[#*]/g, '').trim();
          const headerLines = doc.splitTextToSize(cleanLine, maxWidth);
          doc.text(headerLines, margin, yPosition);
          yPosition += (headerLines.length * 6) + 3;
          doc.setFont('helvetica', 'normal');
        } else {
          const textLines = doc.splitTextToSize(line, maxWidth);
          doc.text(textLines, margin, yPosition);
          yPosition += (textLines.length * 5) + 2;
        }
      });

      doc.save('script-analysis.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

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

        {analysis && !isLoading && (
          <DialogFooter>
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
