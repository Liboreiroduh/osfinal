'use client';

import { useState, useCallback } from 'react';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UseUploadOptions {
  category?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export function useUpload(options: UseUploadOptions = {}) {
  const {
    category = 'general',
    maxSize = 50,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        const error = 'Tipo de arquivo não permitido';
        setError(error);
        setUploading(false);
        return { success: false, error };
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const error = `Arquivo muito grande (máx ${maxSize}MB)`;
        setError(error);
        setUploading(false);
        return { success: false, error };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      setProgress(50);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      const data = await response.json();

      if (!response.ok) {
        const error = data.error || 'Erro ao fazer upload';
        setError(error);
        setUploading(false);
        return { success: false, error };
      }

      setProgress(100);
      setUploading(false);
      
      return { success: true, url: data.url };
    } catch (err) {
      const error = 'Erro ao fazer upload do arquivo';
      setError(error);
      setUploading(false);
      return { success: false, error };
    }
  }, [category, maxSize, allowedTypes]);

  const uploadMultiple = useCallback(async (files: FileList | File[]): Promise<UploadResult[]> => {
    const fileArray = Array.from(files);
    const results: UploadResult[] = [];

    for (const file of fileArray) {
      const result = await uploadFile(file);
      results.push(result);
    }

    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data.success;
    } catch {
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    uploading,
    progress,
    error,
    reset,
  };
}

// Utility function to convert file to base64 (alternative for small files)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
