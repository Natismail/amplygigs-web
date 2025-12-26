// src/app/(app)/network/page.js (NEW - FOR DISCOVERING MUSICIANS/USERS)
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserProfileCard from '@/components/social/UserProfileCard';
import { Search, Users, Music } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

export default function NetworkPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, musicians, clients

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('followers_count', { ascending: false })
      .limit(100);

    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    }
    
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = users;

    // Filter by role
    if (activeFilter === 'musicians') {
      filtered = filtered.filter(u => u.role === 'MUSICIAN');
    } else if (activeFilter === 'clients') {
      filtered = filtered.filter(u => u.role === 'CLIENT');
    }

    // Search by name
    if (searchQuery) {
      filtered = filtered.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.primary_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRefresh = async () => {
    console.log('🔄 Refreshing profile...');
    await fetchUsers();
  };

  return (
        <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            👥 Network
          </h1>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, or location..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users
            </button>
            <button
              onClick={() => setActiveFilter('musicians')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeFilter === 'musicians'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Music className="w-4 h-4" />
              Musicians
            </button>
            <button
              onClick={() => setActiveFilter('clients')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeFilter === 'clients'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Clients
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Users Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Found {filteredUsers.length} users
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserProfileCard key={user.id} user={user} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
        </PullToRefresh>
  );
}

