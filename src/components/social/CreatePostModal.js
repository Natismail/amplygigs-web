// src/components/social/CreatePostModal.js
"use client";

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Smile } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';

export default function CreatePostModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { createPost, uploadProgress } = useSocial();
  
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !mediaFile) {
      alert('Please add a caption or media');
      return;
    }

    setUploading(true);

    const { data, error } = await createPost({
      caption: caption.trim(),
      mediaFile,
      mediaType: mediaFile ? mediaType : 'text',
    });

    setUploading(false);

    if (error) {
      alert('Failed to create post: ' + error.message);
      return;
    }

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Create Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Caption Input */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:bg-gray-800 dark:text-white resize-none min-h-[120px]"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {caption.length}/500
          </p>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {mediaType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain"
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-96"
                />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Add photo or video"
              >
                <ImageIcon className="w-5 h-5 text-green-500" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Add emoji"
              >
                <Smile className="w-5 h-5 text-yellow-500" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading || (!caption.trim() && !mediaFile)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}