'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // In the AuthProvider component
const fetchUserProfile = async (supabaseUser) => {
  if (!supabaseUser) {
    setUser(null);
    return;
  }
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, email, role, name, bio, youtube, socials, available, profile_picture_url, gadget_specs')
    .eq('id', supabaseUser.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    // Fallback to just the basic user info if profile fetch fails
    setUser({ ...supabaseUser, role: 'CLIENT' });
  } else {
    setUser({ ...supabaseUser, ...profile });
  }
};

  useEffect(() => {
    // This function handles both initial session retrieval and auth state changes
    const handleAuthStateChange = async (event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      setLoading(true);

      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // Get initial session and set up the listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(null, session);
    });

    // Set up the real-time listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Clean up the subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email, password, options = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Manually redirect the user after successful sign-out
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};