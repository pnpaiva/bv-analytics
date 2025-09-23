import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Video, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Download
} from 'lucide-react';
import { useProjectFiles, useUploadProjectFile, useAddProjectUrl, useUpdateFileStatus } from '@/hooks/useEnhancedProjectManagement';
import { toast } from 'sonner';

interface FileUploadSectionProps {
  campaignId: string;
  creatorId: string;
}

export function FileUploadSection({ campaignId, creatorId }: FileUploadSectionProps) {
  const { data: files = [], isLoading } = useProjectFiles(campaignId, creatorId);
  const uploadFile = useUploadProjectFile();
  const addUrl = useAddProjectUrl();
  const updateStatus = useUpdateFileStatus();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const fileTypes = [
    { value: 'contract', label: 'Contract', icon: FileText },
    { value: 'brief', label: 'Brief', icon: FileText },
    { value: 'video_for_approval', label: 'Video for Approval', icon: Video },
    { value: 'final_video_url', label: 'Final Video URL', icon: Video },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const handleFileUpload = async () => {
    if (!selectedFile || !fileType) {
      toast.error('Please select a file and file type');
      return;
    }

    try {
      await uploadFile.mutateAsync({
        file: selectedFile,
        campaignId,
        creatorId,
        fileType,
        description
      });
      
      // Reset form
      setSelectedFile(null);
      setFileType('');
      setDescription('');
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleUrlAdd = async () => {
    if (!url || !fileType || !fileName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addUrl.mutateAsync({
        url,
        campaignId,
        creatorId,
        fileType,
        fileName,
        description
      });
      
      // Reset form
      setUrl('');
      setFileName('');
      setFileType('');
      setDescription('');
      setUrlDialogOpen(false);
    } catch (error) {
      console.error('URL add failed:', error);
    }
  };

  const handleStatusUpdate = async (fileId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({
        fileId,
        status,
        campaignId,
        creatorId
      });
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'needs_revision': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileTypes.find(t => t.value === fileType);
    const Icon = type?.icon || FileText;
    return <Icon className="w-4 h-4" />;
  };

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Actions */}
      <div className="flex gap-4">
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Project File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>File Type</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>File</Label>
                <Input 
                  type="file" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about this file..."
                />
              </div>

              <Button 
                onClick={handleFileUpload} 
                disabled={uploadFile.isPending || !selectedFile || !fileType}
                className="w-full"
              >
                {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Add URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add External URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>File Type</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>File Name</Label>
                <Input 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a name for this file/link"
                />
              </div>

              <div>
                <Label>URL</Label>
                <Input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/file-or-video"
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about this URL..."
                />
              </div>

              <Button 
                onClick={handleUrlAdd} 
                disabled={addUrl.isPending || !url || !fileType || !fileName}
                className="w-full"
              >
                {addUrl.isPending ? 'Adding...' : 'Add URL'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        {files.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No files uploaded</h3>
                <p className="text-muted-foreground">Upload files or add URLs to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          files.map(file => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_type)}
                    <div>
                      <h4 className="font-medium">{file.file_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {fileTypes.find(t => t.value === file.file_type)?.label}
                        {file.file_size && ` • ${(file.file_size / 1024 / 1024).toFixed(1)} MB`}
                      </p>
                      {file.description && (
                        <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>

                    {file.file_url ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    ) : file.file_path && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Download logic would go here
                          toast.info('Download functionality to be implemented');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}

                    {file.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(file.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(file.id, 'needs_revision')}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(file.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {file.approved_at && file.status === 'approved' && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Approved on {new Date(file.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}