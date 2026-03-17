"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  // ── Redirect authenticated users to their correct dashboard ──────────────
  useEffect(() => {
    if (authLoading) return; // still loading — wait
    if (!user) return;       // not logged in — show landing

    setShowSplash(true);

    // ✅ Normalize — AuthContext stores lowercase after the fix
    const role = (user.role ?? "").toLowerCase();

    let destination = "/client/home";
    if      (user.is_admin   || role === "admin")   destination = "/admin/dashboard";
    else if (user.is_support || role === "support")  destination = "/admin/dashboard";
    else if (role === "musician")                    destination = "/musician/dashboard";
    else if (role === "client")                      destination = "/client/home";

    console.log("🏠 Home →", destination, "| role:", role, "| is_admin:", user.is_admin);

    const timer = setTimeout(() => router.replace(destination), 1800);
    return () => clearTimeout(timer);
  }, [user, authLoading, router]);

  // ── Landing page navigation (login / signup buttons) ─────────────────────
  const handleNavigate = (path) => {
    setShowSplash(true);
    setTimeout(() => router.push(path), 1800);
  };

  // Auth still resolving
  if (authLoading) return <SplashScreen />;

  // Logged-in user waiting for redirect
  if (showSplash || user) return <SplashScreen />;

  // Guest — show landing page
  return <LandingPage onNavigate={handleNavigate} />;
}



