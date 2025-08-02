import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, File, CheckCircle, AlertCircle, Camera, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File, fileUrl?: string) => void;
  className?: string;
  userId?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, className, userId }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload medical reports",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('uploading');
    setUploadedFile(file);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('medical-reports')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medical-reports')
        .getPublicUrl(fileName);

      setUploadStatus('success');
      onFileUpload(file, urlData.publicUrl);
      
      toast({
        title: "Upload Successful",
        description: "Your medical report has been uploaded successfully",
      });
    } catch (error: any) {
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    };
    input.click();
  };

  const handleGalleryAccess = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.txt,image/*,application/pdf';
    input.multiple = false;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    };
    input.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (file.type === 'application/pdf') return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploadStatus === 'success' && uploadedFile) {
    return (
      <Card className={cn("p-8 border-2 border-success bg-success/5", className)}>
        <div className="flex items-center justify-center space-x-4">
          <CheckCircle className="w-12 h-12 text-success" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-success">File Uploaded Successfully!</h3>
            <div className="flex items-center space-x-2 mt-2 text-muted-foreground">
              {getFileIcon(uploadedFile)}
              <span>{uploadedFile.name}</span>
              <span>({formatFileSize(uploadedFile.size)})</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "relative border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragOver 
          ? "border-primary bg-primary/5 scale-105" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
        uploadStatus === 'uploading' && "border-primary bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploadStatus === 'uploading'}
      />
      
      <div className="p-12 text-center">
        {uploadStatus === 'uploading' ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-primary">Uploading...</h3>
              <p className="text-muted-foreground">Please wait while we process your file</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Upload Your Medical Report</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Drag and drop your medical report here, or click to browse files
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">PDF</span>
              <span className="px-3 py-1 bg-muted rounded-full">PNG</span>
              <span className="px-3 py-1 bg-muted rounded-full">JPG</span>
              <span className="px-3 py-1 bg-muted rounded-full">TXT</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="upload" size="lg" onClick={handleGalleryAccess}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <Button variant="outline" size="lg" onClick={handleCameraCapture}>
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;