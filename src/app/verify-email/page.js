"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Mail, RefreshCw, LogOut } from "lucide-react";

export default function VerifyEmailPage() {
  const { signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0); // seconds remaining before resend is allowed

  useEffect(() => {
    const getEmail = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };
    getEmail();
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setMessage("success");
      setCooldown(60); // 60s cooldown to prevent spam
    } catch (err) {
      console.error("Resend error:", err);
      setMessage("error");
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        {/* Icon */}
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Verify Your Email
        </h1>

        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            We sent a verification link to:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white text-sm bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 inline-block">
            {email || "your email address"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Click the link in the email to activate your account.
          </p>
        </div>

        {/* Feedback message */}
        {message === "success" && (
          <div className="mb-5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              ✅ Verification email sent! Check your inbox.
            </p>
          </div>
        )}
        {message === "error" && (
          <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 text-center">
              ❌ Failed to send email. Please try again.
            </p>
          </div>
        )}

        {/* Resend button */}
        <button
          onClick={handleResendEmail}
          disabled={resending || !email || cooldown > 0}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {resending ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <><Mail className="w-4 h-4" /> Resend Verification Email</>
          )}
        </button>

        {/* Tips */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Didn&apos;t receive the email?
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
            <li>• Check your spam or junk folder</li>
            <li>• Wait a few minutes — delivery can take up to 5 minutes</li>
            <li>• Make sure <strong>{email}</strong> is correct</li>
            <li>• Click the resend button above (once per 60 seconds)</li>
          </ul>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-5 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out and use a different email
        </button>
      </div>
    </div>
  );
}