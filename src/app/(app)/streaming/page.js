// src/app/streaming/page.js
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MusicBrowser from '@/components/streaming/MusicBrowser';
import GlobalMusicPlayer from '@/components/streaming/GlobalMusicPlayer';
import StreamingToggle from '@/components/streaming/StreamingToggle';
import TrackUploadForm from '@/components/streaming/TrackUploadForm';
import { Music, TrendingUp, Clock, Heart, Upload } from 'lucide-react'; // ✅ Added Upload
import { useRouter } from 'next/navigation';

export default function StreamingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                🎵 Music Streaming
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Discover and stream music from multiple sources
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StreamingToggle />
              
              {/* Upload Button (Musicians Only) */}
              {user?.role === 'MUSICIAN' && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition shadow-lg"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Music className="w-5 h-5" />} label="All Tracks" value="1M+" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Trending" value="Top 100" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Recent" value="New" />
            <StatCard icon={<Heart className="w-5 h-5" />} label="Favorites" value="0" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <MusicBrowser />
      </div>

      {/* Global Music Player */}
      <GlobalMusicPlayer />

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <TrackUploadForm
            onSuccess={(track) => {
              setShowUpload(false);
              alert('Track uploaded successfully!');
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-purple-600 dark:text-purple-400">{icon}</div>
        <span className="text-xs font-medium text-purple-900 dark:text-purple-200">{label}</span>
      </div>
      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{value}</p>
    </div>
  );
}