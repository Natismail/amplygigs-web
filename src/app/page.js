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






// "use client";

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';
// import SplashScreen from '@/components/SplashScreen';
// import LandingPage from '@/components/LandingPage';

// export default function Home() {
//   const router = useRouter();
//   const { user, loading: authLoading } = useAuth();
//   const [showSplash, setShowSplash] = useState(false);
//   const [destination, setDestination] = useState(null);

//   // Handle authenticated users
//   useEffect(() => {
//     if (!authLoading && user) {
//       // Show splash then redirect to dashboard
//       setShowSplash(true);
      
//       const timer = setTimeout(() => {
//         if (user.role === 'MUSICIAN') {
//           router.push('/musician/dashboard');
//         } else {
//           router.push('/client/home');
//         }
//       }, 2000);
      
//       return () => clearTimeout(timer);
//     }
//   }, [user, authLoading, router]);

//   // Handle navigation from landing page
//   const handleNavigate = (path) => {
//     setDestination(path);
//     setShowSplash(true);
    
//     setTimeout(() => {
//       router.push(path);
//     }, 2000);
//   };

//   // Show splash screen if needed
//   if (showSplash) {
//     return <SplashScreen />;
//   }

//   // Show auth loading
//   if (authLoading) {
//     return <SplashScreen />;
//   }

//   // Show landing page for non-authenticated users
//   return <LandingPage onNavigate={handleNavigate} />;
// }




// // // src/app/page.js
// // "use client";
// // import { useEffect, useState } from "react";
// // import SplashScreen from "@/components/SplashScreen";
// // //import ClientHome from "@/app/client/home/page"; // or your dashboard
// // //import Login from "@/app/login/page";
// // import LoginPage from "@/app/login/page";

// // export default function Home() {
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const timer = setTimeout(() => setLoading(false), 2000);
// //     return () => clearTimeout(timer);
// //   }, []);

// //   return loading ? <SplashScreen /> : <LoginPage />;
// // }





// // //import Image from "next/image";
// // // export default function Home() {
// // //   return (
// // //     <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
// // //       <h1 className="text-5xl font-bold text-white">🚀 Tailwind is working!</h1>
// // //     </div>
// // //   );
// // // }

