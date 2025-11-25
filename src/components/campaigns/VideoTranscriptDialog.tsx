import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface VideoTranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: any;
  isLoading: boolean;
  videoUrl: string;
}

export function VideoTranscriptDialog({
  open,
  onOpenChange,
  transcript,
  isLoading,
  videoUrl,
}: VideoTranscriptDialogProps) {
  const handleDownloadTranscript = () => {
    if (!transcript) return;

    let textContent = `Video Transcript\n`;
    textContent += `URL: ${videoUrl}\n`;
    textContent += `\n${'='.repeat(80)}\n\n`;

    // Handle different transcript formats
    if (Array.isArray(transcript)) {
      // Transcript with timestamps
      transcript.forEach((segment: any) => {
        const timestamp = segment.timestamp || segment.time || '00:00';
        const text = segment.text || segment.content || '';
        textContent += `[${timestamp}] ${text}\n`;
      });
    } else if (typeof transcript === 'object' && transcript.segments) {
      // Nested segments format
      transcript.segments.forEach((segment: any) => {
        const timestamp = segment.timestamp || segment.time || '00:00';
        const text = segment.text || segment.content || '';
        textContent += `[${timestamp}] ${text}\n`;
      });
    } else if (typeof transcript === 'string') {
      // Plain text transcript
      textContent += transcript;
    } else {
      textContent += JSON.stringify(transcript, null, 2);
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTranscript = () => {
    if (!transcript) return null;

    if (Array.isArray(transcript)) {
      return (
        <div className="space-y-3">
          {transcript.map((segment: any, index: number) => (
            <div key={index} className="flex gap-3">
              <span className="text-primary font-mono text-sm whitespace-nowrap">
                {segment.timestamp || segment.time || '00:00'}
              </span>
              <p className="text-sm leading-relaxed">
                {segment.text || segment.content || ''}
              </p>
            </div>
          ))}
        </div>
      );
    } else if (typeof transcript === 'object' && transcript.segments) {
      return (
        <div className="space-y-3">
          {transcript.segments.map((segment: any, index: number) => (
            <div key={index} className="flex gap-3">
              <span className="text-primary font-mono text-sm whitespace-nowrap">
                {segment.timestamp || segment.time || '00:00'}
              </span>
              <p className="text-sm leading-relaxed">
                {segment.text || segment.content || ''}
              </p>
            </div>
          ))}
        </div>
      );
    } else if (typeof transcript === 'string') {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>;
    } else {
      return (
        <pre className="text-xs overflow-auto">
          {JSON.stringify(transcript, null, 2)}
        </pre>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Video Transcript</DialogTitle>
          <DialogDescription>
            Transcription with timestamps for the video
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Transcribing video... This may take a minute
              </p>
            </div>
          </div>
        ) : transcript ? (
          <>
            <ScrollArea className="h-[50vh] w-full rounded-md border p-4">
              {renderTranscript()}
            </ScrollArea>
            <div className="flex justify-end">
              <Button onClick={handleDownloadTranscript} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Transcript
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transcript available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
