// src/app/admin/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, is_support, role')
      .eq('id', user.id)
      .single();

    if (error || (!data?.is_admin && !data?.is_support)) {
      alert('Access denied. Admin/Support privileges required.');
      router.push('/');
      return;
    }

    setIsAdmin(data.is_admin);
    fetchStats();
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (!error && data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', adminOnly: false },
    { id: 'verifications', label: '✅ Verifications', adminOnly: false },
    { id: 'users', label: '👥 Users', adminOnly: true },
    { id: 'bookings', label: '📅 Bookings', adminOnly: false },
    { id: 'flags', label: '🚩 Flagged Content', adminOnly: false },
    { id: 'tickets', label: '🎫 Support Tickets', adminOnly: false },
  ];

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
          <h1 className="text-3xl font-bold mb-2">
            {isAdmin ? '👑 Admin Dashboard' : '🛠️ Support Dashboard'}
          </h1>
          <p className="text-purple-100">
            {isAdmin ? 'Full system management and oversight' : 'Support ticket and verification management'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto space-x-1">
            {tabs.map(tab => {
              if (tab.adminOnly && !isAdmin) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'border-b-4 border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="🎵"
              label="Total Musicians"
              value={stats.total_musicians}
              color="purple"
            />
            <StatCard
              icon="👤"
              label="Total Clients"
              value={stats.total_clients}
              color="blue"
            />
            <StatCard
              icon="⏳"
              label="Pending Verifications"
              value={stats.pending_verifications}
              color="yellow"
            />
            <StatCard
              icon="📅"
              label="Pending Bookings"
              value={stats.pending_bookings}
              color="green"
            />
            <StatCard
              icon="💰"
              label="Total Revenue"
              value={`₦${stats.total_revenue?.toLocaleString() || 0}`}
              color="green"
            />
            <StatCard
              icon="✅"
              label="Paid Bookings"
              value={stats.paid_bookings}
              color="green"
            />
            <StatCard
              icon="🎫"
              label="Open Tickets"
              value={stats.open_tickets}
              color="orange"
            />
            <StatCard
              icon="🚩"
              label="Pending Flags"
              value={stats.pending_flags}
              color="red"
            />
          </div>
        )}

        {activeTab === 'verifications' && (
          <VerificationsPanel isAdmin={isAdmin} />
        )}

        {activeTab === 'users' && isAdmin && (
          <UsersPanel />
        )}

        {activeTab === 'bookings' && (
          <BookingsPanel isAdmin={isAdmin} />
        )}

        {activeTab === 'flags' && (
          <FlagsPanel isAdmin={isAdmin} />
        )}

        {activeTab === 'tickets' && (
          <TicketsPanel isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-2xl p-6 shadow-lg`}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}

// Verifications Panel
function VerificationsPanel({ isAdmin }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    const { data, error } = await supabase
      .from('musician_verifications')
      .select(`
        *,
        musician:musician_id(first_name, last_name, email, phone)
      `)
      .in('status', ['pending', 'under_review'])
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setVerifications(data);
    }
    setLoading(false);
  };

  const handleAction = async (verificationId, action, reason = '') => {
    setProcessing(verificationId);

    try {
      const { data: verification } = await supabase
        .from('musician_verifications')
        .select('musician_id')
        .eq('id', verificationId)
        .single();

      // Update verification status
      await supabase
        .from('musician_verifications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: action === 'reject' ? reason : null,
        })
        .eq('id', verificationId);

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          action_type: action === 'approve' ? 'verification_approve' : 'verification_reject',
          target_user_id: verification.musician_id,
          target_type: 'verification',
          target_id: verificationId,
          reason: reason,
        });

      // Send notification to musician
      await supabase
        .from('notifications')
        .insert({
          user_id: verification.musician_id,
          type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
          title: action === 'approve' ? 'Verification Approved!' : 'Verification Rejected',
          message: action === 'approve' 
            ? 'Your profile has been verified. You can now receive bookings!'
            : `Your verification was rejected. Reason: ${reason}`,
        });

      alert(action === 'approve' ? 'Verification approved!' : 'Verification rejected.');
      fetchVerifications();
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading verifications...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pending Verifications</h2>
      
      {verifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-600 dark:text-gray-400">No pending verifications</p>
        </div>
      ) : (
        verifications.map(verification => (
          <div key={verification.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {verification.musician?.first_name} {verification.musician?.last_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {verification.musician?.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {verification.musician?.phone}
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {verification.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold mb-2">ID Type</p>
                <p className="text-sm">{verification.id_type}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">ID Number</p>
                <p className="text-sm">{verification.id_number}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Submitted</p>
                <p className="text-sm">
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {verification.id_front_image_url && (
                <div>
                  <p className="text-sm font-semibold mb-2">ID Front</p>
                  <a 
                    href={verification.id_front_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Image →
                  </a>
                </div>
              )}
              {verification.id_back_image_url && (
                <div>
                  <p className="text-sm font-semibold mb-2">ID Back</p>
                  <a 
                    href={verification.id_back_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Image →
                  </a>
                </div>
              )}
              {verification.selfie_image_url && (
                <div>
                  <p className="text-sm font-semibold mb-2">Selfie</p>
                  <a 
                    href={verification.selfie_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Image →
                  </a>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleAction(verification.id, 'approve')}
                  disabled={processing === verification.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason:');
                    if (reason) handleAction(verification.id, 'reject', reason);
                  }}
                  disabled={processing === verification.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Users Panel (Admin only)
function UsersPanel() {
  return <div>Users management coming soon...</div>;
}

// Bookings Panel
function BookingsPanel() {
  return <div>Bookings management coming soon...</div>;
}

// Flags Panel
function FlagsPanel() {
  return <div>Flagged content coming soon...</div>;
}

// Tickets Panel
function TicketsPanel() {
  return <div>Support tickets coming soon...</div>;
}