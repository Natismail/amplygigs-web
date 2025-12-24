// // // //app/client/bookings/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import ReleaseFundsButton from "@/components/ReleaseFundsButton";
import BookingCard from "@/components/BookingCard";

export default function ClientBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading, fetchBookings } = useData();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && (!bookings || bookings.length === 0)) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(true);
    setRefreshing(false);
  };

  const clientBookings = bookings.filter(
    (b) => b.client_id === user?.id
  );

  const upcomingBookings = clientBookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.event_date) >= new Date()
  );

  const pendingBookings = clientBookings.filter(
    (b) => b.status === "pending"
  );

  const pastBookings = clientBookings.filter(
    (b) =>
      b.status === "completed" ||
      (b.status === "confirmed" &&
        new Date(b.event_date) < new Date())
  );

  if (authLoading || (loading.bookings && bookings.length === 0)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-lg text-gray-600">
          Please log in to view your bookings.
        </p>
      </div>
    );
  }

  const renderBookings = (list, emptyState) => {
    if (list.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">{emptyState.icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {emptyState.title}
          </h3>
          <p className="text-sm text-gray-500">
            {emptyState.description}
          </p>
        </div>
      );
    }

    return list.map((booking) => (
      <BookingCard
        key={booking.id}
        booking={booking}
        onClick={() =>
          router.push(`/client/bookings/${booking.id}`)
        }
      >
        {/* Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 space-y-2">
          {(!booking.payment_status ||
            booking.payment_status === "pending") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/payment?bookingId=${booking.id}`);
              }}
              className="w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition"
            >
              💳 Pay Now
            </button>
          )}

          {booking.payment_status === "paid" &&
            !booking.funds_released_at && (
              <ReleaseFundsButton
                booking={{
                  ...booking,
                  musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`,
                  event_name: booking.events?.title,
                }}
                onSuccess={handleRefresh}
              />
            )}
        </div>
      </BookingCard>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">
            My Bookings
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              🔄
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 pb-2 overflow-x-auto">
          {[
            ["upcoming", "Upcoming", upcomingBookings.length],
            ["pending", "Pending", pendingBookings.length],
            ["past", "Past", pastBookings.length],
          ].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`min-h-[44px] px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === "upcoming" &&
          renderBookings(upcomingBookings, {
            icon: "📅",
            title: "No Upcoming Bookings",
            description: "Book a musician to see them here",
          })}

        {activeTab === "pending" &&
          renderBookings(pendingBookings, {
            icon: "⏳",
            title: "No Pending Requests",
            description: "Pending bookings will appear here",
          })}

        {activeTab === "past" &&
          renderBookings(pastBookings, {
            icon: "📚",
            title: "No Past Bookings",
            description: "Completed bookings will appear here",
          })}
      </div>
    </div>
  );
}



