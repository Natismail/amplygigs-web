"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Music,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerType, setPartnerType] = useState(null); // 'venue' or 'event_manager'

  useEffect(() => {
    if (user) {
      checkPartnerStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkPartnerStatus() {
    setLoading(true);
    try {
      // Check if user is a venue partner
      const venueResponse = await fetch(
        `/api/partners/venues?user_id=${user.id}`
      );
      const venueResult = await venueResponse.json();

      if (venueResult.success && venueResult.data?.length > 0) {
        setPartner(venueResult.data[0]);
        setPartnerType("venue");
        await loadVenueStats(venueResult.data[0].id);
        setLoading(false);
        return;
      }

      // Check if user is an event manager
      const managerResponse = await fetch(
        `/api/partners/event-managers?user_id=${user.id}`
      );
      const managerResult = await managerResponse.json();

      if (managerResult.success && managerResult.data?.length > 0) {
        setPartner(managerResult.data[0]);
        setPartnerType("event_manager");
        await loadManagerStats(managerResult.data[0].id);
        setLoading(false);
        return;
      }

      // Not a partner yet
      router.push("/partners/apply");
    } catch (error) {
      console.error("Error checking partner status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVenueStats(venueId) {
    try {
      const response = await fetch(`/api/partners/venues/${venueId}/stats`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading venue stats:", error);
    }
  }

  async function loadManagerStats(managerId) {
    try {
      const response = await fetch(
        `/api/partners/event-managers/${managerId}/stats`
      );
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading manager stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Partner Account Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to apply and be approved as a partner first
          </p>
          <button
            onClick={() => router.push("/partners/apply")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              {partnerType === "venue" ? (
                <Building2 className="w-8 h-8" />
              ) : (
                <Music className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Partner Dashboard</h1>
              <p className="text-purple-100">
                {partnerType === "venue"
                  ? partner.name
                  : partner.company_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                partner.status === "active"
                  ? "bg-green-500/20 text-green-100"
                  : "bg-yellow-500/20 text-yellow-100"
              }`}
            >
              {partner.status?.toUpperCase()}
            </span>
            <span className="text-purple-100">
              {partnerType === "venue"
                ? `${partner.city}, ${partner.state || ""}`
                : partner.company_type}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalEvents || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Events Hosted
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                ₦{(stats.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalAttendees || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Attendees
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.upcomingEvents || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upcoming Events
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {partnerType === "venue" && (
            <button
              onClick={() => router.push("/partners/dashboard/events")}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-purple-500 dark:hover:border-purple-500 transition text-left group"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
                <Calendar className="w-6 h-6 text-purple-600 group-hover:text-white transition" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Manage Events
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage events at your venue
              </p>
            </button>
          )}

          <button
            onClick={() => router.push("/partners/dashboard/analytics")}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-purple-500 dark:hover:border-purple-500 transition text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
              <BarChart3 className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View detailed performance metrics
            </p>
          </button>

          <button
            onClick={() => router.push("/partners/dashboard/settings")}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-purple-500 dark:hover:border-purple-500 transition text-left group"
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your partnership details
            </p>
          </button>
        </div>

        {/* Partner Info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Partnership Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerType === "venue" ? (
              <>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Venue Name
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {partner.name}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Capacity
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {partner.capacity} people
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Address
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {partner.address}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Partnership Tier
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">
                    {partner.partnership?.partnership_tier || "Basic"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Company Name
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {partner.company_name}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Company Type
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">
                    {partner.company_type?.replace("_", " ")}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Artists Managed
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {stats?.artistsManaged || 0}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Verification Status
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium capitalize">
                    {partner.verification_status || "Pending"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}