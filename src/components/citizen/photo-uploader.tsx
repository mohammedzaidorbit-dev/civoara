'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  X,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploaderProps {
  onPhotoSelected: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
  maxSizeBytes?: number; // Default 10MB
}

export function PhotoUploader({
  onPhotoSelected,
  selectedFile,
  error: parentError,
  maxSizeBytes = 10 * 1024 * 1024,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Derive preview URL via useMemo to avoid cascading render inside effect
  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  // Clean up object URL when changed/unmounted
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndHandleFile = (file: File) => {
    setLocalError(null);

    // 1. Validate MIME Type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setLocalError('Unsupported image format. Please upload JPEG, PNG, or WebP.');
      onPhotoSelected(null);
      return false;
    }

    // 2. Validate Size Limit
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setLocalError(`File size exceeds ${maxMb}MB. Please choose a smaller photo.`);
      onPhotoSelected(null);
      return false;
    }

    onPhotoSelected(file);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndHandleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndHandleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoSelected(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeError = localError || parentError;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Incident Photograph <span className="text-slate-400 font-normal">(Optional but recommended)</span>
        </label>
        <span className="text-xs text-slate-400">JPEG, PNG, WebP up to 10MB</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            flex flex-col items-center justify-center gap-2.5
            ${dragOver
              ? 'border-sky-700 bg-sky-50'
              : activeError
                ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }
          `}
        >
          <div className="w-12 h-12 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500">
            <UploadCloud className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop photo
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution field photos accelerate municipal inspection and dispatch.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 pointer-events-none"
          >
            Select Image
          </Button>
        </div>
      ) : (
        /* Image Preview Card */
        <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
          {previewUrl && (
            <div className="relative w-24 h-24 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group">
              <img
                src={previewUrl}
                alt="Selected issue"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setShowFullPreview(true)}
                className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded cursor-pointer"
                title="Enlarge preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600 text-xs font-semibold">
              <FileCheck className="w-4 h-4" />
              <span>Photograph Ready for Upload</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400">
              {formatFileSize(selectedFile.size)} • {selectedFile.type || 'image'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Full Preview Modal */}
      {showFullPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2 border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowFullPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Enlarged issue preview"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-lg"
            />
            <div className="py-2 text-center text-xs text-slate-400">
              {selectedFile?.name} ({selectedFile && formatFileSize(selectedFile.size)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
