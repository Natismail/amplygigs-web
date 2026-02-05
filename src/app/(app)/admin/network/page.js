// src/app/(app)/admin/network/page.js - BUSINESS NETWORK ANALYTICS
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Network, Users, Briefcase, MapPin, TrendingUp, 
  Calendar, DollarSign, Star, Award, Link2, 
  ArrowRight, Globe, Target, BarChart3
} from 'lucide-react';

export default function NetworkAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');
  
  const [stats, setStats] = useState(null);
  const [bookingRelationships, setBookingRelationships] = useState([]);
  const [topMusicians, setTopMusicians] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [growthData, setGrowthData] = useState(null);

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

    await loadNetworkData();
  }

  async function loadNetworkData() {
    try {
      setLoading(true);

      // Get all users with their profiles
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const musicians = allUsers?.filter(u => u.role === 'MUSICIAN') || [];
      const clients = allUsers?.filter(u => u.role === 'CLIENT') || [];

      // Get all bookings with relationships
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          musician:musician_id(id, first_name, last_name, location, city, country),
          client:client_id(id, first_name, last_name, location, city, country)
        `)
        .not('status', 'eq', 'cancelled');

      // Get all events
      const { data: events } = await supabase
        .from('events')
        .select('*');

      // Analyze booking relationships
      const relationshipMap = {};
      bookings?.forEach(booking => {
        const key = `${booking.client_id}-${booking.musician_id}`;
        if (!relationshipMap[key]) {
          relationshipMap[key] = {
            clientId: booking.client_id,
            musicianId: booking.musician_id,
            client: booking.client,
            musician: booking.musician,
            bookingCount: 0,
            totalSpent: 0,
            status: []
          };
        }
        relationshipMap[key].bookingCount++;
        relationshipMap[key].totalSpent += parseFloat(booking.total_amount || 0);
        relationshipMap[key].status.push(booking.status);
      });

      const relationships = Object.values(relationshipMap)
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 20);

      // Top musicians by bookings
      const musicianBookingCount = {};
      bookings?.forEach(booking => {
        const musicianId = booking.musician_id;
        if (!musicianBookingCount[musicianId]) {
          musicianBookingCount[musicianId] = {
            musician: booking.musician,
            bookingCount: 0,
            revenue: 0,
            uniqueClients: new Set(),
            avgRating: 0
          };
        }
        musicianBookingCount[musicianId].bookingCount++;
        musicianBookingCount[musicianId].revenue += parseFloat(booking.total_amount || 0);
        musicianBookingCount[musicianId].uniqueClients.add(booking.client_id);
      });

      const topMusiciansList = Object.values(musicianBookingCount)
        .map(m => ({
          ...m,
          uniqueClients: m.uniqueClients.size
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 10);

      // Top clients by bookings
      const clientBookingCount = {};
      bookings?.forEach(booking => {
        const clientId = booking.client_id;
        if (!clientBookingCount[clientId]) {
          clientBookingCount[clientId] = {
            client: booking.client,
            bookingCount: 0,
            totalSpent: 0,
            uniqueMusicians: new Set()
          };
        }
        clientBookingCount[clientId].bookingCount++;
        clientBookingCount[clientId].totalSpent += parseFloat(booking.total_amount || 0);
        clientBookingCount[clientId].uniqueMusicians.add(booking.musician_id);
      });

      const topClientsList = Object.values(clientBookingCount)
        .map(c => ({
          ...c,
          uniqueMusicians: c.uniqueMusicians.size
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Geographic distribution
      const locationMap = {};
      allUsers?.forEach(user => {
        const location = user.city || user.country || user.location || 'Unknown';
        if (!locationMap[location]) {
          locationMap[location] = {
            location,
            musicians: 0,
            clients: 0,
            total: 0
          };
        }
        locationMap[location].total++;
        if (user.role === 'MUSICIAN') locationMap[location].musicians++;
        if (user.role === 'CLIENT') locationMap[location].clients++;
      });

      const geoData = Object.values(locationMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);

      // Find potential collaborations (musicians booked by same clients)
      const musiciansByClient = {};
      bookings?.forEach(booking => {
        if (!musiciansByClient[booking.client_id]) {
          musiciansByClient[booking.client_id] = new Set();
        }
        musiciansByClient[booking.client_id].add(booking.musician_id);
      });

      const collaborationPairs = {};
      Object.values(musiciansByClient).forEach(musicianSet => {
        const musicians = Array.from(musicianSet);
        for (let i = 0; i < musicians.length; i++) {
          for (let j = i + 1; j < musicians.length; j++) {
            const key = [musicians[i], musicians[j]].sort().join('-');
            collaborationPairs[key] = (collaborationPairs[key] || 0) + 1;
          }
        }
      });

      const collabList = Object.entries(collaborationPairs)
        .map(([key, count]) => {
          const [m1Id, m2Id] = key.split('-');
          const m1 = musicians.find(m => m.id === m1Id);
          const m2 = musicians.find(m => m.id === m2Id);
          return {
            musician1: m1,
            musician2: m2,
            sharedClients: count
          };
        })
        .filter(c => c.musician1 && c.musician2)
        .sort((a, b) => b.sharedClients - a.sharedClients)
        .slice(0, 10);

      // Growth metrics
      const now = new Date();
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
      
      const recentUsers = allUsers?.filter(u => new Date(u.created_at) >= lastMonth) || [];
      const recentBookings = bookings?.filter(b => new Date(b.created_at) >= lastMonth) || [];

      const growth = {
        newMusicians: recentUsers.filter(u => u.role === 'MUSICIAN').length,
        newClients: recentUsers.filter(u => u.role === 'CLIENT').length,
        newBookings: recentBookings.length,
        newRevenue: recentBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0)
      };

      // Calculate comprehensive stats
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0) || 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const repeatClientRate = Object.values(clientBookingCount).filter(c => c.bookingCount > 1).length / clients.length * 100 || 0;
      const networkDensity = totalBookings > 0 ? (totalBookings / (musicians.length * clients.length) * 100) : 0;

      setStats({
        totalUsers: allUsers?.length || 0,
        totalMusicians: musicians.length,
        totalClients: clients.length,
        totalBookings,
        totalRevenue,
        avgBookingValue,
        repeatClientRate: repeatClientRate.toFixed(1),
        networkDensity: networkDensity.toFixed(2),
        activeRelationships: relationships.length,
        totalEvents: events?.length || 0
      });

      setBookingRelationships(relationships);
      setTopMusicians(topMusiciansList);
      setTopClients(topClientsList);
      setGeographicData(geoData);
      setCollaborations(collabList);
      setGrowthData(growth);

      console.log('✅ Network analytics loaded:', {
        users: allUsers?.length,
        bookings: totalBookings,
        relationships: relationships.length,
        collaborations: collabList.length
      });

    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyzing network data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Network className="w-8 h-8" />
            Business Network Analytics
          </h1>
          <p className="text-blue-100">
            Track booking relationships, collaborations, and professional connections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="w-5 h-5" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Musicians"
            value={stats?.totalMusicians || 0}
            icon={<Users className="w-5 h-5" />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Clients"
            value={stats?.totalClients || 0}
            icon={<Briefcase className="w-5 h-5" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Total Bookings"
            value={stats?.totalBookings || 0}
            icon={<Calendar className="w-5 h-5" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Total Revenue"
            value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="bg-green-600"
          />
          <MetricCard
            title="Active Relationships"
            value={stats?.activeRelationships || 0}
            icon={<Link2 className="w-5 h-5" />}
            color="bg-indigo-500"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Avg Booking Value"
            value={`₦${(stats?.avgBookingValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle="per booking"
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-gradient-to-br from-green-500 to-emerald-500"
          />
          <StatCard
            title="Repeat Client Rate"
            value={`${stats?.repeatClientRate || 0}%`}
            subtitle="clients with 2+ bookings"
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Network Density"
            value={`${stats?.networkDensity || 0}%`}
            subtitle="connection saturation"
            icon={<Network className="w-6 h-6" />}
            color="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatCard
            title="Growth This Month"
            value={`+${growthData?.newBookings || 0}`}
            subtitle="new bookings"
            icon={<BarChart3 className="w-6 h-6" />}
            color="bg-gradient-to-br from-orange-500 to-red-500"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <NavButton active={view === 'overview'} onClick={() => setView('overview')} label="Overview" />
          <NavButton active={view === 'relationships'} onClick={() => setView('relationships')} label="Client-Musician Relationships" />
          <NavButton active={view === 'musicians'} onClick={() => setView('musicians')} label="Top Musicians" />
          <NavButton active={view === 'clients'} onClick={() => setView('clients')} label="Top Clients" />
          <NavButton active={view === 'geography'} onClick={() => setView('geography')} label="Geographic Distribution" />
          <NavButton active={view === 'collaborations'} onClick={() => setView('collaborations')} label="Potential Collaborations" />
        </div>

        {/* Views */}
        {view === 'overview' && (
          <OverviewView
            topMusicians={topMusicians}
            topClients={topClients}
            relationships={bookingRelationships}
            collaborations={collaborations}
            growthData={growthData}
          />
        )}

        {view === 'relationships' && <RelationshipsView relationships={bookingRelationships} />}
        {view === 'musicians' && <MusiciansView musicians={topMusicians} />}
        {view === 'clients' && <ClientsView clients={topClients} />}
        {view === 'geography' && <GeographyView data={geographicData} />}
        {view === 'collaborations' && <CollaborationsView collaborations={collaborations} />}
      </div>
    </div>
  );
}

// ============= OVERVIEW VIEW =============
function OverviewView({ topMusicians, topClients, relationships, collaborations, growthData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Musicians */}
      <DashboardCard title="🎵 Top Musicians by Bookings" icon={<Award className="w-5 h-5" />}>
        <div className="space-y-3">
          {topMusicians.slice(0, 5).map((m, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">#{idx + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {m.musician?.first_name} {m.musician?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{m.uniqueClients} unique clients</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-purple-600">{m.bookingCount}</p>
                <p className="text-xs text-gray-500">bookings</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Top Clients */}
      <DashboardCard title="💼 Top Clients by Spending" icon={<Star className="w-5 h-5" />}>
        <div className="space-y-3">
          {topClients.slice(0, 5).map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">#{idx + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {c.client?.first_name} {c.client?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{c.uniqueMusicians} musicians hired</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">₦{c.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{c.bookingCount} bookings</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Strongest Relationships */}
      <DashboardCard title="🤝 Strongest Client-Musician Relationships" icon={<Link2 className="w-5 h-5" />}>
        <div className="space-y-3">
          {relationships.slice(0, 5).map((r, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.client?.first_name} {r.client?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">Client</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.musician?.first_name} {r.musician?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">Musician</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-purple-600 font-semibold">{r.bookingCount} bookings</span>
                <span className="text-green-600 font-semibold">₦{r.totalSpent.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Growth This Month */}
      <DashboardCard title="📈 Growth This Month" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="space-y-4">
          <GrowthMetric
            label="New Musicians"
            value={growthData?.newMusicians || 0}
            icon={<Users className="w-5 h-5 text-purple-600" />}
          />
          <GrowthMetric
            label="New Clients"
            value={growthData?.newClients || 0}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
          />
          <GrowthMetric
            label="New Bookings"
            value={growthData?.newBookings || 0}
            icon={<Calendar className="w-5 h-5 text-orange-600" />}
          />
          <GrowthMetric
            label="New Revenue"
            value={`₦${(growthData?.newRevenue || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
          />
        </div>
      </DashboardCard>
    </div>
  );
}

// ============= OTHER VIEWS =============
function RelationshipsView({ relationships }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Client-Musician Booking Relationships ({relationships.length})
      </h2>
      <div className="space-y-3">
        {relationships.map((r, idx) => (
          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {r.client?.first_name} {r.client?.last_name}
                </p>
                <p className="text-sm text-gray-500">{r.client?.location || r.client?.city || 'Location N/A'}</p>
                <p className="text-xs text-gray-400">Client</p>
              </div>
              <div className="flex-shrink-0">
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {r.musician?.first_name} {r.musician?.last_name}
                </p>
                <p className="text-sm text-gray-500">{r.musician?.location || r.musician?.city || 'Location N/A'}</p>
                <p className="text-xs text-gray-400">Musician</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-purple-600">{r.bookingCount} bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">₦{r.totalSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MusiciansView({ musicians }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Top Musicians by Performance ({musicians.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {musicians.map((m, idx) => (
          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-purple-600">#{idx + 1}</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {m.musician?.first_name} {m.musician?.last_name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500">{m.musician?.location || m.musician?.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-purple-600">{m.bookingCount}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">{m.uniqueClients}</p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">₦{(m.revenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientsView({ clients }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Top Clients by Spending ({clients.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((c, idx) => (
          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-blue-600">#{idx + 1}</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {c.client?.first_name} {c.client?.last_name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500">{c.client?.location || c.client?.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-green-600">₦{(c.totalSpent / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600">{c.bookingCount}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">{c.uniqueMusicians}</p>
                <p className="text-xs text-gray-500">Musicians</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeographyView({ data }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <Globe className="w-6 h-6" />
        Geographic Distribution ({data.length} locations)
      </h2>
      <div className="space-y-3">
        {data.map((loc, idx) => (
          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{loc.location}</h3>
                  <p className="text-sm text-gray-500">{loc.total} total users</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Musicians</span>
                  <span className="font-semibold text-purple-600">{loc.musicians}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(loc.musicians / loc.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Clients</span>
                  <span className="font-semibold text-blue-600">{loc.clients}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(loc.clients / loc.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollaborationsView({ collaborations }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <Target className="w-6 h-6" />
        Potential Collaborations
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Musicians who have been booked by the same clients (potential collaboration opportunities)
      </p>
      <div className="space-y-3">
        {collaborations.map((collab, idx) => (
          <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {collab.musician1?.first_name} {collab.musician1?.last_name}
                </p>
                <p className="text-xs text-gray-500">{collab.musician1?.location || collab.musician1?.city}</p>
              </div>
              <div className="flex-shrink-0 text-center px-4">
                <Link2 className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-purple-600">{collab.sharedClients} shared</p>
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {collab.musician2?.first_name} {collab.musician2?.last_name}
                </p>
                <p className="text-xs text-gray-500">{collab.musician2?.location || collab.musician2?.city}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              These musicians have been hired by {collab.sharedClients} of the same clients
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= HELPER COMPONENTS =============
function MetricCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className={`${color} p-2.5 rounded-lg text-white w-fit mb-3`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{title}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-lg`}>
      <div className="bg-white/20 p-3 rounded-lg w-fit mb-4">{icon}</div>
      <h3 className="text-3xl font-bold mb-2">{value}</h3>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs opacity-90">{subtitle}</p>
    </div>
  );
}

function NavButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
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

function GrowthMetric({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}