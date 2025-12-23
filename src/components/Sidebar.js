// src/components/Sidebar.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { 
  X, Home, User, Calendar, CheckCircle, MapPin, 
  DollarSign, Music, Settings, LogOut, Shield,
  Users, CreditCard, Ticket, Crown, Wrench, MessageCircle, Bell
} from "lucide-react";
import { useState } from "react";

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userRole = user?.role;
  const isAdmin = user?.is_admin || userRole === 'ADMIN';
  const isSupport = user?.is_support || userRole === 'SUPPORT';
  const isMusician = userRole === 'MUSICIAN';
  const isClient = userRole === 'CLIENT';

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    onClose();
    
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const NavLink = ({ href, icon: Icon, children, badge }) => {
    const isActive = pathname === href;
    
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] group ${
          isActive
            ? "bg-purple-600 text-white shadow-lg"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
        <span className="flex-1 font-medium">{children}</span>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 text-white transform transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold">Menu</h2>
            {isAdmin && (
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-semibold">Admin</span>
              </div>
            )}
            {isSupport && !isAdmin && (
              <div className="flex items-center gap-1 mt-1">
                <Wrench className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400 font-semibold">Support</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Admin/Support Section */}
          {(isAdmin || isSupport) && (
            <>
              <div className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {isAdmin ? 'Admin Panel' : 'Support Panel'}
              </div>
              <NavLink href="/admin/dashboard" icon={isAdmin ? Crown : Wrench}>
                Dashboard
              </NavLink>
              <NavLink href="/admin/verifications" icon={CheckCircle} badge={3}>
                Verifications
              </NavLink>
              <NavLink href="/admin/users" icon={Users}>
                Users
              </NavLink>
              <NavLink href="/admin/bookings" icon={Calendar}>
                Bookings
              </NavLink>
              <NavLink href="/admin/payments" icon={CreditCard}>
                Payments
              </NavLink>
              <NavLink href="/admin/tickets" icon={Ticket}>
                Support
              </NavLink>
              <div className="my-3 border-t border-gray-800" />
            </>
          )}

          {/* Musician Section */}
          {isMusician && (
            <>
              <div className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Musician
              </div>
              <NavLink href="/musician/dashboard" icon={Home}>
                Dashboard
              </NavLink>
              <NavLink href="/musician/profile" icon={User}>
                Profile
              </NavLink>
              <NavLink href="/musician/bookings" icon={Calendar}>
                Bookings
              </NavLink>
              <NavLink href="/kyc/verify" icon={Shield}>
                Verification
              </NavLink>
              <NavLink href="/tracking" icon={MapPin}>
                Live Tracking
              </NavLink>
              <NavLink href="/musician/earnings" icon={DollarSign}>
                Earnings
              </NavLink>
              <NavLink href="/musician/events" icon={Music}>
                Events
              </NavLink>

<NavLink href="/messages" icon={MessageCircle}>
  Messages
</NavLink>
              
<NavLink href="/network" icon={Users}>
  Network
</NavLink>
<NavLink href="/musician/discover" icon={MapPin}>
  Discover Events
</NavLink>
{/* <NavLink href="/feed" icon={Home}>
  Feed
</NavLink> */}
<NavLink href="/notifications" icon={Bell}>Notifications</NavLink>
<NavLink href="/musician/settings" icon={Settings}>
                Settings
              </NavLink>




            </>
          )}

          {/* Client Section */}
          {isClient && (
            <>
              <div className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Client
              </div>
              <NavLink href="/client/home" icon={Home}>
                Home
              </NavLink>
              <NavLink href="/client/bookings" icon={Calendar}>
                My Bookings
              </NavLink>
              

<NavLink href="/messages" icon={MessageCircle}>
  Messages
</NavLink>
<NavLink href="/tracking" icon={MapPin}>
                Live Tracking
              </NavLink>
{/* <NavLink href="/notifications" icon={Bell}>Notifications</NavLink> */}

              <NavLink href="/update-profile" icon={Music}>
                Become a Musician
              </NavLink>

            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition min-h-[44px] font-medium"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}



