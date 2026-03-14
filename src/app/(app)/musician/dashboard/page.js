// src/app/musician/dashboard/page.js
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useKYC } from "@/hooks/useKYC";
import ProfileCard from "@/components/dashboard/ProfileCard";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";
import { formatCurrency, getCurrencyByCode } from "@/components/CurrencySelector";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";

// ── Booking status badge colours ───────────────────────────────────────────────
function statusClass(status) {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    case "pending":   return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    default:          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MusicianDashboard() {
  const { user } = useAuth();

  // ✅ Single useData() call — no duplicate destructure
  const {
    profile,
    stats,
    bookings,
    fetchProfile,
    fetchBookings,
  } = useData();

  const {
    isVerified, isPending, isUnverified, isRejected,
    verification, loading: kycLoading,
  } = useKYC();

  const [publicEvents, setPublicEvents]           = useState([]);
  const [loadingPublicEvents, setLoadingPublicEvents] = useState(false);
  const [dismissedKYCBanner, setDismissedKYCBanner]   = useState(false);

  // ── Currency: follows musician's rate_currency ─────────────────────────────
  // profile.rate_currency is the source of truth (same as earnings page + wallet)
  const rawCurrency      = profile?.rate_currency || "NGN";
  const currencyMeta     = getCurrencyByCode(rawCurrency);
  const displayCurrency  = currencyMeta ? rawCurrency : "NGN";

  // ── Fetch profile + bookings on mount (only if missing) ───────────────────
  useEffect(() => {
    if (!user?.id) return;
    if (!profile)                        fetchProfile();
    if (!bookings || bookings.length === 0) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Fetch nearby public events once ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingPublicEvents(true);
      try {
        const data = await fetchPublicEvents({ lat: 6.5244, lng: 3.3792 });
        if (mounted) setPublicEvents(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch public events:", err);
      } finally {
        if (mounted) setLoadingPublicEvents(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchBookings()]);
  }, [fetchProfile, fetchBookings]);

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600" />
      </div>
    );
  }

  const recentGigs = bookings?.filter(b => b.musician_id === user?.id).slice(0, 3) ?? [];

  // Earnings figure from stats, formatted in musician's currency
  const earningsDisplay = formatCurrency(stats?.earnings ?? 0, displayCurrency);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">

        {/* ── Sticky header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-4 px-4">
                🎵 Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 px-8">
                Welcome back, {profile.first_name}!
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6 max-w-7xl mx-auto">

          {/* ── KYC banners ──────────────────────────────────────────────── */}
          {!kycLoading && (
            <>
              {/* Unverified */}
              {isUnverified && !dismissedKYCBanner && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 rounded-xl p-4 shadow-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Verify Your Profile
                        </h3>
                        <button
                          onClick={() => setDismissedKYCBanner(true)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                          aria-label="Dismiss banner"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        Complete KYC verification to receive bookings and build trust with clients. Takes only 5 minutes!
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/kyc/verify"
                          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md min-h-[44px]"
                        >
                          <span>Start Verification</span>
                          <span>→</span>
                        </Link>
                        <button
                          onClick={() => setDismissedKYCBanner(true)}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 min-h-[44px]"
                        >
                          Remind me later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending */}
              {isPending && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">⏳</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                        Verification In Progress
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        We&apos;re reviewing your documents. You&apos;ll be notified within 24–48 hours.
                      </p>
                      {verification?.submitted_at && (
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Submitted:{" "}
                          {new Date(verification.submitted_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verified */}
              {isVerified && (
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-xl p-4 shadow">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <div>
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                        Profile Verified!
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        You can now receive bookings from clients.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {isRejected && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">❌</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                        Verification Rejected
                      </h3>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                        {verification?.rejection_reason ||
                          "Please review your documents and resubmit with clear, legible photos."}
                      </p>
                      <Link
                        href="/kyc/verify"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition min-h-[44px]"
                      >
                        Resubmit Verification
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Profile + Analytics ───────────────────────────────────────── */}
          <div className="space-y-4">
            <ProfileCard profile={profile} />
            <AnalyticsCards stats={stats} />
          </div>

          {/* ── Quick Actions ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/musician/bookings"
              className="min-h-[100px] bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg active:scale-95 transition-transform"
            >
              <div className="text-3xl mb-2">📅</div>
              <div className="font-semibold">My Gigs</div>
              <div className="text-xs opacity-90 mt-1">
                {recentGigs.length} active
              </div>
            </Link>

            <Link
              href="/musician/earnings"
              className="min-h-[100px] bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg active:scale-95 transition-transform"
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold">Earnings</div>
              {/* ✅ Uses formatCurrency + musician's rate_currency */}
              <div className="text-xs opacity-90 mt-1">{earningsDisplay}</div>
            </Link>
          </div>

          {/* ── Recent Bookings ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Bookings</h2>
              <Link
                href="/musician/bookings"
                className="text-sm text-blue-600 font-medium min-h-[44px] flex items-center"
              >
                View All →
              </Link>
            </div>

            {recentGigs.length > 0 ? (
              <div className="space-y-3">
                {recentGigs.map(gig => {
                  // Each gig may have its own currency; fall back to musician's displayCurrency
                  const gigCurrency = gig.currency
                    ? (getCurrencyByCode(gig.currency) ? gig.currency : displayCurrency)
                    : displayCurrency;

                  return (
                    <Link
                      key={gig.id}
                      href={`/musician/bookings/${gig.id}`}
                      className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex-1 mr-2">
                          {gig.events?.title || "Gig"}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusClass(gig.status)}`}>
                          {gig.status}
                        </span>
                      </div>

                      {gig.event_location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          📍 {gig.event_location}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(gig.event_date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </span>
                        {/* ✅ Uses formatCurrency — respects gig.currency or musician rate_currency */}
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(gig.amount ?? 0, gigCurrency)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-2">🎸</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No recent bookings</p>
                {isVerified ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Your profile is verified. Clients can now book you!
                  </p>
                ) : (
                  <Link
                    href="/kyc/verify"
                    className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Complete verification to get bookings →
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* ── Nearby Public Events ──────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nearby Events</h2>
              <Link
                href="/musician/discover"
                className="text-sm text-blue-600 font-medium min-h-[44px] flex items-center"
              >
                Discover →
              </Link>
            </div>

            {loadingPublicEvents ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : publicEvents.length > 0 ? (
              <div className="space-y-3">
                {publicEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      📍 {event.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-2">🎵</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No events nearby</p>
              </div>
            )}
          </section>

        </div>

        {/* iOS safe area */}
        <div className="h-safe-bottom" />
      </div>
    </PullToRefresh>
  );
}


// //
// "use client";

// import { useEffect } from "react";

// export default function MusicianDashboard() {
//   useEffect(() => {
//     console.log('🎵 Dashboard mounted');
//     return () => console.log('🎵 Dashboard unmounted');
//   }, []);

//   // ... rest of code
// }





