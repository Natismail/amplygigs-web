//src/context/AuthContext.js - WITH REFRESH USER
'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  


    // Tracks which user id we've already loaded — prevents redundant fetches
  const loadedUserId = useRef(null);



  // ── Inactivity logout ─────────────────────────────────────────────────────
const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const inactivityTimer = useRef(null);
const WARNING_BEFORE  = 60 * 1000;          // warn 1 min before logout
const [showInactivityWarning, setShowInactivityWarning] = useState(false);
const warningTimer = useRef(null);

const resetInactivityTimer = useCallback(() => {
  // Only run if user is logged in
  if (!loadedUserId.current) return;

  // Clear existing timers
  clearTimeout(inactivityTimer.current);
  clearTimeout(warningTimer.current);
  setShowInactivityWarning(false);

  // Set warning timer (fires 1 min before logout)
  warningTimer.current = setTimeout(() => {
    setShowInactivityWarning(true);
  }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

  // Set logout timer
  inactivityTimer.current = setTimeout(async () => {
    console.log("⏱️ Inactivity timeout — signing out");
    setShowInactivityWarning(false);
    await signOut();
    // Redirect to login
    window.location.href = "/login?reason=inactivity";
  }, INACTIVITY_TIMEOUT);
}, []);  // signOut added below after it's defined

// Attach activity listeners when user logs in, remove on logout
useEffect(() => {
  if (!user) {
    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
    setShowInactivityWarning(false);
    return;
  }

  const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
  events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
  
  // Start the timer immediately on login
  resetInactivityTimer();

  return () => {
    events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
  };
}, [user, resetInactivityTimer]);


  // ── Fetch + merge profile from user_profiles ─────────────────────────────
  const fetchUserProfile = useCallback(async (supabaseUser) => {
    if (!supabaseUser) {
      setUser(null);
      loadedUserId.current = null;
      return;
    }

    // Skip if we already loaded this user's profile
    if (loadedUserId.current === supabaseUser.id) {
      console.log('⏭️ Profile already loaded for:', supabaseUser.id);
      return;
    }

    console.log('📥 Fetching profile for:', supabaseUser.id);

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile row yet — create it
        console.log('⚠️ No profile found, creating...');

        const meta = supabaseUser.user_metadata ?? {};
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id:         supabaseUser.id,
            email:      supabaseUser.email,
            phone:      meta.phone      ?? '',
            first_name: meta.first_name ?? meta.given_name  ?? '',
            last_name:  meta.last_name  ?? meta.family_name ?? '',
            // ⚠️ PRESERVE role from metadata — never default to CLIENT for OAuth
            role:       meta.role ?? 'CLIENT',
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Profile insert error:', insertError);
          // Merge with what we know — do NOT override role here
          setUser({ ...supabaseUser });
        } else {
          console.log('✅ Profile created:', newProfile.role);
          // ✅ Normalize role to lowercase before merging
          setUser({ ...supabaseUser, ...newProfile, role: (newProfile.role ?? '').toLowerCase() });
          loadedUserId.current = supabaseUser.id;
        }

      } else if (error) {
        console.error('❌ Profile fetch error:', error);
        // Don't set a fake role — leave role undefined so pages query DB themselves
        setUser({ ...supabaseUser });

      } else {
        console.log('✅ Profile fetched, role:', profile.role);
        // ✅ Always normalize role to lowercase so comparisons work everywhere
        setUser({ ...supabaseUser, ...profile, role: (profile.role ?? '').toLowerCase() });
        loadedUserId.current = supabaseUser.id;
      }
    } catch (err) {
      console.error('❌ fetchUserProfile exception:', err);
      setUser({ ...supabaseUser });
    }
  }, []); // No dependencies — avoids infinite loops

  // ── Refresh profile (call after profile picture / name updates) ───────────
  const refreshUser = useCallback(async () => {
    if (!session?.user) return;
    console.log('🔄 Refreshing profile...');

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) { console.error('❌ Refresh error:', error); return; }

      setUser({ ...session.user, ...profile, role: (profile.role ?? '').toLowerCase() });
      console.log('✅ Profile refreshed');
    } catch (err) {
      console.error('❌ refreshUser exception:', err);
    }
  }, [session]);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event, newSession) => {
      if (!mounted) return;

      console.log('🔐 Auth event:', event ?? 'INITIAL', newSession ? '(session)' : '(no session)');
      setSession(newSession);

      if (newSession?.user) {
        if (loadedUserId.current !== newSession.user.id) {
          setLoading(true);
          await fetchUserProfile(newSession.user);
        }
      } else {
        setUser(null);
        loadedUserId.current = null;
      }

      if (mounted) setLoading(false);
    };

    // Load initial session
    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (error) {
          console.error('❌ getSession error:', error);
          setLoading(false);
          return;
        }
        handleAuthStateChange('INITIAL', initialSession);
      })
      .catch((err) => {
        console.error('❌ getSession exception:', err);
        setLoading(false);
      });

    // Real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Ignore duplicate SIGNED_IN (e.g. tab re-focus)
      if (event === 'SIGNED_IN' && loadedUserId.current === newSession?.user?.id) {
        console.log('⏭️ Duplicate SIGNED_IN ignored');
        setSession(newSession);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        loadedUserId.current = null;
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        return;
      }

      await handleAuthStateChange(event, newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);


  // // ✅ Track if we've already loaded this user's profile
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, options = {}) => {
    try {
      setLoading(true);
      console.log('📝 Attempting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          data: {
            ...options.data,
          }
        },
      });
      
      if (error) throw error;
      
      console.log('✅ Sign up successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async ({ global = false } = {}) => {
  try {
    setLoading(true);
    console.log('👋 Signing out...');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('⚠️ No active session');
      cleanup();
      return { error: null };
    }

    const { error } = await supabase.auth.signOut(
      global ? { scope: 'global' } : undefined
    );

    if (error) throw error;

    cleanup();
    console.log('✅ Signed out');
    return { error: null };

  } catch (error) {
    console.error('❌ Sign out error:', error);
    cleanup();
    return { error };
  } finally {
    setLoading(false);
  }
};

const cleanup = () => {
  setUser(null);
  setSession(null);
  loadedUserId.current = null;
};

// Add stayLoggedIn handler
const stayLoggedIn = useCallback(() => {
  setShowInactivityWarning(false);
  resetInactivityTimer();
}, [resetInactivityTimer]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,  // ✅ Added refreshUser to context
    showInactivityWarning,  // ← add
    stayLoggedIn,           // ← add
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

