// src/app/admin/users/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Search, Filter, UserPlus, Shield, Ban, Mail } from 'lucide-react';

export default function UsersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    filterUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, statusFilter, users]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    if (error || !data?.is_admin) {
      alert('Access denied. Admin privileges required.');
      router.push('/admin/dashboard');
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      filtered = filtered.filter(u => !u.is_suspended);
    } else if (statusFilter === 'SUSPENDED') {
      filtered = filtered.filter(u => u.is_suspended);
    } else if (statusFilter === 'VERIFIED') {
      filtered = filtered.filter(u => u.is_verified);
    }

    setFilteredUsers(filtered);
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) {
      return;
    }

    setProcessing(userId);

    try {
      await supabase
        .from('user_profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', userId);

      // Log action
      await supabase.from('admin_actions').insert({
        action_type: currentStatus ? 'user_unsuspend' : 'user_suspend',
        target_user_id: userId,
        target_type: 'user',
        target_id: userId,
      });

      alert(`User ${currentStatus ? 'unsuspended' : 'suspended'} successfully`);
      fetchUsers();
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) {
      return;
    }

    setProcessing(userId);

    try {
      await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      // Log action
      await supabase.from('admin_actions').insert({
        action_type: currentStatus ? 'admin_revoke' : 'admin_grant',
        target_user_id: userId,
        target_type: 'user',
        target_id: userId,
      });

      alert(`Admin privileges ${currentStatus ? 'revoked' : 'granted'} successfully`);
      fetchUsers();
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleSupport = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} support privileges?`)) {
      return;
    }

    setProcessing(userId);

    try {
      await supabase
        .from('user_profiles')
        .update({ is_support: !currentStatus })
        .eq('id', userId);

      // Log action
      await supabase.from('admin_actions').insert({
        action_type: currentStatus ? 'support_revoke' : 'support_grant',
        target_user_id: userId,
        target_type: 'user',
        target_id: userId,
      });

      alert(`Support privileges ${currentStatus ? 'revoked' : 'granted'} successfully`);
      fetchUsers();
    } catch (error) {
      alert('Action failed: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">👥 User Management</h1>
          <p className="text-purple-100">Manage all users, roles, and permissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Users"
            value={users.length}
            icon="👥"
            color="blue"
          />
          <StatCard
            label="Musicians"
            value={users.filter(u => u.role === 'MUSICIAN').length}
            icon="🎵"
            color="purple"
          />
          <StatCard
            label="Clients"
            value={users.filter(u => u.role === 'CLIENT').length}
            icon="👤"
            color="green"
          />
          <StatCard
            label="Suspended"
            value={users.filter(u => u.is_suspended).length}
            icon="🚫"
            color="red"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="CLIENT">Clients</option>
                <option value="MUSICIAN">Musicians</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((userProfile) => (
                  <tr key={userProfile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {userProfile.first_name} {userProfile.last_name}
                          {userProfile.is_admin && <span className="ml-2 text-xs">👑</span>}
                          {userProfile.is_support && !userProfile.is_admin && <span className="ml-2 text-xs">🛠️</span>}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{userProfile.email}</div>
                        {userProfile.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{userProfile.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userProfile.role === 'MUSICIAN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        userProfile.role === 'CLIENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {userProfile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {userProfile.is_suspended && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium">
                            🚫 Suspended
                          </span>
                        )}
                        {userProfile.is_verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                            ✅ Verified
                          </span>
                        )}
                        {!userProfile.is_suspended && !userProfile.is_verified && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleSuspend(userProfile.id, userProfile.is_suspended)}
                          disabled={processing === userProfile.id || userProfile.id === user.id}
                          className={`p-2 rounded-lg ${
                            userProfile.is_suspended
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={userProfile.is_suspended ? 'Unsuspend' : 'Suspend'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(userProfile.id, userProfile.is_admin)}
                          disabled={processing === userProfile.id || userProfile.id === user.id}
                          className={`p-2 rounded-lg ${
                            userProfile.is_admin
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={userProfile.is_admin ? 'Remove Admin' : 'Make Admin'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleSupport(userProfile.id, userProfile.is_support)}
                          disabled={processing === userProfile.id || userProfile.id === user.id}
                          className={`p-2 rounded-lg ${
                            userProfile.is_support
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={userProfile.is_support ? 'Remove Support' : 'Make Support'}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}