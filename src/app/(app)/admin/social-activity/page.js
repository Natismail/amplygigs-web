// src/app/(app)/admin/social-activity/page.js
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MessageCircle, Heart, Share2, TrendingUp, Eye } from 'lucide-react';

export default function SocialActivityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [likes, setLikes] = useState([]);
  const [shares, setShares] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('overview');

  useEffect(() => {
    checkAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function checkAccess() {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin && data?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    await loadSocialData();
  }

  async function loadSocialData() {
    try {
      setLoading(true);

      // Get all posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get post likes
      const { data: likesData } = await supabase
        .from('post_likes')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url),
          post:posts!post_id(caption, media_type)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get post shares
      const { data: sharesData } = await supabase
        .from('post_shares')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url),
          post:posts!post_id(caption, media_type)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get comments
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url),
          post:posts!post_id(caption)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate stats
      const totalPosts = postsData?.length || 0;
      const totalLikes = likesData?.length || 0;
      const totalShares = sharesData?.length || 0;
      const totalComments = commentsData?.length || 0;
      const totalViews = postsData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

      // Most active users
      const userActivity = {};
      [...(likesData || []), ...(sharesData || []), ...(commentsData || [])].forEach(item => {
        const userId = item.user_id;
        userActivity[userId] = (userActivity[userId] || 0) + 1;
      });

      const mostActiveUsers = Object.entries(userActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Most engaged posts
      const mostEngagedPosts = postsData
        ?.sort((a, b) => 
          (b.likes_count + b.comments_count + b.shares_count) - 
          (a.likes_count + a.comments_count + a.shares_count)
        )
        .slice(0, 5) || [];

      setStats({
        totalPosts,
        totalLikes,
        totalShares,
        totalComments,
        totalViews,
        mostActiveUsers,
        mostEngagedPosts
      });

      setPosts(postsData || []);
      setLikes(likesData || []);
      setShares(sharesData || []);
      setComments(commentsData || []);

    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            📱 Social Activity
          </h1>
          <p className="text-pink-100">Monitor posts, likes, shares, and comments across the platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Total Posts"
            value={stats?.totalPosts || 0}
            icon={<MessageCircle className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Likes"
            value={stats?.totalLikes || 0}
            icon={<Heart className="w-6 h-6" />}
            color="red"
          />
          <MetricCard
            title="Shares"
            value={stats?.totalShares || 0}
            icon={<Share2 className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Comments"
            value={stats?.totalComments || 0}
            icon={<MessageCircle className="w-6 h-6" />}
            color="purple"
          />
          <MetricCard
            title="Total Views"
            value={stats?.totalViews || 0}
            icon={<Eye className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <TabButton active={view === 'overview'} onClick={() => setView('overview')} label="Overview" />
          <TabButton active={view === 'posts'} onClick={() => setView('posts')} label={`Posts (${stats?.totalPosts || 0})`} />
          <TabButton active={view === 'likes'} onClick={() => setView('likes')} label={`Likes (${stats?.totalLikes || 0})`} />
          <TabButton active={view === 'shares'} onClick={() => setView('shares')} label={`Shares (${stats?.totalShares || 0})`} />
          <TabButton active={view === 'comments'} onClick={() => setView('comments')} label={`Comments (${stats?.totalComments || 0})`} />
        </div>

        {/* Content */}
        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Engaged Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Most Engaged Posts
              </h2>
              <div className="space-y-3">
                {stats?.mostEngagedPosts.slice(0, 5).map(post => (
                  <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                      {post.caption || 'No caption'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {post.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> {post.shares_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {likes.slice(0, 3).map(like => (
                  <div key={like.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <Heart className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {like.user?.first_name} liked a post
                      </p>
                      <p className="text-xs text-gray-500">{new Date(like.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {comments.slice(0, 2).map(comment => (
                  <div key={comment.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {comment.user?.first_name} commented
                      </p>
                      <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'posts' && <PostsView posts={posts} />}
        {view === 'likes' && <LikesView likes={likes} />}
        {view === 'shares' && <SharesView shares={shares} />}
        {view === 'comments' && <CommentsView comments={comments} />}
      </div>
    </div>
  );
}

// Helper Components (same as before but cleaned up)
function MetricCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <div className={`${colors[color]} p-3 rounded-lg text-white w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
        active ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

function PostsView({ posts }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">All Posts ({posts.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map(post => (
          <div key={post.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {post.user?.first_name?.[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{post.user?.first_name} {post.user?.last_name}</p>
                <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm mb-3">{post.caption || 'No caption'}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>
              <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares_count}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LikesView({ likes }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">All Likes ({likes.length})</h2>
      <div className="space-y-3">
        {likes.map(like => (
          <div key={like.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Heart className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{like.user?.first_name} {like.user?.last_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{like.post?.caption || 'No caption'}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(like.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharesView({ shares }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">All Shares ({shares.length})</h2>
      <div className="space-y-3">
        {shares.map(share => (
          <div key={share.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Share2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{share.user?.first_name} {share.user?.last_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{share.post?.caption || 'No caption'}</p>
                {share.shared_with_caption && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 italic">
                    &quot;{share.shared_with_caption}&quot;
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{new Date(share.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsView({ comments }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">All Comments ({comments.length})</h2>
      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{comment.user?.first_name} {comment.user?.last_name}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-2">On: {comment.post?.caption || 'Post'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}