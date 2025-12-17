// src/pages/reset-password.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { access_token } = router.query;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.isReady && !access_token) {
      setError("Invalid or expired password reset link.");
    }
  }, [router.isReady, access_token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2500);
    }

    setLoading(false);
  };

  return (
    <div
      className="h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
      style={{
        backgroundImage:
          "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <div className="w-full max-w-sm bg-white bg-opacity-80 rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Reset Password
        </h1>

        {error && (
          <p className="bg-red-100 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}

        {message && (
          <p className="bg-green-100 text-green-700 px-3 py-2 rounded-md mb-4 text-sm">
            {message}
          </p>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !access_token}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Changed your mind?{" "}
          <a
            href="/login"
            className="text-purple-600 font-medium hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
