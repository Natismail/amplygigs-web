// //src/app/login/page.js

// src/app/login/page.js
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Logo, { LogoIconOnly, LogoWithText, LogoLight } from '@/components/Logo';


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, signIn, loading: authLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false); // Add this state

  // // Redirect if already logged in
  // useEffect(() => {
  //   if (!authLoading && user) {
  //     handleRedirectAfterLogin(user);
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user, authLoading, router]);


  // Redirect if already logged in
useEffect(() => {
  if (!authLoading && user && !hasRedirected) {
    setHasRedirected(true); // Prevent multiple redirects
    handleRedirectAfterLogin(user);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, authLoading]);

  const handleRedirectAfterLogin = async (currentUser) => {
    console.log('🔄 Redirecting user:', currentUser);
    
    try {
      // Fetch fresh user data to check role
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, is_admin, is_support')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        router.push('/client/home'); // Default fallback
        return;
      }

      console.log('👤 User profile:', profile);

      // Redirect based on role
      if (profile.is_admin || profile.role === 'ADMIN') {
        console.log('👑 Redirecting to admin dashboard');
        router.push('/admin/dashboard');
      } else if (profile.is_support || profile.role === 'SUPPORT') {
        console.log('🛠️ Redirecting to support dashboard');
        router.push('/admin/dashboard');
      } else if (profile.role === 'MUSICIAN') {
        console.log('🎵 Redirecting to musician dashboard');
        router.push('/musician/dashboard');
      } else {
        console.log('👤 Redirecting to client home');
        router.push('/client/home');
      }
    } catch (err) {
      console.error('Error in redirect logic:', err);
      router.push('/client/home');
    }
  };

  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🔐 Attempting login for:', email);
      
      // Use signIn from AuthContext if available, otherwise direct Supabase call
      const result = signIn 
        ? await signIn(email, password)
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ Login successful');
      // The useEffect will handle the redirect
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const handleSocialLogin = async (provider) => {
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider,
  //       options: { redirectTo: window.location.origin },
  //     });
      
  //     if (error) throw error;
  //   } catch (err) {
  //     console.error('Social login error:', err);
  //     setError("Social login failed. Please try again.");
  //   }
  // };



// Update only the handleSocialLogin function in your login page

const handleSocialLogin = async (provider) => {
  try {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'https://amplygigs-web.vercel.app/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { 
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
    
    if (error) throw error;
  } catch (err) {
    console.error('Social login error:', err);
    setError("Social login failed. Please try again.");
  }
};


  // Show loading state while checking auth
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-cover bg-center bg-no-repeat bg-black/60"
      style={{
        backgroundImage:
          // linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
           "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      {/* <div className="max-w-md w-full p-6 sm:p-8 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-2xl shadow-2xl"> */}
        
        <div className="max-w-sm w-full p-6 sm:p-6 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 rounded-lg shadow-2xl">{/* Header */}
        <div className="text-center justify-item-center mb-6 sm:mb-8">
          <div className=" flex flex-row">
          {/* <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🎵</div> */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 sm:mb-2 mt-4 px-2">
             Welcome Back!!!
             {/* 🎵 */}
          </h1>
          <Logo size="lg" showText={false} className="mt-2"/>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Sign in to AmplyGigs
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-2 sm:space-y-2 -mt-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="•••••••••••••••••••"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-1.5 sm:py-2 text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="-mt-1 sm:mt-0 mb-5 sm:mb-6 flex items-center">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 -mt-4 sm:-mt-6">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="flex-1 py-1 sm:py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Image
              src="/images/google.svg"
              alt="Google"
              className="w-4 h-4 sm:w-5 sm:h-5"
              width={20}
              height={20}
            />
            <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
            className="flex-1 py-1 sm:py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Image
              src="/images/facebook.svg"
              alt="Facebook"
              className="w-4 h-4 sm:w-5 sm:h-5"
              width={20}
              height={20}
            />
            <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Facebook</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}






