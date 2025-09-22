import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Trash2, 
  Eye,
  Paperclip,
  File,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCampaignCreatorsProject } from '@/hooks/useProjectManagement';

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  category: 'brief' | 'script' | 'video' | 'image' | 'contract' | 'other';
  description?: string;
  creatorId?: string;
  campaignId: string;
}

interface FileAttachmentSystemProps {
  campaignId?: string;
  creatorId?: string;
}

export function FileAttachmentSystem({ campaignId, creatorId }: FileAttachmentSystemProps) {
  const { data: creators = [] } = useCampaignCreatorsProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileAttachment[]>([
    {
      id: '1',
      name: 'Brand Guidelines.pdf',
      type: 'application/pdf',
      size: 2500000,
      url: '/placeholder-file.pdf',
      uploadedAt: new Date(),
      uploadedBy: 'Admin',
      category: 'brief',
      description: 'Brand guidelines and style requirements',
      campaignId: campaignId || 'all'
    },
    {
      id: '2',
      name: 'Content Script v1.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1200000,
      url: '/placeholder-file.docx',
      uploadedAt: new Date(),
      uploadedBy: 'Creator',
      category: 'script',
      creatorId: creatorId,
      campaignId: campaignId || 'all'
    }
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newFileData, setNewFileData] = useState({
    category: 'other' as FileAttachment['category'],
    description: '',
    creatorId: creatorId || ''
  });

  const filteredFiles = files.filter(file => {
    if (campaignId && file.campaignId !== campaignId && file.campaignId !== 'all') return false;
    if (creatorId && file.creatorId && file.creatorId !== creatorId) return false;
    return true;
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const newFile: FileAttachment = {
          id: Date.now().toString() + i,
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file), // In real app, this would be the uploaded file URL
          uploadedAt: new Date(),
          uploadedBy: 'Current User', // In real app, get from auth
          category: newFileData.category,
          description: newFileData.description,
          creatorId: newFileData.creatorId || undefined,
          campaignId: campaignId || 'all'
        };

        setFiles(prev => [...prev, newFile]);
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      setIsUploadDialogOpen(false);
      setNewFileData({
        category: 'other',
        description: '',
        creatorId: creatorId || ''
      });
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File deleted successfully');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getCategoryColor = (category: FileAttachment['category']) => {
    switch (category) {
      case 'brief': return 'bg-blue-500 text-white';
      case 'script': return 'bg-green-500 text-white';
      case 'video': return 'bg-purple-500 text-white';
      case 'image': return 'bg-pink-500 text-white';
      case 'contract': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filesByCategory = filteredFiles.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {} as Record<FileAttachment['category'], FileAttachment[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          File Attachments
        </CardTitle>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>File Category</Label>
                <Select 
                  value={newFileData.category} 
                  onValueChange={(value: FileAttachment['category']) => 
                    setNewFileData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!creatorId && (
                <div className="space-y-2">
                  <Label>Assign to Creator (Optional)</Label>
                  <Select 
                    value={newFileData.creatorId} 
                    onValueChange={(value) => setNewFileData(prev => ({ ...prev, creatorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All creators</SelectItem>
                      {creators.map(creator => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.creators?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={newFileData.description}
                  onChange={(e) => setNewFileData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the file"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Files</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={handleFileSelect}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Support for images, videos, documents, and more
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.keys(filesByCategory).length === 0 ? (
            <div className="text-center py-8">
              <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No files attached</h3>
              <p className="text-muted-foreground">Upload your first file to get started.</p>
            </div>
          ) : (
            Object.entries(filesByCategory).map(([category, categoryFiles]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(category as FileAttachment['category'])}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {categoryFiles.map(file => {
                    const creator = creators.find(c => c.id === file.creatorId);
                    
                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {format(file.uploadedAt, "MMM dd, yyyy")} • {file.uploadedBy}
                            </div>
                            {file.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {file.description}
                              </div>
                            )}
                            {creator && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {creator.creators?.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}