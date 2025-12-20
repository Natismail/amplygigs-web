//src/components/Sidebar.js
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, is_admin, is_support')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      onClose();
    } catch (error) {
      console.error("Logout failed:", error.message);
      alert("Logout failed. Please try again.");
    }
  };

  const isAdmin = userProfile?.is_admin || userProfile?.role === 'ADMIN';
  const isSupport = userProfile?.is_support || userProfile?.role === 'SUPPORT';
  const isMusician = userProfile?.role === 'MUSICIAN';
  const isClient = userProfile?.role === 'CLIENT';

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 z-40 overflow-y-auto`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700 py-6">
        <div>
          <h2 className="text-lg font-bold">Menu</h2>
          {isAdmin && <span className="text-xs text-purple-400">👑 Admin</span>}
          {isSupport && !isAdmin && <span className="text-xs text-blue-400">🛠️ Support</span>}
        </div>
        <button
          className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={onClose}
        >
          ✖
        </button>
      </div>

      <nav className="p-4 space-y-3">
        {/* Admin/Support Menu */}
        {(isAdmin || isSupport) && (
          <>
            <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
              {isAdmin ? 'Admin Panel' : 'Support Panel'}
            </div>
            <Link 
              href="/admin/dashboard" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 bg-purple-900/20 rounded-lg px-3" 
              onClick={onClose}
            >
              <span>{isAdmin ? '👑' : '🛠️'}</span>
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/verifications" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>✅</span>
              <span>Verifications</span>
            </Link>
            <Link 
              href="/admin/users" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>👥</span>
              <span>User Management</span>
            </Link>
            <Link 
              href="/admin/bookings" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>📅</span>
              <span>All Bookings</span>
            </Link>
            <Link 
              href="/admin/payments" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>💰</span>
              <span>Payments</span>
            </Link>
            <Link 
              href="/admin/tickets" 
              className="block hover:text-purple-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>🎫</span>
              <span>Support Tickets</span>
            </Link>
            <div className="border-t border-gray-700 my-3"></div>
          </>
        )}

        {/* Musician Menu */}
        {isMusician && (
          <>
            <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
              Musician
            </div>
            <Link 
              href="/musician/dashboard" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/musician/profile" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>👤</span>
              <span>Update Profile</span>
            </Link>
            <Link 
              href="/musician/bookings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>📅</span>
              <span>Bookings</span>
            </Link>
            <Link 
              href="/kyc/verify" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>✅</span>
              <span>KYC Verification</span>
            </Link>
            <Link 
              href="/tracking" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>📍</span>
              <span>Live Tracking</span>
            </Link>
            <Link 
              href="/musician/earnings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>💰</span>
              <span>Earnings</span>
            </Link>
            <Link 
              href="/musician/events" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>🎵</span>
              <span>Events</span>
            </Link>
            <Link 
              href="/musician/settings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </>
        )}

        {/* Client Menu */}
        {isClient && (
          <>
            <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
              Client
            </div>
            <Link 
              href="/client/home" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>
            <Link 
              href="/client/bookings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>📅</span>
              <span>My Bookings</span>
            </Link>
            <Link 
              href="/tracking" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>📍</span>
              <span>Live Tracking</span>
            </Link>
            <Link 
              href="/update-profile" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center gap-2 px-3" 
              onClick={onClose}
            >
              <span>🎸</span>
              <span>Become a Musician</span>
            </Link>
          </>
        )}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Theme:</span>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 min-h-[44px]"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 rounded bg-inherit text-white text-sm hover:bg-purple-700 min-h-[44px]"
        >
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}