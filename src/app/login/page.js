// src/pages/LoginPage.js
"use client";
import { useState, useEffect } from "react"; // Import useEffect
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, setAuthUser } = useAuth(); // Get user and loading from context

  // New useEffect to handle redirection based on auth state
  useEffect(() => {
    // Wait until the authentication state is finished loading
    if (!authLoading && user) {
      async function fetchUserRole() {
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Could not fetch user role:", profileError);
          // Optional: handle this error, e.g., show a generic error page
          return;
        }

        // Redirect based on role
        if (profile.role === "CLIENT") {
          router.push("/client/home");
        } else if (profile.role === "MUSICIAN") {
          router.push("/musician/dashboard");
        }
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

    if (signInError) {
      setError(signInError.message);
    }
    
    // The useEffect will now handle the redirection after a successful sign-in
    setLoading(false);
  }

  // If the user is already authenticated, this component will return null
  // and useEffect will handle the redirection.
  if (authLoading || user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
  className="h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat  bg-black/60"
  style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}
>
      <div className="max-w-sm p-8 bg-white bg-opacity-80 inset-0 rounded-lg">
        <h1 className="text-2xl font-extrabold text-center mb-6 text-gray-800">
          Welcome, AmplyGigs!🎶
        </h1>
        {error && (
          <p className="bg-red-100 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="you@gmail.com"
              className="mt-4 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="•••••••••••••••••••"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-purple-600 font-medium hover:underline"
          >
            Sign Up                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </a>
        </p>
      </div>
    </div>
  );
}