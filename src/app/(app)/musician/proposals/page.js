// src/app/(app)/musician/proposals/page.js - FIXED WITH NOTIFICATIONS
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import notificationService from "@/lib/notificationService";
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Mail,
} from "lucide-react";

export default function MusicianProposalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("proposals")
        .select(`
          *,
          client:client_id(
            first_name,
            last_name,
            email,
            phone,
            profile_picture_url
          )
        `)
        .eq("musician_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching proposals:', error);
        throw error;
      }

      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      alert("Failed to load proposals. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId) => {
    if (!confirm("Accept this proposal and create a booking?")) return;

    setProcessing({ ...processing, [proposalId]: "accepting" });

    try {
      const proposal = proposals.find((p) => p.id === proposalId);

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      console.log('Accepting proposal:', proposal);

      // Update proposal status
      const { error: proposalError } = await supabase
        .from("proposals")
        .update({ 
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", proposalId);

      if (proposalError) {
        console.error('Proposal update error:', proposalError);
        throw proposalError;
      }

      // Create booking
      const bookingData = {
        client_id: proposal.client_id,
        musician_id: user.id,
        event_date: proposal.event_date,
        event_location: proposal.venue,
        amount: proposal.proposed_amount,
        event_duration: proposal.duration,
        notes: proposal.message,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      console.log('Creating booking with data:', bookingData);

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        throw bookingError;
      }

      console.log('Booking created:', booking);

      // Send notification to client
      await notificationService.createNotification({
        userId: proposal.client_id,
        title: 'Proposal Accepted!',
        message: `${user.first_name} ${user.last_name} accepted your booking proposal. A booking has been created.`,
        type: 'booking',
        link: `/client/bookings/${booking.id}`,
        metadata: {
          booking_id: booking.id,
          musician_id: user.id,
          proposal_id: proposalId,
        },
      });

      alert("Proposal accepted! Booking created successfully.");
      
      // Refresh proposals
      await fetchProposals();
      
      // Navigate to booking
      router.push(`/musician/bookings?id=${booking.id}`);
    } catch (error) {
      console.error("Error accepting proposal:", error);
      alert(`Failed to accept proposal: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setProcessing({ ...processing, [proposalId]: null });
    }
  };

  const handleDecline = async (proposalId) => {
    const reason = prompt("Why are you declining this proposal? (Optional)");
    
    if (reason === null) return; // User cancelled

    setProcessing({ ...processing, [proposalId]: "declining" });

    try {
      const proposal = proposals.find((p) => p.id === proposalId);

      const { error } = await supabase
        .from("proposals")
        .update({ 
          status: "declined",
          updated_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", proposalId);

      if (error) throw error;

      // Send notification to client
      await notificationService.createNotification({
        userId: proposal.client_id,
        title: 'Proposal Declined',
        message: `${user.first_name} ${user.last_name} declined your booking proposal.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'booking',
        link: '/client/proposals',
        metadata: {
          musician_id: user.id,
          proposal_id: proposalId,
          reason: reason,
        },
      });

      alert("Proposal declined.");
      fetchProposals();
    } catch (error) {
      console.error("Error declining proposal:", error);
      alert("Failed to decline proposal. Please try again.");
    } finally {
      setProcessing({ ...processing, [proposalId]: null });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
        icon: Clock,
        text: "Pending",
      },
      accepted: {
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
        icon: CheckCircle,
        text: "Accepted",
      },
      declined: {
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
        icon: XCircle,
        text: "Declined",
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

  const filteredProposals = proposals;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Proposals
          </h1>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Accepted" },
              { id: "declined", label: "Declined" },
              { id: "all", label: "All" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Proposals
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "pending"
                ? "You don't have any pending proposals"
                : `No ${filter} proposals found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {proposal.client?.first_name?.[0]}
                        {proposal.client?.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {proposal.client?.first_name}{" "}
                          {proposal.client?.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(proposal.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Event Type */}
                  {proposal.event_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {proposal.event_type}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Message:
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {proposal.message}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {proposal.event_date && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(proposal.event_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    )}

                    {proposal.venue && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{proposal.venue}</span>
                      </div>
                    )}

                    {proposal.duration && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {proposal.duration} hours
                      </div>
                    )}

                    {proposal.client?.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <a
                          href={`tel:${proposal.client.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {proposal.client.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm">Proposed Amount</span>
                    </div>
                    <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                      ₦{proposal.proposed_amount?.toLocaleString() || "0"}
                    </span>
                  </div>

                  {/* Rejection Reason (if declined) */}
                  {proposal.status === 'declined' && proposal.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>Decline Reason:</strong> {proposal.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {proposal.status === "pending" && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleAccept(proposal.id)}
                        disabled={processing[proposal.id]}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {processing[proposal.id] === "accepting" ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accept & Create Booking
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDecline(proposal.id)}
                        disabled={processing[proposal.id]}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {processing[proposal.id] === "declining" ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}







// // src/app/(app)/musician/proposals/page.js - NEW
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";
// import { useAuth } from "@/context/AuthContext";
// import {
//   Calendar,
//   MapPin,
//   DollarSign,
//   Clock,
//   User,
//   CheckCircle,
//   XCircle,
//   Loader,
//   FileText,
//   Mail,
// } from "lucide-react";

// export default function MusicianProposalsPage() {
//   const router = useRouter();
//   const { user } = useAuth();

//   const [proposals, setProposals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("pending"); // pending | accepted | declined | all
//   const [processing, setProcessing] = useState({});

//   useEffect(() => {
//     if (user) {
//       fetchProposals();
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, filter]);

//   const fetchProposals = async () => {
//     setLoading(true);
//     try {
//       let query = supabase
//         .from("proposals")
//         .select(`
//           *,
//           client:client_id(
//             first_name,
//             last_name,
//             email,
//             phone,
//             profile_picture_url
//           )
//         `)
//         .eq("musician_id", user.id)
//         .order("created_at", { ascending: false });

//       if (filter !== "all") {
//         query = query.eq("status", filter);
//       }

//       const { data, error } = await query;

//       if (error) throw error;

//       setProposals(data || []);
//     } catch (error) {
//       console.error("Error fetching proposals:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAccept = async (proposalId) => {
//     if (!confirm("Accept this proposal and create a booking?")) return;

//     setProcessing({ ...processing, [proposalId]: "accepting" });

//     try {
//       const proposal = proposals.find((p) => p.id === proposalId);

//       // Update proposal status
//       const { error: proposalError } = await supabase
//         .from("proposals")
//         .update({ status: "accepted" })
//         .eq("id", proposalId);

//       if (proposalError) throw proposalError;

//       // Create booking
//       const { data: booking, error: bookingError } = await supabase
//         .from("bookings")
//         .insert({
//           client_id: proposal.client_id,
//           musician_id: user.id,
//           event_date: proposal.event_date,
//           event_location: proposal.venue,
//           amount: proposal.proposed_amount,
//           event_duration: proposal.duration,
//           notes: proposal.message,
//           status: "pending",
//         })
//         .select()
//         .single();

//       if (bookingError) throw bookingError;

//       alert("Proposal accepted! Booking created.");
      
//       // Refresh proposals
//       fetchProposals();
      
//       // Navigate to booking
//       router.push(`/musician/bookings/${booking.id}`);
//     } catch (error) {
//       console.error("Error accepting proposal:", error);
//       alert("Failed to accept proposal. Please try again.");
//     } finally {
//       setProcessing({ ...processing, [proposalId]: null });
//     }
//   };

//   const handleDecline = async (proposalId) => {
//     if (!confirm("Decline this proposal?")) return;

//     setProcessing({ ...processing, [proposalId]: "declining" });

//     try {
//       const { error } = await supabase
//         .from("proposals")
//         .update({ status: "declined" })
//         .eq("id", proposalId);

//       if (error) throw error;

//       alert("Proposal declined.");
//       fetchProposals();
//     } catch (error) {
//       console.error("Error declining proposal:", error);
//       alert("Failed to decline proposal. Please try again.");
//     } finally {
//       setProcessing({ ...processing, [proposalId]: null });
//     }
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       pending: {
//         color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
//         icon: Clock,
//         text: "Pending",
//       },
//       accepted: {
//         color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
//         icon: CheckCircle,
//         text: "Accepted",
//       },
//       declined: {
//         color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
//         icon: XCircle,
//         text: "Declined",
//       },
//     };

//     const badge = badges[status] || badges.pending;
//     const Icon = badge.icon;

//     return (
//       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
//         <Icon className="w-3.5 h-3.5" />
//         {badge.text}
//       </span>
//     );
//   };

//   const filteredProposals = proposals;

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
//       {/* Header */}
//       <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
//         <div className="max-w-5xl mx-auto px-4 py-4">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
//             Proposals
//           </h1>

//           {/* Filters */}
//           <div className="flex gap-2 overflow-x-auto scrollbar-hide">
//             {[
//               { id: "pending", label: "Pending" },
//               { id: "accepted", label: "Accepted" },
//               { id: "declined", label: "Declined" },
//               { id: "all", label: "All" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setFilter(tab.id)}
//                 className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
//                   filter === tab.id
//                     ? "bg-purple-600 text-white"
//                     : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-5xl mx-auto px-4 py-6">
//         {loading ? (
//           <div className="space-y-4">
//             {[1, 2, 3].map((i) => (
//               <div
//                 key={i}
//                 className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
//               >
//                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
//                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
//               </div>
//             ))}
//           </div>
//         ) : filteredProposals.length === 0 ? (
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
//             <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//               No Proposals
//             </h3>
//             <p className="text-gray-600 dark:text-gray-400">
//               {filter === "pending"
//                 ? "You don't have any pending proposals"
//                 : `No ${filter} proposals found`}
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {filteredProposals.map((proposal) => (
//               <div
//                 key={proposal.id}
//                 className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
//               >
//                 {/* Header */}
//                 <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
//                   <div className="flex items-start justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
//                         {proposal.client?.first_name?.[0]}
//                         {proposal.client?.last_name?.[0]}
//                       </div>
//                       <div>
//                         <h3 className="font-bold text-gray-900 dark:text-white">
//                           {proposal.client?.first_name}{" "}
//                           {proposal.client?.last_name}
//                         </h3>
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           {new Date(proposal.created_at).toLocaleDateString(
//                             "en-US",
//                             {
//                               month: "short",
//                               day: "numeric",
//                               year: "numeric",
//                             }
//                           )}
//                         </p>
//                       </div>
//                     </div>
//                     {getStatusBadge(proposal.status)}
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="p-6 space-y-4">
//                   {/* Event Type */}
//                   {proposal.event_type && (
//                     <div className="flex items-center gap-2 text-sm">
//                       <FileText className="w-4 h-4 text-gray-400" />
//                       <span className="font-medium text-purple-600 dark:text-purple-400">
//                         {proposal.event_type}
//                       </span>
//                     </div>
//                   )}

//                   {/* Message */}
//                   <div>
//                     <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
//                       Message:
//                     </p>
//                     <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
//                       {proposal.message}
//                     </p>
//                   </div>

//                   {/* Event Details */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
//                     {proposal.event_date && (
//                       <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
//                         <Calendar className="w-4 h-4" />
//                         {new Date(proposal.event_date).toLocaleDateString(
//                           "en-US",
//                           {
//                             weekday: "short",
//                             month: "long",
//                             day: "numeric",
//                             year: "numeric",
//                           }
//                         )}
//                       </div>
//                     )}

//                     {proposal.venue && (
//                       <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
//                         <MapPin className="w-4 h-4" />
//                         <span className="line-clamp-1">{proposal.venue}</span>
//                       </div>
//                     )}

//                     {proposal.duration && (
//                       <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
//                         <Clock className="w-4 h-4" />
//                         {proposal.duration} hours
//                       </div>
//                     )}

//                     {proposal.client?.phone && (
//                       <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
//                         <User className="w-4 h-4" />
//                         <a
//                           href={`tel:${proposal.client.phone}`}
//                           className="text-blue-600 hover:underline"
//                         >
//                           {proposal.client.phone}
//                         </a>
//                       </div>
//                     )}
//                   </div>

//                   {/* Amount */}
//                   <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
//                     <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
//                       <DollarSign className="w-5 h-5" />
//                       <span className="text-sm">Proposed Amount</span>
//                     </div>
//                     <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
//                       ₦{proposal.proposed_amount?.toLocaleString() || "0"}
//                     </span>
//                   </div>

//                   {/* Actions */}
//                   {proposal.status === "pending" && (
//                     <div className="flex gap-3 pt-4">
//                       <button
//                         onClick={() => handleAccept(proposal.id)}
//                         disabled={processing[proposal.id]}
//                         className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
//                       >
//                         {processing[proposal.id] === "accepting" ? (
//                           <>
//                             <Loader className="w-5 h-5 animate-spin" />
//                             Accepting...
//                           </>
//                         ) : (
//                           <>
//                             <CheckCircle className="w-5 h-5" />
//                             Accept & Create Booking
//                           </>
//                         )}
//                       </button>

//                       <button
//                         onClick={() => handleDecline(proposal.id)}
//                         disabled={processing[proposal.id]}
//                         className="flex items-center justify-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition disabled:opacity-50"
//                       >
//                         {processing[proposal.id] === "declining" ? (
//                           <>
//                             <Loader className="w-5 h-5 animate-spin" />
//                           </>
//                         ) : (
//                           <>
//                             <XCircle className="w-5 h-5" />
//                             Decline
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

