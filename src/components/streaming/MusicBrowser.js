// src/components/streaming/MusicBrowser.js
"use client";

import { useState } from 'react';
import { Search, Play, ExternalLink, Music } from 'lucide-react';
import Image from 'next/image';

export default function MusicBrowser() {
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const searchMusic = async () => {
    if (!query.trim() && source === 'all') {
      // Load trending/popular if no query
      setQuery('top hits');
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/music/search?q=${encodeURIComponent(query)}&source=${source}&limit=30`
      );
      const data = await response.json();
      
      setTracks(data.tracks || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to search music. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchMusic();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for songs, artists, albums..."
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={searchMusic}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Source Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { value: 'all', label: 'All Sources', icon: '🌐' },
          { value: 'uploads', label: 'AmplyGigs Artists', icon: '🎵' },
          { value: 'spotify', label: 'Spotify', icon: '🟢' },
          { value: 'jamendo', label: 'Jamendo (Free)', icon: '🎼' }
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setSource(s.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              source === s.value
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      {total > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found {total} track{total === 1 ? '' : 's'}
        </p>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Searching music...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <Music className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tracks found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Try a different search term or browse by source
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tracks.map((track, index) => (
            <TrackCard 
              key={`${track.source}-${track.id}-${index}`} 
              track={track} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackCard({ track }) {
  const playTrack = () => {
    // Dispatch to global music player
    window.dispatchEvent(new CustomEvent('play-track', { detail: track }));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getSourceBadge = () => {
    const badges = {
      spotify: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-700 dark:text-green-300', 
        label: 'Spotify (30s)' 
      },
      jamendo: { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-700 dark:text-blue-300', 
        label: 'Jamendo (Full)' 
      },
      uploads: { 
        bg: 'bg-purple-100 dark:bg-purple-900/30', 
        text: 'text-purple-700 dark:text-purple-300', 
        label: 'AmplyGigs' 
      }
    };
    return badges[track.source] || badges.uploads;
  };

  const badge = getSourceBadge();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition group">
      {/* Album Art */}
      <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
        {track.cover_image_url ? (
          <Image
            src={track.cover_image_url}
            alt={track.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <button
          onClick={playTrack}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </button>
      </div>

      {/* Track Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
          {track.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
          {track.artist_name}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>{formatDuration(track.duration)}</span>
          <span className={`px-2 py-1 rounded ${badge.bg} ${badge.text} font-medium`}>
            {badge.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={playTrack}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Play className="w-4 h-4" />
            Play
          </button>
          
          {track.is_external && track.external_url && (
            <a
              href={track.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
              title="Open in source"
            >
              <ExternalLink className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}