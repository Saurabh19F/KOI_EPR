'use client';

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  Download,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { filesApi, FileRecord } from '@/lib/api';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  storageKey?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  readOnly?: boolean;
  label?: string;
  moduleName?: string;
  recordId?: string;
}

export function FileUpload({
  files,
  onChange,
  accept = '*',
  maxFiles = 10,
  maxSize = 10,
  readOnly = false,
  label = 'Upload Files',
  moduleName = 'general',
  recordId = 'temp',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${file.name} exceeds ${maxSize}MB limit`;
    }

    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return `${file.name} is not an accepted file type`;
      }
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await filesApi.getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName,
      });

      if (!presignedResponse.data.success) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = presignedResponse.data.data;

      // Step 2: Upload to S3/MinIO using presigned URL
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Step 3: Confirm upload to backend
      const confirmResponse = await filesApi.confirmUpload({
        storageKey: key,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName,
        recordId,
      });

      if (!confirmResponse.data.success) {
        throw new Error('Failed to confirm upload');
      }

      return {
        id: confirmResponse.data.data.fileId,
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        storageKey: key,
      };
    } catch (error: any) {
      console.error('Upload error:', error);

      // Fallback to direct upload if presigned fails
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.log('Falling back to direct upload...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', moduleName);
        formData.append('entityId', recordId);
        formData.append('fileName', file.name);
        formData.append('mimeType', file.type);
        formData.append('fileSize', String(file.size));

        const response = await axios.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          return {
            id: response.data.data.fileId,
            name: file.name,
            url: response.data.data.fileUrl || URL.createObjectURL(file),
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
          };
        }
      }

      throw error;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const newFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        try {
          const uploadedFile = await uploadFile(file);
          if (uploadedFile) {
            newFiles.push(uploadedFile);
          }
        } catch (error: any) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }

        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }

      onChange([...files, ...newFiles]);

      if (newFiles.length === fileArray.length) {
        toast.success(`All ${newFiles.length} file(s) uploaded successfully`);
      } else if (newFiles.length > 0) {
        toast(`${newFiles.length} of ${fileArray.length} files uploaded`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (id: string) => {
    const file = files.find((f) => f.id === id);

    // If this is a server file (has storage key or numeric id), delete from server
    if (file?.storageKey || (id && !id.startsWith('file_') && !id.startsWith('img_') && !id.startsWith('blob:'))) {
      try {
        await filesApi.deleteFile(id);
      } catch (error) {
        console.error('Failed to delete file from server:', error);
      }
    }

    if (file?.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }

    onChange(files.filter((f) => f.id !== id));
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      if (file.storageKey) {
        // Get presigned download URL
        const response = await filesApi.getPresignedDownloadUrl(file.id);
        if (response.data.success && response.data.data.downloadUrl) {
          window.open(response.data.data.downloadUrl, '_blank');
          return;
        }
      }

      // Fallback to direct download
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.click();
    } catch (error) {
      // Fallback
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (readOnly || isUploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0 && inputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(droppedFiles).forEach(file => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [readOnly, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <Badge variant="secondary">
            {files.length} / {maxFiles} files
          </Badge>
        </div>
      )}

      {/* Upload Area */}
      {!readOnly && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isUploading
              ? 'border-primary-300 bg-primary-50 cursor-not-allowed'
              : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50'
          }`}
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500" />
              <p className="text-sm text-slate-600">Uploading files...</p>
              <Progress value={uploadProgress} className="w-48 mx-auto" />
              <p className="text-xs text-slate-500">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm text-slate-600">
                <span className="text-primary-600 font-medium cursor-pointer">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-slate-400">
                Max {maxFiles} files, up to {maxSize}MB each
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {/* Preview */}
              {file.type.startsWith('image/') ? (
                <div className="w-12 h-12 rounded border bg-white overflow-hidden flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded border bg-white flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {file.storageKey && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Synced
                    </Badge>
                  )}
                </p>
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Image Gallery Component for product images
interface ImageGalleryProps {
  images: UploadedFile[];
  onChange: (images: UploadedFile[]) => void;
  maxImages?: number;
  readOnly?: boolean;
  moduleName?: string;
  recordId?: string;
}

export function ImageGallery({
  images,
  onChange,
  maxImages = 5,
  readOnly = false,
  moduleName = 'product_images',
  recordId = 'temp',
}: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<UploadedFile | null> => {
    try {
      const presignedResponse = await filesApi.getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName,
      });

      if (!presignedResponse.data.success) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = presignedResponse.data.data;

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      const confirmResponse = await filesApi.confirmUpload({
        storageKey: key,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName,
        recordId,
      });

      if (!confirmResponse.data.success) {
        throw new Error('Failed to confirm upload');
      }

      return {
        id: confirmResponse.data.data.fileId,
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        storageKey: key,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const imageFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));

    if (images.length + imageFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setIsUploading(true);

    const newImages: UploadedFile[] = [];

    for (const file of imageFiles) {
      const uploaded = await uploadImage(file);
      if (uploaded) {
        newImages.push(uploaded);
      }
    }

    onChange([...images, ...newImages]);
    setIsUploading(false);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    const image = images.find((i) => i.id === id);

    if (image?.storageKey || (id && !id.startsWith('blob:'))) {
      try {
        await filesApi.deleteFile(id);
      } catch (error) {
        console.error('Failed to delete image from server:', error);
      }
    }

    if (image) {
      URL.revokeObjectURL(image.url);
    }
    onChange(images.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Product Images</label>
        <Badge variant="secondary">
          {images.length} / {maxImages}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />

            {/* Primary Badge */}
            {index === 0 && (
              <Badge className="absolute top-2 left-2 bg-primary-600 text-white text-xs">
                Primary
              </Badge>
            )}

            {/* Sync Badge */}
            {image.storageKey && (
              <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs" variant="secondary">
                Synced
              </Badge>
            )}

            {/* Actions Overlay */}
            {!readOnly && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(image.url, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add New Image */}
        {!readOnly && images.length < maxImages && (
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-slate-50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-slate-400" />
                <span className="text-xs text-slate-500 mt-1">Add Image</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
