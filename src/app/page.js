
// src/app/page.js
"use client";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
//import ClientHome from "@/app/client/home/page"; // or your dashboard
//import Login from "@/app/login/page";
import LoginPage from "@/app/login/page";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <SplashScreen /> : <LoginPage />;
}





//import Image from "next/image";
// export default function Home() {
//   return (
//     <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
//       <h1 className="text-5xl font-bold text-white">🚀 Tailwind is working!</h1>
//     </div>
//   );
// }

