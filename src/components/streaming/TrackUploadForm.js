// src/components/streaming/TrackUploadForm.js
"use client";

import { useState, useEffect } from 'react';
import { Upload, Music, Image as ImageIcon, X, Check, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TrackUploadForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist_name: '',
    description: '',
    lyrics: '',
    genre: [],
    is_explicit: false,
    release_date: new Date().toISOString().split('T')[0]
  });
  
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    checkCredits();
  }, []);

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/music/upload/check-credits');
      const data = await response.json();
      setCredits(data);
    } catch (error) {
      console.error('Failed to check credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Audio file must be less than 50MB');
        return;
      }
      
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover image must be less than 5MB');
        return;
      }
      
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    if (!credits?.can_upload) {
      setShowPurchase(true);
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('audio', audioFile);
      if (coverImage) data.append('cover', coverImage);
      data.append('title', formData.title);
      data.append('artist_name', formData.artist_name);
      data.append('description', formData.description);
      data.append('lyrics', formData.lyrics);
      data.append('genre', JSON.stringify(formData.genre));
      data.append('is_explicit', formData.is_explicit);
      data.append('release_date', formData.release_date);

      const response = await fetch('/api/music/upload/track', {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needs_purchase) {
          setShowPurchase(true);
          return;
        }
        throw new Error(result.error || 'Upload failed');
      }

      alert(`✅ Track uploaded successfully! ${result.remaining_credits} credits remaining.`);
      
      if (onSuccess) {
        onSuccess(result.track);
      }
      
      // Reset form
      setFormData({
        title: '',
        artist_name: '',
        description: '',
        lyrics: '',
        genre: [],
        is_explicit: false,
        release_date: new Date().toISOString().split('T')[0]
      });
      setAudioFile(null);
      setCoverImage(null);
      setAudioPreview(null);
      setCoverPreview(null);
      
      // Refresh credits
      checkCredits();

    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload track');
    } finally {
      setUploading(false);
    }
  };

  if (loadingCredits) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (showPurchase) {
    return <PurchaseCreditsModal onClose={() => setShowPurchase(false)} onSuccess={checkCredits} />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Upload Track</h2>
            <p className="text-purple-100 text-sm">
              {credits?.can_upload ? (
                <>
                  {credits.remaining_credits} upload{credits.remaining_credits === 1 ? '' : 's'} remaining
                  {credits.is_free_tier && ' (Free tier)'}
                </>
              ) : (
                'No uploads remaining - Purchase more credits'
              )}
            </p>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Credits Warning */}
      {!credits?.can_upload && (
        <div className="mx-6 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                No Upload Credits Remaining
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                You've used all your free uploads. Purchase more credits to continue uploading.
              </p>
              <button
                onClick={() => setShowPurchase(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
              >
                Purchase Credits
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Audio File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-400 transition">
            {audioFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{audioFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    setAudioPreview(null);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Click to upload audio
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  MP3, WAV, M4A (Max 50MB)
                </p>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4"
                  onChange={handleAudioChange}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cover Image
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 hover:border-purple-500 dark:hover:border-purple-400 transition">
            {coverImage ? (
              <div className="flex items-center gap-4">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{coverImage.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(coverImage.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverPreview(null);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block text-center">
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Upload cover image
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG (Max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Track Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Track Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="My Awesome Track"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Artist Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.artist_name}
              onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Artist Name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Tell listeners about this track..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre
            </label>
            <select
              multiple
              value={formData.genre}
              onChange={(e) => setFormData({ 
                ...formData, 
                genre: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="Afrobeats">Afrobeats</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="R&B">R&B</option>
              <option value="Gospel">Gospel</option>
              <option value="Jazz">Jazz</option>
              <option value="Pop">Pop</option>
              <option value="Reggae">Reggae</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Release Date
            </label>
            <input
              type="date"
              value={formData.release_date}
              onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="explicit"
            checked={formData.is_explicit}
            onChange={(e) => setFormData({ ...formData, is_explicit: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
          />
          <label htmlFor="explicit" className="text-sm text-gray-700 dark:text-gray-300">
            Explicit Content (Parental Advisory)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={uploading || !credits?.can_upload}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Track
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Purchase Credits Modal Component
function PurchaseCreditsModal({ onClose, onSuccess }) {
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('standard');

  const packages = {
    standard: {
      name: 'Standard Pack',
      tracks: 10,
      price_ngn: 500,
      price_usd: 5,
      popular: false
    },
    pro: {
      name: 'Pro Pack',
      tracks: 50,
      price_ngn: 2000,
      price_usd: 15,
      popular: true
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    
    try {
      const response = await fetch('/api/music/upload/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_type: selectedPackage })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error('Purchase failed');
      }

      // Redirect to payment
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        // Stripe flow would use clientSecret
        alert('Stripe payment flow - implement Elements checkout');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to initiate purchase');
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase Upload Credits
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(packages).map(([key, pkg]) => (
            <button
              key={key}
              onClick={() => setSelectedPackage(key)}
              className={`relative p-6 rounded-xl border-2 transition ${
                selectedPackage === key
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  POPULAR
                </span>
              )}
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {pkg.name}
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {pkg.tracks}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Track Uploads
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                ₦{pkg.price_ngn} / ${pkg.price_usd}
              </p>
              
              {selectedPackage === key && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {purchasing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Purchase {packages[selectedPackage].name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}