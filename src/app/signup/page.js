// src/app/signup/page.js
"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock, Users } from "lucide-react";

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "CLIENT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🚀 Starting registration for:', form.email);

      // Sign up the user
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        console.log('✅ User created:', data.user.id);

        // Create user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role || "CLIENT",
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw new Error(profileError.message);
        }

        console.log('✅ Profile created successfully');
        setSuccess(true);

        // Redirect after short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Social login error:', err);
      setError("Social login failed. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to AmplyGigs!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account has been created successfully.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      {/* <div className="max-w-md w-full p-6 sm:p-8 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-2xl shadow-2xl"> */}
        <div className="max-w-sm w-full p-4 sm:p-6 bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-80 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          {/* <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🎵</div> */}
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
        <form onSubmit={handleRegister} className="space-y-0 sm:space-y-2">
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
                placeholder="you@example.com"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
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
            <label className="block text-xs sm:text-sm font-semibold mb-0 sm:mb-0 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-0 sm:py-0 text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-5 sm:mt-6 mb-5 sm:mb-6 flex items-center">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">or sign up with</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="flex-1 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
            className="flex-1 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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








// //src/app/signup/page.js

// "use client";

// import Image from "next/image";
// import { useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";

// export default function SignUpPage() {
//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//     firstName: "",
//     lastName: "",
//     role: "CLIENT",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   async function handleRegister(e) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const { data, error: authError } = await supabase.auth.signUp({
//       email: form.email,
//       password: form.password,
//     });

//     if (authError) {
//       setError(authError.message);
//       setLoading(false);
//       return;
//     }

//     if (data.user) {
//       const { error: profileError } = await supabase
//         .from("user_profiles")
//         .insert({
//           id: data.user.id,
//           email: form.email,
//           first_name: form.firstName,
//           last_name: form.lastName,
//           role: form.role || "CLIENT",
//         });

//       if (profileError) {
//         setError(profileError.message);
//         setLoading(false);
//         return;
//       }
//     }

//     setLoading(false);
//     router.push("/login");
//   }

//   async function handleSocialLogin(provider) {
//     try {
//       await supabase.auth.signInWithOAuth({
//         provider,
//         options: { redirectTo: window.location.origin },
//       });
//     } catch (err) {
//       console.error(err);
//       setError("Social login failed. Try again.");
//     }
//   }

//   return (
//     <div
//       className="h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
//       style={{
//         backgroundImage:
//           "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
//       }}
//     >
//       <form
//         onSubmit={handleRegister}
//         className="p-6 bg-white bg-opacity-80 rounded-lg shadow-xl w-full max-w-sm space-y-4"
//       >
//         <h1 className="text-xl font-bold text-center">Sign Up to AmplyGigs</h1>
//         {error && <p className="text-red-500 text-sm">{error}</p>}

//         <input
//           type="text"
//           placeholder="First Name"
//           className="w-full p-2 border rounded-lg text-white"
//           value={form.firstName}
//           onChange={(e) => setForm({ ...form, firstName: e.target.value })}
//           required
//         />
//         <input
//           type="text"
//           placeholder="Last Name"
//           className="w-full p-2 border rounded-lg text-white"
//           value={form.lastName}
//           onChange={(e) => setForm({ ...form, lastName: e.target.value })}
//           required
//         />
//         <select
//           className="w-full p-2 border rounded-lg text-white"
//           value={form.role}
//           onChange={(e) => setForm({ ...form, role: e.target.value })}
//         >
//           <option value="CLIENT">Client</option>
//         </select>
//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full p-2 border rounded-lg text-white"
//           value={form.email}
//           onChange={(e) => setForm({ ...form, email: e.target.value })}
//           required
//         />
//         <div className="relative">
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             className="w-full p-2 border rounded-lg text-white"
//             value={form.password}
//             onChange={(e) => setForm({ ...form, password: e.target.value })}
//             required
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
//           >
//             {showPassword ? "Hide" : "Show"}
//           </button>
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
//           disabled={loading}
//         >
//           {loading ? "Signing Up..." : "Sign Up"}
//         </button>

//         <div className="mt-4 text-center text-sm text-gray-500">or</div>

//         {/* Social Login Buttons */}
//         <div className="flex gap-3 mt-4">
//           <button
//             onClick={() => handleSocialLogin("google")}
//             className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
//           >
//             <Image src="/images/google.svg" alt="Google" className="w-5 h-5" width={40} height={40}/>
//             {/* Google */}
//           </button>
//           <button
//             onClick={() => handleSocialLogin("facebook")}
//             className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
//           >
//             <Image src="/images/facebook.svg" alt="Facebook" className="w-5 h-5" width={40} height={40}  />
//             {/* Facebook */}
//           </button>
//         </div>

//         <p className="mt-6 text-sm text-center text-gray-600">
//           Already have an account?{" "}
//           <a href="/login" className="text-green-600 font-medium hover:underline">
//             Sign In
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }

