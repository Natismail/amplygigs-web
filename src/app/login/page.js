//src/app/login/page.js


"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      async function fetchUserRole() {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "CLIENT") router.push("/client/home");
        else if (profile?.role === "MUSICIAN") router.push("/musician/dashboard");
      }
      fetchUserRole();
    }
  }, [user, authLoading, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) setError(signInError.message);

    setLoading(false);
  }

  async function handleSocialLogin(provider) {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
    } catch (err) {
      console.error(err);
      setError("Social login failed. Try again.");
    }
  }

  if (authLoading || user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
      style={{
        backgroundImage:
          "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <div className="max-w-sm p-8 bg-white bg-opacity-80 rounded-lg w-full">
        <h1 className="text-2xl font-extrabold text-center mb-6 text-gray-800">
          Welcome, AmplyGigs! 🎶
        </h1>
        {error && (
          <p className="bg-red-100 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="you@gmail.com"
              className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <a href="/forgot-password" className="text-purple-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">or</div>

        {/* Social Login Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleSocialLogin("google")}
            className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <Image src="/images/google.svg" alt="Google" className="w-5 h-5" width={40} height={40}/>
            Google
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <Image src="/images/facebook.svg" alt="Facebook" className="w-5 h-5" width={40} height={40}  />
            Facebook
          </button>
        </div>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-purple-600 font-medium hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}




// "use client";
// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import { Eye, EyeOff } from "lucide-react";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const router = useRouter();
//   const { user, loading: authLoading } = useAuth();

//   useEffect(() => {
//     if (!authLoading && user) {
//       (async () => {
//         const { data: profile } = await supabase
//           .from("user_profiles")
//           .select("role")
//           .eq("id", user.id)
//           .single();

//         if (profile?.role === "CLIENT") router.push("/client/home");
//         if (profile?.role === "MUSICIAN") router.push("/musician/dashboard");
//       })();
//     }
//   }, [user, authLoading, router]);

//   async function handleLogin(e) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) setError(error.message);
//     setLoading(false);
//   }

//   if (authLoading || user) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
//       style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}
//     >
//       <div className="w-full max-w-sm bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg">
//         <h1 className="text-2xl font-extrabold text-center mb-6">
//           Welcome back 🎶
//         </h1>

//         {error && (
//           <p className="bg-red-100 text-red-600 px-3 py-2 rounded mb-4 text-sm">
//             {error}
//           </p>
//         )}

//         <form onSubmit={handleLogin} className="space-y-5">
//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium">Email</label>
//             <input
//               type="email"
//               className="mt-2 w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
//               placeholder="you@gmail.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <label className="block text-sm font-medium">Password</label>
//             <div className="relative mt-2">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 className="w-full px-4 py-2 pr-12 rounded-lg border focus:ring-2 focus:ring-purple-500"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//           </div>

//           {/* Forgot Password */}
//           <div className="flex justify-end">
//             <button
//               type="button"
//               onClick={() => router.push("/forgot-password")}
//               className="text-sm text-purple-600 hover:underline"
//             >
//               Forgot password?
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>
//         </form>

//         <p className="mt-6 text-sm text-center text-gray-600">
//           Don’t have an account?{" "}
//           <a href="/signup" className="text-purple-600 font-medium hover:underline">
//             Sign Up
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }



