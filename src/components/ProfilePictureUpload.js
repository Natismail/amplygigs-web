// src/components/ProfilePictureUpload.js - BEAUTIFUL UI + ARRAYBUFFER FIX
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ProfilePictureUpload() {
  const { user, refreshUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setMessage({ type: "", text: "" });
  };

  const handleRemoveSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(user?.profile_picture_url || null);
    setMessage({ type: "", text: "" });
    // Reset file input
    const input = document.getElementById("profile-picture-input");
    if (input) input.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setMessage({ type: "info", text: "Preparing upload..." });

    try {
      const fileType = selectedFile.type;
      const fileExt = selectedFile.name.split(".").pop().toLowerCase();
      
      console.log("📁 File details:", {
        name: selectedFile.name,
        type: fileType,
        size: selectedFile.size,
        extension: fileExt
      });

      setUploadProgress(20);
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Delete old profile picture if exists
      if (user.profile_picture_url) {
        try {
          setMessage({ type: "info", text: "Removing old picture..." });
          const oldPath = user.profile_picture_url.split("/profile-pictures/")[1];
          if (oldPath) {
            console.log("🗑️ Deleting old image:", oldPath);
            await supabase.storage.from("profile-pictures").remove([oldPath]);
          }
        } catch (err) {
          console.warn("⚠️ Could not delete old image:", err);
        }
      }

      setUploadProgress(40);

      // CRITICAL FIX: Convert to ArrayBuffer
      console.log("🔄 Converting file to ArrayBuffer...");
      setMessage({ type: "info", text: "Processing image..." });
      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log("✅ ArrayBuffer created, size:", arrayBuffer.byteLength);

      setUploadProgress(60);

      // Upload using ArrayBuffer with explicit content-type
      console.log("⬆️ Uploading to:", fileName);
      setMessage({ type: "info", text: "Uploading to cloud..." });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, arrayBuffer, {
          contentType: fileType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw uploadError;
      }

      console.log("✅ Upload successful:", uploadData);
      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log("🔗 Public URL:", publicUrl);

      // Update user profile in database
      console.log("💾 Updating database...");
      setMessage({ type: "info", text: "Saving to profile..." });
      
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        throw updateError;
      }

      console.log("✅ Profile updated in database");
      setUploadProgress(90);

      // Update preview
      setPreviewUrl(publicUrl);

      // Refresh user context
      console.log("🔄 Refreshing user profile...");
      if (refreshUser) {
        await refreshUser();
        console.log("✅ Profile refreshed successfully");
      }

      setUploadProgress(100);
      setMessage({ type: "success", text: "Profile picture updated successfully!" });
      setSelectedFile(null);

      // Reset file input
      const input = document.getElementById("profile-picture-input");
      if (input) input.value = "";

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
        setUploadProgress(0);
      }, 3000);

      // Test image accessibility (for debugging)
      setTimeout(async () => {
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' });
          const contentType = response.headers.get('content-type');
          
          console.log("🧪 Image accessibility test:", {
            url: publicUrl,
            status: response.status,
            contentType: contentType,
            ok: response.ok,
            isImage: contentType?.includes('image/')
          });
          
          if (!contentType?.includes('image/')) {
            console.error("❌ WRONG CONTENT TYPE! Expected image/*, got:", contentType);
          } else {
            console.log("✅✅✅ SUCCESS! Image is accessible with correct content-type!");
          }
        } catch (err) {
          console.error("🧪 Accessibility test failed:", err);
        }
      }, 1000);

    } catch (error) {
      console.error("❌ Upload failed:", error);
      setMessage({ 
        type: "error", 
        text: `Upload failed: ${error.message}` 
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || "";
    const last = user?.last_name?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Picture
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a photo to personalize your profile
          </p>
        </div>

        {/* Avatar Preview */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative group">
            {/* Main Avatar */}
            <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-gray-800">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("✅ Preview image loaded")}
                  onError={(e) => {
                    console.error("❌ Preview image failed to load");
                    console.error("Failed URL:", previewUrl);
                  }}
                />
              ) : (
                <span className="text-5xl font-bold text-white">
                  {getInitials()}
                </span>
              )}
            </div>

            {/* Camera Icon Overlay */}
            <div className="absolute bottom-2 right-2 bg-purple-600 rounded-full p-3 shadow-lg cursor-pointer hover:bg-purple-700 transition-all transform hover:scale-110">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="profile-picture-input"
                disabled={uploading}
              />
            </div>

            {/* Remove Selection Button */}
            {selectedFile && !uploading && (
              <button
                onClick={handleRemoveSelection}
                className="absolute top-0 right-0 bg-red-500 rounded-full p-2 shadow-lg hover:bg-red-600 transition-all transform hover:scale-110"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                {selectedFile.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {uploadProgress}% complete
            </p>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            message.type === "success" 
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
              : message.type === "error"
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          }`}>
            {message.type === "success" && (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {message.type === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            {message.type === "info" && (
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
            )}
            <p className={`text-sm ${
              message.type === "success" 
                ? "text-green-700 dark:text-green-300"
                : message.type === "error"
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !uploading && (
          <button
            onClick={handleUpload}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Photo
          </button>
        )}

        {/* Upload Button (Disabled State) */}
        {uploading && (
          <button
            disabled
            className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </button>
        )}

        {/* Choose Photo Button (when no file selected) */}
        {!selectedFile && !uploading && (
          <label
            htmlFor="profile-picture-input-main"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            Choose Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-picture-input-main"
            />
          </label>
        )}

        {/* File Requirements */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Supported formats: JPG, PNG, GIF, WebP
            <br />
            Maximum file size: 5MB
          </p>
        </div>
      </div>
    </div>
  );
}




// // src/components/ProfilePictureUpload.js - FIXED RELOAD ISSUE
// "use client";

// import { useState, useRef } from "react";
// import Image from "next/image";
// import { Camera, Upload, Loader, X, Check, AlertCircle } from "lucide-react";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";

// export default function ProfilePictureUpload({ currentUrl, onUploadSuccess }) {
//   const { user } = useAuth();
//   const [uploading, setUploading] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState(currentUrl);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);
//   const fileInputRef = useRef(null);

//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     console.log("📁 File selected:", {
//       name: file.name,
//       type: file.type,
//       size: `${(file.size / 1024).toFixed(2)}KB`,
//     });

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       setError("Please select an image file");
//       console.error("❌ Invalid file type:", file.type);
//       return;
//     }

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       setError("Image size must be less than 5MB");
//       console.error("❌ File too large:", `${(file.size / 1024 / 1024).toFixed(2)}MB`);
//       return;
//     }

//     setError("");
//     setSuccess(false);
//     setSelectedFile(file);

//     // Create preview
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setPreviewUrl(reader.result);
//       console.log("✅ Preview created");
//     };
//     reader.readAsDataURL(file);
//   };

//   // Helper function to verify image is accessible
//   const verifyImageUrl = async (url, maxRetries = 5) => {
//     console.log("🔍 Verifying image URL...");
    
//     for (let i = 0; i < maxRetries; i++) {
//       try {
//         const response = await fetch(url, { method: 'HEAD' });
//         if (response.ok) {
//           console.log(`✅ Image verified on attempt ${i + 1}`);
//           return true;
//         }
//       } catch (err) {
//         console.log(`⏳ Attempt ${i + 1} failed, retrying...`);
//       }
      
//       // Wait 500ms before retry
//       await new Promise(resolve => setTimeout(resolve, 500));
//     }
    
//     console.warn("⚠️ Image verification failed, but proceeding anyway");
//     return false;
//   };

//   const handleUpload = async () => {
//     if (!selectedFile || !user) {
//       console.error("❌ No file or user:", { file: !!selectedFile, user: !!user });
//       return;
//     }

//     setUploading(true);
//     setUploadProgress(0);
//     setError("");
//     setSuccess(false);

//     console.log("🔄 Starting upload process...");
//     console.log("👤 User ID:", user.id);

//     try {
//       // Delete old profile picture if exists
//       if (currentUrl) {
//         try {
//           const oldPath = currentUrl.split("/profile-pictures/")[1];
//           if (oldPath) {
//             console.log("🗑️ Deleting old picture:", oldPath);
//             await supabase.storage.from("profile-pictures").remove([oldPath]);
//             console.log("✅ Old picture deleted");
//           }
//         } catch (deleteError) {
//           console.warn("⚠️ Failed to delete old picture:", deleteError);
//           // Continue even if delete fails
//         }
//       }

//       // Prepare file path
//       const fileExt = selectedFile.name.split(".").pop();
//       const fileName = `${user.id}/${Date.now()}.${fileExt}`;
//       console.log("📝 Upload path:", fileName);

//       // Simulate progress
//       const progressInterval = setInterval(() => {
//         setUploadProgress((prev) => Math.min(prev + 10, 70));
//       }, 200);

//       // Upload to Supabase Storage
//       console.log("⬆️ Uploading to storage...");
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from("profile-pictures")
//         .upload(fileName, selectedFile, {
//           cacheControl: "3600",
//           upsert: false,
//         });

//       clearInterval(progressInterval);

//       if (uploadError) {
//         console.error("❌ Upload error:", uploadError);
//         throw uploadError;
//       }

//       console.log("✅ Upload successful:", uploadData);
//       setUploadProgress(80);

//       // Get public URL
//       const { data: urlData } = supabase.storage
//         .from("profile-pictures")
//         .getPublicUrl(fileName);

//       const publicUrl = urlData.publicUrl;
//       console.log("🌐 Public URL:", publicUrl);

//       setUploadProgress(85);

//       // Wait for image to be accessible
//       console.log("⏳ Waiting for image to be ready...");
//       await verifyImageUrl(publicUrl);
//       setUploadProgress(90);

//       // Update user profile in database
//       console.log("💾 Updating profile in database...");
//       const { error: updateError } = await supabase
//         .from("user_profiles")
//         .update({ profile_picture_url: publicUrl })
//         .eq("id", user.id);

//       if (updateError) {
//         console.error("❌ Profile update error:", updateError);
//         throw updateError;
//       }

//       console.log("✅ Profile updated successfully");
//       setUploadProgress(95);

//       // Verify the database was updated
//       console.log("🔍 Verifying database update...");
//       const { data: verifyData } = await supabase
//         .from("user_profiles")
//         .select("profile_picture_url")
//         .eq("id", user.id)
//         .single();

//       if (verifyData?.profile_picture_url !== publicUrl) {
//         console.error("❌ Database verification failed");
//         throw new Error("Profile update verification failed");
//       }

//       console.log("✅ Database update verified");
//       setUploadProgress(100);

//       // Success!
//       setSuccess(true);
//       setSelectedFile(null);
//       setPreviewUrl(publicUrl); // Update preview immediately

//       // Call success callback
//       if (onUploadSuccess) {
//         onUploadSuccess(publicUrl);
//       }

//       // Wait a bit before reload to show success message
//       console.log("⏳ Waiting 2 seconds before reload...");
//       setTimeout(() => {
//         console.log("🔄 Reloading page to update UI...");
//         window.location.reload();
//       }, 2000);

//     } catch (err) {
//       console.error("❌ Upload failed:", err);
      
//       // Detailed error messages
//       let errorMessage = "Failed to upload image";
      
//       if (err.message?.includes("row-level security")) {
//         errorMessage = "Permission denied. Please check storage permissions.";
//       } else if (err.message?.includes("not found")) {
//         errorMessage = "Storage bucket not found. Please contact support.";
//       } else if (err.message?.includes("violates")) {
//         errorMessage = "Security policy violation. Please try again.";
//       } else if (err.message) {
//         errorMessage = err.message;
//       }
      
//       setError(errorMessage);
//       setPreviewUrl(currentUrl); // Restore original preview
//       setUploadProgress(0);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const cancelUpload = () => {
//     console.log("🚫 Upload cancelled");
//     setSelectedFile(null);
//     setPreviewUrl(currentUrl);
//     setError("");
//     setSuccess(false);
//     setUploadProgress(0);
//   };

//   return (
//     <div className="space-y-4">
//       {/* Current/Preview Image */}
//       <div className="flex flex-col items-center">
//         <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg group">
//           {previewUrl ? (
//             <Image
//               src={previewUrl}
//               alt="Profile"
//               fill
//               className="object-cover"
//               unoptimized={previewUrl.startsWith('data:') || previewUrl.includes('supabase')}
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center">
//               <Camera className="w-12 h-12 text-gray-400" />
//             </div>
//           )}

//           {/* Loading Overlay */}
//           {uploading && (
//             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//               <Loader className="w-8 h-8 text-white animate-spin" />
//             </div>
//           )}

//           {/* Hover Overlay */}
//           {!uploading && (
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//             >
//               <Camera className="w-8 h-8 text-white" />
//             </button>
//           )}
//         </div>

//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="image/*"
//           onChange={handleFileSelect}
//           className="hidden"
//         />
//       </div>

//       {/* Upload Progress */}
//       {uploading && (
//         <div className="space-y-2 animate-fadeIn">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
//               <Loader className="w-4 h-4 animate-spin" />
//               {uploadProgress < 80 ? "Uploading..." : 
//                uploadProgress < 90 ? "Verifying..." : 
//                uploadProgress < 100 ? "Saving..." : "Complete!"}
//             </span>
//             <span className="text-purple-600 dark:text-purple-400 font-medium">
//               {uploadProgress}%
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
//             <div
//               className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${uploadProgress}%` }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Success Message */}
//       {success && !uploading && (
//         <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-3 animate-fadeIn">
//           <div className="flex items-center gap-2">
//             <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-sm font-medium text-green-800 dark:text-green-200">
//                 Profile picture updated!
//               </p>
//               <p className="text-xs text-green-700 dark:text-green-300 mt-1">
//                 Page will reload in 2 seconds...
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {error && !uploading && (
//         <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-3 animate-fadeIn">
//           <div className="flex items-start gap-2">
//             <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
//             <div className="flex-1">
//               <p className="text-sm font-medium text-red-800 dark:text-red-200">
//                 Upload Failed
//               </p>
//               <p className="text-xs text-red-700 dark:text-red-300 mt-1">
//                 {error}
//               </p>
              
//               {/* Troubleshooting Tips */}
//               <details className="mt-2">
//                 <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
//                   Troubleshooting tips
//                 </summary>
//                 <ul className="text-xs text-red-700 dark:text-red-300 mt-2 space-y-1 pl-4">
//                   <li>• Make sure the image is JPG, PNG, or GIF</li>
//                   <li>• File must be smaller than 5MB</li>
//                   <li>• Try a different image</li>
//                   <li>• Check your internet connection</li>
//                   <li>• Open browser console (F12) for details</li>
//                 </ul>
//               </details>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Action Buttons */}
//       {selectedFile && !uploading && !success && (
//         <div className="flex gap-2 animate-fadeIn">
//           <button
//             onClick={handleUpload}
//             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl active:scale-95"
//           >
//             <Check className="w-5 h-5" />
//             Upload Picture
//           </button>
//           <button
//             onClick={cancelUpload}
//             className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition active:scale-95"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>
//       )}

//       {!selectedFile && !uploading && !success && (
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition border-2 border-dashed border-gray-300 dark:border-gray-600 active:scale-95"
//         >
//           <Upload className="w-5 h-5" />
//           Choose Photo
//         </button>
//       )}

//       <p className="text-xs text-center text-gray-500 dark:text-gray-400">
//         JPG, PNG or GIF • Max 5MB
//       </p>

//       {/* Debug Info (Development Only) */}
//       {process.env.NODE_ENV === 'development' && (
//         <details className="text-xs text-gray-500 dark:text-gray-400">
//           <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
//             🔧 Debug Info
//           </summary>
//           <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded space-y-1 font-mono text-[10px]">
//             <p>User ID: {user?.id || 'Not logged in'}</p>
//             <p>Current URL: {currentUrl || 'None'}</p>
//             <p>Preview URL: {previewUrl ? (previewUrl.startsWith('data:') ? 'Base64 preview' : previewUrl) : 'None'}</p>
//             <p>File selected: {selectedFile ? 'Yes' : 'No'}</p>
//             <p>Uploading: {uploading ? 'Yes' : 'No'}</p>
//             <p>Success: {success ? 'Yes' : 'No'}</p>
//           </div>
//         </details>
//       )}
//     </div>
//   );
// }