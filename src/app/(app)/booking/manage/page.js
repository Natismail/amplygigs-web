// src/app/(app)/booking/manage/page.js - FULLY FUNCTIONAL FOR MUSICIANS
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  User, 
  Check, 
  X, 
  Clock,
  Filter,
  Search
} from "lucide-react";

export default function BookingManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
      return;
    }

    if (user?.role !== "MUSICIAN") {
      router.push("/");
      return;
    }

    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    filterBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, activeTab, searchQuery]);

  const fetchBookings = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        client:client_id(
          first_name,
          last_name,
          phone,
          email,
          profile_picture_url
        ),
        events:event_id(
          title,
          event_type,
          description,
          date,
          location
        )
      `)
      .eq("musician_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    
    setLoading(false);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by tab
    switch (activeTab) {
      case "pending":
        filtered = filtered.filter(b => b.status === "pending");
        break;
      case "confirmed":
        filtered = filtered.filter(b => b.status === "confirmed");
        break;
      case "completed":
        filtered = filtered.filter(b => b.status === "completed");
        break;
      case "cancelled":
        filtered = filtered.filter(b => b.status === "cancelled" || b.status === "rejected");
        break;
      default:
        break;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.events?.title?.toLowerCase().includes(query) ||
        b.client?.first_name?.toLowerCase().includes(query) ||
        b.client?.last_name?.toLowerCase().includes(query) ||
        b.event_location?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleAccept = async (bookingId) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: 'accepting' }));

    const { error } = await supabase
      .from("bookings")
      .update({ 
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (!error) {
      await fetchBookings();
      alert("✅ Booking accepted! The client has been notified.");
    } else {
      alert("❌ Failed to accept booking");
    }

    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const handleReject = async (bookingId) => {
    if (!confirm("Are you sure you want to reject this booking?")) return;

    setActionLoading(prev => ({ ...prev, [bookingId]: 'rejecting' }));

    const { error } = await supabase
      .from("bookings")
      .update({ 
        status: "rejected",
        rejected_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (!error) {
      await fetchBookings();
      alert("Booking rejected");
    } else {
      alert("❌ Failed to reject booking");
    }

    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const handleComplete = async (bookingId) => {
    if (!confirm("Mark this booking as completed?")) return;

    setActionLoading(prev => ({ ...prev, [bookingId]: 'completing' }));

    const { error } = await supabase
      .from("bookings")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (!error) {
      await fetchBookings();
      alert("✅ Booking marked as completed!");
    } else {
      alert("❌ Failed to update booking");
    }

    setActionLoading(prev => ({ ...prev, [bookingId]: null }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const tabCounts = {
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Bookings
            </h1>
            <button
              onClick={fetchBookings}
              className="min-h-[44px] px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              ["pending", "Pending", tabCounts.pending],
              ["confirmed", "Confirmed", tabCounts.confirmed],
              ["completed", "Completed", tabCounts.completed],
              ["cancelled", "Cancelled", tabCounts.cancelled],
            ].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`min-h-[44px] px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  activeTab === key
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? `No bookings match "${searchQuery}"`
                : `You don't have any ${activeTab} bookings yet`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {booking.events?.title || "Event Booking"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.events?.event_type}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {booking.client?.first_name} {booking.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.client?.phone || booking.client?.email}
                      </p>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(booking.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {booking.event_location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ₦{booking.amount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {booking.events?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      {booking.events.description}
                    </p>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Special Requests:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(booking.id)}
                          disabled={actionLoading[booking.id] === 'accepting'}
                          className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {actionLoading[booking.id] === 'accepting' ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          disabled={actionLoading[booking.id] === 'rejecting'}
                          className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {actionLoading[booking.id] === 'rejecting' ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <X className="w-5 h-5" />
                              Reject
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {booking.status === "confirmed" && 
                     new Date(booking.event_date) < new Date() && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        disabled={actionLoading[booking.id] === 'completing'}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {actionLoading[booking.id] === 'completing' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Mark as Completed
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => router.push(`/musician/bookings/${booking.id}`)}
                      className="flex-1 min-h-[44px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}