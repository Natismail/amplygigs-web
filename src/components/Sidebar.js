// src/components/Sidebar.js - FIXED WITH EVENT LISTENER
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { 
  X, Home, User, Calendar, CheckCircle, MapPin, 
  DollarSign, Music, Settings, LogOut, Shield,
  Users, CreditCard, Ticket, Crown, Wrench, 
  MessageCircle, Bell, TrendingUp, Instagram,
  Users2, PenBox, Guitar, Briefcase, FileText,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const userRole = user?.role;
  const isAdmin = user?.is_admin || userRole === 'ADMIN';
  const isSupport = user?.is_support || userRole === 'SUPPORT';
  const isMusician = userRole === 'MUSICIAN';
  const isClient = userRole === 'CLIENT';

  // ⭐ CRITICAL: Memoize fetch function
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      
      console.log('📊 Sidebar unread count:', count);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user?.id]);

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel("sidebar-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📨 Sidebar: New message received:", payload.new);
          setUnreadCount((prev) => prev + 1);
          
          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `${payload.new.sender_name || "Someone"} sent you a message`,
              icon: "/icons/icon-192.png",
              badge: "/icons/badge-72.png",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh count when message is marked as read
          if (payload.new.read === true && !payload.old.read) {
            console.log("✅ Sidebar: Message marked as read");
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  // ⭐ CRITICAL: Listen for messagesRead event
  useEffect(() => {
    const handleMessagesRead = () => {
      console.log('🔄 Sidebar: messagesRead event received - refreshing count');
      fetchUnreadCount();
    };

    window.addEventListener('messagesRead', handleMessagesRead);

    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [fetchUnreadCount]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotificationsCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);

        if (error) throw error;
        setUnreadNotifications(count || 0);
      } catch (error) {
        console.error("Error fetching notifications count:", error);
      }
    };

    fetchNotificationsCount();

    // Real-time subscription for notifications
    const channel = supabase
      .channel("sidebar-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUnreadNotifications((prev) => prev + 1);
          
          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification(payload.new.title || "New Notification", {
              body: payload.new.message || "You have a new notification",
              icon: "/icons/icon-192.png",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotificationsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

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
        {badge > 0 && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full min-w-[20px] text-center">
            {badge > 99 ? "99+" : badge}
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
              <NavLink href="/admin/network" icon={Users}>
                Network
              </NavLink>
              <NavLink href="/admin/analytics" icon={TrendingUp}>
                Analytics
              </NavLink>
              <NavLink href="/admin/finances" icon={DollarSign}>
                Finances
              </NavLink>
              <NavLink href="/admin/social-media" icon={Instagram}>
                Social Media
              </NavLink>
              <NavLink href="/admin/partners" icon={Users2}>
                Partners
              </NavLink>
              <NavLink href="/admin/events" icon={MapPin}>
                Events
              </NavLink>
              <NavLink href="/admin/tickets" icon={Ticket}>
                Tickets
              </NavLink>
              <NavLink href="/admin/reports" icon={Bell}>
                Reports
              </NavLink>
              <NavLink href="/admin/compliance" icon={Shield}>
                Compliance
                </NavLink>
              <NavLink href="/admin/support-tickets" icon={Wrench}>
                Support
              </NavLink>
              <NavLink href="/admin/settings" icon={Settings}>
                Settings
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
              <NavLink href="/musician/gigs" icon={TrendingUp}>
                Available Gigs
              </NavLink>
              <NavLink href="/musician/proposals" icon={Instagram}>
                Proposals
              </NavLink>

              <NavLink href="/jobs" icon={Briefcase}>
  Browse Jobs
</NavLink>
<NavLink href="/musician/applications" icon={FileText}>
  My Applications
</NavLink>
              {/* <NavLink href="/kyc/verify" icon={Shield}>
                Verification
              </NavLink> */}
              <NavLink href="/tracking" icon={MapPin}>
                Live Tracking
              </NavLink>
              <NavLink href="/musician/earnings" icon={DollarSign}>
                Earnings
              </NavLink>
              <NavLink href="/musician/events" icon={Music}>
                All Gigs
              </NavLink>
              <NavLink href="/messages" icon={MessageCircle} badge={unreadCount}>
                Messages
              </NavLink>
              <NavLink href="/network" icon={Users}>
                Network
              </NavLink>
              <NavLink href="/feed" icon={Home}>
                Social Feed
              </NavLink>
              <NavLink href="/musician/my-events" icon={Music}>
                My Events
              </NavLink>
              <NavLink href="/live-events" icon={PenBox}>
                Discover Events
              </NavLink>
              <NavLink href="/musician/discover" icon={Guitar}>
                External Gigs
              </NavLink>
              <NavLink href="/notifications" icon={Bell} badge={unreadNotifications}>
                Notifications
              </NavLink>
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
              <NavLink href="/client/proposals" icon={TrendingUp}>
                Proposals
              </NavLink>

               {/* NEW: Jobs Section */}
    {/* <NavLink href="/jobs" icon={Briefcase}>
      Jobs & Auditions
    </NavLink>
    <NavLink href="/client/job-postings" icon={Music}>
      My Job Postings
    </NavLink> */}

              <NavLink href="/tracking" icon={MapPin}>
                Live Tracking
              </NavLink>
              <NavLink href="/messages" icon={MessageCircle} badge={unreadCount}>
                Messages
              </NavLink>
              <NavLink href="/network" icon={Users}>
                Network
              </NavLink>
              <NavLink href="/feed" icon={Home}>
                Social Feed
              </NavLink>
              <NavLink href="/live-events" icon={PenBox}>
                Discover Events
              </NavLink>
              <NavLink href="/notifications" icon={Bell} badge={unreadNotifications}>
                Notifications
              </NavLink>
              <NavLink href="/update-profile" icon={Music}>
                Become a Musician
              </NavLink>
              <NavLink href="/client/settings" icon={Settings}>
                Settings
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