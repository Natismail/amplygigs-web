// src/components/BookingCard.js - FULLY OPTIMIZED
"use client";

import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Music, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Shield,
  MessageCircle,
  XCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";


export default function BookingCard({
  booking,
  showActions = false,
  onCancel,
  onContact,
  onReview,
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState("");

  // Calculate countdown for upcoming events
  useEffect(() => {
    if (!booking.event_date) return;

    const calculateCountdown = () => {
      const now = new Date();
      const eventDate = new Date(booking.event_date);
      const diff = eventDate - now;

      if (diff < 0) {
        setCountdown("Event passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 7) {
        setCountdown(`${days} days away`);
      } else if (days > 0) {
        setCountdown(`${days}d ${hours}h away`);
      } else if (hours > 0) {
        setCountdown(`${hours} hours away`);
      } else {
        setCountdown("Starting soon!");
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [booking.event_date]);

  const handleNavigate = () => {
    router.push(`/client/bookings/${booking.id}`);
  };

  // Status badge logic
  const getStatusBadge = () => {
    const status = booking.status?.toLowerCase();

    const badges = {
      pending: {
        icon: Clock,
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
        text: "Pending"
      },
      confirmed: {
        icon: CheckCircle,
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
        text: "Confirmed"
      },
      completed: {
        icon: CheckCircle,
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
        text: "Completed"
      },
      cancelled: {
        icon: XCircle,
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
        text: "Cancelled"
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  // Payment status badge
  const getPaymentBadge = () => {
    if (!booking.payment_status || booking.payment_status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          Unpaid
        </span>
      );
    }
    if (booking.payment_status === "paid" && !booking.funds_released_at) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          In Escrow
        </span>
      );
    }
    if (booking.funds_released_at) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          Complete
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={handleNavigate}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden cursor-pointer transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {booking.events?.title || "Event"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge()}
              {getPaymentBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {/* Musician */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Musician</p>
            <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
              {booking.musician?.first_name} {booking.musician?.last_name}
            </p>
          </div>
        </div>


        {/* Location */}
        {booking.event_location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-gray-700 dark:text-gray-300 line-clamp-1">
                {booking.event_location}
              </p>
            </div>
          </div>
        )}

        {/* Date & Countdown */}
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
            <p className="text-gray-700 dark:text-gray-300">
              {new Date(booking.event_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {countdown && booking.status !== "completed" && booking.status !== "cancelled" && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                {countdown}
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Amount</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">
                        {formatCurrency(booking.amount || 0, booking.currency || 'NGN')}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      {showActions && (booking.status === "pending" || booking.status === "confirmed") && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex gap-2">
            {onContact && (
              <button
                onClick={onContact}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                Contact
              </button>
            )}
            
            {booking.status === "pending" && onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium text-sm transition"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}

            {booking.status === "completed" && onReview && (
              <button
                onClick={onReview}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg font-medium text-sm transition"
              >
                <CheckCircle className="w-4 h-4" />
                Leave Review
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}