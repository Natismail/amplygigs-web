// src/components/MusicianVideosDisplay.js - FIXED VERSION
"use client";

import { useState, useEffect } from "react";
import { Video, Eye, Trash2, Play, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function MusicianVideosDisplay({ musicianId, isOwnProfile = false }) {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    if (musicianId) {
      fetchVideos();
    }
  }, [musicianId]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🎥 Fetching videos for musician: ${musicianId}`);
      
      const res = await fetch(`/api/musician/media?musician_id=${musicianId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch videos');
      }
      
      const data = await res.json();
      console.log(`✅ Received ${data?.length || 0} videos`);
      
      setVideos(data || []);
    } catch (err) {
      console.error('❌ Fetch videos error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/musician/media?id=${videoId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete video");

      setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete video");
    }
  };

  const incrementView = async (videoId) => {
    try {
      await fetch(`/api/musician/media/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_id: videoId, 
          viewer_id: user?.id 
        }),
      });
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const handleVideoPlay = (videoId) => {
    setPlayingVideo(videoId);
    incrementView(videoId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video" />
              <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error Loading Videos
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchVideos}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Videos Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {isOwnProfile
            ? "Upload your first performance video to showcase your talent"
            : "This musician hasn't uploaded any videos yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((vid) => (
        <div
          key={vid.id}
          className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
        >
          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            <video
              src={vid.video_url}
              controls
              controlsList="nodownload"
              className="w-full h-full object-contain"
              preload="metadata"
              crossOrigin="anonymous"
              onPlay={() => handleVideoPlay(vid.id)}
              onError={(e) => {
                console.error('Video playback error:', {
                  videoId: vid.id,
                  url: vid.video_url,
                  error: e.target.error
                });
              }}
            >
              <source src={vid.video_url} type="video/mp4" />
              <source src={vid.video_url} type="video/webm" />
              <source src={vid.video_url} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
            
            {/* Play Overlay (shows before playing) */}
            {playingVideo !== vid.id && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
            
            {/* Featured Badge */}
            {vid.is_featured && (
              <div className="absolute top-2 left-2 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                ⭐ FEATURED
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="p-4">
            {vid.title && (
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {vid.title}
              </h4>
            )}
            {vid.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {vid.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                {new Date(vid.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {vid.views || 0} views
              </span>
            </div>
          </div>

          {/* Delete Button (Only for own profile) */}
          {isOwnProfile && (
            <button
              onClick={() => deleteVideo(vid.id)}
              className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}