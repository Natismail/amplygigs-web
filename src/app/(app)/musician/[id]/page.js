// src/app/(app)/musician/[id]/page.js - WITH PROPOSAL BUTTON INTEGRATED
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import VideoGallery from "@/components/VideoGallery";
import RatingForm from "@/components/RatingForm";
import ProposalForm from "@/components/ProposalForm";

import MusicianVideoUpload from '@/components/videos/MusicianVideoUpload';
import MusicianVideosDisplay from '@/components/videos/MusicianVideosDisplay';
import {
  FaYoutube,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaWhatsapp,
  FaStar,
} from "react-icons/fa";
import {
  MapPin,
  DollarSign,
  Calendar,
  Music,
  Users,
  MessageCircle,
  Share2,
  Heart,
  Award,
  Briefcase,
  Send,
  X,
} from "lucide-react";

export default function MusicianProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getOrCreateConversation } = useSocial();

  const [musician, setMusician] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showProposalForm, setShowProposalForm] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);


  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!id) return;
    fetchMusicianData();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMusicianData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_profiles")
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        bio,
        role,
        available,
        profile_picture_url,
        gadget_specs,
        average_rating,
        hourly_rate,
        primary_role,
        genres,
        experience_years,
        location,
        youtube,
        tiktok,
        whatsapp,
        instagram,
        twitter,
        socials,
        followers_count,
        following_count
      `)
      .eq("id", id)
      .eq("role", "MUSICIAN")
      .single();

    if (error) {
      console.error("Profile error:", error);
      setMusician(null);
    } else {
      setMusician(data);
    }

    // Check if following
    if (user && !isOwnProfile) {
      const { data: followData } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .single();

      setIsFollowing(!!followData);
    }

    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Get booking stats
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("musician_id", id)
        .eq("status", "completed");

      // Get ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          user_profiles!ratings_user_id_fkey (
            first_name,
            last_name,
            profile_picture_url
          )
        `)
        .eq("musician_id", id)
        .order("created_at", { ascending: false });

      setRatings(ratingsData || []);
      setStats({ completedGigs: bookingsCount || 0 });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", id);
        setIsFollowing(false);
        setMusician(prev => ({ ...prev, followers_count: (prev.followers_count || 0) - 1 }));
      } else {
        await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: id });
        setIsFollowing(true);
        setMusician(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await getOrCreateConversation(id);
    if (data) {
      router.push("/messages");
    }
  };

  const refreshRatings = async () => {
    fetchStats();
    fetchMusicianData();
  };

  const ImageZoomModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
      <div
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Profile picture"
            fill
            className="object-contain"
          />
        </div>
      </div>
    );
  };


  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto p-6 animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!musician) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Musician Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This musician profile doesn&apos;t exist or has been removed
          </p>
          <button
            onClick={() => router.push("/network")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Browse Musicians
          </button>
        </div>
      </div>
    );
  }

  const displayName = musician.display_name || `${musician.first_name} ${musician.last_name}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Picture - UPDATED WITH ZOOM */}
            <div
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 cursor-pointer group"
              onClick={() => musician.profile_picture_url && setShowImageModal(true)}
            >
              {musician.profile_picture_url ? (
                <>
                  <Image
                    src={musician.profile_picture_url}
                    alt={displayName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                      {/* Click to zoom */}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-800 text-white text-5xl font-bold">
                  {displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayName}</h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                {musician.primary_role && (
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    {musician.primary_role}
                  </span>
                )}
                {musician.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {musician.location}
                  </span>
                )}
                {musician.experience_years && (
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {musician.experience_years} years experience
                  </span>
                )}
              </div>

              {/* Genres */}
              {musician.genres && musician.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {musician.genres.map((genre, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{musician.followers_count || 0}</div>
                  <div className="text-sm text-white/80">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.completedGigs || 0}</div>
                  <div className="text-sm text-white/80">Gigs</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <FaStar className="w-5 h-5 text-yellow-400" />
                    {musician.average_rating?.toFixed(1) || "N/A"}
                  </div>
                  <div className="text-sm text-white/80">Rating</div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && user && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </button>

                  {/* PROPOSAL BUTTON - NEW! */}
                  <button
                    onClick={() => setShowProposalForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Send Proposal
                  </button>

                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition ${isFollowing
                      ? "bg-purple-700 hover:bg-purple-800 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white backdrop-blur"
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button className="p-3 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur transition">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Availability & Rate */}
              <div className="flex flex-wrap gap-4 mt-4">
                <span
                  className={`px-4 py-2 rounded-lg font-medium ${musician.available
                    ? "bg-green-500/20 text-green-100"
                    : "bg-red-500/20 text-red-100"
                    }`}
                >
                  {musician.available ? "Available for Bookings" : "Currently Unavailable"}
                </span>
                {musician.hourly_rate && (
                  <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg font-medium">
                    ₦{musician.hourly_rate.toLocaleString()}/hr
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {["about", "videos", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* Categories & Subcategories - NEW! */}
            {musician.categories && musician.categories.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Musical Expertise
                </h2>
                <div className="space-y-4">
                  {musician.categories.map((cat, idx) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {cat.category}
                      </h3>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cat.subcategories.map((sub, subIdx) => (
                            <span
                              key={subIdx}
                              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bio */}
            {musician.bio && (
              <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {musician.bio}
                </p>
              </section>
            )}

            {/* Equipment */}
            {musician.gadget_specs && (
              <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Equipment & Gear
                </h2>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {typeof musician.gadget_specs === "string"
                    ? musician.gadget_specs
                    : JSON.stringify(musician.gadget_specs, null, 2)}
                </pre>
              </section>
            )}

            {/* Social Links */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Connect</h2>
              <div className="flex flex-wrap gap-4 text-3xl">
                {musician.youtube && (
                  <a
                    href={musician.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 transition"
                  >
                    <FaYoutube />
                  </a>
                )}
                {musician.instagram && (
                  <a
                    href={musician.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 transition"
                  >
                    <FaInstagram />
                  </a>
                )}
                {musician.twitter && (
                  <a
                    href={musician.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:text-sky-600 transition"
                  >
                    <FaTwitter />
                  </a>
                )}
                {musician.tiktok && (
                  <a
                    href={musician.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black dark:text-white hover:opacity-70 transition"
                  >
                    <FaTiktok />
                  </a>
                )}
                {musician.whatsapp && (
                  <a
                    href={`https://wa.me/${musician.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 transition"
                  >
                    <FaWhatsapp />
                  </a>
                )}
              </div>
            </section>
          </div>
        )}


        {/* {activeTab === "videos" && (
          <VideoGallery musicianId={id} isOwnProfile={isOwnProfile} />
        )} */}


        {activeTab === "videos" && (
          <div className="space-y-6">
            {/* Upload Section - Only for own profile */}
            {isOwnProfile && (
              <MusicianVideoUpload
                onUploadSuccess={(newVideo) => {
                  // Optionally refresh the display
                  console.log('Video uploaded:', newVideo);
                }}
              />
            )}

            {/* Public Display - For everyone */}
            <MusicianVideosDisplay
              musicianId={id}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Rating Form */}
            {user && !isOwnProfile && (
              <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Leave a Review
                </h2>
                <RatingForm musicianId={musician.id} onSuccess={refreshRatings} />
              </section>
            )}

            {/* Ratings List */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Reviews ({ratings.length})
              </h2>

              {ratings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No reviews yet. Be the first to leave a review!
                </p>
              ) : (
                <div className="space-y-4">
                  {ratings.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {r.user_profiles?.profile_picture_url ? (
                            <Image
                              src={r.user_profiles.profile_picture_url}
                              alt={r.user_profiles?.first_name || "User"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold">
                              {r.user_profiles?.first_name?.[0] || "U"}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {r.user_profiles?.first_name} {r.user_profiles?.last_name}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-4 h-4 ${i < r.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>

                          {r.comment && (
                            <p className="text-gray-700 dark:text-gray-300 mb-2">{r.comment}</p>
                          )}

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* PROPOSAL FORM MODAL - NEW! */}
      {showProposalForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ProposalForm
            musicianId={id}
            onSuccess={() => {
              setShowProposalForm(false);
              alert('✅ Proposal sent successfully! The musician will review it and respond.');
              router.push('/client/proposals');
            }}
            onCancel={() => setShowProposalForm(false)}
          />
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageModal && (
        <ImageZoomModal 
          imageUrl={musician.profile_picture_url}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}


