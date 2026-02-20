"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [destination, setDestination] = useState(null);

  // Handle authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      // Show splash then redirect to dashboard
      setShowSplash(true);
      
      const timer = setTimeout(() => {
        if (user.role === 'MUSICIAN') {
          router.push('/musician/dashboard');
        } else {
          router.push('/client/home');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router]);

  // Handle navigation from landing page
  const handleNavigate = (path) => {
    setDestination(path);
    setShowSplash(true);
    
    setTimeout(() => {
      router.push(path);
    }, 2000);
  };

  // Show splash screen if needed
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show auth loading
  if (authLoading) {
    return <SplashScreen />;
  }

  // Show landing page for non-authenticated users
  return <LandingPage onNavigate={handleNavigate} />;
}




// // src/app/page.js
// "use client";
// import { useEffect, useState } from "react";
// import SplashScreen from "@/components/SplashScreen";
// //import ClientHome from "@/app/client/home/page"; // or your dashboard
// //import Login from "@/app/login/page";
// import LoginPage from "@/app/login/page";

// export default function Home() {
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   return loading ? <SplashScreen /> : <LoginPage />;
// }





// //import Image from "next/image";
// // export default function Home() {
// //   return (
// //     <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
// //       <h1 className="text-5xl font-bold text-white">🚀 Tailwind is working!</h1>
// //     </div>
// //   );
// // }

