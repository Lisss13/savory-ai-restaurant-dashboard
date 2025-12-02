'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { uploadApi } from '@/lib/api';

interface UseImageUploadOptions {
  onSuccess?: (url: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    onSuccess,
    successMessage = 'Изображение загружено',
    errorMessage = 'Ошибка загрузки изображения',
  } = options;

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const response = await uploadApi.uploadImage(file);
        onSuccess?.(response.data.url);
        toast.success(successMessage);
      } catch {
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, successMessage, errorMessage]
  );

  return { isUploading, handleImageUpload };
}
