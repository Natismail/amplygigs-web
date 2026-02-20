
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  ChevronRight,
  Search,
} from "lucide-react";

export default function MyTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming"); // upcoming, past, all
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    if (user) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadTickets() {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?user_id=${user.id}`);
      const result = await response.json();

      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function searchByEmail() {
    if (!searchEmail) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?email=${searchEmail}`);
      const result = await response.json();

      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (error) {
      console.error("Error searching tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTickets = tickets.filter((purchase) => {
    const eventDate = new Date(purchase.event.event_date);
    const now = new Date();

    if (filter === "upcoming") return eventDate >= now;
    if (filter === "past") return eventDate < now;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-purple-600" />
            My Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your event tickets
          </p>

          {/* Search by Email */}
          {!user && (
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Enter your email to find tickets"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={searchByEmail}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            {["upcoming", "past", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center">
            <TicketIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Tickets Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't purchased any tickets yet
            </p>
            <button
              onClick={() => router.push("/live-events")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold inline-flex items-center gap-2 transition"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((purchase) => (
              <div
                key={purchase.id}
                onClick={() => router.push(`/tickets/${purchase.id}`)}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition cursor-pointer"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                    {purchase.event.cover_image_url ? (
                      <img
                        src={purchase.event.cover_image_url}
                        alt={purchase.event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {purchase.event.title}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(
                              purchase.event.event_date
                            ).toLocaleDateString("en-NG", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            {purchase.event.venue_name}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        {purchase.tickets?.length || 0} Ticket(s)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Order #{purchase.id.substring(0, 8)}
                      </div>
                    </div>
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