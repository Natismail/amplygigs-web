// src/components/EmptyState.js
"use client";

import { 
  Music, 
  Users, 
  MessageCircle, 
  Bell, 
  FileText,
  Video,
  Star,
  Calendar,
  Search
} from "lucide-react";

const icons = {
  music: Music,
  users: Users,
  messages: MessageCircle,
  notifications: Bell,
  posts: FileText,
  videos: Video,
  reviews: Star,
  events: Calendar,
  search: Search,
};

export default function EmptyState({
  icon = "search",
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
}) {
  const Icon = icons[icon] || Search;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>

      {title && (
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {action && actionLabel && (
          <button
            onClick={action}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            {actionLabel}
          </button>
        )}

        {secondaryAction && secondaryActionLabel && (
          <button
            onClick={secondaryAction}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoResults({ searchQuery }) {
  return (
    <EmptyState
      icon="search"
      title="No Results Found"
      description={
        searchQuery
          ? `No results found for "${searchQuery}". Try different keywords.`
          : "Try adjusting your search or filters"
      }
    />
  );
}

export function NoMessages({ onNewMessage }) {
  return (
    <EmptyState
      icon="messages"
      title="No Messages Yet"
      description="Start a conversation with musicians or clients to see your messages here"
      action={onNewMessage}
      actionLabel="Find Musicians"
    />
  );
}

export function NoPosts({ onCreatePost, canCreate = true }) {
  return (
    <EmptyState
      icon="posts"
      title="No Posts Yet"
      description={
        canCreate
          ? "Share your first post with your followers"
          : "Follow musicians and clients to see their posts in your feed"
      }
      action={canCreate ? onCreatePost : undefined}
      actionLabel={canCreate ? "Create Post" : undefined}
    />
  );
}

export function NoVideos({ onUpload, isOwnProfile }) {
  return (
    <EmptyState
      icon="videos"
      title="No Videos Yet"
      description={
        isOwnProfile
          ? "Upload your first performance video to showcase your talent"
          : "This musician hasn't uploaded any videos yet"
      }
      action={isOwnProfile ? onUpload : undefined}
      actionLabel={isOwnProfile ? "Upload Video" : undefined}
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="notifications"
      title="No Notifications"
      description="You'll see notifications here when people interact with you"
    />
  );
}

export function NoFollowers() {
  return (
    <EmptyState
      icon="users"
      title="No Followers Yet"
      description="Share great content and connect with others to gain followers"
    />
  );
}

export function NoReviews({ onWriteReview, canReview = false }) {
  return (
    <EmptyState
      icon="reviews"
      title="No Reviews Yet"
      description={
        canReview
          ? "Be the first to leave a review for this musician"
          : "This musician hasn't received any reviews yet"
      }
      action={canReview ? onWriteReview : undefined}
      actionLabel={canReview ? "Write Review" : undefined}
    />
  );
}

export function NoBookings({ onFindMusicians }) {
  return (
    <EmptyState
      icon="events"
      title="No Bookings Yet"
      description="Find talented musicians and book them for your events"
      action={onFindMusicians}
      actionLabel="Find Musicians"
    />
  );
}