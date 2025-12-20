// src/app/admin/verifications/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export default function VerificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) fetchVerifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const checkAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    fetchVerifications();
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('musician_verifications')
        .select(`
          *,
          musician:musician_id(first_name, last_name, email, phone)
        `)
        .order('submitted_at', { ascending: false });

      if (filter === 'pending') {
        query = query.in('status', ['pending', 'under_review']);
      } else if (filter === 'approved') {
        query = query.eq('status', 'approved');
      } else if (filter === 'rejected') {
        query = query.eq('status', 'rejected');
      }

      const { data, error } = await query;

      if (!error && data) {
        setVerifications(data);
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (verificationId, action, reason = '') => {
    if (!confirm(`Are you sure you want to ${action} this verification?`)) {
      return;
    }

    setProcessing(verificationId);

    try {
      const verification = verifications.find(v => v.id === verificationId);

      // Update verification status
      await supabase
        .from('musician_verifications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: action === 'reject' ? reason : null,
        })
        .eq('id', verificationId);

      // Update user verification status if approved
      if (action === 'approve') {
        await supabase
          .from('user_profiles')
          .update({ is_verified: true })
          .eq('id', verification.musician_id);
      }

      // Log admin action
      await supabase.from('admin_actions').insert({
        action_type: action === 'approve' ? 'verification_approve' : 'verification_reject',
        target_user_id: verification.musician_id,
        target_type: 'verification',
        target_id: verificationId,
        reason: reason,
      });

      // Send notification to musician
      await supabase.from('notifications').insert({
        user_id: verification.musician_id,
        type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
        title: action === 'approve' ? 'Verification Approved! ✅' : 'Verification Rejected ❌',
        message: action === 'approve' 
          ? 'Congratulations! Your profile has been verified. You can now receive bookings!'
          : `Your verification was rejected. Reason: ${reason}. Please resubmit with correct documents.`,
      });

      alert(action === 'approve' ? 'Verification approved!' : 'Verification rejected.');
      setSelectedVerification(null);
      fetchVerifications();
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">✅ Musician Verifications</h1>
          <p className="text-purple-100">Review and manage KYC verification submissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Pending"
            value={verifications.filter(v => ['pending', 'under_review'].includes(v.status)).length}
            icon="⏳"
            color="yellow"
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
          <StatCard
            label="Approved"
            value={verifications.filter(v => v.status === 'approved').length}
            icon="✅"
            color="green"
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
          />
          <StatCard
            label="Rejected"
            value={verifications.filter(v => v.status === 'rejected').length}
            icon="❌"
            color="red"
            active={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
          />
          <StatCard
            label="All Time"
            value={verifications.length}
            icon="📊"
            color="blue"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </div>

        {/* Verifications List */}
        {verifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No verifications found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'pending' ? 'All caught up! No pending verifications.' : `No ${filter} verifications.`}
            </p>
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
                    <a 
                      href={verification.id_front_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">ID Front</span>
                    </a>
                  )}
                  {verification.id_back_image_url && (
                    <a 
                      href={verification.id_back_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">ID Back</span>
                    </a>
                  )}
                  {verification.selfie_image_url && (
                    <a 
                      href={verification.selfie_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Selfie</span>
                    </a>
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
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason (required):');
                        if (reason && reason.trim()) {
                          handleAction(verification.id, 'reject', reason.trim());
                        } else if (reason !== null) {
                          alert('Rejection reason is required');
                        }
                      }}
                      disabled={processing === verification.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

  const labels = {
    pending: '⏳ Pending',
    under_review: '🔍 Under Review',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}