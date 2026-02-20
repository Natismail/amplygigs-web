// src/app/(app)/profile/[userId]/page.js
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/social/FollowButton";
import {
  MapPin,
  Calendar,
  Music,
  MessageCircle,
  Edit,
  ArrowLeft,
  Star,
  Heart,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  FileText,
  Play,
  ZoomIn,
  Image as ImageIcon,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { useSocial } from "@/context/SocialContext";
import PullToRefresh from "@/components/PullToRefresh";

// ─────────────────────────────────────────────────────────────
// ImageLightbox — full-screen viewer (images + avatar)
// ─────────────────────────────────────────────────────────────
function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((p) => Math.min(p + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrent((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/50 px-3 py-1 rounded-full z-10">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      {current > 0 && (
        <button
          className="absolute left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition z-10"
          onClick={(e) => { e.stopPropagation(); setCurrent((p) => p - 1); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        alt="Lightbox"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {current < images.length - 1 && (
        <button
          className="absolute right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition z-10"
          onClick={(e) => { e.stopPropagation(); setCurrent((p) => p + 1); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────────────────────
function PostCard({ post, onImageClick }) {
  const isImage = post.media_type === "image" && post.media_url;
  const isVideo = post.media_type === "video" && post.media_url;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">

      {/* Image */}
      {isImage && (
        <div
          className="relative overflow-hidden cursor-pointer group aspect-video"
          onClick={() => onImageClick([post.media_url], 0)}
        >
          <img
            src={post.media_url}
            alt="Post"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
            {/* <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" /> */}
          </div>
        </div>
      )}

      {/* Video */}
      {isVideo && (
        <div
          className="relative overflow-hidden cursor-pointer group aspect-video bg-black"
          onClick={() => window.open(post.media_url, "_blank")}
        >
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt="Video thumbnail"
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            VIDEO
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        {post.caption && (
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
            {post.caption}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {post.location && (
              <>
                <MapPin className="w-3 h-3" />
                <span className="mr-2">{post.location}</span>
              </>
            )}
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 text-xs">
              <Heart className="w-3.5 h-3.5" />
              {post.likes_count ?? 0}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comments_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PostsGrid — Instagram-style media-only grid
// ─────────────────────────────────────────────────────────────
function PostsGrid({ posts, onImageClick }) {
  const mediaPosts = posts.filter(
    (p) => p.media_type === "image" && p.media_url
  );

  if (mediaPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <ImageIcon className="w-10 h-10 opacity-40" />
        <p className="text-sm">No photos yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {mediaPosts.map((post) => (
        <div
          key={post.id}
          className="aspect-square overflow-hidden cursor-pointer relative group" //cursor-zoom-in
          onClick={() => onImageClick([post.media_url], 0)}
        >
          <img
            src={post.media_url}
            alt="Post media"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
            {/* <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" /> */}
          </div>
          {/* Likes overlay on hover */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition">
            <span className="flex items-center gap-1 text-white text-xs font-semibold drop-shadow">
              <Heart className="w-3.5 h-3.5 fill-white" />
              {post.likes_count ?? 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// UserListModal — followers / following bottom sheet
// ─────────────────────────────────────────────────────────────
function UserListModal({ title, users, loading, onClose, onNavigate }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner size="sm" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No users found</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                onClick={() => { onClose(); onNavigate(u.id); }}
              >
                <Avatar user={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {u.first_name} {u.last_name}
                  </p>
                  {u.display_name && (
                    <p className="text-xs text-gray-500 truncate">@{u.display_name}</p>
                  )}
                </div>
                {u.role && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium capitalize shrink-0">
                    {u.role.toLowerCase()}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat skeleton
// ─────────────────────────────────────────────────────────────
function StatSkeleton() {
  return <div className="h-7 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />;
}

// ─────────────────────────────────────────────────────────────
// TABS config
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "posts", label: "Posts", icon: FileText },
  { id: "media", label: "Media", icon: Grid3X3 },
  { id: "events", label: "Events", icon: Music },
];

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { getOrCreateConversation } = useSocial();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  const [stats, setStats] = useState({ followers: null, following: null, posts: null, events: null });

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Lightbox: supports both post images and avatar
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  // Followers / Following modal
  const [modal, setModal] = useState({ open: false, type: null });
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const userId = params.userId;
  const isOwnProfile = currentUser?.id === userId;

  // ── Fetch helpers ──────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    try {
      const [
        { count: followersCount },
        { count: followingCount },
        { count: postsCount },
        { count: eventsCount },
      ] = await Promise.all([
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_public", true).eq("is_archived", false),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("creator_id", userId),
      ]);
      setStats({
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
        posts: postsCount ?? 0,
        events: eventsCount ?? 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, media_url, media_type, thumbnail_url, likes_count, comments_count, tags, location, created_at")
        .eq("user_id", userId)
        .eq("is_public", true)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setEventsLoading(false);
    }
  }, [userId]);

  const openFollowModal = useCallback(
    async (type) => {
      setModal({ open: true, type });
      setModalLoading(true);
      setModalUsers([]);
      try {
        let userIds = [];
        if (type === "followers") {
          const { data } = await supabase
            .from("user_follows")
            .select("follower_id")
            .eq("following_id", userId);
          userIds = (data || []).map((r) => r.follower_id);
        } else {
          const { data } = await supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", userId);
          userIds = (data || []).map((r) => r.following_id);
        }
        if (userIds.length === 0) { setModalUsers([]); return; }
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, display_name, avatar_url, role")
          .in("id", userIds);
        setModalUsers(profiles || []);
      } catch (err) {
        console.error("Modal fetch error:", err);
      } finally {
        setModalLoading(false);
      }
    },
    [userId]
  );

  // ── Effects ────────────────────────────────

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      fetchPosts();
      fetchEvents();
    }
  }, [userId, fetchProfile, fetchStats, fetchPosts, fetchEvents]);

  // ── Handlers ───────────────────────────────

  const handleMessage = async () => {
    try {
      const { data, error } = await getOrCreateConversation(userId);
      if (error) { alert("Failed to start conversation"); return; }
      if (data) router.push("/messages");
    } catch { alert("An error occurred"); }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchProfile(), fetchStats(), fetchPosts(), fetchEvents()]);
  };

  const openLightbox = (images, index = 0) => setLightbox({ open: true, images, index });
  const closeLightbox = () => setLightbox({ open: false, images: [], index: 0 });

  // ── Avatar zoom ────────────────────────────
  const handleAvatarClick = () => {
    // Use avatar_url from profile; fall back gracefully
    const url = profile?.avatar_url;
    if (url) openLightbox([url], 0);
  };

  // ── Render guards ──────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user doesn&apos;t exist or has been removed
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statsLoading = stats.followers === null;

  // ── Main render ────────────────────────────

  return (
    <>
      {/* Lightbox */}
      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}

      {/* Follow modal */}
      {modal.open && (
        <UserListModal
          title={
            modal.type === "followers"
              ? `${stats.followers ?? ""} Followers`
              : `${stats.following ?? ""} Following`
          }
          users={modalUsers}
          loading={modalLoading}
          onClose={() => setModal({ open: false, type: null })}
          onNavigate={(id) => router.push(`/profile/${id}`)}
        />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">

            {/* Sticky back bar */}
            <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm pt-4 pb-2">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
            </div>

            {/* ── Profile card ─────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-3">

              {/* Cover */}
              <div className="h-36 sm:h-52 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              <div className="px-5 pb-5">
                {/* Avatar + action buttons row */}
                <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-4">

                  {/* Clickable / zoomable avatar */}
                  <div
                    className="relative ring-4 ring-white dark:ring-gray-800 rounded-full group cursor-pointer"
                    onClick={handleAvatarClick}
                    title="View profile picture"
                  >
                    <Avatar user={profile} size="xl" />
                    {/* Zoom overlay */}
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      {/* <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" /> */}
                    </div>
                    {/* Verified badge */}
                    {profile.is_verified && (
                      <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1 z-10">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    {isOwnProfile ? (
                      <Link
                        href={profile.role === "MUSICIAN" ? "/musician/settings" : "/client/settings"}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition font-medium text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        <FollowButton
                          targetUserId={userId}
                          targetUser={profile}
                          onFollowChange={fetchStats}
                        />
                        <button
                          onClick={handleMessage}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  {profile.display_name && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">@{profile.display_name}</p>
                  )}
                  {profile.role === "MUSICIAN" && profile.primary_role && (
                    <div className="flex items-center gap-1.5 mt-1 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      <Music className="w-3.5 h-3.5" />
                      {profile.primary_role}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                  {profile.location && (
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {profile.location}
                    </span>
                  )}
                  {profile.created_at && (
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      Joined{" "}
                      {new Date(profile.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {profile.average_rating > 0 && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {profile.average_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({profile.total_reviews || 0} reviews)
                      </span>
                    </span>
                  )}
                </div>

                {/* Genres */}
                {profile.role === "MUSICIAN" && profile.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Stats row ───────────────────────── */}
                <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {[
                    {
                      label: stats.followers === 1 ? "Follower" : "Followers",
                      value: stats.followers,
                      onClick: () => openFollowModal("followers"),
                    },
                    {
                      label: "Following",
                      value: stats.following,
                      onClick: () => openFollowModal("following"),
                    },
                    {
                      label: "Posts",
                      value: stats.posts,
                      onClick: () => setActiveTab("posts"),
                    },
                    {
                      label: "Events",
                      value: stats.events,
                      onClick: () => setActiveTab("events"),
                    },
                  ].map(({ label, value, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl py-2 transition group"
                    >
                      {statsLoading ? (
                        <StatSkeleton />
                      ) : (
                        <p className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {value}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tabs ────────────────────────────────── */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

              {/* Tab bar */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition border-b-2 ${
                        isActive
                          ? "border-purple-600 text-purple-600 dark:text-purple-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="p-4">

                {/* Posts */}
                {activeTab === "posts" && (
                  postsLoading ? (
                    <div className="flex justify-center py-10">
                      <LoadingSpinner size="sm" message="Loading posts..." />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                      <FileText className="w-10 h-10 opacity-40" />
                      <p className="text-sm">No posts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard key={post.id} post={post} onImageClick={openLightbox} />
                      ))}
                    </div>
                  )
                )}

                {/* Media grid */}
                {activeTab === "media" && (
                  postsLoading ? (
                    <div className="flex justify-center py-10">
                      <LoadingSpinner size="sm" message="Loading media..." />
                    </div>
                  ) : (
                    <PostsGrid posts={posts} onImageClick={openLightbox} />
                  )
                )}

                {/* Events */}
                {activeTab === "events" && (
                  eventsLoading ? (
                    <div className="flex justify-center py-10">
                      <LoadingSpinner size="sm" message="Loading events..." />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                      <Music className="w-10 h-10 opacity-40" />
                      <p className="text-sm">No events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          {event.image_url ? (
                            <img
                              src={event.image_url}
                              alt={event.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Music className="w-7 h-7 text-purple-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {event.event_date && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(event.event_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              {event.location && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </span>
                              )}
                              {event.status && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    event.status === "ACTIVE"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : event.status === "COMPLETED"
                                      ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  }`}
                                >
                                  {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        </div>
      </PullToRefresh>
    </>
  );
}