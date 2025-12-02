'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CloudinaryUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  type: 'image' | 'video' | 'slideshow';
  className?: string;
}

export function CloudinaryUpload({ value, onChange, type, className }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize uploaded URLs from value prop
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setUploadedUrls(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(urls)) {
          return urls;
        }
        return prev;
      });
    } else {
      setUploadedUrls([]);
    }
  }, [value]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    console.log({cloudName})
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `announcements/${type}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${type === 'video' ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate file types
    const allowedTypes = type === 'video' 
      ? ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB or 10MB

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max ${type === 'video' ? '100MB' : '10MB'})`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // For non-slideshow, only allow one file
    if (type !== 'slideshow' && validFiles.length > 1) {
      toast.error('Please select only one file');
      return;
    }

    // For slideshow, limit to 10 files
    if (type === 'slideshow' && uploadedUrls.length + validFiles.length > 10) {
      toast.error('Maximum 10 images allowed for slideshow');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);

      if (type === 'slideshow') {
        const updated = [...uploadedUrls, ...urls];
        setUploadedUrls(updated);
        onChange(updated);
      } else {
        setUploadedUrls(urls);
        onChange(urls[0]);
      }

      toast.success(`Successfully uploaded ${urls.length} file(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeUrl = (index: number) => {
    const updated = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(updated);
    
    if (type === 'slideshow') {
      onChange(updated);
    } else {
      onChange(updated[0] || '');
    }
  };

  const getAcceptTypes = () => {
    if (type === 'video') return 'video/mp4,video/quicktime,video/x-msvideo,video/webm';
    return 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  };

  const getIcon = () => {
    if (type === 'video') return <Video className="h-8 w-8" />;
    return <ImageIcon className="h-8 w-8" />;
  };

  const getLabel = () => {
    if (type === 'video') return 'Upload Video';
    if (type === 'slideshow') return 'Upload Images';
    return 'Upload Image';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        multiple={type === 'slideshow'}
        onChange={handleChange}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'hover:border-blue-500 hover:bg-blue-50/50',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50/50',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Uploading...</p>
              <p className="text-xs text-gray-500">Please wait</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-blue-100 rounded-full">
                {getIcon()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {dragActive ? 'Drop files here' : getLabel()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or drag and drop
                </p>
              </div>
              <div className="text-xs text-gray-400">
                {type === 'video' ? (
                  <p>MP4, MOV, AVI, WebM (max 100MB)</p>
                ) : (
                  <p>JPG, PNG, GIF, WebP (max 10MB)</p>
                )}
                {type === 'slideshow' && <p className="mt-1">Up to 10 images</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {type === 'slideshow' ? `Uploaded Images (${uploadedUrls.length})` : 'Uploaded Media'}
          </p>
          <div className={cn(
            'grid gap-3',
            type === 'slideshow' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'
          )}>
            {uploadedUrls.map((url, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {type === 'video' ? (
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full aspect-video object-cover"
                    />
                  </>
                )}
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* URL Display */}
                <div className="p-2 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-600 truncate" title={url}>
                    {url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual URL Input Option */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
          Or enter URL manually
        </summary>
        <div className="mt-2 space-y-2">
          <input
            type="text"
            placeholder={type === 'slideshow' ? 'Enter URLs (comma-separated)' : 'Enter URL'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            onBlur={(e) => {
              const input = e.target.value.trim();
              if (input) {
                if (type === 'slideshow') {
                  const urls = input.split(',').map(u => u.trim()).filter(Boolean);
                  setUploadedUrls(urls);
                  onChange(urls);
                } else {
                  setUploadedUrls([input]);
                  onChange(input);
                }
                e.target.value = '';
              }
            }}
          />
        </div>
      </details>
    </div>
  );
}
