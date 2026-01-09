// src/app/signup/page.js - FIXED EMAIL VERIFICATION FLOW

// ============================================
// CRITICAL ISSUES IN YOUR CURRENT SIGNUP:
// ============================================

/**
 * PROBLEM 1 (Line 32): Email confirmation check is WRONG
 * 
 * CURRENT CODE:
 * if (data.user && !data.user.confirmed_at) {
 *   setVerificationSent(true);
 *   return;
 * }
 * 
 * PROBLEM: This checks data.user.confirmed_at which doesn't exist immediately
 * after signup. You need to check if there's NO SESSION instead.
 */

/**
 * PROBLEM 2 (Line 38-54): Profile creation happens BEFORE email verification
 * 
 * CURRENT FLOW:
 * 1. Sign up user
 * 2. Create profile immediately
 * 3. Show success
 * 4. Redirect to login
 * 
 * PROBLEM: Profile is created even if user never verifies email!
 */

/**
 * PROBLEM 3 (Line 23): emailRedirectTo is correct but needs verification page
 */


// ============================================
// COMPLETE FIXED VERSION
// ============================================

"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock, Users, Phone } from "lucide-react";

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "CLIENT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🚀 Starting registration for:', form.email);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate password
      if (form.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Sign up the user with email confirmation
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            role: form.role,
          }
        }
      });

      if (authError) {
        console.error('❌ Signup error:', authError);
        throw new Error(authError.message);
      }

      console.log('📧 Signup response:', {
        user: !!data.user,
        session: !!data.session,
        userId: data.user?.id
      });

      // ⭐ FIXED: Check if email confirmation is required
      // If there's a user BUT no session, email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email verification required - no session created');
        
        // Store user data temporarily for after verification
        localStorage.setItem('pendingUserData', JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.role,
          email: form.email,
        }));

        // Redirect to verification page
        router.push('/verify-email');
        return;
      }

      // ⭐ FIXED: If session exists, user is auto-confirmed (shouldn't happen with email confirmation enabled)
      if (data.session) {
        console.log('✅ User auto-confirmed (no email verification needed)');
        
        // Create profile immediately since no verification needed
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            email: form.email,
            phone: form.phone,
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role || "CLIENT",
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw new Error('Account created but profile setup failed. Please contact support.');
        }

        console.log('✅ Profile created, redirecting to dashboard');
        
        // Redirect to appropriate dashboard
        const redirectUrl = form.role === 'MUSICIAN' 
          ? '/musician/dashboard' 
          : '/client/home';
        
        router.push(redirectUrl);
        return;
      }

    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
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
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <div className="max-w-sm w-full p-6 sm:p-6 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-85 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 sm:mb-2">
            🎵 Join AmplyGigs
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
          {/* Name Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="John"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              Phone Number <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              I am a
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              <select
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition appearance-none cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="CLIENT">Client (Hire Musicians)</option>
                {/* <option value="MUSICIAN">Musician (Find Gigs)</option> */}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="•••••••••••••••••••"
                className="w-full pl-9 sm:pl-10 pr-11 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 6 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="-mt-1 sm:mt-0 mb-5 sm:mb-6 flex items-center">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">or sign up with</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 -mt-4 sm:-mt-6">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="flex-1 py-1.5 sm:py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
            className="flex-1 py-1.5 sm:py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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

        {/* Sign In Link */}
        <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-green-600 dark:text-green-400 font-semibold hover:underline"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}

