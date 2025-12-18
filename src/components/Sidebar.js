//src/components/Sidebar.js
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

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

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 z-40 overflow-y-auto`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700 py-6">
        <h2 className="text-lg font-bold">Menu</h2>
        <button
          className="text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={onClose}
        >
          ✖
        </button>
      </div>

      <nav className="p-4 space-y-3">
        {user?.role === "MUSICIAN" && (
          <>
            <Link 
              href="/musician/dashboard" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              🏠 Dashboard
            </Link>
            <Link 
              href="/musician/profile" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              👤 Update Profile
            </Link>
            <Link 
              href="/musician/bookings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              📅 Bookings
            </Link>
            <Link 
              href="/kyc/verify" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              ✅ KYC Verification
            </Link>
            <Link 
              href="/tracking" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              📍 Live Tracking
            </Link>
            <Link 
              href="/musician/earnings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              💰 Earnings
            </Link>
            <Link 
              href="/musician/events" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              🎵 Events
            </Link>
            <Link 
              href="/musician/settings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              ⚙️ Settings
            </Link>
          </>
        )}
        {user?.role === "CLIENT" && (
          <>
            <Link 
              href="/client/home" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              🏠 Home
            </Link>
            <Link 
              href="/client/bookings" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              📅 My Bookings
            </Link>
            <Link 
              href="/tracking" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              📍 Live Tracking
            </Link>
            <Link 
              href="/update-profile" 
              className="block hover:text-blue-400 min-h-[44px] flex-col items-center" 
              onClick={onClose}
            >
              🎸 Become a Musician
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

