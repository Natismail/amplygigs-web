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
        transition-transform duration-300 z-40`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700 py-6">
        <h2 className="text-lg font-bold">Menu</h2>
        <button
          className="text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>
      </div>

      <nav className="p-4 space-y-3">
        {user?.role === "MUSICIAN" && (
          <>
            <Link href="/musician/dashboard" className="block hover:text-blue-400" onClick={onClose}>
              Dashboard
            </Link>
            <Link href="/musician/profile" className="block hover:text-blue-400" onClick={onClose}>
              Update Profile
            </Link>
            <Link href="/musician/bookings" className="block hover:text-blue-400" onClick={onClose}>
              Bookings
            </Link>
            <Link href="/musician/earnings" className="block hover:text-blue-400" onClick={onClose}>
              Earnings
            </Link>
            <Link href="/musician/events" className="block hover:text-blue-400" onClick={onClose}>
              Events
            </Link>
            <Link href="/settings" className="block hover:text-blue-400" onClick={onClose}>
              Settings
            </Link>
          </>
        )}
        {user?.role === "CLIENT" && (
          <>
            <Link href="/client/home" className="block hover:text-blue-400" onClick={onClose}>
              Home
            </Link>
            <Link href="/client/bookings" className="block hover:text-blue-400" onClick={onClose}>
              My Bookings
            </Link>
            <Link href="/update-profile" className="block hover:text-blue-400" onClick={onClose}>
              Become a Musician
            </Link>
          </>
        )}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Theme:</span>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 rounded bg-inherit text-white text-sm hover:bg-purple-700"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}