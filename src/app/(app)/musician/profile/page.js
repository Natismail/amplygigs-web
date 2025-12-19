'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useRouter } from 'next/navigation';

export default function MusicianProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

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
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        primary_role: user.primary_role || '',
        genres: user.genres || [],
        experience_years: user.experience_years || '',
        hourly_rate: user.hourly_rate || '',
        availability: user.availability || 'available',
        gadget_specs: user.gadget_specs || '',
        youtube: user.youtube || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        tiktok: user.tiktok || '',
      });
    }
  }, [user]);

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
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
      const { error } = await supabase
        .from('user_profiles')
        .update(formData)
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
    { id: 'basic', label: '👤 Basic Info', icon: '👤' },
    { id: 'music', label: '🎵 Music Details', icon: '🎵' },
    { id: 'equipment', label: '🎸 Equipment', icon: '🎸' },
    { id: 'social', label: '📱 Social Media', icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Musician Profile
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Success / Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
            <span className="text-2xl">✅</span>
            <p className="text-green-800 dark:text-green-200 font-medium">
              Profile updated successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Profile Picture */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Profile Picture
          </h3>
          <ProfilePictureUpload />
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Lagos, Nigeria"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  rows={4}
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>
            </div>
          )}

          {/* MUSIC DETAILS */}
          {activeTab === 'music' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Musician Details
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Primary Role
                </label>
                <select
                  name="primary_role"
                  value={formData.primary_role}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                >
                  <option value="">Select your role</option>
                  {musicRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Genres (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        formData.genres.includes(genre)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Years of Experience
                  </label>
                  <input
                    name="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Hourly Rate (₦)
                  </label>
                  <input
                    name="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    placeholder="e.g., 15000"
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Availability Status
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                >
                  <option value="available">✅ Available</option>
                  <option value="busy">⏰ Busy</option>
                  <option value="unavailable">❌ Not Available</option>
                </select>
              </div>
            </div>
          )}

          {/* EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Equipment & Gear
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Your Equipment
                </label>
                <textarea
                  name="gadget_specs"
                  value={formData.gadget_specs}
                  onChange={handleChange}
                  placeholder="List your instruments, sound systems, DJ equipment, etc.&#10;Example:&#10;- Yamaha DGX-660 Keyboard&#10;- Shure SM58 Microphone&#10;- Pioneer DDJ-400 Controller"
                  rows={6}
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Tip: List all equipment you own or have access to. This helps clients understand what you can provide.
                </p>
              </div>
            </div>
          )}

          {/* SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Online Presence
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🎥 YouTube
                </label>
                <input
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannnel"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  📸 Instagram
                </label>
                <input
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/username"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🐦 Twitter / X
                </label>
                <input
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🎵 TikTok
                </label>
                <input
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@username"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
                  📱 Why add social links?
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Showcase your performances and skills</li>
                  <li>• Build trust with potential clients</li>
                  <li>• Increase your booking chances</li>
                  <li>• Grow your fanbase</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Save Button (Mobile Sticky) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* iOS Safe Area */}
      <div className="h-safe-bottom"></div>
    </div>
  );
}