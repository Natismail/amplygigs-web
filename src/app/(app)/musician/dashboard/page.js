// src/app/musician/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useKYC } from "@/hooks/useKYC";
import ProfileCard from "@/components/dashboard/ProfileCard";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";
import Link from "next/link";

export default function MusicianDashboard() {
  const { user } = useAuth();
  const { profile, stats, bookings, events, fetchProfile, fetchBookings, fetchEvents } = useData();
  const { isVerified, isPending, isUnverified, isRejected, verification, loading: kycLoading } = useKYC();
  
  const [publicEvents, setPublicEvents] = useState([]);
  const [loadingPublicEvents, setLoadingPublicEvents] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedKYCBanner, setDismissedKYCBanner] = useState(false);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(true),
      fetchBookings(true),
      fetchEvents(true),
      loadPublicEvents()
    ]);
    setRefreshing(false);
  };

  const loadPublicEvents = async () => {
    setLoadingPublicEvents(true);
    try {
      const data = await fetchPublicEvents({ lat: 6.5244, lng: 3.3792 });
      setPublicEvents(data.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch public events:", error);
    } finally {
      setLoadingPublicEvents(false);
    }
  };

  useEffect(() => {
    loadPublicEvents();
  }, []);

  useEffect(() => {
    if (user) {
      if (!profile) fetchProfile();
      if (!bookings || bookings.length === 0) fetchBookings();
      if (!events || events.length === 0) fetchEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  const recentGigs = bookings?.filter(b => b.musician_id === user?.id).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-6">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              🎵 Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {profile.first_name}!
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition disabled:opacity-50"
            aria-label="Refresh"
          >
            <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-7xl mx-auto">
        {/* KYC Verification Banners */}
        {!kycLoading && (
          <>
            {/* Unverified - Warning Banner */}
            {isUnverified && !dismissedKYCBanner && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 rounded-xl p-4 shadow-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">⚠️</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Verify Your Profile
                      </h3>
                      <button
                        onClick={() => setDismissedKYCBanner(true)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
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

            {/* Pending - Info Banner */}
            {isPending && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-xl p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">⏳</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                      Verification In Progress
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      We&apos;re reviewing your documents. You&apos;ll be notified within 24-48 hours.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Submitted: {new Date(verification?.submitted_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verified - Success Banner */}
            {isVerified && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-xl p-4 shadow">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">✅</div>
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

            {/* Rejected - Error Banner */}
            {isRejected && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 shadow">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">❌</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                      Verification Rejected
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                      {verification?.rejection_reason || 'Please review your documents and resubmit with clear, legible photos.'}
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

        {/* Profile + Analytics - Stacked on mobile */}
        <div className="space-y-4">
          <ProfileCard profile={profile} />
          <AnalyticsCards stats={stats} />
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push = '/musician/bookings'}
            className="min-h-[100px] bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">📅</div>
            <div className="font-semibold">My Gigs</div>
            <div className="text-xs opacity-90 mt-1">{recentGigs.length} active</div>
          </button>
          
          <button
            onClick={() => router.push = '/musician/earnings'}
            className="min-h-[100px] bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold">Earnings</div>
            <div className="text-xs opacity-90 mt-1">₦{stats.earnings?.toLocaleString() || 0}</div>
          </button>
        </div>

        {/* Recent Bookings */}
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
              {recentGigs.map(gig => (
                <div
                  key={gig.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 transition cursor-pointer"
                  onClick={() => router.push = `/musician/bookings/${gig.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex-1 mr-2">
                      {gig.events?.title || 'Gig'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      gig.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                      gig.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {gig.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    📍 {gig.event_location}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(gig.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ₦{gig.amount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ))}
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

        {/* Public Events */}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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

      {/* iOS Safe Area Bottom Padding */}
      <div className="h-safe-bottom"></div>
    </div>
  );
}



// import { useEffect, useState } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { useData } from "@/context/DataContext";

// import ProfileCard from "@/components/dashboard/ProfileCard";
// import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
// import EventPreviewSection from "@/components/dashboard/EventPreviewSection";
// import PublicEventCard from "@/components/events/PublicEventCard";
// import MusicianEvents from "@/components/MusicianEvents";

// import { fetchPublicEvents } from "@/lib/google/fetchPublicEvents";

// export default function MusicianDashboard() {
//   const { user } = useAuth();
//   const {
//     profile,
//     stats,
//     bookings,
//     events,
//     fetchProfile,
//     fetchBookings,
//     fetchEvents
//   } = useData();

//   const [publicEvents, setPublicEvents] = useState([]);
//   const [loadingPublicEvents, setLoadingPublicEvents] = useState(true);

//   // Load public events
//   useEffect(() => {
//     async function loadPublicEvents() {
//       setLoadingPublicEvents(true);
//       try {
//         const data = await fetchPublicEvents({ lat: 6.5244, lng: 3.3792 });
//         setPublicEvents(data.slice(0, 3));
//       } catch (error) {
//         console.error("Failed to fetch public events:", error);
//       } finally {
//         setLoadingPublicEvents(false);
//       }
//     }

//     loadPublicEvents();
//   }, []);

//   // Load user-related data
//   useEffect(() => {
//     if (user) {
//       if (!profile) fetchProfile();
//       if (!bookings || bookings.length === 0) fetchBookings();
//       if (!events || events.length === 0) fetchEvents();
//     }
//   }, [user, profile, bookings, events, fetchProfile, fetchBookings, fetchEvents]);

//   if (!profile) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
//       </div>
//     );
//   }

//   const recentGigs = bookings?.filter(b => b.musician_id === user?.id).slice(0, 3);
//   const recentPostedEvents = events?.filter(e => e.creator_id === user?.id).slice(0, 3);

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-10">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">🎵 Musician Dashboard</h1>
//         <button
//           onClick={() => {
//             fetchProfile(true);
//             fetchBookings(true);
//             fetchEvents(true);
//             fetchPublicEvents({ lat: 6.5244, lng: 3.3792 }).then(data =>
//               setPublicEvents(data.slice(0, 3))
//             );
//           }}
//           className="text-sm text-blue-600 hover:underline"
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {/* Profile + Analytics */}
//       <div className="grid md:grid-cols-3 gap-6">
//         <ProfileCard profile={profile} />
//         <div className="md:col-span-2">
//           <AnalyticsCards stats={stats} />
//         </div>
//       </div>

//       {/* Event sections */}
//       <div className="grid md:grid-cols-3 gap-6">
//         {/* Uploaded Gigs */}
//         <EventPreviewSection
//           title="Recent Bookings"
//           description="Your latest gigs"
//           items={recentGigs}
//           link="/musician/bookings"
//           renderItem={(gig) => <MusicianEvents key={gig.id} event={gig} compact />}
//         />

//         {/* Posted Events */}
//         <EventPreviewSection
//           title="Uploaded Events"
//           description="Events posted on the platform"
//           items={recentPostedEvents}
//           link="/musician/events"
//           renderItem={(event) => (
//             <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//               <p className="font-medium">{event.title}</p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
//               <p className="text-xs text-gray-500 mt-1">
//                 {new Date(event.date).toLocaleDateString()}
//               </p>
//             </div>
//           )}
//         />

//         {/* Public events */}
//         <EventPreviewSection
//           title="Public Events"
//           description="Discover external music events"
//           items={publicEvents}
//           loading={loadingPublicEvents}
//           link="/musician/discover"
//           renderItem={(event) => <PublicEventCard key={event.id} event={event} />}
//         />
//       </div>
//     </div>
//   );
// }


