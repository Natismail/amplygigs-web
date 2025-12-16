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
  
  // Use refs for cache timestamps to avoid dependency issues
  const lastFetch = useRef({
    bookings: null,
    events: null,
    externalEvents: null,
    profile: null,
    wallet: null,
  });

  // Helper to check if data needs refresh
  const shouldRefetch = useCallback((dataType) => {
    if (!lastFetch.current[dataType]) return true;
    return Date.now() - lastFetch.current[dataType] > CACHE_DURATION;
  }, []);

  // Fetch Bookings
  const fetchBookings = useCallback(async (force = false) => {
    if (!user) return [];
    if (!force && !shouldRefetch('bookings')) {
      return bookings;
    }

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
        setBookings(data);
        lastFetch.current.bookings = Date.now();
        return data;
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
    return bookings;
  }, [user, bookings, shouldRefetch]);

  // Fetch Events
  const fetchEvents = useCallback(async (force = false) => {
    if (!force && !shouldRefetch('events')) {
      return events;
    }

    setLoading(prev => ({ ...prev, events: true }));
    
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      
      if (result.events) {
        setEvents(result.events);
        lastFetch.current.events = Date.now();
        return result.events;
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
    return events;
  }, [events, shouldRefetch]);

  // Fetch External Events
  const fetchExternalEvents = useCallback(async (force = false) => {
    if (!force && !shouldRefetch('externalEvents')) {
      return externalEvents;
    }

    setLoading(prev => ({ ...prev, externalEvents: true }));
    
    try {
      const response = await fetch('/api/external-events');
      const result = await response.json();
      
      if (result.events) {
        setExternalEvents(result.events);
        lastFetch.current.externalEvents = Date.now();
        return result.events;
      }
    } catch (error) {
      console.error('Error fetching external events:', error);
    } finally {
      setLoading(prev => ({ ...prev, externalEvents: false }));
    }
    return externalEvents;
  }, [externalEvents, shouldRefetch]);

  // Fetch Profile
  const fetchProfile = useCallback(async (force = false) => {
    if (!user) return null;
    if (!force && !shouldRefetch('profile')) {
      return profile;
    }

    setLoading(prev => ({ ...prev, profile: true }));
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        lastFetch.current.profile = Date.now();
        return data;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
    return profile;
  }, [user, profile, shouldRefetch]);

  // Fetch Wallet (for musicians)
  const fetchWallet = useCallback(async (force = false) => {
    if (!user || user.role !== 'MUSICIAN') return null;
    if (!force && !shouldRefetch('wallet')) {
      return wallet;
    }

    setLoading(prev => ({ ...prev, wallet: true }));
    
    try {
      const { data, error } = await supabase
        .from('musician_wallets')
        .select('*')
        .eq('musician_id', user.id)
        .single();

      if (!error && data) {
        setWallet(data);
        lastFetch.current.wallet = Date.now();
        return data;
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
    return wallet;
  }, [user, wallet, shouldRefetch]);

  // Calculate Stats
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

  // Auto-fetch on user change
  useEffect(() => {
    if (user) {
      // Only fetch if data is stale or missing
      if (!profile || shouldRefetch('profile')) {
        fetchProfile();
      }
      if (bookings.length === 0 || shouldRefetch('bookings')) {
        fetchBookings();
      }
      if (user.role === 'MUSICIAN') {
        if (!wallet || shouldRefetch('wallet')) {
          fetchWallet();
        }
        if (events.length === 0 || shouldRefetch('events')) {
          fetchEvents();
        }
        if (externalEvents.length === 0 || shouldRefetch('externalEvents')) {
          fetchExternalEvents();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user

  // Invalidate cache (force refresh)
  const invalidateCache = useCallback((dataType) => {
    lastFetch.current[dataType] = null;
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
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