// src/components/MusicianVideoUpload.js
"use client";

import { useState, useRef } from "react";
import { Upload, X, Video, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


export default function MusicianVideoUpload({ onUploadSuccess }) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

//   const uploadVideo = async () => {
//     if (!file || !user) return;
    
//     setUploading(true);
//     setUploadProgress(0);

//     const formData = new FormData();
//     formData.append("video", file);
//     formData.append("musician_id", user.id);
//     formData.append("title", videoTitle || file.name);
//     formData.append("description", videoDescription);

//     try {
//       const progressInterval = setInterval(() => {
//         setUploadProgress(prev => Math.min(prev + 10, 90));
//       }, 500);

//       const res = await fetch("/api/musician/media", {
//         method: "POST",
//         body: formData,
//       });

//       clearInterval(progressInterval);
//       setUploadProgress(100);

//       if (!res.ok) throw new Error("Video upload failed");

//       const newVideo = await res.json();
      
//       // Reset form
//       setFile(null);
//       setPreviewUrl(null);
//       setVideoTitle("");
//       setVideoDescription("");
//       setUploadProgress(0);
      
//       if (onUploadSuccess) onUploadSuccess(newVideo);
      
//     } catch (err) {
//       console.error(err);
//       alert("Failed to upload video. Please try again.");
//     } finally {
//       setUploading(false);
//     }
//   };


const uploadVideo = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    setUploadProgress(0);

    // ✅ Get session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    const formData = new FormData();
    formData.append("video", file);
    formData.append("musician_id", user.id);
    formData.append("title", videoTitle || file.name);
    formData.append("description", videoDescription);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const res = await fetch("/api/musician/media", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session?.access_token}`, // ✅ Include token
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Video upload failed");
      }

      const newVideo = await res.json();
      
      setFile(null);
      setPreviewUrl(null);
      setVideoTitle("");
      setVideoDescription("");
      setUploadProgress(0);
      
      if (onUploadSuccess) onUploadSuccess(newVideo);
      
      alert("✅ Video uploaded successfully!");
      
    } catch (err) {
      console.error(err);
      alert(`Failed to upload video: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };


  const cancelUpload = () => {
    setFile(null);
    setPreviewUrl(null);
    setVideoTitle("");
    setVideoDescription("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
        Upload Performance Video
      </h3>

      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragActive
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drag and drop your video here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or click to browse files
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
              >
                Choose Video
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Supported formats: MP4, MOV, AVI (Max 500MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-64 object-contain"
            />
            <button
              onClick={cancelUpload}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Video Title
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g., Live Jazz Performance at Blue Note"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Tell viewers about this performance..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
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

          <div className="flex gap-3">
            <button
              onClick={uploadVideo}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Video
                </>
              )}
            </button>
            <button
              onClick={cancelUpload}
              disabled={uploading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}