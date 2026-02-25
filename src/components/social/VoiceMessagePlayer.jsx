"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

export default function VoiceMessagePlayer({ audioUrl, isOwn, isFromAmy }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const colorClasses = isOwn || isFromAmy
    ? {
        button: 'bg-white/20 hover:bg-white/30',
        icon: 'text-white',
        progress: 'bg-white',
        progressBg: 'bg-white/20',
        text: 'text-white/90'
      }
    : {
        button: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50',
        icon: 'text-purple-600 dark:text-purple-400',
        progress: 'bg-purple-600 dark:bg-purple-400',
        progressBg: 'bg-gray-200 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300'
      };

  return (
    <div className={`
      px-4 py-3 rounded-2xl shadow-sm min-w-[240px] max-w-[280px]
      ${isFromAmy
        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
        : isOwn
        ? 'bg-purple-600'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }
    `}>
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Voice Message Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwn || isFromAmy ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'
        }`}>
          <Volume2 className={`w-4 h-4 ${colorClasses.icon}`} />
        </div>
        <span className={`text-xs font-medium ${colorClasses.text}`}>
          Voice Message
        </span>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all active:scale-95 flex-shrink-0
            ${colorClasses.button}
          `}
        >
          {isPlaying ? (
            <Pause className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" />
          ) : (
            <Play className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" />
          )}
        </button>

        {/* Progress Bar & Time */}
        <div className="flex-1 min-w-0">
          {/* Progress Bar */}
          <div 
            onClick={handleSeek}
            className={`h-1.5 rounded-full ${colorClasses.progressBg} cursor-pointer mb-1`}
          >
            <div 
              className={`h-full rounded-full ${colorClasses.progress} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time Display */}
          <div className={`text-xs ${colorClasses.text} flex justify-between`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

