// src/app/(app)/musician/profile/page.js - WITH VIDEO UPLOAD TAB
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useRouter } from 'next/navigation';
import ProfileSyncButton from '@/components/ProfileSyncButton';
import { 
  ArrowLeft, 
  User, 
  Music, 
  Guitar, 
  Share2, 
  CheckCircle, 
  AlertCircle,
  Loader,
  Video,
  Upload as UploadIcon,
  X,
  Play,
  Trash2
} from 'lucide-react';

export default function MusicianProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // ⭐ NEW: Video upload states
  const [videos, setVideos] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const musicRoles = [
    "Singer", "Guitarist", "Drummer", "DJ", "Keyboardist", 
    "Bassist", "Saxophonist", "Trumpeter", "Violinist", "MC/Host"
  ];

  const genres = [
    "Afrobeats", "Hip Hop", "R&B", "Jazz", "Gospel", 
    "Highlife", "Reggae", "Pop", "Rock", "Classical", "Electronic"
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '', // ⭐ NEW: Stage name
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        primary_role: user.primary_role || '',
        genres: user.genres || [],
        experience_years: user.experience_years || '',
        hourly_rate: user.hourly_rate || '',
        availability: user.available ? 'available' : 'unavailable',
        gadget_specs: user.gadget_specs || '',
        youtube: user.youtube || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        tiktok: user.tiktok || '',
      });
      
      // ⭐ Fetch videos
      fetchVideos();
    }
  }, [user]);

  // ⭐ NEW: Fetch musician's videos
  const fetchVideos = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('musician_videos')
        .select('*')
        .eq('musician_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  // ⭐ NEW: Upload video
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('video/')) {
      setVideoError('Please select a video file');
      return;
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setVideoError('Video must be less than 100MB');
      return;
    }

    setUploadingVideo(true);
    setVideoError(null);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('musician-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('musician-videos')
        .getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase
        .from('musician_videos')
        .insert({
          musician_id: user.id,
          video_url: publicUrl,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
        });

      if (dbError) throw dbError;

      // Refresh videos
      await fetchVideos();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Video upload error:', err);
      setVideoError(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  // ⭐ NEW: Delete video
  const handleDeleteVideo = async (videoId, videoUrl) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // user_id/filename.ext

      // Delete from storage
      await supabase.storage
        .from('musician-videos')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('musician_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Refresh videos
      await fetchVideos();
    } catch (err) {
      console.error('Delete error:', err);
      setVideoError('Failed to delete video');
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name, // ⭐ Save stage name
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        primary_role: formData.primary_role,
        genres: formData.genres,
        experience_years: formData.experience_years ? parseInt(formData.experience_years, 10) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        available: formData.availability === 'available',
        gadget_specs: formData.gadget_specs,
        youtube: formData.youtube,
        instagram: formData.instagram,
        twitter: formData.twitter,
        tiktok: formData.tiktok,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: User, emoji: '👤' },
    { id: 'music', label: 'Music', icon: Music, emoji: '🎵' },
    { id: 'videos', label: 'Videos', icon: Video, emoji: '🎬' }, // ⭐ NEW TAB
    { id: 'equipment', label: 'Equipment', icon: Guitar, emoji: '🎸' },
    { id: 'social', label: 'Social', icon: Share2, emoji: '📱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </h1>

          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="sm:hidden flex items-center justify-center w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 transition"
            aria-label="Save changes"
          >
            {saving ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

{/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
  <h3 className="font-semibold mb-2">Sync Profile from Google</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
    If you signed up with Google and your name/picture isn't showing,
    click here to sync your profile.
  </p>
  <ProfileSyncButton />
</div> */}

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-700 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              Profile updated successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Profile Picture
          </h3>
          <ProfilePictureUpload 
            currentUrl={user.profile_picture_url}
            onUploadSuccess={(url) => {
              // Optionally update local state
            }}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.emoji}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          {/* BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              {/* ⭐ NEW: Stage Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Stage Name / Display Name
                </label>
                <input
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="e.g., DJ KoolBreeze, MC Smooth"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be displayed on your public profile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Lagos, Nigeria"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell clients about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* MUSIC DETAILS */}
          {activeTab === 'music' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Musician Details
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Primary Role *
                </label>
                <select
                  name="primary_role"
                  value={formData.primary_role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                >
                  <option value="">Select your role</option>
                  {musicRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Genres (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                        formData.genres.includes(genre)
                          ? 'bg-purple-600 text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {formData.genres.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formData.genres.length} genre{formData.genres.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Experience (years)
                  </label>
                  <input
                    name="experience_years"
                    type="number"
                    inputMode="numeric"
                    value={formData.experience_years}
                    onChange={handleChange}
                    placeholder="5"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Hourly Rate (₦)
                  </label>
                  <input
                    name="hourly_rate"
                    type="number"
                    inputMode="numeric"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    placeholder="15000"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Availability Status
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                >
                  <option value="available">✅ Available for Bookings</option>
                  <option value="unavailable">❌ Not Available</option>
                </select>
              </div>
            </div>
          )}

          {/* ⭐ NEW: VIDEOS TAB */}
          {activeTab === 'videos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Your Performance Videos
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {videos.length} video{videos.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className={`cursor-pointer ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    {uploadingVideo ? (
                      <Loader className="w-12 h-12 text-purple-600 animate-spin mb-3" />
                    ) : (
                      <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                    )}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {uploadingVideo ? 'Uploading video...' : 'Click to upload a video'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      MP4, MOV, AVI (max 100MB)
                    </p>
                  </div>
                </label>
              </div>

              {videoError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{videoError}</p>
                </div>
              )}

              {/* Videos Grid */}
              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No videos uploaded yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Upload videos to showcase your talent
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <div className="relative aspect-video bg-black group">
                        <video
                          src={video.video_url}
                          className="w-full h-full object-contain"
                          controls
                        />
                        <button
                          onClick={() => handleDeleteVideo(video.id, video.video_url)}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        {video.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
                  📹 Video Tips
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Upload high-quality performance videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Show different styles and genres you perform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Good lighting and clear audio increase bookings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>Videos help clients see your talent before booking</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Equipment & Gear
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Your Equipment
                </label>
                <textarea
                  name="gadget_specs"
                  value={formData.gadget_specs}
                  onChange={handleChange}
                  placeholder="List your instruments and equipment&#10;&#10;Example:&#10;• Yamaha DGX-660 Keyboard&#10;• Shure SM58 Microphone&#10;• Pioneer DDJ-400 Controller"
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                />
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> List all equipment you own or have access to. This helps clients understand what you can provide.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Online Presence
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  🎥 YouTube Channel
                </label>
                <input
                  name="youtube"
                  type="url"
                  value={formData.youtube}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  📸 Instagram
                </label>
                <input
                  name="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  🐦 Twitter / X
                </label>
                <input
                  name="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  🎵 TikTok
                </label>
                <input
                  name="tiktok"
                  type="url"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@username"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 text-sm">
                  📱 Why add social links?
                </h4>
                <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">✓</span>
                    <span>Showcase your performances and skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">✓</span>
                    <span>Build trust with potential clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">✓</span>
                    <span>Increase your booking chances by 3x</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">✓</span>
                    <span>Grow your fanbase organically</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-20 safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}