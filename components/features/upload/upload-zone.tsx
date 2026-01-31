'use client';

import { useState, useCallback } from 'react';
import { uploadFile } from '@/app/actions/upload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadFile(formData);

      if (result.success) {
        setUploadStatus('success');
        toast.success('Document uploaded successfully!', {
          description: `${result.data?.fileName} has been processed and saved.`,
        });
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        setUploadStatus('error');
        toast.error('Upload failed', {
          description: result.error || 'An error occurred',
        });
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);

    // Reset input
    e.target.value = '';
  };

  return (
    <Card
      className={`relative p-12 transition-all ${
        isDragging ? 'border-primary border-2 bg-primary/5' : 'border-dashed border-2'
      } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Processing document...</h3>
              <p className="text-sm text-muted-foreground">
                Extracting data with AI. This may take a moment.
              </p>
            </div>
          </>
        ) : uploadStatus === 'success' ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Upload successful!</h3>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </>
        ) : uploadStatus === 'error' ? (
          <>
            <XCircle className="h-16 w-16 text-red-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Upload failed</h3>
              <p className="text-sm text-muted-foreground">
                Please try again or check the error message.
              </p>
            </div>
            <Button onClick={() => setUploadStatus('idle')} variant="outline">
              Try Again
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-primary/10 rounded-full">
              {isDragging ? (
                <Upload className="h-12 w-12 text-primary" />
              ) : (
                <FileText className="h-12 w-12 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isDragging ? 'Drop your file here' : 'Upload a document'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Drag and drop your receipt, invoice, or contract here, or click to browse.
                Supports JPEG, PNG, WebP, and PDF files up to 10MB.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="default" size="lg">
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                AI-powered extraction
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Secure storage
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Searchable
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}