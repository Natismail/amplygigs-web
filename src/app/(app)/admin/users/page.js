// src/app/(app)/admin/users/page.js
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Filter, MoreVertical, Mail, 
  Phone, MapPin, CheckCircle, XCircle, Ban,
  UserCheck, Crown, Music, User as UserIcon,
  Calendar, DollarSign, Eye, Edit
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  async function checkAdminAndLoad() {
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile, error } = await supabase
  .from('user_profiles')
  .select('role, is_admin')
  .eq('id', user.id)
  .single();

if (error || (!profile?.is_admin && profile?.role !== 'ADMIN')) {
  router.push('/');
  return;
}


    await loadUsers();
  }

  async function loadUsers() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          verification_status,
          available,
          profile_picture_url,
          bio,
          location,
          socials,
          youtube,
          is_admin,
          is_support,
          is_verified,
          is_suspended,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Loaded users:', data?.length || 0);

      // Enhance with stats in smaller batches
      const enhancedUsers = [];
      
      for (const u of data || []) {
        let stats = { bookings: 0, earnings: 0 };

        try {
          if (u.role === 'MUSICIAN') {
            // Get booking count
            const { count: bookingCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('musician_id', u.id);

            // Get completed bookings
            const { count: completedCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('musician_id', u.id)
              .eq('status', 'completed');

            // Get wallet info
            const { data: wallet } = await supabase
              .from('musician_wallets')
              .select('total_earned, available_balance')
              .eq('musician_id', u.id)
              .maybeSingle();

            stats = {
              bookings: bookingCount || 0,
              completedBookings: completedCount || 0,
              earnings: wallet?.total_earned || 0,
              available: wallet?.available_balance || 0
            };
          } else if (u.role === 'CLIENT') {
            // Get booking count and spending
            const { data: bookings } = await supabase
              .from('bookings')
              .select('id, amount')
              .eq('client_id', u.id);

            stats = {
              bookings: bookings?.length || 0,
              spent: bookings?.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0) || 0
            };
          }
        } catch (statsError) {
          console.warn(`⚠️ Error loading stats for user ${u.id}:`, statsError);
          // Continue with empty stats
        }

        enhancedUsers.push({ ...u, stats });
      }

      //setUsers(enhancedUsers);

      const normalizedUsers = enhancedUsers.map(u => ({
  ...u,
  verification_status:
    u.verification_status ??
    (u.is_suspended ? 'suspended' :
     u.is_verified ? 'verified' : 'pending')
}));

setUsers(normalizedUsers);

    } catch (error) {
      console.error('❌ Error loading users:', error);
      alert('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.first_name?.toLowerCase().includes(search) ||
        u.last_name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.phone?.includes(search)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

   if (statusFilter !== 'ALL') {
  filtered = filtered.filter(u => u.verification_status === statusFilter.toLowerCase());
}


    setFilteredUsers(filtered);
  }



//   async function handleAction(userId, action) {
//     try {
//       let update = {};

      

// switch (action) {
//   case 'verify':
//     update = {
//       verification_status: 'verified',
//       account_status: 'active'
//     };
//     break;

//   case 'suspend':
//     update = {
//       account_status: 'suspended',
//       available: false,
//       suspended_at: new Date().toISOString(),
//       suspended_by: user.id
//     };
//     break;

//   case 'activate':
//     update = {
//       account_status: 'active',
//       available: true,
//       suspended_at: null,
//       suspended_by: null
//     };
//     break;

//   case 'make_admin':
//     update = {
//       is_admin: true,
//       role: 'ADMIN'
//     };
//     break;

//   default:
//     return;
// }

// // if (error) {
// //   console.error('Supabase update failed:', error);
// //   throw error;
// // }
//       const { error } = await supabase
//         .from('user_profiles')
//         .update(update)
//         .eq('id', userId);




  //     if (error) throw error;

  //     // Log action
  //     await supabase.from('admin_actions').insert({
  //       admin_id: user.id,
  //       action_type: action,
  //       target_user_id: userId,
  //       target_type: 'user_profile',
  //       target_id: userId,
  //       details: { action, update },
  //       reason: `Admin ${action} action`
  //     });

  //     await loadUsers();
  //     alert('Action completed successfully!');
  //   } catch (error) {
  //     console.error('Error:', error);
  //     alert('Action failed: ' + error.message);
  //   }
  // }


async function handleAction(userId, action) {
  try {
    console.log('🔄 Performing action:', action, 'on user:', userId);

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('Session expired. Please log in again.');
      router.push('/login');
      return;
    }

    // Make API call with auth token in header
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`  // ✅ Add auth token
      },
      body: JSON.stringify({ userId, action })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Action failed');
    }

    console.log('✅ Action completed:', result);
    await loadUsers();
    alert('Action completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Action failed: ' + error.message);
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className=" bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 dark:bg-gray-900 bg-white dark:text-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-6">
       <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                👥 User Management
              </h1>
              <p className="text-purple-600 dark:text-gray-400 mt-1">
                Manage all platform users, roles, and permissions
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white-600">
                {filteredUsers.length}
              </div>
              <div className="text-sm text-gray-50">Total Users</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Total Users"
              value={users.length}
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <StatBox
              label="Musicians"
              value={users.filter(u => u.role === 'MUSICIAN').length}
              icon={<Music className="w-5 h-5" />}
              color="purple"
            />
            <StatBox
              label="Clients"
              value={users.filter(u => u.role === 'CLIENT').length}
              icon={<UserIcon className="w-5 h-5" />}
              color="green"
            />
            <StatBox
              label="Admins"
              value={users.filter(u => u.role === 'ADMIN').length}
              icon={<Crown className="w-5 h-5" />}
              color="yellow"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Roles</option>
              <option value="MUSICIAN">Musicians</option>
              <option value="CLIENT">Clients</option>
              <option value="ADMIN">Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Stats</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onAction={handleAction}
                    onView={() => {
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

// Components
function StatBox({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`${colors[color]} p-2 rounded-lg text-white`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onAction, onView }) {
  const [showMenu, setShowMenu] = useState(false);

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'MUSICIAN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'CLIENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
  {user.profile_picture_url ? (
    <img
      src={user.profile_picture_url}
      alt="Profile"
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="w-full h-full flex items-center justify-center text-white font-semibold bg-gradient-to-r from-purple-500 to-purple-600">
      {user.first_name?.[0]}
      {user.last_name?.[0]}
    </span>
  )}
</div>

          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.verification_status)}`}>
          {user.verification_status || 'unverified'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          {user.role === 'MUSICIAN' && (
            <>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.stats?.completedBookings || 0} gigs
              </div>
              <div className="text-gray-500">
                ₦{user.stats?.earnings?.toLocaleString() || 0} earned
              </div>
            </>
          )}
          {user.role === 'CLIENT' && (
            <>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.stats?.bookings || 0} bookings
              </div>
              <div className="text-gray-500">
                ₦{user.stats?.spent?.toLocaleString() || 0} spent
              </div>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              {user.verification_status !== 'verified' && (
                <button
                  onClick={() => {
                    onAction(user.id, 'verify');
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify User
                </button>
              )}
              {user.verification_status !== 'suspended' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to suspend this user?')) {
                      onAction(user.id, 'suspend');
                      setShowMenu(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                >
                  <Ban className="w-4 h-4" />
                  Suspend User
                </button>
              )}
              {user.verification_status === 'suspended' && (
                <button
                  onClick={() => {
                    onAction(user.id, 'activate');
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
                >
                  <UserCheck className="w-4 h-4" />
                  Activate User
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function UserDetailModal({ user, onClose, onAction }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Name" value={`${user.first_name} ${user.last_name}`} />
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Phone" value={user.phone || 'N/A'} />
              <InfoItem label="Role" value={user.role} />
              <InfoItem label="Status" value={user.verification_status || 'unverified'} />
              <InfoItem label="Available" value={user.available ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Social Media */}
          {user.socials && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Social Media</h3>
              <div className="space-y-2">
                {user.socials.instagram && (
                  <div className="text-sm">
                    <span className="text-gray-500">Instagram:</span>
                    <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" className="ml-2 text-purple-600 hover:underline">
                      @{user.socials.instagram}
                    </a>
                  </div>
                )}
                {user.youtube && (
                  <div className="text-sm">
                    <span className="text-gray-500">YouTube:</span>
                    <a href={user.youtube} target="_blank" className="ml-2 text-purple-600 hover:underline">
                      {user.youtube}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {user.stats && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {user.role === 'MUSICIAN' && (
                  <>
                    <InfoItem label="Total Bookings" value={user.stats.bookings || 0} />
                    <InfoItem label="Completed Gigs" value={user.stats.completedBookings || 0} />
                    <InfoItem label="Total Earned" value={`₦${user.stats.earnings?.toLocaleString() || 0}`} />
                    <InfoItem label="Available Balance" value={`₦${user.stats.available?.toLocaleString() || 0}`} />
                  </>
                )}
                {user.role === 'CLIENT' && (
                  <>
                    <InfoItem label="Total Bookings" value={user.stats.bookings || 0} />
                    <InfoItem label="Total Spent" value={`₦${user.stats.spent?.toLocaleString() || 0}`} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bio</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onAction(user.id, 'verify');
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Verify
            </button>
            <button
              onClick={() => {
                if (confirm('Suspend this user?')) {
                  onAction(user.id, 'suspend');
                  onClose();
                }
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Suspend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}



//       <div className="max-w-7xl mx-auto p-6">
//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <StatCard
//             label="Total Users"
//             value={users.length}
//             icon="👥"
//             color="blue"
//           />
//           <StatCard
//             label="Musicians"
//             value={users.filter(u => u.role === 'MUSICIAN').length}
//             icon="🎵"
//             color="purple"
//           />
//           <StatCard
//             label="Clients"
//             value={users.filter(u => u.role === 'CLIENT').length}
//             icon="👤"
//             color="green"
//           />
//           <StatCard
//             label="Suspended"
//             value={users.filter(u => u.is_suspended).length}
//             icon="🚫"
//             color="red"
//           />
//         </div>

//         {/* Filters */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search users..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
//               />
//             </div>

//             {/* Role Filter */}
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//               <select
//                 value={roleFilter}
//                 onChange={(e) => setRoleFilter(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
//               >
//                 <option value="ALL">All Roles</option>
//                 <option value="CLIENT">Clients</option>
//                 <option value="MUSICIAN">Musicians</option>
//                 <option value="ADMIN">Admins</option>
//               </select>
//             </div>

//             {/* Status Filter */}
//             <div>
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
//               >
//                 <option value="ALL">All Status</option>
//                 <option value="ACTIVE">Active</option>
//                 <option value="SUSPENDED">Suspended</option>
//                 <option value="VERIFIED">Verified</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Users Table */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Joined</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredUsers.map((userProfile) => (
//                   <tr key={userProfile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
//                     <td className="px-6 py-4">
//                       <div>
//                         <div className="font-medium text-gray-900 dark:text-white">
//                           {userProfile.first_name} {userProfile.last_name}
//                           {userProfile.is_admin && <span className="ml-2 text-xs">👑</span>}
//                           {userProfile.is_support && !userProfile.is_admin && <span className="ml-2 text-xs">🛠️</span>}
//                         </div>
//                         <div className="text-sm text-gray-500 dark:text-gray-400">{userProfile.email}</div>
//                         {userProfile.phone && (
//                           <div className="text-sm text-gray-500 dark:text-gray-400">{userProfile.phone}</div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                         userProfile.role === 'MUSICIAN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
//                         userProfile.role === 'CLIENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
//                         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
//                       }`}>
//                         {userProfile.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex flex-col gap-1">
//                         {userProfile.is_suspended && (
//                           <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium">
//                             🚫 Suspended
//                           </span>
//                         )}
//                         {userProfile.is_verified && (
//                           <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
//                             ✅ Verified
//                           </span>
//                         )}
//                         {!userProfile.is_suspended && !userProfile.is_verified && (
//                           <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs font-medium">
//                             Active
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
//                       {new Date(userProfile.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => handleToggleSuspend(userProfile.id, userProfile.is_suspended)}
//                           disabled={processing === userProfile.id || userProfile.id === user.id}
//                           className={`p-2 rounded-lg ${
//                             userProfile.is_suspended
//                               ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
//                               : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
//                           } disabled:opacity-50 disabled:cursor-not-allowed`}
//                           title={userProfile.is_suspended ? 'Unsuspend' : 'Suspend'}
//                         >
//                           <Ban className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleToggleAdmin(userProfile.id, userProfile.is_admin)}
//                           disabled={processing === userProfile.id || userProfile.id === user.id}
//                           className={`p-2 rounded-lg ${
//                             userProfile.is_admin
//                               ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200'
//                               : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
//                           } disabled:opacity-50 disabled:cursor-not-allowed`}
//                           title={userProfile.is_admin ? 'Remove Admin' : 'Make Admin'}
//                         >
//                           <Shield className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleToggleSupport(userProfile.id, userProfile.is_support)}
//                           disabled={processing === userProfile.id || userProfile.id === user.id}
//                           className={`p-2 rounded-lg ${
//                             userProfile.is_support
//                               ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
//                               : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
//                           } disabled:opacity-50 disabled:cursor-not-allowed`}
//                           title={userProfile.is_support ? 'Remove Support' : 'Make Support'}
//                         >
//                           <UserPlus className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {filteredUsers.length === 0 && (
//             <div className="text-center py-12">
//               <div className="text-6xl mb-4">🔍</div>
//               <p className="text-gray-600 dark:text-gray-400">No users found</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatCard({ label, value, icon, color }) {
//   const colorClasses = {
//     blue: 'from-blue-500 to-blue-600',
//     purple: 'from-purple-500 to-purple-600',
//     green: 'from-green-500 to-green-600',
//     red: 'from-red-500 to-red-600',
//   };

//   return (
//     <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg`}>
//       <div className="text-3xl mb-2">{icon}</div>
//       <div className="text-2xl font-bold mb-1">{value}</div>
//       <div className="text-sm opacity-90">{label}</div>
//     </div>
//   );
// }