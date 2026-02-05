// src/app/(app)/admin/bookings/page.js - COMPLETE FIX WITH DETAILS
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, MapPin, User, Music, RefreshCw, Eye, X, Users, Mail, Phone, Clock } from 'lucide-react';

export default function BookingsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

    fetchBookings();
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching ALL bookings...');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(first_name, last_name, email, phone, profile_picture_url, location, city, country),
          musician:musician_id(first_name, last_name, email, phone, profile_picture_url, location, city, country)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        throw error;
      }

      console.log('✅ Loaded bookings:', data?.length || 0);
      
      // Debug: Log all unique statuses
      const statuses = [...new Set(data?.map(b => b.status))];
      console.log('📊 Unique statuses found:', statuses);
      
      setAllBookings(data || []);
      
    } catch (err) {
      console.error('❌ Fetch error:', err);
      alert('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewBookingDetails = async (booking) => {
    setViewingBooking(booking);
    setDetailsLoading(true);

    try {
      // Fetch proposals for this booking
      const { data: proposals, error: proposalsError } = await supabase
        .from('proposals')
        .select(`
          *,
          musician:musician_id(
            first_name,
            last_name,
            email,
            phone,
            profile_picture_url,
            location,
            city,
            bio,
            instruments
          )
        `)
        .eq('event_id', booking.event_id)
        .order('created_at', { ascending: false });

      if (proposalsError) {
        console.error('Error fetching proposals:', proposalsError);
      }

      // Get the event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', booking.event_id)
        .single();

      if (eventError) {
        console.error('Error fetching event:', eventError);
      }

      setViewingBooking({
        ...booking,
        proposals: proposals || [],
        event: event || null
      });

    } catch (err) {
      console.error('Error loading booking details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setProcessing(bookingId);

    try {
      const booking = allBookings.find(b => b.id === bookingId);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'CANCELLED',
          admin_cancelled: true,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Log action (optional)
      try {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: 'booking_cancel',
          target_user_id: booking.client_id,
          target_type: 'booking',
          target_id: bookingId,
        });
      } catch (logError) {
        console.log('Admin action logging skipped');
      }

      // Notify both parties (optional)
      try {
        await supabase.from('notifications').insert([
          {
            user_id: booking.client_id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled by Admin',
            message: `Your booking for ${booking.event_type || 'event'} has been cancelled by admin.`,
            is_read: false
          },
          {
            user_id: booking.musician_id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled by Admin',
            message: `A booking has been cancelled by admin.`,
            is_read: false
          },
        ]);
      } catch (notifError) {
        console.log('Notification sending skipped');
      }

      alert('Booking cancelled successfully!');
      await fetchBookings();
      
    } catch (error) {
      console.error('❌ Action failed:', error);
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Normalize status values and count properly
  const normalizeStatus = (status) => {
    if (!status) return 'UNKNOWN';
    return status.toUpperCase().trim();
  };

  // Calculate stats with normalized statuses
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter(b => {
      const status = normalizeStatus(b.status);
      return status === 'PENDING' || status === 'AWAITING';
    }).length,
    confirmed: allBookings.filter(b => {
      const status = normalizeStatus(b.status);
      return status === 'CONFIRMED' || status === 'ACCEPTED';
    }).length,
    completed: allBookings.filter(b => {
      const status = normalizeStatus(b.status);
      return status === 'COMPLETED' || status === 'FINISHED';
    }).length,
    cancelled: allBookings.filter(b => {
      const status = normalizeStatus(b.status);
      return status === 'CANCELLED' || status === 'REJECTED';
    }).length,
  };

  // Log for debugging
  console.log('📊 Stats:', stats);

  // Filter bookings for display
  const bookings = allBookings.filter(b => {
    if (statusFilter === 'ALL') return true;
    const status = normalizeStatus(b.status);
    
    if (statusFilter === 'PENDING') {
      return status === 'PENDING' || status === 'AWAITING';
    }
    if (statusFilter === 'CONFIRMED') {
      return status === 'CONFIRMED' || status === 'ACCEPTED';
    }
    if (statusFilter === 'COMPLETED') {
      return status === 'COMPLETED' || status === 'FINISHED';
    }
    if (statusFilter === 'CANCELLED') {
      return status === 'CANCELLED' || status === 'REJECTED';
    }
    
    return status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">📅 Bookings Management</h1>
              <p className="text-purple-100">Monitor and manage all platform bookings</p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon="📊"
            color="blue"
            active={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="⏳"
            color="yellow"
            active={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter('PENDING')}
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            icon="✅"
            color="green"
            active={statusFilter === 'CONFIRMED'}
            onClick={() => setStatusFilter('CONFIRMED')}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon="🎉"
            color="purple"
            active={statusFilter === 'COMPLETED'}
            onClick={() => setStatusFilter('COMPLETED')}
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon="❌"
            color="red"
            active={statusFilter === 'CANCELLED'}
            onClick={() => setStatusFilter('CANCELLED')}
          />
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No bookings found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter === 'ALL' ? 'No bookings yet' : `No ${statusFilter.toLowerCase()} bookings`}
            </p>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div 
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {booking.event_type || 'Booking'}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Client Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">Client:</span>
                          <span>{booking.client?.first_name} {booking.client?.last_name}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 ml-6">
                          📧 {booking.client?.email}
                        </div>
                        {booking.client?.phone && (
                          <div className="text-gray-600 dark:text-gray-400 ml-6">
                            📱 {booking.client?.phone}
                          </div>
                        )}
                      </div>

                      {/* Musician Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Music className="w-4 h-4" />
                          <span className="font-semibold">Musician:</span>
                          <span>{booking.musician?.first_name} {booking.musician?.last_name}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 ml-6">
                          📧 {booking.musician?.email}
                        </div>
                        {booking.musician?.phone && (
                          <div className="text-gray-600 dark:text-gray-400 ml-6">
                            📱 {booking.musician?.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Event Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₦{booking.total_amount?.toLocaleString() || booking.total_price?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {booking.event_location || booking.venue || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* View Details Button */}
                  <button
                    onClick={() => viewBookingDetails(booking)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </button>

                  {/* Cancel Button */}
                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={processing === booking.id}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      {processing === booking.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Booking'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {viewingBooking && (
        <BookingDetailsModal
          booking={viewingBooking}
          loading={detailsLoading}
          onClose={() => setViewingBooking(null)}
        />
      )}
    </div>
  );
}

// Booking Details Modal Component
function BookingDetailsModal({ booking, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Booking Details</h2>
                <p className="text-purple-100">{booking.event_type || 'Event Booking'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading details...</p>
              </div>
            ) : (
              <>
                {/* Client & Musician Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Card */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-200">
                      <User className="w-5 h-5" />
                      Client Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {booking.client?.first_name} {booking.client?.last_name}</p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {booking.client?.email}
                      </p>
                      {booking.client?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {booking.client?.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Musician Card */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-purple-900 dark:text-purple-200">
                      <Music className="w-5 h-5" />
                      Musician Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {booking.musician?.first_name} {booking.musician?.last_name}</p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {booking.musician?.email}
                      </p>
                      {booking.musician?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {booking.musician?.phone}
                        </p>
                      )}
                      {booking.musician?.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {booking.musician?.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-3">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Event Date</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Payment Amount</p>
                      <p className="font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        ₦{booking.total_amount?.toLocaleString() || booking.total_price?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Location</p>
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {booking.event_location || booking.venue || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Status</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Created</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(booking.created_at).toLocaleString()}
                      </p>
                    </div>
                    {booking.payment_status && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
                        <p className="font-semibold">{booking.payment_status}</p>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-4">
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                      <p className="text-sm bg-white dark:bg-gray-800 p-3 rounded-lg">{booking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Proposals/Interested Musicians */}
                {booking.proposals && booking.proposals.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-900 dark:text-green-200">
                      <Users className="w-5 h-5" />
                      Musicians Who Showed Interest ({booking.proposals.length})
                    </h3>
                    <div className="space-y-3">
                      {booking.proposals.map((proposal, idx) => (
                        <div key={proposal.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center font-bold text-purple-600">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-semibold">{proposal.musician?.first_name} {proposal.musician?.last_name}</p>
                                <p className="text-xs text-gray-500">{proposal.musician?.email}</p>
                              </div>
                            </div>
                            <StatusBadge status={proposal.status} />
                          </div>
                          {proposal.message && (
                            <div className="ml-13 mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{proposal.message}</p>
                            </div>
                          )}
                          <div className="ml-13 mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>💰 Proposed: ₦{proposal.proposed_amount?.toLocaleString() || '0'}</span>
                            <span>📅 {new Date(proposal.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Details */}
                {booking.event && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-700">
                    <h3 className="font-bold text-lg mb-3 text-yellow-900 dark:text-yellow-200">Original Event Post</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {booking.event?.title}</p>
                      {booking.event?.description && (
                        <p><strong>Description:</strong> {booking.event?.description}</p>
                      )}
                      {booking.event?.requirements && (
                        <p><strong>Requirements:</strong> {booking.event?.requirements}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 p-4 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, active, onClick }) {
  const colorClasses = {
    blue: active ? 'from-blue-500 to-blue-600' : 'from-blue-400 to-blue-500',
    yellow: active ? 'from-yellow-500 to-yellow-600' : 'from-yellow-400 to-yellow-500',
    green: active ? 'from-green-500 to-green-600' : 'from-green-400 to-green-500',
    purple: active ? 'from-purple-500 to-purple-600' : 'from-purple-400 to-purple-500',
    red: active ? 'from-red-500 to-red-600' : 'from-red-400 to-red-500',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition transform ${active ? 'scale-105 ring-4 ring-white dark:ring-gray-900' : 'hover:scale-105'}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </button>
  );
}

function StatusBadge({ status }) {
  if (!status) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">UNKNOWN</span>;
  
  const normalized = status.toUpperCase().trim();
  
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    AWAITING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    COMPLETED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    FINISHED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[normalized] || 'bg-gray-100 text-gray-800'}`}>
      {normalized}
    </span>
  );
}