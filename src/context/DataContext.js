// src/context/DataContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const DataContext = createContext({});

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for different data types
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState({});
  
  // Loading states
  const [loading, setLoading] = useState({
    bookings: false,
    events: false,
    externalEvents: false,
    profile: false,
    wallet: false,
  });
  
  // Use refs for cache timestamps and initialization tracking
  const lastFetch = useRef({
    bookings: null,
    events: null,
    externalEvents: null,
    profile: null,
    wallet: null,
  });

  // Track if initial fetch has been done
  const initialFetchDone = useRef({
    bookings: false,
    events: false,
    externalEvents: false,
    profile: false,
    wallet: false,
  });

  // Track current user ID to detect user changes
  const currentUserId = useRef(null);

  // Helper to check if data needs refresh
  const shouldRefetch = useCallback((dataType) => {
    if (!lastFetch.current[dataType]) return true;
    return Date.now() - lastFetch.current[dataType] > CACHE_DURATION;
  }, []);

  // Reset all data when user changes
  useEffect(() => {
    if (user?.id !== currentUserId.current) {
      console.log('🔄 User changed, resetting data...');
      
      // Reset all state
      setBookings([]);
      setEvents([]);
      setExternalEvents([]);
      setProfile(null);
      setWallet(null);
      setStats({});
      
      // Reset cache timestamps
      lastFetch.current = {
        bookings: null,
        events: null,
        externalEvents: null,
        profile: null,
        wallet: null,
      };
      
      // Reset initial fetch flags
      initialFetchDone.current = {
        bookings: false,
        events: false,
        externalEvents: false,
        profile: false,
        wallet: false,
      };
      
      // Update current user ID
      currentUserId.current = user?.id || null;
    }
  }, [user?.id]);

  // Fetch Bookings
  const fetchBookings = useCallback(async (force = false) => {
    if (!user) {
      console.log('⏭️ No user, skipping bookings fetch');
      return [];
    }

    // Skip if already loading
    if (loading.bookings && !force) {
      console.log('⏭️ Already loading bookings, skipping...');
      return bookings;
    }

    // Skip if data is fresh and not forced
    if (!force && !shouldRefetch('bookings') && initialFetchDone.current.bookings) {
      console.log('✅ Using cached bookings');
      return bookings;
    }

    console.log('📥 Fetching bookings...');
    setLoading(prev => ({ ...prev, bookings: true }));
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:client_id(first_name, last_name, phone, email),
          musician:musician_id(first_name, last_name, phone, email),
          events:event_id(title, description)
        `)
        .or(`musician_id.eq.${user.id},client_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        console.log(`✅ Fetched ${data.length} bookings`);
        setBookings(data);
        lastFetch.current.bookings = Date.now();
        initialFetchDone.current.bookings = true;
        return data;
      } else if (error) {
        console.error('❌ Bookings fetch error:', error);
      }
    } catch (error) {
      console.error('❌ Bookings fetch exception:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
    
    return bookings;
  }, [user, bookings, shouldRefetch, loading.bookings]);

  // Fetch Events
  const fetchEvents = useCallback(async (force = false) => {
    // Skip if already loading
    if (loading.events && !force) {
      console.log('⏭️ Already loading events, skipping...');
      return events;
    }

    // Skip if data is fresh and not forced
    if (!force && !shouldRefetch('events') && initialFetchDone.current.events) {
      console.log('✅ Using cached events');
      return events;
    }

    console.log('📥 Fetching events...');
    setLoading(prev => ({ ...prev, events: true }));
    
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      
      if (result.events) {
        console.log(`✅ Fetched ${result.events.length} events`);
        setEvents(result.events);
        lastFetch.current.events = Date.now();
        initialFetchDone.current.events = true;
        return result.events;
      }
    } catch (error) {
      console.error('❌ Events fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
    
    return events;
  }, [events, shouldRefetch, loading.events]);

  // Fetch External Events
  const fetchExternalEvents = useCallback(async (force = false) => {
    // Skip if already loading
    if (loading.externalEvents && !force) {
      console.log('⏭️ Already loading external events, skipping...');
      return externalEvents;
    }

    // Skip if data is fresh and not forced
    if (!force && !shouldRefetch('externalEvents') && initialFetchDone.current.externalEvents) {
      console.log('✅ Using cached external events');
      return externalEvents;
    }

    console.log('📥 Fetching external events...');
    setLoading(prev => ({ ...prev, externalEvents: true }));
    
    try {
      const response = await fetch('/api/external-events');
      const result = await response.json();
      
      if (result.events) {
        console.log(`✅ Fetched ${result.events.length} external events`);
        setExternalEvents(result.events);
        lastFetch.current.externalEvents = Date.now();
        initialFetchDone.current.externalEvents = true;
        return result.events;
      }
    } catch (error) {
      console.error('❌ External events fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, externalEvents: false }));
    }
    
    return externalEvents;
  }, [externalEvents, shouldRefetch, loading.externalEvents]);

  // Fetch Profile
  const fetchProfile = useCallback(async (force = false) => {
    if (!user) {
      console.log('⏭️ No user, skipping profile fetch');
      return null;
    }

    // Skip if already loading
    if (loading.profile && !force) {
      console.log('⏭️ Already loading profile, skipping...');
      return profile;
    }

    // Skip if data is fresh and not forced
    if (!force && !shouldRefetch('profile') && initialFetchDone.current.profile) {
      console.log('✅ Using cached profile');
      return profile;
    }

    console.log('📥 Fetching profile...');
    setLoading(prev => ({ ...prev, profile: true }));
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        console.log('✅ Fetched profile');
        setProfile(data);
        lastFetch.current.profile = Date.now();
        initialFetchDone.current.profile = true;
        return data;
      } else if (error) {
        console.error('❌ Profile fetch error:', error);
      }
    } catch (error) {
      console.error('❌ Profile fetch exception:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
    
    return profile;
  }, [user, profile, shouldRefetch, loading.profile]);

  // Fetch Wallet (for musicians)
  const fetchWallet = useCallback(async (force = false) => {
    if (!user || user.role !== 'MUSICIAN') {
      console.log('⏭️ Not a musician, skipping wallet fetch');
      return null;
    }

    // Skip if already loading
    if (loading.wallet && !force) {
      console.log('⏭️ Already loading wallet, skipping...');
      return wallet;
    }

    // Skip if data is fresh and not forced
    if (!force && !shouldRefetch('wallet') && initialFetchDone.current.wallet) {
      console.log('✅ Using cached wallet');
      return wallet;
    }

    console.log('📥 Fetching wallet...');
    setLoading(prev => ({ ...prev, wallet: true }));
    
    try {
      const { data, error } = await supabase
        .from('musician_wallets')
        .select('*')
        .eq('musician_id', user.id)
        .single();

      if (!error && data) {
        console.log('✅ Fetched wallet');
        setWallet(data);
        lastFetch.current.wallet = Date.now();
        initialFetchDone.current.wallet = true;
        return data;
      } else if (error && error.code !== 'PGRST116') {
        console.error('❌ Wallet fetch error:', error);
      }
    } catch (error) {
      console.error('❌ Wallet fetch exception:', error);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
    
    return wallet;
  }, [user, wallet, shouldRefetch, loading.wallet]);

  // Calculate Stats (only when bookings or profile changes)
  useEffect(() => {
    if (!bookings || bookings.length === 0 || !user) return;

    const musicianBookings = bookings.filter(b => b.musician_id === user.id);
    
    const newStats = {
      totalGigs: musicianBookings.length,
      completedGigs: musicianBookings.filter(b => b.status === 'completed').length,
      confirmedGigs: musicianBookings.filter(b => b.status === 'confirmed').length,
      pendingGigs: musicianBookings.filter(b => b.status === 'pending').length,
      earnings: musicianBookings.reduce((sum, b) => sum + (parseFloat(b.escrow_amount) || 0), 0),
      rating: profile?.rating || 0,
    };

    setStats(newStats);
  }, [bookings, profile, user]);

  // Initial data fetch - ONLY ONCE on mount with proper user
  useEffect(() => {
    if (!user) return;

    console.log('🚀 Initial data fetch triggered for user:', user.id);

    // Fetch profile first (most critical)
    if (!initialFetchDone.current.profile) {
      fetchProfile();
    }

    // Then fetch other data based on role
    if (!initialFetchDone.current.bookings) {
      fetchBookings();
    }

    if (user.role === 'MUSICIAN') {
      if (!initialFetchDone.current.wallet) {
        fetchWallet();
      }
      if (!initialFetchDone.current.events) {
        fetchEvents();
      }
      if (!initialFetchDone.current.externalEvents) {
        fetchExternalEvents();
      }
    }
    
    // This effect should ONLY run when user ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Invalidate cache (force refresh)
  const invalidateCache = useCallback((dataType) => {
    console.log(`🔄 Invalidating cache for: ${dataType}`);
    lastFetch.current[dataType] = null;
    initialFetchDone.current[dataType] = false;
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all data...');
    
    const promises = [
      fetchBookings(true),
      fetchProfile(true),
    ];

    if (user?.role === 'MUSICIAN') {
      promises.push(
        fetchWallet(true),
        fetchEvents(true),
        fetchExternalEvents(true)
      );
    }

    await Promise.all(promises);
    console.log('✅ All data refreshed');
  }, [user, fetchBookings, fetchProfile, fetchWallet, fetchEvents, fetchExternalEvents]);

  const value = {
    // Data
    bookings,
    events,
    externalEvents,
    profile,
    wallet,
    stats,
    
    // Loading states
    loading,
    
    // Fetch functions
    fetchBookings,
    fetchEvents,
    fetchExternalEvents,
    fetchProfile,
    fetchWallet,
    
    // Utility functions
    invalidateCache,
    refreshAll,
    
    // Manual setters (for optimistic updates)
    setBookings,
    setEvents,
    setProfile,
    setWallet,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};


