// src/components/ProfilePictureUpload.js
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Upload, Loader, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePictureUpload({ currentUrl, onUploadSuccess }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Delete old profile picture if exists
      if (currentUrl) {
        const oldPath = currentUrl.split("/profile-pictures/")[1];
        if (oldPath) {
          await supabase.storage.from("profile-pictures").remove([oldPath]);
        }
      }

      // Upload new image
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Call success callback
      onUploadSuccess?.(publicUrl);

      // Reset
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
      setPreviewUrl(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(currentUrl);
    setError("");
  };

  return (
    <div className="space-y-4">
      {/* Current/Preview Image */}
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Uploading...
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && !uploading && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
          >
            <Check className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={cancelUpload}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {!selectedFile && !uploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
          <Upload className="w-4 h-4" />
          Choose Photo
        </button>
      )}

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        JPG, PNG or GIF. Max 5MB
      </p>
    </div>
  );
}


