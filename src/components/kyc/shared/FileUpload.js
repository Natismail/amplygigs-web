// src/components/kyc/shared/FileUpload.js
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Upload, CheckCircle2, X, Camera, AlertCircle } from 'lucide-react';

export default function FileUpload({ 
  label, 
  file, 
  onChange, 
  accept = "image/*",
  capture = null,
  error = null,
  hint = "JPG, PNG or WebP (max 5MB)",
  preview = true
}) {
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Create preview
    if (preview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }

    onChange(selectedFile);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onChange(null);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
        error 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
          : file
          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
      }`}>
        <input
          type="file"
          accept={accept}
          capture={capture}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {file && previewUrl ? (
          <div className="relative">
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 z-20 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <Image
              src={previewUrl}
              alt="Preview"
              width={400}
              height={300}
              className="mx-auto rounded-lg border-2 border-purple-200 dark:border-purple-800 max-h-64 object-contain"
            />
            <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {file.name}
            </p>
          </div>
        ) : (
          <div className="text-center">
            {capture === 'user' ? (
              <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            )}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {capture === 'user' ? 'Take a photo or upload' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}