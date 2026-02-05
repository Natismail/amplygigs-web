// src/app/(app)/admin/social-media/page.js - ULTIMATE UNIFIED SOCIAL ADMIN
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Instagram, Youtube, Twitter, Heart, Share2, MessageCircle, Eye, 
  ExternalLink, TrendingUp, Users, UserPlus, Activity, Bell,
  Search, Filter, Calendar, BarChart3
} from 'lucide-react';

export default function SocialMediaAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mainView, setMainView] = useState('dashboard'); // 'dashboard', 'activity', 'profiles'
  
  // Activity data
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [shares, setShares] = useState([]);
  const [comments, setComments] = useState([]);
  const [follows, setFollows] = useState([]);
  
  // Profile data
  const [musicians, setMusicians] = useState([]);
  const [profileFilter, setProfileFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const [stats, setStats] = useState(null);
  const [activitySubView, setActivitySubView] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', 'week', 'month', 'all'

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

    await loadAllData();
  }

  async function loadAllData() {
    try {
      setLoading(true);

      // Get time filter date
      const now = new Date();
      let dateFilter = null;
      if (timeFilter === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (timeFilter === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (timeFilter === 'month') {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      }

      // Base queries
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url, role)
        `)
        .order('created_at', { ascending: false });

      let likesQuery = supabase
        .from('post_likes')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url, role),
          post:posts!post_id(caption, media_type, user_id)
        `)
        .order('created_at', { ascending: false });

      let sharesQuery = supabase
        .from('post_shares')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url),
          post:posts!post_id(caption, media_type, user_id)
        `)
        .order('created_at', { ascending: false });

      let commentsQuery = supabase
        .from('post_comments')
        .select(`
          *,
          user:user_profiles!user_id(first_name, last_name, profile_picture_url),
          post:posts!post_id(caption, user_id)
        `)
        .order('created_at', { ascending: false });

      let followsQuery = supabase
        .from('user_follows')
        .select(`
          *,
          follower:user_profiles!follower_id(first_name, last_name, profile_picture_url, role),
          following:user_profiles!following_id(first_name, last_name, profile_picture_url, role)
        `)
        .order('created_at', { ascending: false });

      // Apply date filters if needed
      if (dateFilter) {
        postsQuery = postsQuery.gte('created_at', dateFilter);
        likesQuery = likesQuery.gte('created_at', dateFilter);
        sharesQuery = sharesQuery.gte('created_at', dateFilter);
        commentsQuery = commentsQuery.gte('created_at', dateFilter);
        followsQuery = followsQuery.gte('created_at', dateFilter);
      }

      // Execute queries
      const [
        { data: postsData },
        { data: likesData },
        { data: sharesData },
        { data: commentsData },
        { data: followsData },
        { data: musiciansData },
        { data: allUsers }
      ] = await Promise.all([
        postsQuery.limit(200),
        likesQuery.limit(200),
        sharesQuery.limit(200),
        commentsQuery.limit(200),
        followsQuery.limit(200),
        supabase.from('user_profiles').select('*').eq('role', 'MUSICIAN').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id, first_name, last_name, role')
      ]);

      // Calculate comprehensive stats
      const totalUsers = allUsers?.length || 0;
      const totalPosts = postsData?.length || 0;
      const totalLikes = likesData?.length || 0;
      const totalShares = sharesData?.length || 0;
      const totalComments = commentsData?.length || 0;
      const totalFollows = followsData?.length || 0;
      const totalViews = postsData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

      // Calculate engagement metrics
      const usersWithActivity = new Set([
        ...(likesData || []).map(l => l.user_id),
        ...(sharesData || []).map(s => s.user_id),
        ...(commentsData || []).map(c => c.user_id),
        ...(followsData || []).map(f => f.follower_id)
      ]).size;

      const engagementRate = totalUsers > 0 
        ? ((usersWithActivity / totalUsers) * 100).toFixed(1)
        : 0;

      // Most engaged posts
      const mostEngagedPosts = postsData
        ?.sort((a, b) => 
          (b.likes_count + b.comments_count + b.shares_count) - 
          (a.likes_count + a.comments_count + a.shares_count)
        )
        .slice(0, 10) || [];

      // Most active users (by engagement actions)
      const userActivityMap = {};
      [...(likesData || []), ...(sharesData || []), ...(commentsData || []), ...(postsData || [])].forEach(item => {
        const userId = item.user_id;
        if (!userId) return;
        userActivityMap[userId] = (userActivityMap[userId] || 0) + 1;
      });

      const mostActiveUsers = Object.entries(userActivityMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => {
          const userInfo = allUsers.find(u => u.id === userId);
          return { userId, count, ...userInfo };
        });

      // Recent activity timeline (last 24 hours breakdown)
      const recentActivity = [
        ...likesData.slice(0, 10).map(l => ({ type: 'like', data: l, time: l.created_at })),
        ...sharesData.slice(0, 10).map(s => ({ type: 'share', data: s, time: s.created_at })),
        ...commentsData.slice(0, 10).map(c => ({ type: 'comment', data: c, time: c.created_at })),
        ...followsData.slice(0, 10).map(f => ({ type: 'follow', data: f, time: f.created_at }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

      // Trending hashtags or topics (if you store them)
      const trending = {
        posts: mostEngagedPosts.slice(0, 5),
        users: mostActiveUsers.slice(0, 5)
      };

      setStats({
        totalUsers,
        totalPosts,
        totalLikes,
        totalShares,
        totalComments,
        totalFollows,
        totalViews,
        engagementRate,
        usersWithActivity,
        mostEngagedPosts,
        mostActiveUsers,
        recentActivity,
        trending
      });

      setPosts(postsData || []);
      setLikes(likesData || []);
      setShares(sharesData || []);
      setComments(commentsData || []);
      setFollows(followsData || []);
      setMusicians(musiciansData || []);

      console.log('✅ Social data loaded:', {
        posts: totalPosts,
        likes: totalLikes,
        shares: totalShares,
        comments: totalComments,
        follows: totalFollows,
        musicians: musiciansData?.length
      });

    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter musicians by social media
  const filteredMusicians = musicians.filter(m => {
    const matchesSearch = !searchTerm || 
      m.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (profileFilter === 'instagram') return matchesSearch && (m.instagram || m.socials?.instagram);
    if (profileFilter === 'youtube') return matchesSearch && m.youtube;
    if (profileFilter === 'twitter') return matchesSearch && (m.twitter || m.socials?.twitter);
    if (profileFilter === 'tiktok') return matchesSearch && (m.tiktok || m.socials?.tiktok);
    if (profileFilter === 'verified') return matchesSearch && m.is_verified;
    if (profileFilter === 'no-socials') {
      return matchesSearch && !m.instagram && !m.youtube && !m.twitter && !m.tiktok && !m.socials?.instagram && !m.socials?.twitter && !m.socials?.tiktok;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading social data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8" />
                Social Media & Network Analytics
              </h1>
              <p className="text-pink-100">Monitor posts, engagement, social profiles, and network activity</p>
            </div>
            
            {/* Time Filter */}
            <div className="flex gap-2">
              {['all', 'today', 'week', 'month'].map(filter => (
                <button
                  key={filter}
                  onClick={() => {
                    setTimeFilter(filter);
                    loadAllData();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    timeFilter === filter
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main Navigation */}
        <div className="flex gap-3 mb-8">
          <NavButton
            active={mainView === 'dashboard'}
            onClick={() => setMainView('dashboard')}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavButton
            active={mainView === 'activity'}
            onClick={() => setMainView('activity')}
            icon={<Activity className="w-5 h-5" />}
            label="Activity Feed"
            badge={stats?.recentActivity?.length}
          />
          <NavButton
            active={mainView === 'profiles'}
            onClick={() => setMainView('profiles')}
            icon={<Users className="w-5 h-5" />}
            label="Social Profiles"
            badge={musicians.length}
          />
        </div>

        {/* Dashboard View */}
        {mainView === 'dashboard' && (
          <DashboardView stats={stats} posts={posts} likes={likes} shares={shares} comments={comments} follows={follows} />
        )}

        {/* Activity View */}
        {mainView === 'activity' && (
          <ActivityView
            posts={posts}
            likes={likes}
            shares={shares}
            comments={comments}
            follows={follows}
            stats={stats}
            subView={activitySubView}
            setSubView={setActivitySubView}
          />
        )}

        {/* Profiles View */}
        {mainView === 'profiles' && (
          <ProfilesView
            musicians={filteredMusicians}
            allMusicians={musicians}
            filter={profileFilter}
            setFilter={setProfileFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
      </div>
    </div>
  );
}

// ============= DASHBOARD VIEW =============
function DashboardView({ stats, posts, likes, shares, comments, follows }) {
  return (
    <>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          title="Total Posts"
          value={stats?.totalPosts || 0}
          icon={<MessageCircle className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Total Likes"
          value={stats?.totalLikes || 0}
          icon={<Heart className="w-5 h-5" />}
          color="red"
        />
        <MetricCard
          title="Shares"
          value={stats?.totalShares || 0}
          icon={<Share2 className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Comments"
          value={stats?.totalComments || 0}
          icon={<MessageCircle className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          title="Follows"
          value={stats?.totalFollows || 0}
          icon={<UserPlus className="w-5 h-5" />}
          color="indigo"
        />
        <MetricCard
          title="Total Views"
          value={stats?.totalViews || 0}
          icon={<Eye className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Engagement Rate"
          value={`${stats?.engagementRate || 0}%`}
          subtitle={`${stats?.usersWithActivity || 0} of ${stats?.totalUsers || 0} users active`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <StatCard
          title="Avg. Post Engagement"
          value={stats?.totalPosts > 0 ? Math.round((stats.totalLikes + stats.totalComments + stats.totalShares) / stats.totalPosts) : 0}
          subtitle="likes + comments + shares"
          icon={<Activity className="w-6 h-6" />}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Network Growth"
          value={`+${stats?.totalFollows || 0}`}
          subtitle="new connections"
          icon={<Users className="w-6 h-6" />}
          color="bg-gradient-to-br from-green-500 to-emerald-500"
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Engaged Posts */}
        <DashboardCard title="🔥 Most Engaged Posts" icon={<TrendingUp className="w-5 h-5" />}>
          <div className="space-y-3">
            {stats?.mostEngagedPosts?.slice(0, 5).map((post, idx) => (
              <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {post.caption || 'No caption'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" /> {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-blue-500" /> {post.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-green-500" /> {post.shares_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gray-500" /> {post.views_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Most Active Users */}
        <DashboardCard title="⭐ Most Active Users" icon={<Users className="w-5 h-5" />}>
          <div className="space-y-3">
            {stats?.mostActiveUsers?.slice(0, 5).map((user, idx) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-600">{user.count}</p>
                  <p className="text-xs text-gray-500">actions</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Recent Activity Timeline */}
        <DashboardCard title="📊 Recent Activity" icon={<Activity className="w-5 h-5" />}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats?.recentActivity?.slice(0, 15).map((activity, idx) => (
              <ActivityTimelineItem key={idx} activity={activity} />
            ))}
          </div>
        </DashboardCard>

        {/* Network Stats */}
        <DashboardCard title="🌐 Network Statistics" icon={<Users className="w-5 h-5" />}>
          <div className="space-y-4">
            <NetworkStat
              label="New Follows (Latest)"
              value={follows.slice(0, 5).length}
              total={stats?.totalFollows}
              color="bg-purple-500"
            />
            <NetworkStat
              label="Active Users Today"
              value={stats?.usersWithActivity || 0}
              total={stats?.totalUsers}
              color="bg-blue-500"
              percentage={stats?.engagementRate}
            />
            <NetworkStat
              label="Posts with Engagement"
              value={posts.filter(p => p.likes_count > 0 || p.comments_count > 0).length}
              total={stats?.totalPosts}
              color="bg-green-500"
            />
            
            {/* Recent Follows */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Recent Follows</h4>
              <div className="space-y-2">
                {follows.slice(0, 5).map(follow => (
                  <div key={follow.id} className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      <span className="font-medium">{follow.follower?.first_name}</span> followed{' '}
                      <span className="font-medium">{follow.following?.first_name}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  );
}

// ============= ACTIVITY VIEW =============
function ActivityView({ posts, likes, shares, comments, follows, stats, subView, setSubView }) {
  return (
    <>
      {/* Activity Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <TabButton
          active={subView === 'overview'}
          onClick={() => setSubView('overview')}
          label="Overview"
        />
        <TabButton
          active={subView === 'posts'}
          onClick={() => setSubView('posts')}
          label={`Posts (${stats?.totalPosts || 0})`}
        />
        <TabButton
          active={subView === 'likes'}
          onClick={() => setSubView('likes')}
          label={`Likes (${stats?.totalLikes || 0})`}
        />
        <TabButton
          active={subView === 'shares'}
          onClick={() => setSubView('shares')}
          label={`Shares (${stats?.totalShares || 0})`}
        />
        <TabButton
          active={subView === 'comments'}
          onClick={() => setSubView('comments')}
          label={`Comments (${stats?.totalComments || 0})`}
        />
        <TabButton
          active={subView === 'follows'}
          onClick={() => setSubView('follows')}
          label={`Follows (${stats?.totalFollows || 0})`}
        />
      </div>

      {/* Activity Content */}
      {subView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Combined Recent Activity */}
          <DashboardCard title="Recent Activity Stream" icon={<Bell className="w-5 h-5" />}>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {stats?.recentActivity?.map((activity, idx) => (
                <ActivityTimelineItem key={idx} activity={activity} />
              ))}
            </div>
          </DashboardCard>

          {/* Quick Stats */}
          <div className="space-y-6">
            <DashboardCard title="Top Performers" icon={<TrendingUp className="w-5 h-5" />}>
              <div className="space-y-3">
                {stats?.mostEngagedPosts?.slice(0, 3).map((post, idx) => (
                  <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm line-clamp-1 mb-2">{post.caption || 'No caption'}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Latest Follows" icon={<UserPlus className="w-5 h-5" />}>
              <div className="space-y-2">
                {follows.slice(0, 5).map(follow => (
                  <div key={follow.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{follow.follower?.first_name}</span>
                      {' → '}
                      <span className="font-medium">{follow.following?.first_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(follow.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {subView === 'posts' && <PostsGrid posts={posts} />}
      {subView === 'likes' && <LikesList likes={likes} />}
      {subView === 'shares' && <SharesList shares={shares} />}
      {subView === 'comments' && <CommentsList comments={comments} />}
      {subView === 'follows' && <FollowsList follows={follows} />}
    </>
  );
}

// ============= PROFILES VIEW =============
function ProfilesView({ musicians, allMusicians, filter, setFilter, searchTerm, setSearchTerm }) {
  return (
    <>
      {/* Profile Filter Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <ProfileStatCard
          label="All Musicians"
          value={allMusicians.length}
          icon={<Users className="w-5 h-5" />}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <ProfileStatCard
          label="Instagram"
          value={allMusicians.filter(m => m.instagram || m.socials?.instagram).length}
          icon={<Instagram className="w-5 h-5" />}
          active={filter === 'instagram'}
          onClick={() => setFilter('instagram')}
        />
        <ProfileStatCard
          label="YouTube"
          value={allMusicians.filter(m => m.youtube).length}
          icon={<Youtube className="w-5 h-5" />}
          active={filter === 'youtube'}
          onClick={() => setFilter('youtube')}
        />
        <ProfileStatCard
          label="Twitter/X"
          value={allMusicians.filter(m => m.twitter || m.socials?.twitter).length}
          icon={<Twitter className="w-5 h-5" />}
          active={filter === 'twitter'}
          onClick={() => setFilter('twitter')}
        />
        <ProfileStatCard
          label="TikTok"
          value={allMusicians.filter(m => m.tiktok || m.socials?.tiktok).length}
          icon={<Instagram className="w-5 h-5" />}
          active={filter === 'tiktok'}
          onClick={() => setFilter('tiktok')}
        />
        <ProfileStatCard
          label="Verified"
          value={allMusicians.filter(m => m.is_verified).length}
          icon={<span className="text-green-500">✓</span>}
          active={filter === 'verified'}
          onClick={() => setFilter('verified')}
        />
        <ProfileStatCard
          label="No Socials"
          value={allMusicians.filter(m => !m.instagram && !m.youtube && !m.twitter && !m.tiktok && !m.socials?.instagram).length}
          icon={<Filter className="w-5 h-5" />}
          active={filter === 'no-socials'}
          onClick={() => setFilter('no-socials')}
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search musicians by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Musicians Grid */}
      {musicians.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
          <Instagram className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No musicians found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try a different search term' : 'No musicians match the selected filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {musicians.map(musician => (
            <MusicianProfileCard key={musician.id} musician={musician} />
          ))}
        </div>
      )}
    </>
  );
}

// ============= HELPER COMPONENTS =============
function NavButton({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition relative ${
        active
          ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-lg'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
      <div className={`${colors[color]} p-2.5 rounded-lg text-white w-fit mb-3`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
        {title}
      </p>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition`}>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-lg">
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-2">{value}</h3>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs opacity-90">{subtitle}</p>
    </div>
  );
}

function DashboardCard({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function NetworkStat({ label, value, total, color, percentage }) {
  const percent = percentage || (total > 0 ? ((value / total) * 100).toFixed(1) : 0);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {value}{total && ` / ${total}`}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percent}%</p>
    </div>
  );
}

function ActivityTimelineItem({ activity }) {
  const config = {
    like: {
      icon: <Heart className="w-4 h-4 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-900/10',
      text: (data) => `${data.user?.first_name} liked a post`
    },
    share: {
      icon: <Share2 className="w-4 h-4 text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-900/10',
      text: (data) => `${data.user?.first_name} shared a post`
    },
    comment: {
      icon: <MessageCircle className="w-4 h-4 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      text: (data) => `${data.user?.first_name} commented on a post`
    },
    follow: {
      icon: <UserPlus className="w-4 h-4 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      text: (data) => `${data.follower?.first_name} followed ${data.following?.first_name}`
    }
  };

  const { icon, bg, text } = config[activity.type] || config.like;

  return (
    <div className={`flex items-start gap-3 p-2.5 ${bg} rounded-lg`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {text(activity.data)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(activity.time).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition whitespace-nowrap ${
        active
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function ProfileStatCard({ label, value, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-left transition hover:shadow-md ${
        active ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div className={`p-2 rounded-lg w-fit mb-2 ${active ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">{label}</div>
    </button>
  );
}

function PostsGrid({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map(post => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {post.user?.first_name?.[0]}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-white">
                {post.user?.first_name} {post.user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
            {post.caption || 'No caption'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes_count}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments_count}</span>
            <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {post.shares_count}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LikesList({ likes }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">All Likes ({likes.length})</h2>
      <div className="space-y-2">
        {likes.map(like => (
          <div key={like.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {like.user?.first_name} {like.user?.last_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {like.post?.caption || 'No caption'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(like.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharesList({ shares }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">All Shares ({shares.length})</h2>
      <div className="space-y-2">
        {shares.map(share => (
          <div key={share.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-start gap-3 mb-2">
              <Share2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {share.user?.first_name} {share.user?.last_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {share.post?.caption || 'No caption'}
                </p>
              </div>
            </div>
            {share.shared_with_caption && (
              <div className="ml-8 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500 rounded">
                <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                  &quot;{share.shared_with_caption}&quot;
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 ml-8 mt-2">
              {new Date(share.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsList({ comments }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">All Comments ({comments.length})</h2>
      <div className="space-y-2">
        {comments.map(comment => (
          <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                  {comment.user?.first_name} {comment.user?.last_name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {comment.content}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  On: {comment.post?.caption || 'Post'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowsList({ follows }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">All Follows ({follows.length})</h2>
      <div className="space-y-2">
        {follows.map(follow => (
          <div key={follow.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <UserPlus className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {follow.follower?.first_name} {follow.follower?.last_name}
                </span>
                <span className="text-gray-600 dark:text-gray-400 mx-2">followed</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {follow.following?.first_name} {follow.following?.last_name}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(follow.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MusicianProfileCard({ musician }) {
  const socials = [
    { 
      name: 'Instagram', 
      handle: musician.instagram || musician.socials?.instagram, 
      url: musician.instagram ? `https://instagram.com/${musician.instagram.replace('@', '')}` : null, 
      icon: <Instagram className="w-4 h-4" />,
      color: 'text-pink-600'
    },
    { 
      name: 'YouTube', 
      handle: musician.youtube, 
      url: musician.youtube, 
      icon: <Youtube className="w-4 h-4" />,
      color: 'text-red-600'
    },
    { 
      name: 'Twitter/X', 
      handle: musician.twitter || musician.socials?.twitter, 
      url: musician.twitter ? `https://twitter.com/${musician.twitter.replace('@', '')}` : null, 
      icon: <Twitter className="w-4 h-4" />,
      color: 'text-blue-500'
    },
    { 
      name: 'TikTok', 
      handle: musician.tiktok || musician.socials?.tiktok, 
      url: musician.tiktok ? `https://tiktok.com/@${musician.tiktok.replace('@', '')}` : null, 
      icon: <span className="text-sm">🎵</span>,
      color: 'text-gray-900'
    }
  ].filter(s => s.handle);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {musician.first_name?.[0]}{musician.last_name?.[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {musician.first_name} {musician.last_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{musician.email}</p>
            </div>
          </div>
          {musician.is_verified && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
              ✓ Verified
            </div>
          )}
        </div>
        {musician.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {musician.bio}
          </p>
        )}
      </div>

      {/* Social Links */}
      <div className="p-5">
        {socials.length > 0 ? (
          <>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
              Social Media
            </h4>
            <div className="space-y-2">
              {socials.map(social => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${social.color} group-hover:scale-110 transition`}>
                      {social.icon}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {social.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        @{social.handle}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 transition" />
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Instagram className="w-8 h-8 mx-auto opacity-50" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">No social media profiles</p>
          </div>
        )}
      </div>
    </div>
  );
}