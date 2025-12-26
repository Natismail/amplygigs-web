// src/app/(app)/feed/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocial } from "@/context/SocialContext";
import SocialFeed from "@/components/social/SocialFeed";
import CreatePostModal from "@/components/social/CreatePostModal";
import { Plus, TrendingUp, Users, Compass } from "lucide-react";
import PullToRefresh from '@/components/PullToRefresh';

export default function FeedPage() {
  const router = useRouter();
  const { user } = useSocial();
  const [activeTab, setActiveTab] = useState("feed"); // feed | discover | following
  const [showCreatePost, setShowCreatePost] = useState(false);
const { posts, fetchFeed } = useSocial();

  useEffect(() => {
    fetchFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    console.log('🔄 Refreshing feed...');
    await fetchFeed();
  };

  const tabs = [
    { id: "feed", label: "Feed", icon: TrendingUp, description: "Posts from people you follow" },
    { id: "discover", label: "Discover", icon: Compass, description: "Explore new content" },
    { id: "following", label: "Following", icon: Users, description: "People you follow" },
  ];

  return (
        <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Feed
            </h1>

            {/* Create Post Button */}
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Post</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "feed" && (
          <SocialFeed />
        )}

        {activeTab === "discover" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <Compass className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Discover New Content
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Explore posts from musicians and clients across AmplyGigs
            </p>
            <button
              onClick={() => router.push("/network")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
            >
              Explore Network
            </button>
          </div>
        )}

        {activeTab === "following" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your Network
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View and manage people you follow
            </p>
            <button
              onClick={() => router.push("/network")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
            >
              View Network
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </div>
        </PullToRefresh>
  );
}


