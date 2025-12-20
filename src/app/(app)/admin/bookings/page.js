// src/app/admin/bookings/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, MapPin, User, Music } from 'lucide-react';

export default function BookingsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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

    fetchBookings();
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(first_name, last_name, email, phone),
          musician:musician_id(first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setProcessing(bookingId);

    try {
      const booking = bookings.find(b => b.id === bookingId);

      await supabase
        .from('bookings')
        .update({ 
          status: 'CANCELLED',
          admin_cancelled: true,
        })
        .eq('id', bookingId);

      // Log action
      await supabase.from('admin_actions').insert({
        action_type: 'booking_cancel',
        target_user_id: booking.client_id,
        target_type: 'booking',
        target_id: bookingId,
      });

      // Notify both parties
      await supabase.from('notifications').insert([
        {
          user_id: booking.client_id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled by Admin',
          message: `Your booking for ${booking.event_type} has been cancelled by admin.`,
        },
        {
          user_id: booking.musician_id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled by Admin',
          message: `A booking has been cancelled by admin.`,
        },
      ]);

      alert('Booking cancelled successfully');
      fetchBookings();
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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">📅 Bookings Management</h1>
          <p className="text-purple-100">Monitor and manage all platform bookings</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No bookings found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'ALL' ? 'No bookings yet' : `No ${statusFilter.toLowerCase()} bookings`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div 
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {booking.event_type}
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
                        {new Date(booking.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₦{booking.total_price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {booking.event_location || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p><strong>Created:</strong> {new Date(booking.created_at).toLocaleString()}</p>
                  {booking.payment_status && (
                    <p><strong>Payment Status:</strong> {booking.payment_status}</p>
                  )}
                  {booking.notes && (
                    <p className="mt-2"><strong>Notes:</strong> {booking.notes}</p>
                  )}
                </div>

                {/* Actions */}
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={processing === booking.id}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition"
                    >
                      Cancel Booking
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
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    COMPLETED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}