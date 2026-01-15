
// src/app/(app)/layout.js - FINAL FIX FOR MESSAGES
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import GlobalPullToRefresh from "@/components/GlobalPullToRefresh";

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // ⭐ CHECK IF MESSAGES PAGE
  const isMessagesPage = pathname === '/messages';

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirectedFrom=${pathname}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ⭐ FIX 2: Different layout for messages page
  if (isMessagesPage) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Messages gets full remaining height */}
        <main className="flex-1 relative overflow-hidden">
          <GlobalPullToRefresh>
            {children}
          </GlobalPullToRefresh>
        </main>
      </div>
    );
  }

  // Normal layout for other pages
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="transition-all duration-300">
        <GlobalPullToRefresh>
          {children}
        </GlobalPullToRefresh>
      </main>
    </div>
  );
}



