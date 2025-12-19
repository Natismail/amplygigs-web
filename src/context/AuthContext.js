//src/context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (supabaseUser) => {
    if (!supabaseUser) {
      console.log('No supabase user provided');
      setUser(null);
      return;
    }

    try {
      console.log('📥 Fetching profile for user:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*') // Select all columns instead of specific ones
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        // If error code is PGRST116, it means no rows found
        if (error.code === 'PGRST116') {
          console.log('⚠️ No profile found, creating new profile...');
          
          // Create a basic profile for the user
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              first_name: supabaseUser.user_metadata?.first_name || '',
              last_name: supabaseUser.user_metadata?.last_name || '',
              role: 'CLIENT', // Default role
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error creating profile:', insertError);
            // Fallback to basic user info
            setUser({ 
              ...supabaseUser, 
              id: supabaseUser.id,
              email: supabaseUser.email,
              role: 'CLIENT',
              first_name: '',
              last_name: ''
            });
          } else {
            console.log('✅ Profile created successfully');
            setUser({ ...supabaseUser, ...newProfile });
          }
        } else {
          console.error('❌ Error fetching profile:', error.message, error);
          // Fallback to basic user info
          setUser({ 
            ...supabaseUser, 
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: 'CLIENT',
            first_name: '',
            last_name: ''
          });
        }
      } else {
        console.log('✅ Profile fetched successfully');
        setUser({ ...supabaseUser, ...profile });
      }
    } catch (err) {
      console.error('❌ Exception in fetchUserProfile:', err);
      // Fallback to basic user info
      setUser({ 
        ...supabaseUser, 
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: 'CLIENT',
        first_name: '',
        last_name: ''
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event || 'INITIAL', session ? 'Session exists' : 'No session');
      
      setSession(session);
      setLoading(true);

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }
        handleAuthStateChange('INITIAL', session);
      })
      .catch(err => {
        console.error('❌ Exception getting session:', err);
        setLoading(false);
      });

    // Set up the real-time listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    // Clean up
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
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

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      console.log('✅ Sign out successful');
      setUser(null);
      setSession(null);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    } finally {
      setLoading(false);
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



