//src/app/sign-up/page.js

"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock, Users, Phone, Check, X } from "lucide-react";
import Logo, { LogoIconOnly, LogoWithText, LogoLight } from '@/components/Logo';

// ─── Password rules ────────────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)",    test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "One lowercase letter (a–z)",    test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "One number (0–9)",               test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLabel(passed) {
  if (passed <= 1) return { label: "Very weak",  color: "bg-red-500",    width: "w-1/5"  };
  if (passed === 2) return { label: "Weak",       color: "bg-orange-500", width: "w-2/5"  };
  if (passed === 3) return { label: "Fair",       color: "bg-yellow-500", width: "w-3/5"  };
  if (passed === 4) return { label: "Good",       color: "bg-blue-500",   width: "w-4/5"  };
  return               { label: "Strong",      color: "bg-green-500",  width: "w-full" };
}

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "CLIENT",
  });
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ─── Live rule checking ──────────────────────────────────────────────────────
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount  = ruleResults.filter((r) => r.passed).length;
  const allPassed    = passedCount === PASSWORD_RULES.length;
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;
  const strength     = form.password.length > 0 ? getStrengthLabel(passedCount) : null;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (!allPassed) {
      setError("Password does not meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: form.firstName,
            last_name:  form.lastName,
            phone:      form.phone,
            role:       form.role,
          },
        },
      });

      if (authError) throw new Error(authError.message);

      // Email confirmation required — no session yet
      if (data.user && !data.session) {
        // Store pending profile data so auth/callback can create it after verification
        localStorage.setItem(
          "pendingUserData",
          JSON.stringify({
            firstName: form.firstName,
            lastName:  form.lastName,
            phone:     form.phone,
            role:      form.role,
            email:     form.email,
          })
        );
        router.push("/verify-email");
        return;
      }

      // Auto-confirmed (email confirmation disabled in Supabase settings)
      if (data.session) {
        await supabase.from("user_profiles").insert({
          id:         data.user.id,
          email:      form.email,
          phone:      form.phone,
          first_name: form.firstName,
          last_name:  form.lastName,
          role:       form.role,
        });
        router.replace(form.role === "MUSICIAN" ? "/musician/dashboard" : "/client/home");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError("Social login failed. Please try again.");
    }
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)), url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <div className="max-w-sm w-full bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 rounded-xl shadow-2xl p-6 sm:p-8">

        {/* Header */}
        <div className="ml-6">
        <div className="flex items-center gap-0 mb-0 -mt-3">
          
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white items-center ml-4">
            {/* 🎵 */}
            Join AmplyGigs</h1>
                    <Logo size="lg" showText={false} className="mt-2"/>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 items-center px-2 -mt-2 ml-4">Create your account to get started</p>
</div>
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-5">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "firstName", label: "First Name", placeholder: "John"  },
              { key: "lastName",  label: "Last Name",  placeholder: "Doe"   },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" required placeholder={placeholder}
                    value={form[key]} onChange={update(key)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email" required placeholder="you@example.com"
                value={form.email} onChange={update("email")}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Phone <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel" placeholder="+234 800 000 0000"
                value={form.phone} onChange={update("phone")}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Role */}
          {/* <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">I am a</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={form.role} onChange={update("role")}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition appearance-none cursor-pointer"
              >
                <option value="CLIENT">Client (Hire Talents)</option>
                {/* <option value="MUSICIAN">Musician (Find Gigs)</option> *}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div> */}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="•••••••••••••••"
                value={form.password}
                onChange={update("password")}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="w-full pl-9 pr-11 py-2.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 font-medium ${
                  passedCount <= 1 ? "text-red-500" :
                  passedCount === 2 ? "text-orange-500" :
                  passedCount === 3 ? "text-yellow-600" :
                  passedCount === 4 ? "text-blue-500" : "text-green-500"
                }`}>{strength.label}</p>
              </div>
            )}

            {/* Rules checklist — shown when focused or typing */}
            {(passwordFocused || form.password.length > 0) && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1.5">
                {ruleResults.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    {r.passed
                      ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <X     className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                    }
                    <span className={`text-xs ${r.passed ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="•••••••••••••••"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                required
                className={`w-full pl-9 pr-11 py-2.5 text-sm rounded-lg border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition ${
                  form.confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-400 dark:border-green-500"
                      : "border-red-400 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword.length > 0 && (
              <p className={`text-xs mt-1 ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !allPassed || !passwordsMatch}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2.5 text-sm rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          <span className="text-xs text-gray-500">or sign up with</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
        </div>

        {/* Social */}
        <div className="flex gap-3">
          {["google", "facebook"].map((provider) => (
            <button key={provider} type="button" onClick={() => handleSocialLogin(provider)}
              className="flex-1 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Image src={`/images/${provider}.svg`} alt={provider} width={18} height={18} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{provider}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-green-600 dark:text-green-400 font-semibold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}