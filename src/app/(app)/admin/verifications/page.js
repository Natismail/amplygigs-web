// src/app/(app)/admin/verifications/page.js - FIXED VERSION
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [allVerifications, setAllVerifications] = useState([]); // Store ALL verifications
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [viewingImage, setViewingImage] = useState(null);
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support, role')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support && data?.role !== 'ADMIN')) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    fetchVerifications();
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching ALL verifications...');

      // ✅ FIX: Fetch ALL verifications at once (no filter)
      const { data, error } = await supabase
        .from('musician_verifications')
        .select(`
          *,
          musician:user_profiles!musician_id(
            first_name,
            last_name,
            email,
            phone,
            is_verified,
            verification_status
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching verifications:', error);
        throw error;
      }

      console.log('✅ Loaded all verifications:', data?.length || 0);
      setAllVerifications(data || []); // Store ALL verifications
      
    } catch (err) {
      console.error('❌ Fetch error:', err);
      alert('Failed to load verifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (verificationId, action, reason = '') => {
    if (action === 'reject' && !reason) {
      reason = prompt('Enter rejection reason (required):');
      if (!reason || !reason.trim()) {
        alert('Rejection reason is required');
        return;
      }
    }

    if (!confirm(`Are you sure you want to ${action} this verification?`)) {
      return;
    }

    setProcessing(verificationId);

    try {
      const verification = verifications.find(v => v.id === verificationId);

      // Update verification status
      const { error: verificationError } = await supabase
        .from('musician_verifications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: action === 'reject' ? reason.trim() : null,
        })
        .eq('id', verificationId);

      if (verificationError) throw verificationError;

      // Update user verification status if approved
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ 
            is_verified: true,
            verification_status: 'verified'
          })
          .eq('id', verification.musician_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      // Log action (optional - will fail silently if table doesn't exist)
      try {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: action === 'approve' ? 'verification_approve' : 'verification_reject',
          target_user_id: verification.musician_id,
          target_type: 'verification',
          target_id: verificationId,
          reason: action === 'reject' ? reason : null,
        });
      } catch (logError) {
        console.log('Admin action logging skipped:', logError);
      }

      // Send notification
      try {
        await supabase.from('notifications').insert({
          user_id: verification.musician_id,
          type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
          title: action === 'approve' ? '✅ Verification Approved!' : '❌ Verification Rejected',
          message: action === 'approve' 
            ? 'Congratulations! Your profile has been verified. You can now receive bookings!'
            : `Your verification was rejected. Reason: ${reason}. Please resubmit with correct documents.`,
          is_read: false
        });
      } catch (notifError) {
        console.log('Notification sending skipped:', notifError);
      }

      alert(`Verification ${action}d successfully!`);
      
      // ✅ FIX: Refresh ALL verifications, not just current filter
      await fetchVerifications();
      
    } catch (error) {
      console.error('❌ Action failed:', error);
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleViewImage = async (url, title) => {
    setImageError(null);
    
    // Check if URL exists
    if (!url) {
      setImageError('Image URL is missing');
      return;
    }

    // Check if it's a Supabase storage URL
    if (url.includes('supabase')) {
      try {
        // Extract bucket and path from URL
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length < 2) {
          setImageError('Invalid storage URL format');
          return;
        }

        const [bucketAndPath] = urlParts[1].split('?');
        const [bucket, ...pathParts] = bucketAndPath.split('/');
        const path = pathParts.join('/');

        console.log('📦 Checking bucket:', bucket, 'path:', path);

        // Try to get public URL directly
        const { data: publicUrlData } = supabase
          .storage
          .from(bucket)
          .getPublicUrl(path);

        if (publicUrlData?.publicUrl) {
          setViewingImage({ url: publicUrlData.publicUrl, title });
          return;
        }

        // If that fails, try to download
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .download(path);

        if (error) {
          console.error('Storage error:', error);
          setImageError(`Storage error: ${error.message}. Bucket "${bucket}" may not exist or is not public.`);
          return;
        }

        // Create blob URL
        const blobUrl = URL.createObjectURL(data);
        setViewingImage({ url: blobUrl, title });
        
      } catch (err) {
        console.error('Error accessing storage:', err);
        setImageError('Failed to load image: ' + err.message);
      }
    } else {
      // Direct URL - just open it
      setViewingImage({ url, title });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // ✅ Calculate stats from ALL verifications
  const stats = {
    pending: allVerifications.filter(v => ['pending', 'under_review'].includes(v.status)).length,
    approved: allVerifications.filter(v => v.status === 'approved').length,
    rejected: allVerifications.filter(v => v.status === 'rejected').length,
    all: allVerifications.length
  };

  // ✅ Filter verifications for display based on selected filter
  const verifications = allVerifications.filter(v => {
    if (filter === 'pending') return ['pending', 'under_review'].includes(v.status);
    if (filter === 'approved') return v.status === 'approved';
    if (filter === 'rejected') return v.status === 'rejected';
    return true; // 'all' filter
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">✅ Musician Verifications</h1>
              <p className="text-purple-100">Review and manage KYC verification submissions</p>
            </div>
            <button
              onClick={fetchVerifications}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="⏳"
            color="yellow"
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon="✅"
            color="green"
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon="❌"
            color="red"
            active={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
          />
          <StatCard
            label="All Time"
            value={stats.all}
            icon="📊"
            color="blue"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </div>

        {/* Storage Error Warning */}
        {imageError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Image Loading Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{imageError}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                💡 Fix: Ensure storage bucket exists and is public in Supabase Dashboard → Storage
              </p>
            </div>
            <button
              onClick={() => setImageError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Verifications List */}
        {verifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No verifications found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'pending' ? 'All caught up! No pending verifications.' : `No ${filter} verifications.`}
            </p>
            <button
              onClick={fetchVerifications}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map(verification => (
              <div 
                key={verification.id} 
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {verification.musician?.first_name} {verification.musician?.last_name}
                      </h3>
                      <StatusBadge status={verification.status} />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>📧 {verification.musician?.email}</p>
                      {verification.musician?.phone && <p>📱 {verification.musician?.phone}</p>}
                      <p>🆔 {verification.id_type}: {verification.id_number}</p>
                      <p>📅 Submitted: {new Date(verification.submitted_at).toLocaleString()}</p>
                      {verification.reviewed_at && (
                        <p>✓ Reviewed: {new Date(verification.reviewed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {verification.id_front_image_url && (
                    <button
                      onClick={() => handleViewImage(verification.id_front_image_url, 'ID Front')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View ID Front</span>
                    </button>
                  )}
                  {verification.id_back_image_url && (
                    <button
                      onClick={() => handleViewImage(verification.id_back_image_url, 'ID Back')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View ID Back</span>
                    </button>
                  )}
                  {verification.selfie_image_url && (
                    <button
                      onClick={() => handleViewImage(verification.selfie_image_url, 'Selfie')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View Selfie</span>
                    </button>
                  )}
                </div>

                {/* Rejection Reason */}
                {verification.status === 'rejected' && verification.rejection_reason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Rejection Reason:</strong> {verification.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {['pending', 'under_review'].includes(verification.status) && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleAction(verification.id, 'approve')}
                      disabled={processing === verification.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {processing === verification.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(verification.id, 'reject')}
                      disabled={processing === verification.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {processing === verification.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm z-10 transition"
            >
              <XCircle className="w-6 h-6 text-white" />
            </button>
            <img
              src={viewingImage.url}
              alt={viewingImage.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onError={() => {
                setImageError('Failed to load image. The file may not exist or the storage bucket is not configured correctly.');
                setViewingImage(null);
              }}
            />
            <div className="mt-4 text-center">
              <h3 className="text-white text-lg font-semibold mb-2">{viewingImage.title}</h3>
              <a
                href={viewingImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, active, onClick }) {
  const colorClasses = {
    yellow: active ? 'from-yellow-500 to-yellow-600' : 'from-yellow-400 to-yellow-500',
    green: active ? 'from-green-500 to-green-600' : 'from-green-400 to-green-500',
    red: active ? 'from-red-500 to-red-600' : 'from-red-400 to-red-500',
    blue: active ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform ${active ? 'scale-105 ring-4 ring-white dark:ring-gray-900' : 'hover:scale-105'}`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}