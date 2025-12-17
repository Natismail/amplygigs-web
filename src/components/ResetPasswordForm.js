// src/components/ResetPasswordForm.js
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token"); 

  useEffect(() => {
    if (!accessToken) setError("Invalid password reset link.");
  }, [accessToken]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(""); setMessage(""); setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMessage("Password updated! Redirecting...");
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
         style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}>
      <div className="max-w-sm p-8 bg-white bg-opacity-80 rounded-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Reset Password</h1>
        {error && <p className="bg-red-100 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">{error}</p>}
        {message && <p className="bg-green-100 text-green-700 px-3 py-2 rounded-md mb-4 text-sm">{message}</p>}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <input type={showPassword ? "text" : "password"}
                   placeholder="Enter new password"
                   className="w-full p-2 border rounded-lg"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button type="submit"
                  disabled={loading || !accessToken}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Remembered your password? <a href="/login" className="text-purple-600 hover:underline font-medium">Login</a>
        </p>
      </div>
    </div>
  );
}
