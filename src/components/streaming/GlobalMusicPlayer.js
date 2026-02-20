// src/components/streaming/GlobalMusicPlayer.js
"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, ExternalLink, X, Maximize2 
} from 'lucide-react';
import Image from 'next/image';

export default function GlobalMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef(null);

  // Listen for play track events
  useEffect(() => {
    const handlePlayTrack = (event) => {
      const track = event.detail;
      setCurrentTrack(track);
      setCurrentIndex(0);
      setQueue([track]);
      setIsPlaying(true);
    };

    const handlePlayQueue = (event) => {
      const { tracks, startIndex } = event.detail;
      setQueue(tracks);
      setCurrentIndex(startIndex || 0);
      setCurrentTrack(tracks[startIndex || 0]);
      setIsPlaying(true);
    };

    window.addEventListener('play-track', handlePlayTrack);
    window.addEventListener('play-queue', handlePlayQueue);

    return () => {
      window.removeEventListener('play-track', handlePlayTrack);
      window.removeEventListener('play-queue', handlePlayQueue);
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    // Determine which URL to use
    let audioUrl = null;
    
    if (currentTrack.source === 'jamendo') {
      audioUrl = currentTrack.streaming_url; // Full-length stream
    } else if (currentTrack.source === 'spotify') {
      audioUrl = currentTrack.preview_url; // 30-second preview
    } else if (currentTrack.source === 'uploads') {
      audioUrl = currentTrack.file_url; // User uploaded track
    }

    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeat]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      nextIndex = 0; // Loop to start
    }
    
    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current track
      audioRef.current.currentTime = 0;
    } else if (queue.length > 0) {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
      setCurrentIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLike = async () => {
    // TODO: Implement like functionality with Supabase
    setIsLiked(!isLiked);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const closePlayer = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden Audio Element */}
      <audio ref={audioRef} />

      {/* Player UI */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-t border-gray-800 shadow-2xl transition-all ${
        isMinimized ? 'h-16' : 'h-24 md:h-28'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-4 h-full">
          {!isMinimized ? (
            // Full Player
            <div className="flex items-center gap-4 h-full">
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                  {currentTrack.cover_image_url ? (
                    <Image
                      src={currentTrack.cover_image_url}
                      alt={currentTrack.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold truncate text-sm md:text-base">
                    {currentTrack.title}
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm truncate">
                    {currentTrack.artist_name}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 text-white text-xs rounded">
                    {currentTrack.source === 'spotify' && '🟢 Spotify'}
                    {currentTrack.source === 'jamendo' && '🎼 Jamendo'}
                    {currentTrack.source === 'uploads' && '🎵 AmplyGigs'}
                  </span>
                </div>

                <button
                  onClick={toggleLike}
                  className="hidden md:block p-2 hover:bg-white/10 rounded-full transition"
                >
                  <Heart 
                    className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
                {/* Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`hidden md:block p-2 rounded-full transition ${
                      isShuffle ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrevious}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                  >
                    <SkipBack className="w-5 h-5" fill="currentColor" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="p-3 md:p-4 bg-white hover:bg-gray-200 text-gray-900 rounded-full transition shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" fill="currentColor" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                  >
                    <SkipForward className="w-5 h-5" fill="currentColor" />
                  </button>

                  <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={`hidden md:block p-2 rounded-full transition ${
                      isRepeat ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-gray-400 min-w-[40px]">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px] text-right">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Volume & Actions */}
              <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition">
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {currentTrack.is_external && (
                  <a
                    href={currentTrack.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                    title="Open in source"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>

                <button
                  onClick={closePlayer}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            // Minimized Player
            <div className="flex items-center gap-4 h-full px-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={handlePlayPause}
                  className="p-2 bg-white hover:bg-gray-200 text-gray-900 rounded-full transition"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" fill="currentColor" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {currentTrack.title} - {currentTrack.artist_name}
                  </p>
                </div>

                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={closePlayer}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden under player */}
      <div className={isMinimized ? 'h-16' : 'h-24 md:h-28'} />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
}

